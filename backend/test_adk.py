import asyncio
from pathlib import Path
from google.adk.cli.cli import run_once_cli

async def main():
    agent_dir = r"C:\Users\admin\Documents\GitHub\OmniLead_AWS\backend\agent"
    p = Path(agent_dir)
    await run_once_cli(
        agent_parent_dir=str(p.parent),
        agent_folder_name=p.name,
        query="hi",
        use_local_storage=True,
    )

if __name__ == "__main__":
    asyncio.run(main())
