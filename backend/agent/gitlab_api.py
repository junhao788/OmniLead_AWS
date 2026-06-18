"""
Direct GitLab REST API tools for the Project Agent.
These provide READ capabilities that the GitLab MCP server doesn't offer.
"""
import os
import requests
from dotenv import load_dotenv
import time
from functools import wraps

# --- Simple TTL Cache ---
def ttl_cache(ttl_seconds=60):
    def decorator(func):
        cache = {}
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < ttl_seconds:
                    return result
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())
            return result
        return wrapper
    return decorator

load_dotenv()


GITLAB_TOKEN = os.environ.get("GITLAB_PERSONAL_ACCESS_TOKEN", "")
GITLAB_API_URL = os.environ.get("GITLAB_API_URL", "https://gitlab.com/api/v4")
PROJECT_ID = "82559130"

HEADERS = {"PRIVATE-TOKEN": GITLAB_TOKEN}


def get_global_user_open_issue_count(username: str) -> int:
    """Get the total number of open issues assigned to a user across ALL projects."""
    url = f"{GITLAB_API_URL}/issues"
    params = {"state": "opened", "assignee_username": username, "per_page": 1}
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code == 200:
        total = resp.headers.get("X-Total")
        if total is not None:
            return int(total)
        return len(resp.json())
    return 0

def list_project_issues(project_id: str, state: str = "all", per_page: int = 20) -> dict:
    """List issues for a project. State can be 'opened', 'closed', or 'all'."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/issues"
    params = {"state": state, "per_page": per_page, "order_by": "updated_at", "sort": "desc"}
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        return {"error": f"GitLab API error {resp.status_code}: {resp.text[:200]}"}
    issues = resp.json()
    result = []
    for i in issues:
        result.append({
            "iid": i.get("iid"),
            "title": i.get("title"),
            "state": i.get("state"),
            "author": i.get("author", {}).get("username"),
            "assignees": [a.get("username") for a in i.get("assignees", [])] if i.get("assignees") else [],
            "closed_by": i.get("closed_by", {}).get("username") if i.get("closed_by") else None,
            "labels": i.get("labels", []),
            "created_at": i.get("created_at"),
            "updated_at": i.get("updated_at"),
            "web_url": i.get("web_url"),
            "description": i.get("description", ""),
        })
    return {"issues": result, "total": len(result)}


def get_issue_detail(project_id: str, issue_iid: int) -> dict:
    """Get detailed information about a specific issue by its IID (e.g. #1)."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid}"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code != 200:
        return {"error": f"GitLab API error {resp.status_code}: {resp.text[:200]}"}
    i = resp.json()
    # Also get issue notes/comments
    notes_url = f"{url}/notes"
    notes_resp = requests.get(notes_url, headers=HEADERS, params={"per_page": 10})
    notes = []
    if notes_resp.status_code == 200:
        for n in notes_resp.json():
            notes.append({"author": n.get("author", {}).get("username"), "body": n.get("body", "")[:300]})
    return {
        "iid": i.get("iid"),
        "title": i.get("title"),
        "description": i.get("description", ""),
        "state": i.get("state"),
        "author": i.get("author", {}).get("username"),
        "assignees": [a.get("username") for a in i.get("assignees", [])],
        "labels": i.get("labels", []),
        "milestone": i.get("milestone", {}).get("title") if i.get("milestone") else None,
        "created_at": i.get("created_at"),
        "updated_at": i.get("updated_at"),
        "web_url": i.get("web_url"),
        "notes": notes,
    }


def list_merge_requests(project_id: str, state: str = "all", per_page: int = 20) -> dict:
    """List merge requests for a project. State can be 'opened', 'closed', 'merged', or 'all'."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/merge_requests"
    params = {"state": state, "per_page": per_page, "order_by": "updated_at", "sort": "desc"}
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        return {"error": f"GitLab API error {resp.status_code}: {resp.text[:200]}"}
    mrs = resp.json()
    result = []
    for mr in mrs:
        result.append({
            "iid": mr.get("iid"),
            "title": mr.get("title"),
            "state": mr.get("state"),
            "author": mr.get("author", {}).get("username"),
            "source_branch": mr.get("source_branch"),
            "target_branch": mr.get("target_branch"),
            "created_at": mr.get("created_at"),
            "merged_at": mr.get("merged_at"),
            "web_url": mr.get("web_url"),
        })
    return {"merge_requests": result, "total": len(result)}


def list_recent_commits(project_id: str, ref_name: str = "main", per_page: int = 10) -> dict:
    """List recent commits on a specific branch (default 'main')."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/repository/commits"
    params = {"ref_name": ref_name, "per_page": per_page}
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        return {"error": f"GitLab API error {resp.status_code}: {resp.text[:200]}"}
    commits = resp.json()
    result = []
    for c in commits:
        result.append({
            "short_id": c.get("short_id"),
            "title": c.get("title"),
            "author_name": c.get("author_name"),
            "authored_date": c.get("authored_date"),
            "message": c.get("message", "")[:200],
        })
    return {"commits": result, "total": len(result)}


def list_pipelines(project_id: str, status: str = None, per_page: int = 10) -> dict:
    """List recent CI/CD pipelines. Optional status (e.g. 'success', 'failed', 'running')."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/pipelines"
    params = {"per_page": per_page, "order_by": "updated_at", "sort": "desc"}
    if status:
        params["status"] = status
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        return {"error": f"GitLab API error {resp.status_code}: {resp.text[:200]}"}
    pipes = resp.json()
    result = []
    for p in pipes:
        result.append({
            "id": p.get("id"),
            "status": p.get("status"),
            "ref": p.get("ref"),
            "created_at": p.get("created_at"),
            "web_url": p.get("web_url"),
        })
    return {"pipelines": result, "total": len(result)}


def get_pipeline_jobs(project_id: str, pipeline_id: int) -> dict:
    """List all jobs in a specific CI/CD pipeline, including their status and stage."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/pipelines/{pipeline_id}/jobs"
    resp = requests.get(url, headers=HEADERS, params={"per_page": 50})
    if resp.status_code != 200:
        return {"error": f"GitLab API error {resp.status_code}: {resp.text[:200]}"}
    jobs = resp.json()
    result = []
    for j in jobs:
        result.append({
            "id": j.get("id"),
            "name": j.get("name"),
            "stage": j.get("stage"),
            "status": j.get("status"),
            "duration": j.get("duration"),
            "web_url": j.get("web_url"),
            "started_at": j.get("started_at"),
            "finished_at": j.get("finished_at"),
            "failure_reason": j.get("failure_reason", "unknown")
        })
    return {"jobs": result, "total": len(result)}


def get_job_log(project_id: str, job_id: int) -> dict:
    """Fetch the raw terminal output log (trace) of a specific CI/CD job.
    Returns the last 200 lines to stay within token limits."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/jobs/{job_id}/trace"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code != 200:
        return {"error": f"Failed to fetch job log: {resp.status_code}"}
    raw_log = resp.text
    # Trim to last 200 lines to avoid token overflow
    lines = raw_log.strip().split("\n")
    if len(lines) > 200:
        trimmed = "\n".join(lines[-200:])
        return {"log": f"...(truncated {len(lines) - 200} lines)...\n{trimmed}", "total_lines": len(lines)}
    return {"log": raw_log, "total_lines": len(lines)}


def get_project_info(project_id: str) -> dict:
    """
    Get general project information including statistics.
    
    Args:
        project_id: The ID of the GitLab project.
    """
    url = f"{GITLAB_API_URL}/projects/{project_id}"
    resp = requests.get(url, headers=HEADERS, params={"statistics": True})
    if resp.status_code != 200:
        return {"error": f"GitLab API error {resp.status_code}: {resp.text[:200]}"}
    p = resp.json()
    return {
        "name": p.get("name"),
        "path_with_namespace": p.get("path_with_namespace"),
        "web_url": p.get("web_url"),
        "default_branch": p.get("default_branch"),
        "open_issues_count": p.get("open_issues_count"),
        "star_count": p.get("star_count"),
        "last_activity_at": p.get("last_activity_at"),
    }


def get_team_profiles() -> dict:
    """Get the team roster with each developer's name, skills, experience level, current workload, and availability.
    Use this tool to understand team capacity before assigning tasks."""
    from agent.db import get_team_profiles as db_get_team
    try:
        return db_get_team()
    except Exception as e:
        return {"error": f"Failed to read team profiles: {str(e)}"}


def assign_issue_to_developer(issue_iid: int, developer_username: str, project_id: str = None) -> dict:
    """Assign a specific issue (by IID) to a developer (by username).
    This directly updates the issue assignee via GitLab REST API.
    Use this after analyzing team profiles to match the best developer to each task.
    
    Args:
        issue_iid: The issue IID number.
        developer_username: The GitLab username of the developer.
        project_id: The GitLab project ID. If not provided, falls back to the default PROJECT_ID.
    """
    target_pid = project_id or PROJECT_ID
    # First, look up the user ID from the username
    user_url = f"{GITLAB_API_URL}/users"
    user_resp = requests.get(user_url, headers=HEADERS, params={"username": developer_username})
    
    if user_resp.status_code != 200 or not user_resp.json():
        # If user not found, still update the issue description with the assignment note
        url = f"{GITLAB_API_URL}/projects/{target_pid}/issues/{issue_iid}"
        note_url = f"{url}/notes"
        requests.post(note_url, headers=HEADERS, json={
            "body": f"🤖 **AI Tech Lead Assignment**: This task is assigned to **@{developer_username}** based on skill matching and availability analysis."
        })
        return {
            "status": "partial_success",
            "issue_iid": issue_iid,
            "assigned_to": developer_username,
            "note": f"User '{developer_username}' not found in GitLab. Added assignment comment instead."
        }
    
    user_id = user_resp.json()[0].get("id")
    
    # Update the issue with the assignee
    url = f"{GITLAB_API_URL}/projects/{target_pid}/issues/{issue_iid}"
    update_resp = requests.put(url, headers=HEADERS, json={"assignee_ids": [user_id]})
    
    if update_resp.status_code != 200:
        # Fallback: add a note instead
        note_url = f"{url}/notes"
        requests.post(note_url, headers=HEADERS, json={
            "body": f"🤖 **AI Tech Lead Assignment**: This task is assigned to **@{developer_username}** based on skill matching and availability analysis."
        })
        return {
            "status": "partial_success",
            "issue_iid": issue_iid,
            "assigned_to": developer_username,
            "note": "Could not set assignee directly. Added assignment comment instead."
        }
    
    return {
        "status": "success",
        "issue_iid": issue_iid,
        "assigned_to": developer_username,
        "message": f"Issue #{issue_iid} successfully assigned to @{developer_username}"
    }


def batch_create_and_assign_issues(project_id: str, issues_json: str) -> dict:
    """
    Batch create multiple issues and immediately assign them to developers.
    
    Args:
        project_id: The ID of the GitLab project.
        issues_json: A JSON string representing a list of dicts. Each dict MUST contain 'title', 'description', and 'assignee_username' (optional). Each dict may also contain 'estimated_hours' (number) for time tracking.
        
    This drastically reduces API requests by performing the loop in Python.
    """
    import json
    try:
        issues = json.loads(issues_json)
    except Exception as e:
        return {"error": f"Failed to parse issues_json: {str(e)}"}
        
    results = []
    created_count = 0
    assigned_count = 0
    
    # First, preload all user IDs to minimize requests
    user_cache = {}
    
    for issue_data in issues:
        title = issue_data.get("title")
        description = issue_data.get("description", "")
        assignee_username = issue_data.get("assignee_username")
        
        # 1. Create the issue
        url = f"{GITLAB_API_URL}/projects/{project_id}/issues"
        create_resp = requests.post(url, headers=HEADERS, json={
            "title": title,
            "description": description
        })
        
        if create_resp.status_code != 201:
            results.append({"title": title, "status": "failed_to_create", "error": create_resp.text})
            continue
            
        created_issue = create_resp.json()
        issue_iid = created_issue.get("iid")
        created_count += 1
        
        # 1b. Set time estimate if provided
        estimated_hours = issue_data.get("estimated_hours")
        if estimated_hours:
            te_url = f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid}/time_estimate"
            requests.post(te_url, headers=HEADERS, json={"duration": f"{estimated_hours}h"})
        
        # 2. Assign the issue if assignee is provided
        assigned_to = None
        if assignee_username:
            user_id = user_cache.get(assignee_username)
            if not user_id:
                u_resp = requests.get(f"{GITLAB_API_URL}/users", headers=HEADERS, params={"username": assignee_username})
                if u_resp.status_code == 200 and u_resp.json():
                    user_id = u_resp.json()[0].get("id")
                    user_cache[assignee_username] = user_id
            
            if user_id:
                update_resp = requests.put(f"{url}/{issue_iid}", headers=HEADERS, json={"assignee_ids": [user_id]})
                if update_resp.status_code == 200:
                    assigned_to = assignee_username
                    assigned_count += 1
            else:
                # Fallback: add a comment
                note_url = f"{url}/{issue_iid}/notes"
                requests.post(note_url, headers=HEADERS, json={
                    "body": f"🤖 **AI Tech Lead Assignment**: This task is assigned to **@{assignee_username}**."
                })
                assigned_to = assignee_username
                assigned_count += 1
                
        results.append({
            "title": title,
            "iid": issue_iid,
            "assigned_to": assigned_to,
            "estimated_hours": issue_data.get("estimated_hours"),
            "status": "created_and_assigned" if assigned_to else "created"
        })
        
    return {
        "status": "success",
        "total_requested": len(issues),
        "created": created_count,
        "assigned": assigned_count,
        "details": results
    }

@ttl_cache(ttl_seconds=15)
def list_user_projects() -> dict:
    """Fetch all projects the authenticated user has access to, differentiating personal vs contributed."""
    url = f"{GITLAB_API_URL}/projects"
    # Get projects where the user is a member or owner
    resp = requests.get(url, headers=HEADERS, params={"membership": True, "per_page": 100})
    if resp.status_code != 200:
        return {"error": f"Failed to fetch projects: {resp.text}"}
    
    projects = resp.json()
    
    # We also need to know the current user's username to determine if it's personal
    user_resp = requests.get(f"{GITLAB_API_URL}/user", headers=HEADERS)
    username = None
    if user_resp.status_code == 200:
        username = user_resp.json().get("username")
        
    formatted_projects = []
    for p in projects:
        # Skip projects that are marked for deletion
        if p.get("marked_for_deletion_at") or "deletion_scheduled" in p.get("path", ""):
            continue
            
        # A project is personal if its namespace is the user's username
        namespace_path = p.get("namespace", {}).get("path")
        is_personal = (namespace_path == username) if username else False
        
        formatted_projects.append({
            "id": str(p.get("id")),
            "name": p.get("name"),
            "name_with_namespace": p.get("name_with_namespace"),
            "type": "Personal" if is_personal else "Contributed",
            "web_url": p.get("web_url")
        })
        
    # Sort personal first
    formatted_projects.sort(key=lambda x: (0 if x["type"] == "Personal" else 1, x["name_with_namespace"]))
    
    return {"projects": formatted_projects, "total": len(formatted_projects)}

@ttl_cache(ttl_seconds=15)
def get_dashboard_metrics(project_id: str) -> dict:
    """Fetch core metrics for the project dashboard to calculate health score."""
    # Fetch ALL MRs so we can show merged ones in the activity log too
    all_mrs_resp = requests.get(f"{GITLAB_API_URL}/projects/{project_id}/merge_requests", headers=HEADERS, params={"state": "all"})
    all_mrs = all_mrs_resp.json() if all_mrs_resp.status_code == 200 else []
    open_mrs = [m for m in all_mrs if m.get("state") == "opened"]
    
    open_issues_resp = requests.get(f"{GITLAB_API_URL}/projects/{project_id}/issues", headers=HEADERS, params={"state": "opened"})
    open_issues = open_issues_resp.json() if open_issues_resp.status_code == 200 else []
    
    closed_issues_resp = requests.get(f"{GITLAB_API_URL}/projects/{project_id}/issues", headers=HEADERS, params={"state": "closed"})
    closed_issues = closed_issues_resp.json() if closed_issues_resp.status_code == 200 else []

    blockers = [i for i in open_issues if any("blocker" in l.lower() for l in i.get("labels", []))]
    
    total_issues = len(open_issues) + len(closed_issues)
    base_score = 40
    completion_bonus = 0
    
    if total_issues > 0:
        completion_rate = len(closed_issues) / total_issues
        completion_bonus = int(completion_rate * 60) # up to +60 points
    else:
        base_score = 100 # Perfect score if brand new project
        
    blocker_penalty = len(blockers) * 10
    mr_penalty = len(open_mrs) * 2 # too many open MRs lowers score slightly (bottleneck)
    
    score = base_score + completion_bonus - blocker_penalty - mr_penalty
    score = max(0, min(100, score))
    
    status_text = "Good Standing"
    if score < 50: status_text = "Needs Attention"
    elif score < 70: status_text = "At Risk"
    elif score >= 90: status_text = "Excellent"

    # Combine and sort issues for the activity feed
    all_recent_issues = sorted(open_issues + closed_issues, key=lambda x: x.get("created_at", ""), reverse=True)
    
    recent_issues = [
        {
            "iid": i.get("iid"),
            "title": i.get("title"),
            "author": i.get("author", {}).get("username"),
            "created_at": i.get("created_at"),
            "closed_at": i.get("closed_at") or i.get("updated_at"),
            "state": i.get("state"),
            "web_url": i.get("web_url"),
            "labels": i.get("labels", [])
        } for i in all_recent_issues[:15]
    ]

    recent_mrs = [
        {
            "iid": m.get("iid"),
            "title": m.get("title"),
            "author": m.get("author", {}).get("username"),
            "created_at": m.get("created_at"),
            "merged_at": m.get("merged_at"),
            "closed_at": m.get("closed_at") or m.get("updated_at"),
            "web_url": m.get("web_url"),
            "state": m.get("state")
        } for m in all_mrs[:15]
    ]

    return {
        "health_score": score,
        "status_text": status_text,
        "open_mrs_count": len(open_mrs),
        "blockers_count": len(blockers),
        "open_issues_count": len(open_issues),
        "closed_issues_count": len(closed_issues),
        "total_issues": total_issues,
        "score_breakdown": {
            "base_score": base_score,
            "completion_bonus": completion_bonus,
            "blocker_penalty": blocker_penalty,
            "mr_penalty": mr_penalty
        },
        "recent_issues": recent_issues,
        "recent_mrs": recent_mrs
    }


@ttl_cache(ttl_seconds=15)
def get_project_members(project_id: str) -> dict:
    """
    Fetch the actual members of a specific GitLab project.
    Returns a list of developers who have been explicitly invited to this project,
    along with their access level and profile info.
    Use this instead of get_team_profiles() when you need project-specific team data.
    
    Args:
        project_id: The ID of the GitLab project.
    """
    import json
    url = f"{GITLAB_API_URL}/projects/{project_id}/members/all"
    resp = requests.get(url, headers=HEADERS, params={"per_page": 100})
    members_raw = []
    if resp.status_code == 200:
        members_raw = resp.json()
    else:
        print(f"Warning: GitLab API project members fetch failed ({resp.status_code}): {resp.text[:200]}")
    
    # Load the skill matrix from team_profiles.json for enrichment
    skill_matrix = {}
    profiles_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "team_profiles.json")
    try:
        with open(profiles_path, "r", encoding="utf-8") as f:
            profiles_data = json.load(f)
            for p in profiles_data.get("team", []):
                skill_matrix[p["username"]] = p
    except Exception:
        pass
    
    ACCESS_LEVELS = {10: "Guest", 20: "Reporter", 30: "Developer", 40: "Maintainer", 50: "Owner"}
    
    members = []
    existing_usernames = set()
    for m in members_raw:
        username = m.get("username", "")
        existing_usernames.add(username)
        profile = skill_matrix.get(username, {})
        members.append({
            "id": m.get("id"),
            "name": m.get("name"),
            "username": username,
            "avatar_url": m.get("avatar_url"),
            "access_level": ACCESS_LEVELS.get(m.get("access_level"), "Unknown"),
            "role": profile.get("role", "Team Member"),
            "skills": profile.get("skills", []),
            "experience_level": profile.get("experience_level", "Unknown"),
            "availability": profile.get("availability", "Unknown"),
            "assignable": profile.get("assignable", True),
            "current_open_issues": profile.get("current_open_issues", 0),
        })
        
    # Enrich with mock memberships from registry
    registry_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_memberships.json")
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                registry = json.load(f)
            mock_users = registry.get(str(project_id), [])
            for username in mock_users:
                if username not in existing_usernames:
                    existing_usernames.add(username)
                    profile = skill_matrix.get(username, {})
                    members.append({
                        "id": None,
                        "name": profile.get("name", username),
                        "username": username,
                        "avatar_url": None,
                        "access_level": "Developer",
                        "role": profile.get("role", "Developer"),
                        "skills": profile.get("skills", []),
                        "experience_level": profile.get("experience_level", "Mid"),
                        "availability": profile.get("availability", "High"),
                        "assignable": profile.get("assignable", True),
                        "current_open_issues": profile.get("current_open_issues", 0),
                    })
        except Exception:
            pass
            
    # Also check issues to find any mock/assigned users who aren't in existing_usernames
    try:
        issues_data = list_project_issues(project_id, state="all", per_page=100)
        for issue in issues_data.get("issues", []):
            for assignee in issue.get("assignees", []):
                if assignee not in existing_usernames:
                    existing_usernames.add(assignee)
                    profile = skill_matrix.get(assignee, {})
                    members.append({
                        "id": None,
                        "name": profile.get("name", assignee),
                        "username": assignee,
                        "avatar_url": None,
                        "access_level": "Developer",
                        "role": profile.get("role", "Developer"),
                        "skills": profile.get("skills", []),
                        "experience_level": profile.get("experience_level", "Mid"),
                        "availability": profile.get("availability", "High"),
                        "assignable": profile.get("assignable", True),
                        "current_open_issues": profile.get("current_open_issues", 0),
                    })
    except Exception:
        pass
    
    return {"members": members, "total": len(members)}


def add_project_member(project_id: str, user_id: int = None, access_level: int = 30, username: str = None) -> dict:
    """
    Add a user to a GitLab project with the specified access level.
    Access levels: 10=Guest, 20=Reporter, 30=Developer, 40=Maintainer.
    This grants the user permission to push code, create MRs, and view issues in this project.
    Use this during Zero-to-One to invite selected engineers to the newly created repository.
    
    Args:
        project_id: The ID of the GitLab project.
        user_id: The GitLab user ID to invite (optional for mock users).
        access_level: The access level (e.g. 30 for Developer).
        username: The GitLab username (used for mock users lookup).
    """
    if not user_id:
        # Save to mock memberships JSON
        name = "Mock AI User"
        if username:
            import json
            profiles_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "team_profiles.json")
            try:
                with open(profiles_path, "r", encoding="utf-8") as f:
                    profiles_data = json.load(f)
                    for p in profiles_data.get("team", []):
                        if p["username"] == username:
                            name = p["name"]
                            break
            except Exception:
                pass
        else:
            username = "mock_ai_user"

        registry_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_memberships.json")
        try:
            registry = {}
            if os.path.exists(registry_path):
                with open(registry_path, "r", encoding="utf-8") as f:
                    registry = json.load(f)
            
            project_mobs = registry.get(str(project_id), [])
            if username not in project_mobs:
                project_mobs.append(username)
                registry[str(project_id)] = project_mobs
                with open(registry_path, "w", encoding="utf-8") as f:
                    json.dump(registry, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving mock membership: {e}")
            
        return {
            "status": "success",
            "message": f"User {username} (mock) added to project with Developer access.",
            "username": username,
            "name": name,
            "access_level": access_level
        }

    url = f"{GITLAB_API_URL}/projects/{project_id}/members"
    resp = requests.post(url, headers=HEADERS, json={
        "user_id": user_id,
        "access_level": access_level
    })
    if resp.status_code == 201:
        m = resp.json()
        return {
            "status": "success",
            "message": f"User {m.get('username')} added to project with Developer access.",
            "username": m.get("username"),
            "name": m.get("name"),
            "access_level": access_level
        }
    elif resp.status_code == 409:
        return {"status": "already_member", "message": "User is already a member of this project."}
    else:
        return {"error": f"Failed to add member: {resp.text[:200]}"}


def get_company_directory() -> dict:
    """Fetch the global company talent pool — all engineers available for project assignment.
    Returns the full roster from AWS DynamoDB enriched with their GitLab user IDs.
    The AI should use this to intelligently select and invite engineers to new projects
    based on skill matching during the Zero-to-One protocol."""
    from agent.db import get_team_profiles as db_get_team
    try:
        data = db_get_team()
    except Exception as e:
        return {"error": f"Failed to read company directory from DynamoDB: {str(e)}"}
    
    # Enrich each profile with their GitLab user ID (needed for add_project_member)
    enriched_team = []
    for p in data.get("team", []):
        username = p.get("username")
        # Look up the GitLab user ID
        user_resp = requests.get(f"{GITLAB_API_URL}/users", headers=HEADERS, params={"username": username})
        gitlab_user_id = None
        if user_resp.status_code == 200 and user_resp.json():
            gitlab_user_id = user_resp.json()[0].get("id")
        
        # Dynamically fetch real workload
        current_workload = get_global_user_open_issue_count(username)

        enriched_team.append({
            **p,
            "gitlab_user_id": gitlab_user_id,
            "current_open_issues": current_workload
        })
    
    return {"directory": enriched_team, "total": len(enriched_team)}


def get_merge_request_changes(project_id: str, mr_iid: int) -> dict:
    url = f"{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr_iid}/changes"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        return resp.json()
    return {}

def post_mr_comment(project_id: str, mr_iid: int, body: str) -> dict:
    url = f"{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr_iid}/notes"
    resp = requests.post(url, headers=HEADERS, json={"body": body})
    if resp.status_code == 201:
        return resp.json()
    return {}
def create_repository(name: str, description: str = "") -> dict:
    """
    Creates a new GitLab project (repository) with the given name.
    """
    import os
    import requests
    
    url = f"{GITLAB_API_URL}/projects"
    payload = {
        "name": name,
        "description": description,
        "initialize_with_readme": True,
        "visibility": "public"
    }
    
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code not in (200, 201):
        return {"error": f"Failed to create project: {resp.text}"}
        
    return resp.json()

def scaffold_project(project_id: str, clone_url: str, framework: str) -> dict:
    """
    Scaffolds a new project using the specified framework and pushes it to GitLab.
    Supported frameworks: react-ts, nextjs, vue-ts, python-fastapi, node-express,
                          fullstack-react-fastapi, fullstack-vue-fastapi, fullstack-react-express
    
    Has a fallback mode that uses GitLab Commits API if npm/git CLI are unavailable (e.g. on Render).
    """
    import subprocess
    import tempfile
    import shutil
    import os
    
    # Check if git and npm are available
    has_git = shutil.which("git") is not None
    has_npm = shutil.which("npm") is not None or shutil.which("npx") is not None
    
    # ── FALLBACK: Use GitLab Commits API if CLI tools are missing ──
    if not has_git or (not has_npm and framework not in ("python-fastapi",)):
        print(f"[scaffold] CLI tools unavailable (git={has_git}, npm={has_npm}). Using GitLab API fallback.")
        return _scaffold_via_api(project_id, framework)
    
    auth_url = clone_url.replace("https://", f"https://oauth2:{GITLAB_TOKEN}@")
    temp_dir = tempfile.mkdtemp()
    
    try:
        subprocess.run(f"git clone {auth_url} .", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=60)
        
        # Clear all files (like README.md from repo initialization) except .git so npm create doesn't abort
        for item in os.listdir(temp_dir):
            if item != ".git":
                item_path = os.path.join(temp_dir, item)
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
                    
        if framework == "react-ts":
            subprocess.run("npm create vite@latest . -- --template react-ts", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=120)
        elif framework == "vue-ts":
            subprocess.run("npm create vite@latest . -- --template vue-ts", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=120)
        elif framework == "nextjs":
            subprocess.run("npx --yes create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias \"@/*\" --use-npm", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=300)
        elif framework == "python-fastapi":
            with open(os.path.join(temp_dir, "app.py"), "w") as f:
                f.write("from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'Hello': 'World'}\n")
            with open(os.path.join(temp_dir, "requirements.txt"), "w") as f:
                f.write("fastapi\nuvicorn\n")
        elif framework == "node-express":
            subprocess.run("npm init -y", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=30)
            subprocess.run("npm install express", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=120)
            with open(os.path.join(temp_dir, "index.js"), "w") as f:
                f.write("const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => res.send('Hello World'));\n\napp.listen(3000, () => console.log('Server ready'));\n")
        elif framework.startswith("fullstack-"):
            frontend_dir = os.path.join(temp_dir, "frontend")
            backend_dir = os.path.join(temp_dir, "backend")
            os.mkdir(frontend_dir)
            os.mkdir(backend_dir)
            
            if "react" in framework:
                subprocess.run("npm create vite@latest . -- --template react-ts", cwd=frontend_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=120)
            elif "vue" in framework:
                subprocess.run("npm create vite@latest . -- --template vue-ts", cwd=frontend_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=120)
                
            if "fastapi" in framework:
                with open(os.path.join(backend_dir, "app.py"), "w") as f:
                    f.write("from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'Hello': 'World'}\n")
                with open(os.path.join(backend_dir, "requirements.txt"), "w") as f:
                    f.write("fastapi\nuvicorn\n")
            elif "express" in framework:
                subprocess.run("npm init -y", cwd=backend_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=30)
                subprocess.run("npm install express", cwd=backend_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=120)
                with open(os.path.join(backend_dir, "index.js"), "w") as f:
                    f.write("const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => res.send('Hello World'));\n\napp.listen(3000, () => console.log('Server ready'));\n")
        
        subprocess.run("git config user.name \"Project Agent AI\"", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL)
        subprocess.run("git config user.email \"agent@example.com\"", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL)
        
        subprocess.run("git add .", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=30)
        subprocess.run("git commit -m \"Initial scaffold from Project Agent AI\"", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=30)
        subprocess.run("git branch -M main", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, timeout=10)
        subprocess.run("git push -u origin main --force", cwd=temp_dir, shell=True, stdin=subprocess.DEVNULL, check=True, timeout=30)
        
        return {"status": "success", "message": f"Successfully scaffolded {framework} and pushed to repository."}
    except Exception as e:
        # If subprocess approach fails, try API fallback
        print(f"[scaffold] CLI approach failed: {e}. Trying API fallback.")
        return _scaffold_via_api(project_id, framework)
    
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except:
            pass


def _scaffold_via_api(project_id: str, framework: str) -> dict:
    """Fallback: push scaffold files via GitLab Commits API (no git/npm needed)."""
    actions = []
    
    if framework in ("react-ts", "vue-ts", "nextjs"):
        actions.append({"action": "update", "file_path": "README.md", "content": f"# Project\n\nScaffolded with `{framework}` by OmniLead AI.\n\n## Getting Started\n\n```bash\nnpm install\nnpm run dev\n```\n"})
        actions.append({"action": "create", "file_path": "package.json", "content": '{\n  "name": "project",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "echo \\"Run npm install first\\""\n  }\n}\n'})
        actions.append({"action": "create", "file_path": ".gitignore", "content": "node_modules/\ndist/\n.env\n"})
    elif framework == "python-fastapi":
        actions.append({"action": "update", "file_path": "README.md", "content": "# Project\n\nScaffolded with `python-fastapi` by OmniLead AI.\n\n## Getting Started\n\n```bash\npip install -r requirements.txt\nuvicorn app:app --reload\n```\n"})
        actions.append({"action": "create", "file_path": "app.py", "content": "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'Hello': 'World'}\n"})
        actions.append({"action": "create", "file_path": "requirements.txt", "content": "fastapi\nuvicorn\n"})
        actions.append({"action": "create", "file_path": ".gitignore", "content": "__pycache__/\n*.pyc\n.env\nvenv/\n"})
    elif framework == "node-express":
        actions.append({"action": "update", "file_path": "README.md", "content": "# Project\n\nScaffolded with `node-express` by OmniLead AI.\n\n## Getting Started\n\n```bash\nnpm install\nnode index.js\n```\n"})
        actions.append({"action": "create", "file_path": "index.js", "content": "const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => res.send('Hello World'));\n\napp.listen(3000, () => console.log('Server ready'));\n"})
        actions.append({"action": "create", "file_path": "package.json", "content": '{\n  "name": "project",\n  "version": "1.0.0",\n  "main": "index.js",\n  "dependencies": {\n    "express": "^4.18.0"\n  }\n}\n'})
        actions.append({"action": "create", "file_path": ".gitignore", "content": "node_modules/\n.env\n"})
    elif framework.startswith("fullstack-"):
        actions.append({"action": "update", "file_path": "README.md", "content": f"# Project\n\nScaffolded as `{framework}` mono-repo by OmniLead AI.\n\n## Structure\n\n- `/frontend` — UI application\n- `/backend` — API server\n"})
        actions.append({"action": "create", "file_path": "frontend/.gitkeep", "content": ""})
        actions.append({"action": "create", "file_path": "backend/.gitkeep", "content": ""})
        if "fastapi" in framework:
            actions.append({"action": "create", "file_path": "backend/app.py", "content": "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'Hello': 'World'}\n"})
            actions.append({"action": "create", "file_path": "backend/requirements.txt", "content": "fastapi\nuvicorn\n"})
        actions.append({"action": "create", "file_path": ".gitignore", "content": "node_modules/\n__pycache__/\ndist/\n.env\n"})
    else:
        actions.append({"action": "update", "file_path": "README.md", "content": f"# Project\n\nScaffolded by OmniLead AI.\nFramework: {framework}\n"})
    
    url = f"{GITLAB_API_URL}/projects/{project_id}/repository/commits"
    payload = {
        "branch": "main",
        "commit_message": f"Initial scaffold ({framework}) from Project Agent AI",
        "actions": actions,
    }
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code in (200, 201):
        return {"status": "success", "message": f"Scaffolded {framework} via GitLab API (fallback mode)."}
    return {"status": "error", "message": f"API scaffold failed: {resp.status_code} - {resp.text[:300]}"}


# ── Auto-Remediate: File Read + Commit Push ───────────────────────────

def get_file_content(project_id: str, file_path: str, ref: str = "main") -> dict:
    """Get the raw content of a file from a specific branch."""
    import base64
    encoded_path = requests.utils.quote(file_path, safe="")
    url = f"{GITLAB_API_URL}/projects/{project_id}/repository/files/{encoded_path}"
    params = {"ref": ref}
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        return {"error": f"Failed to read file {file_path} on branch {ref}: {resp.status_code}"}
    data = resp.json()
    content = base64.b64decode(data.get("content", "")).decode("utf-8", errors="replace")
    return {"file_path": file_path, "content": content, "ref": ref}


def commit_fix_to_branch(project_id: str, branch: str, files: list, commit_message: str) -> dict:
    """Create a commit on a branch with updated file contents.
    
    Args:
        project_id: GitLab project ID
        branch: The branch to commit to (e.g. the MR source branch)
        files: List of dicts with 'file_path', 'content', and 'action' ('update' or 'create')
        commit_message: The commit message
    """
    url = f"{GITLAB_API_URL}/projects/{project_id}/repository/commits"
    actions = []
    for f in files:
        actions.append({
            "action": f.get("action", "update"),
            "file_path": f["file_path"],
            "content": f["content"],
        })
    payload = {
        "branch": branch,
        "commit_message": commit_message,
        "actions": actions,
    }
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code not in [200, 201]:
        return {"error": f"Failed to commit to {branch}: {resp.status_code} - {resp.text[:300]}"}
    data = resp.json()
    return {"status": "success", "commit_id": data.get("id"), "short_id": data.get("short_id"), "message": data.get("message")}


# ── Auto-Release Notes: Tags + Releases ──────────────────────────────

def list_tags(project_id: str, per_page: int = 20) -> dict:
    """List project tags (used to find the last release)."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/repository/tags"
    params = {"per_page": per_page, "order_by": "updated", "sort": "desc"}
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        return {"error": f"Failed to list tags: {resp.status_code}"}
    tags = resp.json()
    result = []
    for t in tags:
        result.append({
            "name": t.get("name"),
            "message": t.get("message", ""),
            "commit_id": t.get("commit", {}).get("id"),
            "committed_date": t.get("commit", {}).get("committed_date"),
        })
    return {"tags": result, "total": len(result)}


def list_merged_mrs_since(project_id: str, since_date: str, per_page: int = 100) -> dict:
    """List all MRs merged after a given ISO date string."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/merge_requests"
    params = {
        "state": "merged",
        "per_page": per_page,
        "order_by": "updated_at",
        "sort": "desc",
        "updated_after": since_date,
    }
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        return {"error": f"Failed to list merged MRs: {resp.status_code}"}
    mrs = resp.json()
    result = []
    for mr in mrs:
        result.append({
            "iid": mr.get("iid"),
            "title": mr.get("title"),
            "description": mr.get("description", ""),
            "author": mr.get("author", {}).get("username"),
            "merged_at": mr.get("merged_at"),
            "labels": mr.get("labels", []),
            "web_url": mr.get("web_url"),
        })
    return {"merge_requests": result, "total": len(result)}


def create_release(project_id: str, tag_name: str, name: str, description: str) -> dict:
    """Create a GitLab Release for a given tag."""
    # First, create the tag if it doesn't exist
    tag_url = f"{GITLAB_API_URL}/projects/{project_id}/repository/tags"
    tag_resp = requests.post(tag_url, headers=HEADERS, json={
        "tag_name": tag_name,
        "ref": "main",
        "message": f"Release {tag_name}"
    })
    # Tag might already exist, that's fine

    # Create the release
    url = f"{GITLAB_API_URL}/projects/{project_id}/releases"
    payload = {
        "tag_name": tag_name,
        "name": name,
        "description": description,
    }
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code not in [200, 201]:
        return {"error": f"Failed to create release: {resp.status_code} - {resp.text[:300]}"}
    data = resp.json()
    return {"status": "success", "tag_name": data.get("tag_name"), "name": data.get("name"), "web_url": data.get("_links", {}).get("self")}

# --- Auto-Triage & Routing Helpers ---

@ttl_cache(ttl_seconds=300)
def get_user_by_username(username: str) -> int:
    """Find a GitLab user ID by their username."""
    if not username or username.lower() == "none":
        return None
        
    url = f"{GITLAB_API_URL}/users"
    resp = requests.get(url, headers=HEADERS, params={"username": username})
    if resp.status_code == 200:
        data = resp.json()
        if len(data) > 0:
            return data[0].get("id")
    return None

def update_issue(project_id: str, issue_iid: int, labels: list = None, assignee_ids: list = None) -> dict:
    """Update an issue's labels and assignees."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid}"
    payload = {}
    if labels is not None:
        payload["labels"] = ",".join(labels)
    if assignee_ids is not None:
        payload["assignee_ids"] = assignee_ids
    
    resp = requests.put(url, headers=HEADERS, json=payload)
    if resp.status_code == 200:
        return {"status": "success"}
    return {"error": f"Failed to update issue: {resp.text[:200]}"}

def post_issue_comment(project_id: str, issue_iid: int, body: str) -> dict:
    """Post a comment (note) to a specific issue."""
    url = f"{GITLAB_API_URL}/projects/{project_id}/issues/{issue_iid}/notes"
    resp = requests.post(url, headers=HEADERS, json={"body": body})
    if resp.status_code == 201:
        return {"status": "success"}
    return {"error": f"Failed to post issue comment: {resp.text[:200]}"}

def setup_gitlab_webhook(project_id: str):
    """Automatically registers our backend webhook for issues and MRs if not present."""
    webhook_urls = [
        "https://hackathon-030e.onrender.com/api/webhook/gitlab",
        "https://hackathon-030e.onrender.com/api/webhooks/gitlab"
    ]
    
    url = f"{GITLAB_API_URL}/projects/{project_id}/hooks"
    resp = requests.get(url, headers=HEADERS)
    existing_urls = []
    if resp.status_code == 200:
        existing_urls = [hook.get("url") for hook in resp.json()]
        
    for w_url in webhook_urls:
        if w_url not in existing_urls:
            payload = {
                "url": w_url,
                "issues_events": True,
                "merge_requests_events": True,
                "pipeline_events": True,
                "push_events": False,
                "enable_ssl_verification": False
            }
            requests.post(url, headers=HEADERS, json=payload)
            
    return {"status": "success"}


def create_branch(project_id: str, branch_name: str, ref: str) -> dict:
    url = f"{GITLAB_API_URL}/projects/{project_id}/repository/branches"
    payload = {"branch": branch_name, "ref": ref}
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code != 201:
        return {"error": f"Failed to create branch: {resp.status_code} - {resp.text}"}
    return resp.json()

def revert_commit(project_id: str, commit_sha: str, branch_name: str) -> dict:
    url = f"{GITLAB_API_URL}/projects/{project_id}/repository/commits/{commit_sha}/revert"
    payload = {"branch": branch_name}
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code not in [200, 201]:
        return {"error": f"Failed to revert commit: {resp.status_code} - {resp.text}"}
    return resp.json()

def create_merge_request(project_id: str, source_branch: str, target_branch: str, title: str, description: str) -> dict:
    url = f"{GITLAB_API_URL}/projects/{project_id}/merge_requests"
    payload = {
        "source_branch": source_branch,
        "target_branch": target_branch,
        "title": title,
        "description": description
    }
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code != 201:
        return {"error": f"Failed to create merge request: {resp.status_code} - {resp.text}"}
    return resp.json()

def create_issue(project_id: str, title: str, description: str, labels: str = "", assignee_ids: list = None) -> dict:
    url = f"{GITLAB_API_URL}/projects/{project_id}/issues"
    payload = {
        "title": title,
        "description": description,
        "labels": labels
    }
    if assignee_ids:
        payload["assignee_ids"] = assignee_ids
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code != 201:
        return {"error": f"Failed to create issue: {resp.status_code} - {resp.text}"}
    return resp.json()

def get_latest_commit(project_id: str, branch: str = "main") -> dict:
    url = f"{GITLAB_API_URL}/projects/{project_id}/repository/commits?ref_name={branch}&per_page=1"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200 and len(resp.json()) > 0:
        return resp.json()[0]
    return {}
