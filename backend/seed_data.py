import os, requests
from dotenv import load_dotenv
load_dotenv()

TOKEN = os.environ["GITLAB_PERSONAL_ACCESS_TOKEN"]
API = "https://gitlab.com/api/v4"
PID = "82559130"
H = {"PRIVATE-TOKEN": TOKEN}

issues = [
    {"title": "Setup CI/CD pipeline for automated testing", "description": "We need a .gitlab-ci.yml with test and deploy stages.", "labels": "devops,priority::high"},
    {"title": "Implement user authentication module", "description": "Add JWT-based auth with login/register endpoints.", "labels": "backend,priority::high"},
    {"title": "Design landing page UI", "description": "Create a modern landing page with hero section and feature cards.", "labels": "frontend,priority::medium"},
    {"title": "Fix database connection timeout", "description": "DB connections drop after 30s idle. Need connection pooling.", "labels": "bug,backend,priority::high"},
    {"title": "Add API rate limiting middleware", "description": "Prevent abuse by limiting to 100 req/min per user.", "labels": "backend,priority::medium"},
    {"title": "Write unit tests for auth module", "description": "Need 80%+ coverage on the auth module.", "labels": "testing,priority::medium"},
]

for issue in issues:
    r = requests.post(f"{API}/projects/{PID}/issues", headers=H, json=issue)
    data = r.json()
    title = data.get("title", "ERROR")
    print(f"Created issue: {title} (status: {r.status_code})")
