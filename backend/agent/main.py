import os
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from mcp.client.stdio import StdioServerParameters

def create_agent():
    """Creates and configures the ADK Project Agent with GitLab MCP."""
    
    # 1. Configure GitLab MCP connection using npx
    gitlab_params = StdioServerParameters(
        command="npx",
        args=["-y", "@modelcontextprotocol/server-gitlab"],
        env={
            "GITLAB_PERSONAL_ACCESS_TOKEN": os.environ.get("GITLAB_PERSONAL_ACCESS_TOKEN", ""),
            "GITLAB_API_URL": os.environ.get("GITLAB_API_URL", "https://gitlab.com/api/v4"),
            "PATH": os.environ.get("PATH", "") # Inherit PATH for npx
        }
    )

    # Wrap the MCP server as an ADK Toolset
    gitlab_tools = MCPToolset(connection_params=gitlab_params)

    # 2. Initialize the ADK Agent
    project_agent = Agent(
        name="project_agent",
        model="gemini-3.0-flash",
        instruction="""You are an intelligent project management agent.
        You have access to a GitLab instance.
        Your goal is to help users understand their project status, manage issues, and generate reports.
        Always look up data using the tools provided before answering.""",
        tools=[gitlab_tools]
    )

    return project_agent

async def main():
    print("Initializing Agent...")
    agent = create_agent()
    
    print("\n--- Testing Agent Connection ---")
    print("Asking Agent to list GitLab projects...")
    
    # Test query
    response = await agent.run("Please list the names of the projects I have access to in GitLab.")
    
    print("\n[Agent Response]:")
    print(response.output)

if __name__ == "__main__":
    asyncio.run(main())
