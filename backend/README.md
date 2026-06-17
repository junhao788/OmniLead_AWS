# OmniLead 🚀

The first fully autonomous AI Tech Lead & Project Manager for your GitLab ecosystem.

## Why We Built This (Our Motivation)

In modern software development, Tech Leads and Project Managers spend **up to 40% of their time on administrative overhead** rather than actual engineering.
- They manually bootstrap repositories and set up boilerplate code.
- They hunt down available developers across the company and guess their capacity.
- They manually break down raw product ideas into dozens of Jira/GitLab issues.
- They spend hours doing tedious Code Reviews on Merge Requests, pointing out trivial mistakes like missing types or leftover `console.log`s.

This process drains engineering velocity and burns out senior talent. **We built OmniLead to eliminate this friction.** 

Our vision is to give every software team a tireless, deterministic AI agent that handles the entire project management lifecycle—from "Zero-to-One" idea inception, to smart talent assignment, to continuous code reviews. We want developers to focus purely on coding, while OmniLead handles the management.

## Project Description

**The Solution: What OmniLead Does**
OmniLead acts as an autonomous Staff Engineer and Project Manager integrated directly into your GitLab environment. You just give it a raw idea, and OmniLead builds the foundation, manages the team, and guards the code quality.

**Core Capabilities:**
- 🚀 **Launchpad (Zero-to-One):** Give OmniLead a raw project idea, and it executes a complete bootstrap. It creates the repository, scaffolds the tech stack, designs a 3-layer architectural blueprint (Pages, APIs, DB), and batches it into prioritized GitLab issues.
- 👥 **Smart Talent Acquisition:** OmniLead dynamically analyzes global workloads across all projects and invites the perfect mix of developers, strictly avoiding overloaded engineers.
- 🧠 **AI Tech Lead:** OmniLead acts as an autonomous gatekeeper for your main branch. It reviews Merge Requests for security, performance, and types. It auto-merges pristine code and auto-remediates minor issues (pushing fix commits automatically).
- ⏱️ **Autonomous Sprint Planner:** It organizes issues into active Sprints with strict capacity enforcement and prioritizes foundational backend dependencies automatically.

## How it's Made

**Architecture & Flow**

```text
===========================================================================
                          OMNILEAD ARCHITECTURE
===========================================================================

[ USER / PRODUCT OWNER ]
          │
          │ (1) Inputs Raw Project Idea
          ▼
+-------------------------------------------------------------------------+
|                        FRONTEND DASHBOARD                               |
|                         (Next.js + React)                               |
+-------------------------------------------------------------------------+
          │ (2) Triggers "Launchpad"
          ▼
+-------------------------------------------------------------------------+
|                        AGENT ENGINE (Backend)                           |
|                         (Python + FastAPI)                              |
|                                                                         |
|   +-------------------+    (3) Prompts    +-------------------------+   |
|   |   Orchestrator    | ----------------> |     LLM Intelligence    |   |
|   | (Google ADK Core) | <---------------- | (Gemini 2.5 Flash for   |   |
|   +-------------------+    (4) Decisions  |  deep reasoning / Arch) |   |
|           │                               +-------------------------+   |
|           │ (5) Tool Calls                                              |
|           ▼                                                             |
|   +-------------------+                                                 |
|   |   Model Context   | ---> [ Scaffolds Codebase Locally ]             |
|   |   Protocol (MCP)  | ---> [ Plans Architecture Blueprint ]           |
|   +-------------------+                                                 |
+-------------------------------------------------------------------------+
          │
          │ (6) GitLab API & Webhooks
          ▼
+-------------------------------------------------------------------------+
|                          GITLAB ECOSYSTEM                               |
|                                                                         |
|  [Repository] <--- 1. Creates Repo & Pushes Scaffolding                 |
|  [Issues]     <--- 2. Translates Blueprint -> Prioritized Backlog       |
|  [Members]    <--- 3. Fetches Workloads -> Auto-Assigns Team            |
|  [MRs]        <--- 4. Listens for MRs -> AI Tech Lead Code Review       |
+-------------------------------------------------------------------------+
          │
          │ (7) Assigns Tasks
          ▼
[ ENGINEERING TEAM ]

===========================================================================
                      AI TECH LEAD (MERGE REQUEST) FLOW
===========================================================================

[ DEVELOPER ]
      │
      │ (1) Pushes Code & Opens Merge Request
      ▼
+-------------------------------------------------------------------------+
|                        GITLAB WEBHOOK TRIGGER                           |
+-------------------------------------------------------------------------+
      │ (2) Webhook Event Payload
      ▼
+-------------------------------------------------------------------------+
|                        OMNILEAD AGENT ENGINE                            |
|                                                                         |
|  [ Code Fetcher ] ---> Pulls MR Diff & Target Branch Context            |
|          │                                                              |
|          ▼                                                              |
|  [ Gemini Reviewer ] ---> Analyzes:                                     |
|                           - Security Vulnerabilities                    |
|                           - Performance Bottlenecks                     |
|                           - Type Safety & Best Practices                |
|                           - Trivial Issues (e.g. leftover console.log)  |
+-------------------------------------------------------------------------+
      │ (3) Decision Routing
      ▼
    /   \
   /     \
[PASS]  [FAIL]
  │        │
  │        ├─► (Minor Issue) ───► [ AUTO-REMEDIATE ]
  │        │                        Agent pushes fix commit directly to MR
  │        │
  ▼        └─► (Major Issue) ───► [ BLOCK & COMMENT ]
[ AUTO-MERGE ]                      Agent comments on MR with feedback
  Closes Issue
```

**The Stack**
The system relies on deterministic rules alongside LLM intelligence to prevent hallucinated project management.
- **Agent Engine & Backend:** Python, FastAPI, and Google Agent Development Kit (ADK).
- **Intelligence:** Google Gemini (3.1 Flash-Lite & 2.5 Flash) leveraging the Model Context Protocol (MCP).
- **Frontend Dashboard:** Next.js, React, and Tailwind CSS.
- **Integrations:** GitLab REST API and Webhooks.


