import boto3
import os
import json
from decimal import Decimal

# Helper to convert float to Decimal for DynamoDB
def float_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [float_to_decimal(v) for v in obj]
    return obj

# Helper to convert Decimal back to int/float for standard JSON serialization
def decimal_to_python(obj):
    if isinstance(obj, Decimal):
        # convert to int if it's a whole number, else float
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_python(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_python(v) for v in obj]
    return obj

class DynamoDBClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DynamoDBClient, cls).__new__(cls)
            # Initialize the boto3 resource. It expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in env,
            # or we can pass them directly if needed.
            # In our case, the user provided them. We'll set them in os.environ in server.py or here.
            # Usually, it's best to have them loaded via python-dotenv.
            cls._instance.dynamodb = boto3.resource(
                'dynamodb',
                region_name=os.environ.get('AWS_REGION', 'us-east-1'),
                aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
            )
            cls._instance.table = cls._instance.dynamodb.Table('OmniLead_Data')
        return cls._instance

    def put_item(self, pk, sk, data):
        """Put an item into DynamoDB."""
        item = {
            'PK': pk,
            'SK': sk,
            'data': float_to_decimal(data)
        }
        self.table.put_item(Item=item)

    def get_item(self, pk, sk):
        """Get a specific item by PK and SK."""
        response = self.table.get_item(Key={'PK': pk, 'SK': sk})
        item = response.get('Item')
        if item:
            return decimal_to_python(item.get('data'))
        return None

    def query_by_pk(self, pk):
        """Query all items with a specific Partition Key."""
        from boto3.dynamodb.conditions import Key
        response = self.table.query(
            KeyConditionExpression=Key('PK').eq(pk)
        )
        items = response.get('Items', [])
        return [decimal_to_python(item.get('data')) for item in items]

    def delete_item(self, pk, sk):
        self.table.delete_item(Key={'PK': pk, 'SK': sk})

# Singleton access
db = DynamoDBClient()

# --- Helpers for specific data entities ---

def get_team_profiles():
    # Returns {"team": [member1, member2]} to match old JSON
    items = db.query_by_pk('TEAM')
    return {"team": items}

def save_team_profiles(profiles_dict):
    # profiles_dict is {"team": [...] }
    team = profiles_dict.get("team", [])
    for profile in team:
        user_id = profile.get("id") or profile.get("username")
        db.put_item('TEAM', f'PROFILE#{user_id}', profile)

def remove_team_profile(username):
    db.delete_item('TEAM', f'PROFILE#{username}')

def get_sprint_history(project_id):
    # Returns a list of sprints for the project
    return db.query_by_pk(f'SPRINT#{project_id}')

def save_sprint_history(project_id, sprints_list):
    # Overwrite sprints for a project. In DynamoDB, we just put them. 
    # (In a real app we'd delete old ones or use SK correctly, but here we just put)
    for entry in sprints_list:
        sk = f'RECORD#{entry.get("sprint_id", entry.get("created_at", "unknown"))}'
        db.put_item(f'SPRINT#{project_id}', sk, entry)

def get_tech_reviews(project_id):
    return db.query_by_pk(f'REVIEW#{project_id}')

def save_tech_reviews(project_id, reviews_list):
    for review in reviews_list:
        sk = f'MR#{review.get("mr_iid", "unknown")}'
        db.put_item(f'REVIEW#{project_id}', sk, review)

def get_standup_history():
    # Returns {"history": [...]}
    items = db.query_by_pk('STANDUP')
    return {"history": items}

def save_standup_history(history_dict):
    history = history_dict.get("history", [])
    for entry in history:
        sk = f'REPORT#{entry.get("date", "unknown")}'
        db.put_item('STANDUP', sk, entry)

def load_mock_registry():
    items = db.query_by_pk('REGISTRY')
    registry = {}
    for item in items:
        username = item.get("username")
        if username:
            registry[username] = item.get("roles", [])
    return registry

def save_mock_registry(registry):
    for username, roles in registry.items():
        db.put_item('REGISTRY', f'USER#{username}', {"username": username, "roles": roles})
