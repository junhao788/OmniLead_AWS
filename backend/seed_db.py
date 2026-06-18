import os
import json
from dotenv import load_dotenv

# Load env before importing db
load_dotenv()

from agent.db import save_team_profiles, save_sprint_history, save_standup_history

def seed_database():
    print("Seeding Team Profiles...")
    team_data = [
        {
            "username": "alice_smith",
            "name": "Alice Smith (DynamoDB)",
            "role": "Lead Engineer",
            "skills": ["Python", "AWS", "React"],
            "experience_level": "Senior",
            "current_open_issues": 2,
            "availability": "Available"
        },
        {
            "username": "bob_jones",
            "name": "Bob Jones (DynamoDB)",
            "role": "Frontend Developer",
            "skills": ["TypeScript", "Next.js", "Tailwind"],
            "experience_level": "Mid",
            "current_open_issues": 5,
            "availability": "Busy"
        }
    ]
    save_team_profiles({"team": team_data})
    
    print("Seeding Sprint History...")
    project_id = "82559130"
    sprint_data = [
        {
            "sprint_id": "SP-001",
            "project_id": project_id,
            "title": "Initial Launch Sprint",
            "status": "active",
            "board": [
                {
                    "column_name": "To Do",
                    "cards": [
                        {"title": "Setup DynamoDB Tables", "assignee": "alice_smith", "checked": False},
                        {"title": "Configure Vercel API Route", "assignee": "bob_jones", "checked": False}
                    ]
                },
                {
                    "column_name": "In Progress",
                    "cards": [
                        {"title": "Design Landing Page", "assignee": "bob_jones", "checked": False}
                    ]
                },
                {
                    "column_name": "Done",
                    "cards": [
                        {"title": "Initialize Repository", "assignee": "alice_smith", "checked": True}
                    ]
                }
            ]
        }
    ]
    save_sprint_history(project_id, sprint_data)
    
    print("Seeding Standup History...")
    standup_data = {
        "history": [
            {
                "date": "2026-06-18",
                "project_id": project_id,
                "report": json.dumps([
                    {
                        "devId": "alice_smith",
                        "commits": 5,
                        "prsReviewed": 2,
                        "prsMerged": 1,
                        "summary": "Alice migrated the database to DynamoDB and reviewed API PRs.",
                        "highlights": ["Completed DynamoDB setup", "Reviewed auth module"]
                    },
                    {
                        "devId": "bob_jones",
                        "commits": 3,
                        "prsReviewed": 0,
                        "prsMerged": 0,
                        "summary": "Bob worked on connecting the Vercel frontend to the new APIs.",
                        "highlights": ["Wrote fetchAPI wrapper", "Integrated Roster component"]
                    }
                ])
            }
        ]
    }
    save_standup_history(standup_data)
    
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
