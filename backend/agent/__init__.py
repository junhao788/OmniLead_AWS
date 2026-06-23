import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
from mcp.client.stdio import StdioServerParameters

# 1. Configure GitLab MCP connection
gitlab_params = StdioServerParameters(
    command="node",
    args=["node_modules/@modelcontextprotocol/server-gitlab/dist/index.js"],
    env={
        "GITLAB_PERSONAL_ACCESS_TOKEN": os.environ.get("GITLAB_PERSONAL_ACCESS_TOKEN", ""),
        "GITLAB_API_URL": os.environ.get("GITLAB_API_URL", "https://gitlab.com/api/v4"),
        "PATH": os.environ.get("PATH", "")
    }
)

# Wrap the MCP server as an ADK Toolset
gitlab_tools = McpToolset(connection_params=gitlab_params)

# 2. Initialize the ADK Agent (exported as `agent` or `root_agent`)
agent = Agent(
    name="project_agent",
    model="gemini-2.5-flash-lite",
    instruction="""You are an intelligent project management agent.
    You have access to a GitLab instance.
    Your goal is to help users understand their project status, manage issues, and generate reports.
    Always look up data using the tools provided before answering.""",
    tools=[gitlab_tools]
)
