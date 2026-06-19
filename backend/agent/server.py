import asyncio
import json
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import subprocess
import os
import sys

# Import custom api functions
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.gitlab_api import list_user_projects, get_dashboard_metrics, get_project_members

# Force console output to UTF-8 to prevent charmap crashes with Chinese/Emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

app = FastAPI(title="Project Agent API")

# Limit to 1 concurrent AI agent subprocess to prevent OOM on Render's 512MB free tier
_agent_busy = False

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default-session"
    project_id: str = None
    stream_output: bool = False

class ZeroToOneRequest(BaseModel):
    prompt: str

@app.post("/api/project/zero_to_one")
async def zero_to_one_project(request: ZeroToOneRequest):
    try:
        import asyncio
        base_dir, adk_exe, agent_dir, merged_env = _prepare_agent_env()
        result = await asyncio.to_thread(_run_agent_sync, adk_exe, agent_dir, f"ZERO TO ONE: {request.prompt}", merged_env, base_dir)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects")
async def get_projects():
    try:
        return await asyncio.to_thread(list_user_projects)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/{project_id}")
async def fetch_dashboard_metrics(project_id: str):
    try:
        return await asyncio.to_thread(get_dashboard_metrics, project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}/members")
async def fetch_project_members(project_id: str):
    try:
        return await asyncio.to_thread(get_project_members, project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Sprint History (sprint_history.json) CRUD ──────────────────────────

from agent.db import get_sprint_history as db_get_sprints, save_sprint_history as db_save_sprints

class SprintSaveRequest(BaseModel):
    sprint_data: str # The JSON string returned by the agent

@app.get("/api/sprints/{project_id}")
async def get_sprint_history(project_id: str):
    try:
        sprints = db_get_sprints(project_id)
        if not sprints:
            # Auto-generate a sprint from GitLab issues
            from agent.gitlab_api import list_project_issues
            try:
                issues = list_project_issues(project_id, state="opened").get("issues", [])
                if issues:
                    board_cards = []
                    for iss in issues:
                        board_cards.append({
                            "title": iss.get("title"),
                            "assignee": iss.get("assignees", [{}])[0].get("username") if iss.get("assignees") else None,
                            "issue_iid": iss.get("iid"),
                            "status": "todo"
                        })
                    new_sprint = {
                        "sprint_id": f"sprint-auto",
                        "created_at": __import__("time").time(),
                        "board": [
                            {"column_name": "To Do", "cards": board_cards},
                            {"column_name": "In Progress", "cards": []},
                            {"column_name": "In Review", "cards": []},
                            {"column_name": "Done", "cards": []}
                        ]
                    }
                    sprints = [new_sprint]
                    db_save_sprints(project_id, sprints)
            except Exception as e:
                print(f"Auto-sync issues failed: {e}")
        return {"sprints": sprints}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sprints/{project_id}")
async def save_sprint_history(project_id: str, request: SprintSaveRequest):
    try:
        sprints = db_get_sprints(project_id)
        import time
        
        try:
            parsed_sprint = json.loads(request.sprint_data)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid sprint JSON data")
            
        sprint_id = parsed_sprint.get("sprint_id")
        if not sprint_id:
            sprint_id = str(int(time.time()))
            parsed_sprint["sprint_id"] = sprint_id
            parsed_sprint["created_at"] = time.time()
            sprints.insert(0, parsed_sprint)
        else:
            for i, sp in enumerate(sprints):
                if sp.get("sprint_id") == sprint_id:
                    sprints[i] = parsed_sprint
                    break
        
        db_save_sprints(project_id, sprints)
            
        # Fire off webhook setup in the background
        from agent.gitlab_api import setup_gitlab_webhook
        asyncio.create_task(asyncio.to_thread(setup_gitlab_webhook, project_id))
            
        return {"status": "success", "sprint_id": sprint_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── GitLab Webhook for Auto-Sync ──────────────────────────────────────────

@app.post("/api/webhook/gitlab")
async def gitlab_webhook(request: Request):
    try:
        payload = await request.json()
        object_kind = payload.get("object_kind")
        project = payload.get("project", {})
        project_id = str(project.get("id"))
        
        if not project_id:
            return {"status": "ignored", "reason": "No project ID"}
            
        attributes = payload.get("object_attributes", {})
        action = attributes.get("action")
        state = attributes.get("state")
        title = attributes.get("title")
        
        is_issue_close = object_kind == "issue" and action == "close" and state == "closed"
        is_mr_merge = object_kind == "merge_request" and action == "merge" and state == "merged"
        
        if not (is_issue_close or is_mr_merge) or not title:
            return {"status": "ignored", "reason": "Not a close/merge event or missing title"}
            
        sprints = db_get_sprints(project_id)
        if not sprints:
            return {"status": "ignored", "reason": "No sprints for this project"}
            
        active_sprint = sprints[0]
        board = active_sprint.get("board", [])
        
        updated = False
        for col in board:
            for card in col.get("cards", []):
                # Loose matching to handle minor differences
                if card.get("title", "").strip().lower() == title.strip().lower():
                    card["checked"] = True
                    updated = True
                    
        if updated:
            db_save_sprints(project_id, sprints)
            return {"status": "success", "message": f"Auto-synced '{title}' as closed."}
            
        return {"status": "ignored", "reason": "Task not found in active sprint"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Company Roster (team_profiles.json) CRUD ──────────────────────────

from agent.db import get_team_profiles as db_get_team, save_team_profiles as db_save_team, remove_team_profile as db_rm_team

class TeamMemberRequest(BaseModel):
    name: str
    username: str
    github_username: str = ""
    role: str = "Developer"
    skills: list[str] = []
    experience_level: str = "Mid"
    availability: str = "High"
    timezone: str = "UTC+8"

@app.get("/api/team")
async def get_team():
    try:
        data = db_get_team()
        try:
            from agent.gitlab_api import get_global_user_open_issue_count
            for member in data.get("team", []):
                username = member.get("username")
                if username:
                    member["current_open_issues"] = get_global_user_open_issue_count(username)
        except Exception as e:
            print(f"Error fetching issue counts: {e}")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/team/{username}/issues")
async def get_team_member_issues(username: str):
    try:
        from agent.gitlab_api import GITLAB_API_URL, HEADERS
        import requests
        url = f"{GITLAB_API_URL}/issues"
        params = {"state": "opened", "assignee_username": username, "per_page": 20}
        resp = requests.get(url, headers=HEADERS, params=params)
        if resp.status_code == 200:
            issues = []
            for i in resp.json():
                issues.append({
                    "title": i.get("title"),
                    "web_url": i.get("web_url"),
                    "project_id": i.get("project_id"),
                })
            return {"issues": issues}
        return {"issues": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/team")
async def add_team_member(member: TeamMemberRequest):
    try:
        data = db_get_team()
        
        # Check for duplicate username
        for existing in data.get("team", []):
            if existing["username"] == member.username:
                raise HTTPException(status_code=409, detail=f"Member @{member.username} already exists in the roster.")
        
        new_member = {
            "name": member.name,
            "username": member.username,
            "github_username": member.github_username,
            "role": member.role,
            "skills": member.skills,
            "experience_level": member.experience_level,
            "current_open_issues": 0,
            "availability": member.availability,
            "timezone": member.timezone
        }
        data["team"].append(new_member)
        
        db_save_team(data)
        
        return {"status": "success", "member": new_member, "total": len(data["team"])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/team/{username}")
async def remove_team_member(username: str):
    try:
        db_rm_team(username)
        return {"status": "success", "removed": username}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/team/{username}")
async def update_team_member(username: str, member: TeamMemberRequest):
    try:
        from agent.db import db
        # 1. Fetch existing user
        existing = db.get_item('TEAM', f'PROFILE#{username}')
        if not existing:
            raise HTTPException(status_code=404, detail=f"Member @{username} not found.")
            
        # 2. Check for username conflict if changing username
        if username != member.username:
            conflict = db.get_item('TEAM', f'PROFILE#{member.username}')
            if conflict:
                raise HTTPException(status_code=409, detail=f"Username @{member.username} is already taken.")
                
        # 3. Preserve fields
        existing_issues = existing.get("current_open_issues", 0)
        
        updated_member = {
            "name": member.name,
            "username": member.username,
            "github_username": member.github_username,
            "role": member.role,
            "skills": member.skills,
            "experience_level": member.experience_level,
            "current_open_issues": existing_issues,
            "availability": member.availability,
            "timezone": member.timezone
        }
        
        # 4. Save to DynamoDB
        db.put_item('TEAM', f'PROFILE#{member.username}', updated_member)
        
        # 5. Delete old profile if username changed
        if username != member.username:
            db.delete_item('TEAM', f'PROFILE#{username}')
            
        return {"status": "success", "member": updated_member}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _run_agent_sync(adk_exe, agent_dir, final_query, merged_env, base_dir):
    """Run the ADK agent synchronously (for use in a thread). Returns dict."""
    import subprocess as sp
    try:
        result = sp.run(
            [adk_exe, "run", agent_dir, final_query],
            env=merged_env,
            cwd=base_dir,
            capture_output=True,
            text=True,
            timeout=180  # 3 minutes max
        )
        output = result.stdout + result.stderr
    except sp.TimeoutExpired:
        return {"response": '{"error": "Agent timed out after 180 seconds."}'}
    except Exception as e:
        return {"response": f'{{"error": "Agent execution failed: {str(e)}"}}'}

    # Extract the final agent response
    final_response = output.strip()
    if "[project_agent]:" in final_response:
        final_response = final_response.split("[project_agent]:")[-1].strip()
    elif "Agent:" in final_response:
        final_response = final_response.split("Agent:")[-1].strip()

    if "{" not in final_response:
        return {"response": f'{{"error": "Agent returned no valid JSON."}}'}

    return {"response": final_response}


def _prepare_agent_env():
    """Prepare common environment variables and paths for the agent."""
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    adk_exe = os.path.join(base_dir, ".venv", "Scripts", "adk.exe")  # Windows
    if not os.path.exists(adk_exe):
        adk_exe = os.path.join(base_dir, ".venv", "bin", "adk")  # Linux/Render
    if not os.path.exists(adk_exe):
        adk_exe = "adk"  # Fallback to PATH
    agent_dir = os.path.join(base_dir, "agent")
    env_file_path = os.path.join(base_dir, ".env")

    merged_env = os.environ.copy()
    merged_env["PYTHONIOENCODING"] = "utf-8"
    merged_env["NODE_OPTIONS"] = "--max-old-space-size=40"
    merged_env["MALLOC_ARENA_MAX"] = "1"
    merged_env["PYTHONMALLOC"] = "malloc"
    if os.path.exists(env_file_path):
        with open(env_file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    merged_env[k] = v.strip("'\"")

    return base_dir, adk_exe, agent_dir, merged_env


def clean_and_serialize_json(raw_text: str) -> str:
    """Robustly cleans a raw text response, extracts the JSON/dict portion,
    and returns a valid double-quoted JSON string.
    """
    import json
    import ast
    
    raw_text = raw_text.strip()
    
    # Split on agent identifiers if present
    if "[project_agent]:" in raw_text:
        raw_text = raw_text.split("[project_agent]:")[-1].strip()
    elif "Agent:" in raw_text:
        raw_text = raw_text.split("Agent:")[-1].strip()
        
    # Extract content between first '{' and last '}'
    start_idx = raw_text.find('{')
    end_idx = raw_text.rfind('}')
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        raw_text = raw_text[start_idx:end_idx+1]
    
    # Try parsing as standard JSON
    try:
        parsed = json.loads(raw_text)
        return json.dumps(parsed)
    except Exception:
        pass
        
    # Try parsing as python dictionary/list literal (deals with single quotes, None, True, False)
    try:
        parsed = ast.literal_eval(raw_text)
        if isinstance(parsed, (dict, list)):
            return json.dumps(parsed)
    except Exception:
        pass
        
    # If all fails, return a JSON error structure so the caller gets valid JSON
    return json.dumps({"error": f"Failed to parse or clean response as JSON. Raw length: {len(raw_text)}"})


@app.post("/api/chat")
async def chat(request: ChatRequest):
    # --- FAST PATH: Bypass AI for pure data aggregation tasks to save 300MB RAM! ---
    if "TEAM WORKLOAD DASHBOARD" in request.message and request.project_id:
        try:
            from agent.gitlab_api import get_company_directory, get_project_members, list_project_issues
            
            # 1. Get all developers
            company = get_company_directory().get("directory", [])
            
            # 2. Get project members
            p_members = get_project_members(request.project_id).get("members", [])
            p_usernames = {m.get("username") for m in p_members if m.get("username")}
            
            # 3. Get all issues
            opened = list_project_issues(request.project_id, state="opened").get("issues", [])
            closed = list_project_issues(request.project_id, state="closed").get("issues", [])
            all_issues = opened + closed
            
            # 4. Aggregate
            dashboard = []
            for dev in company:
                username = dev.get("username")
                assigned_issues = []
                for issue in all_issues:
                    if username in issue.get("assignees", []):
                        assigned_issues.append({
                            "iid": issue.get("iid"),
                            "title": issue.get("title"),
                            "state": issue.get("state"),
                            "description": issue.get("description", "")
                        })
                
                dashboard.append({
                    "name": dev.get("name"),
                    "username": username,
                    "role": dev.get("role", "Engineer"),
                    "skills": dev.get("skills", []),
                    "in_project": username in p_usernames,
                    "assigned_issues": assigned_issues
                })
            import json
            return {"response": json.dumps({"team_dashboard": dashboard})}
        except Exception as e:
            return {"response": json.dumps({"error": f"Fast path failed: {str(e)}"})}

    global _agent_busy
    # Prevent concurrent AI agent calls to avoid OOM on 512MB Render
    if _agent_busy:
        return {"response": '{"error": "Agent is busy processing another request. Please wait and try again."}'}
    
    _agent_busy = True
    try:
        print(f"Executing Agent with query: {request.message}")

        base_dir, adk_exe, agent_dir, merged_env = _prepare_agent_env()

        final_query = request.message
        if request.project_id:
            final_query = f"[TARGET PROJECT ID: {request.project_id}]\n\n{final_query}"

        # ── STREAMING MODE (Zero-to-One only) ──────────────────────────
        if request.stream_output:
            from fastapi.responses import StreamingResponse

            async def stream_agent_output():
                global _agent_busy
                try:
                    process = await asyncio.create_subprocess_exec(
                        adk_exe, "run", agent_dir, final_query,
                        env=merged_env,
                        cwd=base_dir,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.STDOUT,
                    )

                    full_output = ""
                    while True:
                        line_bytes = await process.stdout.readline()
                        if not line_bytes and process.returncode is not None:
                            break
                        if line_bytes:
                            line_str = line_bytes.decode('utf-8', errors='replace')
                            full_output += line_str
                            yield line_str

                    # Extract final JSON robustly
                    print(f"--- AGENT SUBPROCESS OUTPUT ---\n{full_output}\n--- END SUBPROCESS OUTPUT ---", flush=True)
                    yield "\n__FINAL_JSON__\n"
                    if process.returncode != 0:
                        import json
                        yield json.dumps({"error": f"Agent crashed with code {process.returncode}"})
                    else:
                        import json
                        yield json.dumps({"status": "success"})
                finally:
                    _agent_busy = False

            return StreamingResponse(stream_agent_output(), media_type="text/plain")

        # ── NORMAL MODE (all other features) ───────────────────────────
        from fastapi.responses import StreamingResponse

        async def stream_spaces_then_json():
            global _agent_busy
            try:
                process = await asyncio.create_subprocess_exec(
                    adk_exe, "run", agent_dir, final_query,
                    env=merged_env,
                    cwd=base_dir,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.STDOUT,
                )

                full_output = ""
                while True:
                    try:
                        line_bytes = await asyncio.wait_for(process.stdout.readline(), timeout=2.0)
                        
                        if not line_bytes and process.returncode is not None:
                            break
                            
                        if line_bytes:
                            full_output += line_bytes.decode('utf-8', errors='replace')
                            yield " "
                    except asyncio.TimeoutError:
                        yield " "
                        if process.returncode is not None:
                            break
                        continue

                # Process finished. Extract final JSON robustly
                cleaned_json = clean_and_serialize_json(full_output)
                
                # Check if it was a parsing error generated by our helper
                try:
                    parsed = json.loads(cleaned_json)
                    is_parse_error = isinstance(parsed, dict) and "error" in parsed and "Failed to parse or clean response" in parsed["error"]
                except Exception:
                    is_parse_error = True
                    
                if is_parse_error:
                    yield json.dumps({"error": f"Agent returned no valid JSON. Raw output length: {len(full_output)}"})
                else:
                    yield json.dumps({"response": cleaned_json})
            finally:
                _agent_busy = False

        return StreamingResponse(stream_spaces_then_json(), media_type="application/json")

    except Exception as e:
        import traceback
        print(f"Error during agent execution: {traceback.format_exc()}")
        _agent_busy = False
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

def start_server():
    print("Starting Agent API on port 8000...")
    uvicorn.run("agent.server:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    start_server()

# ── Tech Lead AI Review Endpoints ─────────────────────────────────────
from agent.db import get_tech_reviews as db_get_reviews, save_tech_reviews as db_save_reviews

@app.get("/api/reviews/{project_id}")
async def get_reviews(project_id: str):
    return {"reviews": db_get_reviews(project_id)}

@app.post("/api/reviews/{project_id}/{mr_iid}/execute")
def execute_manual_review(project_id: str, mr_iid: int):
    from agent.gitlab_api import get_merge_request_changes, post_mr_comment, GITLAB_API_URL, HEADERS
    from agent.agent import run_tech_lead_review
    import requests, re, time

    mr_resp = requests.get(f"{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr_iid}", headers=HEADERS)
    if mr_resp.status_code != 200:
        raise HTTPException(status_code=404, detail="MR not found")

    mr_data = mr_resp.json()
    changes_data = get_merge_request_changes(project_id, mr_iid)
    review_result = run_tech_lead_review(project_id, mr_data, changes_data)

    json_match = re.search(r'\{[\s\S]*\}', review_result)
    if json_match:
        review_json = json.loads(json_match.group(0))
    else:
        review_json = {"review": {"status": "ERROR", "summary": "Failed to parse AI response.", "feedback": []}}

    status = review_json.get("review", {}).get("status", "UNKNOWN")
    summary = review_json.get("review", {}).get("summary", "")

    comment_body = f"🤖 **AI Tech Lead Code Review**\n\n**Status**: {status}\n\n**Summary**: {summary}\n"
    for fb in review_json.get("review", {}).get("feedback", []):
        comment_body += f"\n- **{fb.get('file', 'File')}**: {fb.get('comment', '')}"

    post_mr_comment(project_id, mr_iid, comment_body)

    # ── AUTO-APPROVE + AUTO-MERGE + AUTO-CLOSE ISSUES ──────────────────
    if status == "APPROVED":
        print(f"✅ AI APPROVED MR #{mr_iid}! Auto-approving and merging...")
        
        # Step 1: Auto-Approve the MR
        try:
            approve_resp = requests.post(
                f"{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr_iid}/approve",
                headers=HEADERS
            )
            print(f"   Approve API response: {approve_resp.status_code}")
        except Exception as e:
            print(f"   Approve failed (non-critical): {e}")

        # Step 2: Auto-Merge the MR
        try:
            merge_resp = requests.put(
                f"{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr_iid}/merge",
                headers=HEADERS,
                json={"merge_commit_message": f"Auto-merged by AI Tech Lead: MR #{mr_iid}", "should_remove_source_branch": True}
            )
            print(f"   Merge API response: {merge_resp.status_code}")
            
            # Step 3: Auto-Close related Issues
            if merge_resp.status_code in [200, 201]:
                print(f"   🎉 MR #{mr_iid} merged successfully! Scanning for related issues...")
                mr_title = mr_data.get("title", "")
                mr_desc = mr_data.get("description", "") or ""
                
                # Find issue references like #7, #12, closes #7, fixes #12
                issue_refs = set(re.findall(r'#(\d+)', mr_title + " " + mr_desc))
                
                for issue_iid in issue_refs:
                    try:
                        close_resp = requests.put(
                            f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid}",
                            headers=HEADERS,
                            json={"state_event": "close"}
                        )
                        if close_resp.status_code == 200:
                            print(f"   📋 Auto-closed Issue #{issue_iid}")
                            # Also post a comment on the issue
                            requests.post(
                                f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid}/notes",
                                headers=HEADERS,
                                json={"body": f"🤖 **Auto-closed by AI Tech Lead**\n\nThis issue was automatically closed after MR !{mr_iid} was reviewed (APPROVED) and merged by the AI Tech Lead agent."}
                            )
                        else:
                            print(f"   Issue #{issue_iid} close failed: {close_resp.status_code}")
                    except Exception as e:
                        print(f"   Issue #{issue_iid} close error: {e}")
        except Exception as e:
            print(f"   Merge failed: {e}")
    # ── AUTO-REMEDIATE: Push fix commits for NEEDS_WORK ──────────────────
    elif status == "NEEDS_WORK":
        fixes = review_json.get("review", {}).get("fixes", [])
        if fixes:
            print(f"🔧 AI found minor issues in MR #{mr_iid}. Auto-remediating {len(fixes)} file(s)...")
            from agent.gitlab_api import commit_fix_to_branch
            source_branch = mr_data.get("source_branch", "")
            
            commit_result = commit_fix_to_branch(
                project_id, 
                source_branch, 
                fixes,
                f"🤖 AI Auto-Fix: Resolved minor code quality issues in MR #{mr_iid}"
            )
            
            if commit_result.get("status") == "success":
                print(f"   ✅ Auto-fix commit pushed to branch '{source_branch}': {commit_result.get('short_id')}")
                
                # Post comment about the auto-fix
                fix_comment = f"🔧 **AI Auto-Remediate Applied!**\n\n"
                fix_comment += f"I found minor issues and automatically pushed a fix commit (`{commit_result.get('short_id')}`) to branch `{source_branch}`.\n\n"
                fix_comment += "**Files fixed:**\n"
                for fix in fixes:
                    fix_comment += f"- `{fix.get('file_path')}`\n"
                fix_comment += "\nPlease review the auto-fix and merge when ready."
                post_mr_comment(project_id, mr_iid, fix_comment)
                
                # Mark as auto-fixed in the review record
                review_json["review"]["auto_fixed"] = True
                review_json["review"]["fix_commit"] = commit_result.get("short_id")
                
                # ── RE-REVIEW after auto-fix ──────────────────────────
                print(f"   🔄 Re-reviewing MR #{mr_iid} after auto-fix...")
                import time as _time
                _time.sleep(5)  # Wait for GitLab to register the new commit
                
                mr_resp2 = requests.get(f"{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr_iid}", headers=HEADERS)
                if mr_resp2.status_code == 200:
                    mr_data2 = mr_resp2.json()
                    changes_data2 = get_merge_request_changes(project_id, mr_iid)
                    review_result2 = run_tech_lead_review(project_id, mr_data2, changes_data2)
                    
                    json_match2 = re.search(r'\{[\s\S]*\}', review_result2)
                    if json_match2:
                        review_json2 = json.loads(json_match2.group(0))
                    else:
                        review_json2 = {"review": {"status": "ERROR"}}
                    
                    status2 = review_json2.get("review", {}).get("status", "UNKNOWN")
                    summary2 = review_json2.get("review", {}).get("summary", "")
                    
                    # Post re-review comment
                    recheck_comment = f"🤖 **AI Tech Lead Re-Review (Post Auto-Fix)**\n\n**Status**: {status2}\n\n**Summary**: {summary2}\n"
                    for fb2 in review_json2.get("review", {}).get("feedback", []):
                        recheck_comment += f"\n- **{fb2.get('file', 'File')}**: {fb2.get('comment', '')}"
                    post_mr_comment(project_id, mr_iid, recheck_comment)
                    
                    # Update the review record with re-review
                    review_json = review_json2
                    review_json["review"]["auto_fixed"] = True
                    review_json["review"]["fix_commit"] = commit_result.get("short_id")
                    status = status2
                    
                    if status2 == "APPROVED":
                        print(f"   ✅ Re-review APPROVED! Auto-approving and merging MR #{mr_iid}...")
                        try:
                            requests.post(f"{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr_iid}/approve", headers=HEADERS)
                        except Exception:
                            pass
                        try:
                            merge_resp = requests.put(
                                f"{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr_iid}/merge",
                                headers=HEADERS,
                                json={"merge_commit_message": f"Auto-merged by AI Tech Lead: MR #{mr_iid}", "should_remove_source_branch": True}
                            )
                            if merge_resp.status_code in [200, 201]:
                                print(f"   🎉 MR #{mr_iid} merged successfully after auto-fix!")
                                # Auto-close related issues
                                mr_title2 = mr_data2.get("title", "")
                                mr_desc2 = mr_data2.get("description", "") or ""
                                issue_refs = set(re.findall(r'#(\d+)', mr_title2 + " " + mr_desc2))
                                for issue_iid_ref in issue_refs:
                                    try:
                                        requests.put(f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid_ref}", headers=HEADERS, json={"state_event": "close"})
                                        requests.post(f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid_ref}/notes", headers=HEADERS, json={"body": f"🤖 **Auto-closed by AI Tech Lead**\n\nThis issue was automatically closed after MR !{mr_iid} was reviewed (APPROVED) and merged by the AI Tech Lead agent."})
                                        print(f"   📋 Auto-closed Issue #{issue_iid_ref}")
                                    except Exception:
                                        pass
                        except Exception as e:
                            print(f"   Merge failed after re-review: {e}")
                    else:
                        print(f"   ⚠️ Re-review status: {status2}. Manual intervention needed.")
            else:
                print(f"   ❌ Auto-fix commit failed: {commit_result.get('error')}")
                post_mr_comment(project_id, mr_iid, f"🔧 AI attempted an auto-fix but the commit failed: `{commit_result.get('error', 'Unknown error')}`")
        else:
            print(f"⚠️ AI marked MR #{mr_iid} as NEEDS_WORK but provided no fixes.")
    else:
        print(f"❌ AI REJECTED MR #{mr_iid} (status: {status}). Skipping auto-merge.")
    # ───────────────────────────────────────────────────────────────────

    proj_reviews = db_get_reviews(project_id)
    new_review = {
        "mr_iid": mr_iid,
        "mr_title": mr_data.get("title"),
        "created_at": time.time(),
        "review": review_json.get("review", {})
    }

    proj_reviews.insert(0, new_review)
    db_save_reviews(project_id, proj_reviews)

    return new_review

async def execute_auto_triage(project_id: str, issue_iid: int, issue_data: dict):
    print(f"🤖 Starting Auto-Triage for Issue #{issue_iid}: {issue_data.get('title')}")
    
    # 1. Fetch ACTUAL project members (so we don't assign to people in other projects)
    from agent.gitlab_api import get_team_profiles, get_global_user_open_issue_count
    
    profiles = get_team_profiles()
    team_roster = profiles.get("team", [])
    if not team_roster:
        print("   ❌ No company team roster available for auto-triage.")
        return
        
    # Dynamically update workload globally across all projects
    for member in team_roster:
        username = member.get("username")
        if username:
            member["current_open_issues"] = get_global_user_open_issue_count(username)

    # 2. Prepare the prompt for the AI
    issue_info = {
        "title": issue_data.get("title"),
        "description": issue_data.get("description"),
        "created_at": issue_data.get("created_at")
    }
    
    prompt = f"Execute AUTO-TRIAGE PROTOCOL. Incoming Issue: {json.dumps(issue_info, ensure_ascii=False)}\nTeam Roster: {json.dumps(team_roster, ensure_ascii=False)}"
    
    # 3. Call the AI
    chat_req = ChatRequest(message=prompt, project_id=project_id)
    try:
        response_obj = await chat(chat_req)
        
        # If it returned an error dict instead of StreamingResponse
        if isinstance(response_obj, dict):
            ai_response = response_obj.get("response", "")
        else:
            # It's a StreamingResponse, we must consume it
            chunks = []
            async for chunk in response_obj.body_iterator:
                chunks.append(chunk)
            ai_response = "".join(chunks)

        if '"error": "Agent is busy' in ai_response:
            print("   ❌ Triage failed: Agent is busy.")
            return

        # 4. Parse the AI result
        import re
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            print(f"   ❌ AI did not return a valid JSON object. Raw: {ai_response}")
            return
            
        triage_json = json.loads(json_match.group(0))
        assignee_username = triage_json.get("assignee_username")
        labels = triage_json.get("labels", [])
        reason = triage_json.get("reason", "")
        
        # Fallback if AI hallucinates "None"
        if not assignee_username or assignee_username.lower() in ["none", "null", ""]:
            assignable_roster = [m for m in team_roster if m.get("assignable", True) is not False]
            if assignable_roster:
                # Basic skill matching for fallback
                issue_text = (issue_info.get("title", "") + " " + issue_info.get("description", "")).lower()
                for m in assignable_roster:
                    m["score"] = m.get("current_open_issues", 0) * 10  # Lower is better
                    
                    # 1. Skill Matching Bonus
                    skills = [s.lower() for s in m.get("skills", [])]
                    for skill in skills:
                        if skill in issue_text:
                            m["score"] -= 5
                            
                    # 2. Role/Domain Matching Bonus
                    dev_role = m.get("role", "").lower()
                    DOMAIN_KEYWORDS = {
                        "frontend": ["ui", "button", "page", "component", "css", "style", "view", "interface", "client"],
                        "backend": ["api", "database", "server", "endpoint", "query", "data", "model", "schema", "logic"],
                        "devops": ["deploy", "host", "pipeline", "ci/cd", "cloud", "server", "firebase", "render", "vercel", "connection", "infrastructure", "docker", "build"]
                    }
                    
                    for domain, keywords in DOMAIN_KEYWORDS.items():
                        if domain in dev_role:
                            for kw in keywords:
                                if kw in issue_text:
                                    m["score"] -= 3  # Role-based bonus
                
                # Pick the one with the lowest score as a safe default
                sorted_roster = sorted(assignable_roster, key=lambda x: x.get("score", 0))
                assignee_username = sorted_roster[0].get("username")
            else:
                assignee_username = "Unassigned"
        
        print(f"   ✅ AI decided to assign to @{assignee_username} with labels {labels}")
        
        from agent.gitlab_api import get_user_by_username, update_issue, post_issue_comment
        
        # Resolve username to user ID
        assignee_id = get_user_by_username(assignee_username)
        
        assignee_ids = [assignee_id] if assignee_id else None
        
        # 5. Update the issue
        update_res = update_issue(project_id, issue_iid, labels=labels, assignee_ids=assignee_ids)
        if update_res.get("status") == "success":
            print(f"   ✅ Successfully updated issue #{issue_iid}")
        else:
            print(f"   ❌ Failed to update issue: {update_res.get('error')}")
            
        # 6. Post comment
        if assignee_username == "Unassigned":
            comment_body = f"🤖 **AI Auto-Triage Applied!**\n\n**Assigned to:** Unassigned\n\n**Reasoning:** {reason}\n\n*This issue was automatically routed based on team skillsets and current workloads.*"
        else:
            comment_body = f"🤖 **AI Auto-Triage Applied!**\n\n**Assigned to:** `@{assignee_username}`\n\n**Reasoning:** {reason}\n\n*This issue was automatically routed based on team skillsets and current workloads.*"
        post_res = post_issue_comment(project_id, issue_iid, comment_body)
        if post_res.get("status") == "success":
            print(f"   ✅ Successfully posted triage comment on issue #{issue_iid}")
            
    except Exception as e:
        print(f"   ❌ Auto-Triage failed: {str(e)}")

async def execute_auto_wiki(project_id: str, mr_iid: int, target_branch: str):
    print(f"📚 Starting Auto-Wiki for merged MR #{mr_iid} on branch {target_branch}")
    
    from agent.gitlab_api import get_merge_request_changes, get_file_content, commit_fix_to_branch
    
    # 1. Get MR diff
    mr_changes = get_merge_request_changes(project_id, mr_iid)
    changes_list = mr_changes.get("changes", [])
    if not changes_list:
        print("   ❌ No changes found in MR.")
        return
        
    diff_texts = []
    for c in changes_list[:5]: # Limit to first 5 files to avoid token overflow
        diff_texts.append(f"File: {c.get('new_path')}\nDiff:\n{c.get('diff')}")
    diff_summary = "\n\n".join(diff_texts)
    
    # 2. Get current README.md
    readme_content = get_file_content(project_id, "README.md", target_branch)
    if not readme_content:
        # If no README exists, we can still generate one
        readme_content = "# Project Documentation\n\n(No current README.md found)"
        
    # 3. Call AI
    prompt = f"Execute AUTO-WIKI PROTOCOL.\n\nCURRENT README.md:\n{readme_content}\n\nMR CHANGES:\n{diff_summary}"
    chat_req = ChatRequest(message=prompt, project_id=project_id)
    try:
        response_obj = await chat(chat_req)
        
        if isinstance(response_obj, dict):
            ai_response = response_obj.get("response", "")
        else:
            chunks = []
            async for chunk in response_obj.body_iterator:
                chunks.append(chunk)
            ai_response = "".join(chunks)

        if '"error": "Agent is busy' in ai_response:
            print("   ❌ Auto-Wiki failed: Agent is busy.")
            return

        import re
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            print("   ❌ AI did not return a valid JSON object.")
            return
            
        wiki_json = json.loads(json_match.group(0))
        status = wiki_json.get("status")
        
        if status == "updated":
            new_readme = wiki_json.get("new_readme_content")
            reason = wiki_json.get("reason")
            print(f"   ✅ AI decided to update README: {reason}")
            
            # 4. Commit directly to target branch
            commit_res = commit_fix_to_branch(
                project_id=project_id,
                branch=target_branch,
                files=[{"action": "update", "file_path": "README.md", "content": new_readme}],
                commit_message=f"📝 docs: auto-update documentation based on MR !{mr_iid}"
            )
            
            if commit_res.get("status") == "success":
                print(f"   ✅ Auto-Wiki successfully pushed README.md update to {target_branch}.")
            else:
                # Fallback to create if update fails
                if "A file with this name doesn't exist" in commit_res.get("error", ""):
                    commit_res = commit_fix_to_branch(
                        project_id=project_id,
                        branch=target_branch,
                        files=[{"action": "create", "file_path": "README.md", "content": new_readme}],
                        commit_message=f"📝 docs: auto-create documentation based on MR !{mr_iid}"
                    )
                    if commit_res.get("status") == "success":
                        print(f"   ✅ Auto-Wiki successfully created README.md on {target_branch}.")
                    else:
                        print(f"   ❌ Auto-Wiki failed to create README.md: {commit_res.get('error')}")
                else:
                    print(f"   ❌ Auto-Wiki commit failed: {commit_res.get('error')}")
        else:
            print("   ℹ️ AI determined no documentation update is needed.")
            
    except Exception as e:
        print(f"   ❌ Auto-Wiki failed: {str(e)}")


def auto_close_issues_on_merge(project_id: str, mr_attrs: dict):
    """Auto-close issues referenced in MR title/description when MR is merged (manual or auto)."""
    import re, requests as http_req
    from agent.gitlab_api import GITLAB_API_URL, HEADERS
    
    title = mr_attrs.get("title", "")
    description = mr_attrs.get("description", "") or ""
    mr_iid = mr_attrs.get("iid", "?")
    
    # Find all issue references like #7, #12, #13
    issue_refs = set(re.findall(r'#(\d+)', title + " " + description))
    
    if not issue_refs:
        print(f"   ℹ️ No issue references found in MR !{mr_iid}")
        return
    
    print(f"   📋 Found issue references in MR !{mr_iid}: {issue_refs}")
    
    for issue_iid in issue_refs:
        try:
            # Close the issue
            close_resp = http_req.put(
                f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid}",
                headers=HEADERS,
                json={"state_event": "close"}
            )
            if close_resp.status_code == 200:
                print(f"   ✅ Auto-closed Issue #{issue_iid}")
                # Post a comment explaining why
                http_req.post(
                    f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid}/notes",
                    headers=HEADERS,
                    json={"body": f"🤖 **Auto-closed** — This issue was resolved by MR !{mr_iid} which has been merged."}
                )
            else:
                print(f"   ⚠️ Failed to close Issue #{issue_iid}: {close_resp.status_code}")
        except Exception as e:
            print(f"   ❌ Error closing Issue #{issue_iid}: {e}")


# ── Pipeline Rescue (CI/CD Auto-Diagnostics) ──────────────────────────

# In-memory store for pipeline events (last 20)
_pipeline_events = []

async def execute_pipeline_rescue(project_id: str, pipeline_id: int, ref: str, pipeline_attrs: dict):
    """Diagnose a failed CI/CD pipeline by fetching job logs and asking AI for root-cause analysis."""
    print(f"🚨 Starting Pipeline Rescue for Pipeline #{pipeline_id} on branch '{ref}'")
    
    from agent.gitlab_api import get_pipeline_jobs, get_job_log, GITLAB_API_URL, HEADERS
    import requests as http_req
    
    # 1. Get all jobs in the failed pipeline
    jobs_resp = get_pipeline_jobs(project_id, pipeline_id)
    if "error" in jobs_resp:
        print(f"   ❌ Failed to fetch pipeline jobs: {jobs_resp['error']}")
        return
    
    jobs = jobs_resp.get("jobs", [])
    failed_jobs = [j for j in jobs if j.get("status") == "failed"]
    
    if not failed_jobs:
        print("   ℹ️ No failed jobs found in pipeline (might have been retried).")
        return
    
    # 2. Fetch logs from each failed job
    all_logs = []
    for job in failed_jobs[:3]:  # Max 3 failed jobs to avoid token overflow
        job_id = job.get("id")
        job_name = job.get("name", "unknown")
        failure_reason = job.get("failure_reason", "unknown")
        log_resp = get_job_log(project_id, job_id)
        if "error" not in log_resp:
            all_logs.append(f"=== JOB: {job_name} (ID: {job_id}, Stage: {job.get('stage')}, Reason: {failure_reason}) ===\n{log_resp.get('log', '')}")
        else:
            all_logs.append(f"=== JOB: {job_name} (ID: {job_id}, Reason: {failure_reason}) === [LOG FETCH FAILED]")
    
    combined_logs = "\n\n".join(all_logs)
    
    # 3. Send to AI for diagnosis
    prompt = f"Execute PIPELINE RESCUE PROTOCOL.\n\nPipeline #{pipeline_id} on branch '{ref}' has FAILED.\n\nFailed Job Logs:\n{combined_logs}"
    chat_req = ChatRequest(message=prompt, project_id=project_id)
    
    try:
        response_obj = await chat(chat_req)
        
        if isinstance(response_obj, dict):
            ai_response = response_obj.get("response", "")
        else:
            chunks = []
            async for chunk in response_obj.body_iterator:
                chunks.append(chunk)
            ai_response = "".join(chunks)
        
        if '"error": "Agent is busy' in ai_response:
            print("   ❌ Pipeline Rescue failed: Agent is busy.")
            return
        
        # 4. Parse AI diagnosis
        import re
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            print(f"   ❌ AI did not return valid JSON for pipeline diagnosis.")
            return
        
        try:
            diagnosis_json = json.loads(json_match.group(0))
        except Exception as e:
            print(f"   ❌ Failed to parse AI JSON: {e}")
            return
            
        # Handle cases where AI omits the "diagnosis" wrapper key
        if "diagnosis" in diagnosis_json and isinstance(diagnosis_json["diagnosis"], dict):
            diagnosis = diagnosis_json["diagnosis"]
        else:
            diagnosis = diagnosis_json
        
        failure_category = diagnosis.get("failure_category", "unknown")
        error_summary = diagnosis.get("error_summary", "Unknown error")
        root_cause = diagnosis.get("root_cause", "Could not determine root cause")
        affected_files = diagnosis.get("affected_files", [])
        fix_suggestion = diagnosis.get("fix_suggestion", "No suggestion available")
        severity = diagnosis.get("severity", "medium")
        
        print(f"   ✅ AI Diagnosis: [{failure_category}] {error_summary}")
        
        # 5. Post diagnosis as a comment on the commit that triggered this pipeline
        sha = pipeline_attrs.get("sha", "")
        
        severity_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(severity, "⚪")
        
        comment_body = (
            f"🚨 **AI Pipeline Rescue — Automated Failure Diagnosis**\n\n"
            f"**Pipeline**: #{pipeline_id} | **Branch**: `{ref}`\n"
            f"**Severity**: {severity_emoji} {severity.upper()}\n"
            f"**Category**: `{failure_category}`\n\n"
            f"---\n\n"
            f"### 🔍 Error Summary\n{error_summary}\n\n"
            f"### 🧠 Root Cause Analysis\n{root_cause}\n\n"
        )
        
        if affected_files:
            comment_body += f"### 📁 Affected Files\n"
            for f in affected_files:
                comment_body += f"- `{f}`\n"
            comment_body += "\n"
        
        comment_body += f"### 💡 Fix Suggestion\n{fix_suggestion}\n"
        
        # Post on the commit
        if sha:
            try:
                http_req.post(
                    f"{GITLAB_API_URL}/projects/{project_id}/repository/commits/{sha}/comments",
                    headers=HEADERS,
                    json={"note": comment_body}
                )
                print(f"   ✅ Posted diagnosis on commit {sha[:8]}")
            except Exception as e:
                print(f"   ❌ Failed to post commit comment: {e}")
        
        # Also try to find the MR that triggered this pipeline and comment there
        try:
            mrs_resp = http_req.get(
                f"{GITLAB_API_URL}/projects/{project_id}/merge_requests",
                headers=HEADERS,
                params={"state": "opened", "source_branch": ref, "per_page": 1}
            )
            if mrs_resp.status_code == 200 and mrs_resp.json():
                mr_iid = mrs_resp.json()[0].get("iid")
                from agent.gitlab_api import post_mr_comment
                post_mr_comment(project_id, mr_iid, comment_body)
                print(f"   ✅ Also posted diagnosis on MR !{mr_iid}")
        except Exception:
            pass
        
        # 6. Store event for the frontend dashboard
        event_record = {
            "pipeline_id": pipeline_id,
            "ref": ref,
            "sha": sha[:8] if sha else "unknown",
            "failure_category": failure_category,
            "error_summary": error_summary,
            "root_cause": root_cause,
            "fix_suggestion": fix_suggestion,
            "severity": severity,
            "affected_files": affected_files,
            "timestamp": pipeline_attrs.get("created_at", ""),
            "project_id": project_id,
            "raw_ai_response": ai_response,
            "raw_logs_sent": combined_logs
        }
        _pipeline_events.insert(0, event_record)
        if len(_pipeline_events) > 20:
            _pipeline_events.pop()
        
        print(f"   🎉 Pipeline Rescue complete for Pipeline #{pipeline_id}!")
        
    except Exception as e:
        print(f"   ❌ Pipeline Rescue failed: {str(e)}")


@app.get("/api/pipeline-events/{project_id}")
async def get_pipeline_events(project_id: str):
    """Get recent pipeline rescue events for the frontend dashboard."""
    filtered = [e for e in _pipeline_events if e.get("project_id") == project_id]
    return {"events": filtered, "total": len(filtered)}


@app.post("/api/pipeline-rescue/{project_id}/{pipeline_id}")
async def manual_pipeline_rescue(project_id: str, pipeline_id: int):
    """Manually trigger pipeline rescue for a specific failed pipeline."""
    from agent.gitlab_api import GITLAB_API_URL, HEADERS
    import requests as http_req
    
    # Fetch pipeline info
    resp = http_req.get(f"{GITLAB_API_URL}/projects/{project_id}/pipelines/{pipeline_id}", headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipe_data = resp.json()
    ref = pipe_data.get("ref", "")
    attrs = {
        "id": pipeline_id,
        "status": pipe_data.get("status"),
        "ref": ref,
        "sha": pipe_data.get("sha", ""),
        "created_at": pipe_data.get("created_at", "")
    }
    
    asyncio.create_task(execute_pipeline_rescue(project_id, pipeline_id, ref, attrs))
    return {"status": "rescue_started", "pipeline_id": pipeline_id}


@app.post("/api/webhooks/gitlab")
async def gitlab_webhook_events(request: Request):
    payload = await request.json()
    event_type = request.headers.get("X-Gitlab-Event")

    if event_type == "Merge Request Hook":
        attrs = payload.get("object_attributes", {})
        action = attrs.get("action")
        project_id = str(payload.get("project", {}).get("id"))
        mr_iid = attrs.get("iid")
        target_branch = attrs.get("target_branch")
        
        if action in ["open", "update"]:
            asyncio.create_task(asyncio.to_thread(execute_manual_review, project_id, mr_iid))
        elif action == "merge":
            asyncio.create_task(execute_auto_wiki(project_id, mr_iid, target_branch))
            # Auto-close issues referenced in MR title/description on manual merge
            asyncio.create_task(asyncio.to_thread(auto_close_issues_on_merge, project_id, attrs))
            
    elif event_type == "Issue Hook":
        attrs = payload.get("object_attributes", {})
        action = attrs.get("action")
        # Only triage if it's newly opened and has no assignees
        if action == "open" and not attrs.get("assignee_ids"):
            project_id = str(payload.get("project", {}).get("id"))
            issue_iid = attrs.get("iid")
            asyncio.create_task(execute_auto_triage(project_id, issue_iid, attrs))

    elif event_type == "Pipeline Hook":
        attrs = payload.get("object_attributes", {})
        pipeline_status = attrs.get("status")
        pipeline_id = attrs.get("id")
        project_id = str(payload.get("project", {}).get("id"))
        ref = attrs.get("ref", "")
        
        if pipeline_status == "failed":
            print(f"🚨 Pipeline #{pipeline_id} FAILED on branch '{ref}' — launching Pipeline Rescue!")
            asyncio.create_task(execute_pipeline_rescue(project_id, pipeline_id, ref, attrs))

    return {"status": "received"}


# ── Release Notes Generator Endpoints ─────────────────────────────────

class ReleaseGenerateRequest(BaseModel):
    since_date: str = None  # ISO date string, optional
    version: str = None  # e.g. "v1.0.0", optional

class ReleasePublishRequest(BaseModel):
    tag_name: str
    name: str
    description: str

@app.post("/api/releases/{project_id}/generate")
async def generate_release_notes(project_id: str, request: ReleaseGenerateRequest):
    """Use the AI agent to generate release notes from merged MRs."""
    from agent.gitlab_api import list_tags
    
    since_date = request.since_date
    if not since_date:
        # Try to find the last tag date
        tags_data = list_tags(project_id)
        tags = tags_data.get("tags", [])
        if tags and tags[0].get("committed_date"):
            since_date = tags[0]["committed_date"]
        else:
            # Default to 30 days ago
            from datetime import datetime, timedelta
            since_date = (datetime.utcnow() - timedelta(days=30)).isoformat() + "Z"
    
    version = request.version or "v0.1.0"
    
    # Use the AI agent to generate the release notes
    prompt = f"Execute RELEASE NOTE GENERATOR protocol. Generate release notes for version {version}. Fetch all merged MRs since {since_date} and all closed issues. Categorize them and output the strict JSON."
    
    # Re-use the existing chat mechanism
    chat_req = ChatRequest(message=prompt, project_id=project_id)
    try:
        result = await chat(chat_req)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/releases/{project_id}/publish")
async def publish_release(project_id: str, request: ReleasePublishRequest):
    """Publish a release to GitLab."""
    from agent.gitlab_api import create_release
    result = create_release(project_id, request.tag_name, request.name, request.description)
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    return result

# ── GitHub Auto-Skill Detection ───────────────────────────────────────
@app.get("/api/github/{username}/skills")
async def get_github_skills(username: str):
    import collections
    import requests as gh_requests
    try:
        url = f"https://api.github.com/users/{username}/repos?per_page=100&type=owner"
        headers = {"Accept": "application/vnd.github.v3+json"}
        resp = gh_requests.get(url, headers=headers)

        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to fetch GitHub repos for {username}")

        repos = resp.json()
        languages = []
        for repo in repos:
            if repo.get("language") and not repo.get("fork"):
                languages.append(repo["language"])

        if not languages:
            return {"skills": []}

        counter = collections.Counter(languages)
        top_skills = [lang for lang, count in counter.most_common()]
        return {"skills": top_skills}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Autonomous Git Watcher ──────────────────────────
import threading
import time
import requests
import asyncio

MR_LAST_UPDATED_MEMORY = {}

def gitlab_watcher_loop():
    print("🤖 Autonomous Git Watcher started. Patrolling for new code every 15 seconds...")
    from agent.gitlab_api import GITLAB_API_URL, HEADERS
    
    def get_known_project_ids():
        import os, json
        sprints_path = os.path.join(os.path.dirname(__file__), "sprint_history.json")
        if os.path.exists(sprints_path):
            with open(sprints_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return list(data.keys())
        return ["howwerd0898/project-managing-dashboard"] # Fallback default

    while True:
        try:
            pids = get_known_project_ids()
            for pid in pids:
                encoded_pid = pid.replace("/", "%2F")
                url = f"{GITLAB_API_URL}/projects/{encoded_pid}/merge_requests?state=opened"
                resp = requests.get(url, headers=HEADERS, timeout=10)
                if resp.status_code == 200:
                    mrs = resp.json()
                    for mr in mrs:
                        mr_iid = mr.get("iid")
                        updated_at = mr.get("updated_at")
                        
                        memory_key = f"{pid}-{mr_iid}"
                        
                        if memory_key not in MR_LAST_UPDATED_MEMORY:
                            # First time seeing it since server start, initialize memory
                            MR_LAST_UPDATED_MEMORY[memory_key] = updated_at
                        else:
                            if MR_LAST_UPDATED_MEMORY[memory_key] != updated_at:
                                print(f"🚨 ALERT! MR #{mr_iid} in project {pid} was updated! Intercepting code...")
                                MR_LAST_UPDATED_MEMORY[memory_key] = updated_at
                                
                                # Run the review
                                try:
                                    loop = asyncio.new_event_loop()
                                    asyncio.set_event_loop(loop)
                                    loop.run_until_complete(execute_manual_review(pid, mr_iid))
                                    loop.close()
                                except Exception as e:
                                    print(f"Error running auto-review: {e}")
        except Exception as e:
            pass # Silent fail on network errors during watch
        time.sleep(15)

# Start watcher on server boot
watcher_thread = threading.Thread(target=gitlab_watcher_loop, daemon=True)
watcher_thread.start()


_incident_events = []

async def execute_auto_revert(project_id: str, incident_data: dict):
    from agent.gitlab_api import get_latest_commit, create_branch, revert_commit, create_merge_request, create_issue, get_project_members
    
    print(f"🚨 [AUTO-REVERT] Incident detected on project {project_id}! Executing emergency response...")
    
    # 1. Get latest commit
    latest_commit = get_latest_commit(project_id, "main")
    if not latest_commit:
        return "❌ Could not find latest commit to revert."
        
    commit_sha = latest_commit.get("id")
    short_sha = commit_sha[:8]
    author_name = latest_commit.get("author_name", "Unknown")
    
    # 2. Create Revert Branch
    branch_name = f"revert-incident-{short_sha}"
    print(f"   🌱 Creating branch {branch_name}...")
    b_res = create_branch(project_id, branch_name, "main")
    if "error" in b_res:
        return f"❌ Branch creation failed: {b_res['error']}"
    
    # 3. Execute Revert
    print(f"   ⏪ Reverting commit {short_sha}...")
    revert_res = revert_commit(project_id, commit_sha, branch_name)
    if "error" in revert_res:
        return f"❌ Revert failed: {revert_res['error']}"
        
    # 4. Create Emergency MR
    print("   🚀 Creating Emergency Merge Request...")
    mr_title = f"🚨 [EMERGENCY] Auto-Revert: Production Incident Detected"
    mr_desc = f"**Incident Report:**\n```json\n{incident_data}\n```\n\nThis MR automatically reverts the latest commit `{short_sha}` by `{author_name}` to restore production stability.\n\n/assign @{author_name}"
    mr_res = create_merge_request(project_id, branch_name, "main", mr_title, mr_desc)
    if "error" in mr_res:
        return f"❌ MR creation failed: {mr_res['error']}"
    
    # 5. Create P0 Issue assigned to author
    print(f"   🐛 Creating P0 Issue for {author_name}...")
    members = get_project_members(project_id)
    # Very naive matching for hackathon demo
    assignee_id = None
    for m in members:
        if m.get("name") == author_name or m.get("username") == author_name:
            assignee_id = m.get("id")
            break
            
    issue_title = f"🔥 [P0] Prod Crash Caused by Commit {short_sha}"
    issue_desc = f"Your recent commit `{short_sha}` caused a production incident. The system has automatically created a revert MR to stop the bleeding.\n\n**Incident Details:**\n```json\n{incident_data}\n```\n\nPlease investigate the root cause immediately."
    assignees = [assignee_id] if assignee_id else None
    create_issue(project_id, issue_title, issue_desc, "bug,critical", assignees)
    
    # 6. Store event
    event = {
        "timestamp": incident_data.get("timestamp", "Just now"),
        "error": incident_data.get("error", "Unknown Crash"),
        "reverted_commit": short_sha,
        "author": author_name,
        "mr_url": mr_res.get("web_url", "")
    }
    _incident_events.insert(0, event)
    print("   ✅ Auto-Revert Protocol Completed Successfully!")

@app.post("/api/webhooks/incident/{project_id}")
async def simulate_incident(project_id: str, request: Request):
    try:
        incident_data = await request.json()
    except Exception:
        incident_data = {"error": "Simulated Memory Leak or Crash"}
        
    res = await execute_auto_revert(project_id, incident_data)
    return {"status": "Incident Received, Auto-Revert Executed", "details": res}

@app.get("/api/incident-events/{project_id}")
async def get_incident_events(project_id: str):
    return {"events": _incident_events}

# ── Standup History (standup_history.json) CRUD ──────────────────────────
from agent.db import get_standup_history as db_get_standups, save_standup_history as db_save_standups

class StandupSaveRequest(BaseModel):
    report: str  # The raw markdown/JSON string returned by the AI

@app.post("/api/standups/{project_id}/save")
async def save_standup(project_id: str, request: StandupSaveRequest):
    """Save today's standup report. If one already exists for today, overwrite it."""
    try:
        from datetime import datetime, timezone, timedelta
        today = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")

        data = db_get_standups()
        history = data.get("history", [])

        # Find existing standup for today and project_id, or append new one
        found = False
        new_entry = {
            "project_id": project_id,
            "date": f"{project_id}_{today}", # make it unique per project
            "report": request.report,
            "saved_at": datetime.now(timezone(timedelta(hours=8))).isoformat()
        }
        for i, entry in enumerate(history):
            if entry.get("project_id") == project_id and entry.get("date") == new_entry["date"]:
                history[i] = new_entry
                found = True
                break
        if not found:
            history.append(new_entry)

        db_save_standups({"history": history})

        return {"status": "saved", "date": today}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/standups/{project_id}/history")
async def get_standup_history(project_id: str):
    """Get all saved standups for a project, sorted by date descending."""
    try:
        data = db_get_standups()
        history = data.get("history", [])
        project_standups = [h for h in history if h.get("project_id") == project_id]
        standups_list = sorted(project_standups, key=lambda x: x["date"], reverse=True)
        return {"standups": standups_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
