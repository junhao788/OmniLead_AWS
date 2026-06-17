import re

FILE_PATH = r"C:\Users\admin\Documents\GitHub\OmniLead_AWS\backend\agent\gitlab_api.py"

with open(FILE_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Replace get_company_directory loading
content = re.sub(
    r'profiles_path = os\.path\.join.*?with open\(profiles_path, "r", encoding="utf-8"\) as f:\s*data = json\.load\(f\)\s*return data',
    '''from agent.db import get_team_profiles as db_get_team
    return db_get_team()''',
    content, flags=re.DOTALL
)

# Replace mock_memberships loading
content = re.sub(
    r'registry_path = os\.path\.join\(.*?mock_memberships\.json"\)\s*if os\.path\.exists\(registry_path\):\s*with open\(registry_path, "r"\) as f:\s*return json\.load\(f\)\s*return \{\}',
    '''from agent.db import load_mock_registry
    return load_mock_registry()''',
    content, flags=re.DOTALL
)

# Replace mock_memberships saving
content = re.sub(
    r'registry_path = os\.path\.join\(.*?mock_memberships\.json"\)\s*with open\(registry_path, "w"\) as f:\s*json\.dump\(registry, f, indent=2\)',
    '''from agent.db import save_mock_registry
    save_mock_registry(registry)''',
    content, flags=re.DOTALL
)

# Fix get_full_roster loading
content = re.sub(
    r'profiles_path = os\.path\.join\(os\.path\.dirname\(os\.path\.abspath\(__file__\)\), "team_profiles\.json"\)\s*if not os\.path\.exists\(profiles_path\):\s*return \{"team": \[\]\}\s*with open\(profiles_path, "r", encoding="utf-8"\) as f:\s*data = json\.load\(f\)',
    '''from agent.db import get_team_profiles as db_get_team
    data = db_get_team()''',
    content, flags=re.DOTALL
)

with open(FILE_PATH, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated gitlab_api.py")
