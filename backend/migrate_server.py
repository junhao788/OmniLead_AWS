import re
import os

SERVER_PY = r"C:\Users\admin\Documents\GitHub\OmniLead_AWS\backend\agent\server.py"

with open(SERVER_PY, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Sprints CRUD
content = re.sub(
    r'SPRINT_HISTORY_PATH = os\.path\.join.*?def get_sprint_history\(project_id: str\):.*?except Exception as e:\s*raise HTTPException\(status_code=500, detail=str\(e\)\)',
    '''from agent.db import get_sprint_history as db_get_sprints, save_sprint_history as db_save_sprints

@app.get("/api/sprints/{project_id}")
async def get_sprint_history(project_id: str):
    try:
        return {"sprints": db_get_sprints(project_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))''',
    content, flags=re.DOTALL
)

# Wait, `save_sprint_history` is huge. Let's replace the whole `save_sprint_history` method.
# We will use string split/replace for simplicity, or just regex.
# Actually I'll write the script to just replace everything carefully using regex.

content = re.sub(
    r'@app\.post\("/api/sprints/\{project_id\}"\)\s*async def save_sprint_history\(.*?return \{"status": "success", "sprint_id": sprint_id\}\s*except Exception as e:\s*raise HTTPException\(status_code=500, detail=str\(e\)\)',
    '''@app.post("/api/sprints/{project_id}")
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
        from agent.gitlab_api import setup_gitlab_webhook
        asyncio.create_task(asyncio.to_thread(setup_gitlab_webhook, project_id))
        return {"status": "success", "sprint_id": sprint_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))''',
    content, flags=re.DOTALL
)

# Webhook Sprints
content = re.sub(
    r'if not os\.path\.exists\(SPRINT_HISTORY_PATH\):.*?with open\(SPRINT_HISTORY_PATH, "w", encoding="utf-8"\) as f:\s*json\.dump\(data, f, indent=2, ensure_ascii=False\)\s*return \{"status": "success", "message": f"Auto-synced \'\{title\}\' as closed\."\}\s*return \{"status": "ignored", "reason": "Task not found in active sprint"\}',
    '''sprints = db_get_sprints(project_id)
        if not sprints:
            return {"status": "ignored", "reason": "No sprints for this project"}
            
        active_sprint = sprints[0]
        board = active_sprint.get("board", [])
        
        updated = False
        for col in board:
            for card in col.get("cards", []):
                if card.get("title", "").strip().lower() == title.strip().lower():
                    card["checked"] = True
                    updated = True
                    
        if updated:
            db_save_sprints(project_id, sprints)
            return {"status": "success", "message": f"Auto-synced '{title}' as closed."}
            
        return {"status": "ignored", "reason": "Task not found in active sprint"}''',
    content, flags=re.DOTALL
)

# Roster
content = re.sub(
    r'TEAM_PROFILES_PATH = os\.path\.join\(.*?from agent.db import get_team_profiles as db_get_team, save_team_profiles as db_save_team, remove_team_profile as db_rm_team',
    '',
    content, flags=re.DOTALL
)

# Tech reviews
content = re.sub(
    r'REVIEWS_HISTORY_PATH = os\.path\.join\(.*?def get_reviews\(project_id: str\):.*?except Exception as e:\s*raise HTTPException\(status_code=500, detail=str\(e\)\)',
    '''from agent.db import get_tech_reviews as db_get_reviews, save_tech_reviews as db_save_reviews

@app.get("/api/reviews/{project_id}")
async def get_reviews(project_id: str):
    return {"reviews": db_get_reviews(project_id)}''',
    content, flags=re.DOTALL
)


with open(SERVER_PY, "w", encoding="utf-8") as f:
    f.write(content)
    
print("Updated server.py via script")
