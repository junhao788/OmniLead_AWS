import asyncio
from agent.agent import root_agent

async def main():
    from google.adk.cli.cli import _to_app
    from google.adk.runner import Runner
    
    # We can use mock or local storage
    from google.adk.storage.artifact_service.local_artifact_service import LocalArtifactService
    from google.adk.storage.session_service.local_session_service import LocalSessionService
    from google.adk.auth.credential_service.in_memory_credential_service import InMemoryCredentialService
    
    app = _to_app(root_agent, "test_app")
    runner = Runner(
        app=app,
        artifact_service=LocalArtifactService(".adk/artifacts"),
        session_service=LocalSessionService(".adk/sessions"),
        credential_service=InMemoryCredentialService(),
        memory_service=None,
    )
    
    agen = runner.run_async(
        user_id="test_user",
        session_id="test_session",
        new_message="hi",
    )
    
    async for event in agen:
        print(event)

if __name__ == "__main__":
    asyncio.run(main())
