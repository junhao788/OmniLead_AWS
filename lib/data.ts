export type Availability = "available" | "busy" | "in-meeting" | "off"

export type Developer = {
  id: string
  name: string
  initials: string
  role: string
  skills: string[]
  availability: Availability
  openIssues: number
  capacity: number
}

export type TicketStatus = "backlog" | "todo" | "in-progress" | "in-review" | "done"
export type Priority = "critical" | "high" | "medium" | "low"

export type Ticket = {
  id: string
  title: string
  tags: string[]
  assignee: string | null
  status: TicketStatus
  priority: Priority
  points: number
  aiRank: number
  rationale: string
}

export type StandupEntry = {
  devId: string
  commits: number
  prsReviewed: number
  prsMerged: number
  summary: string
  highlights: string[]
}

export const developers: Developer[] = [
  {
    id: "d1",
    name: "Maya Okonkwo",
    initials: "MO",
    role: "Staff Frontend Engineer",
    skills: ["React", "TypeScript", "Next.js", "WebGL"],
    availability: "available",
    openIssues: 3,
    capacity: 8,
  },
  {
    id: "d2",
    name: "Daniel Reyes",
    initials: "DR",
    role: "Backend Engineer",
    skills: ["Go", "PostgreSQL", "gRPC", "Kafka"],
    availability: "busy",
    openIssues: 7,
    capacity: 8,
  },
  {
    id: "d3",
    name: "Priya Nair",
    initials: "PN",
    role: "Platform / DevOps",
    skills: ["Kubernetes", "Terraform", "AWS", "Observability"],
    availability: "in-meeting",
    openIssues: 4,
    capacity: 8,
  },
  {
    id: "d4",
    name: "Lukas Brandt",
    initials: "LB",
    role: "Full-Stack Engineer",
    skills: ["Node.js", "React", "Prisma", "Stripe"],
    availability: "available",
    openIssues: 2,
    capacity: 8,
  },
  {
    id: "d5",
    name: "Sofia Marchetti",
    initials: "SM",
    role: "ML Engineer",
    skills: ["Python", "PyTorch", "LangGraph", "Vector DBs"],
    availability: "busy",
    openIssues: 6,
    capacity: 8,
  },
  {
    id: "d6",
    name: "Tomás Vega",
    initials: "TV",
    role: "Mobile Engineer",
    skills: ["Swift", "Kotlin", "React Native"],
    availability: "off",
    openIssues: 1,
    capacity: 8,
  },
]

export const tickets: Ticket[] = [
  {
    id: "OMNI-241",
    title: "Set up multi-tenant auth with org-scoped roles",
    tags: ["auth", "backend", "security"],
    assignee: "d2",
    status: "in-progress",
    priority: "critical",
    points: 8,
    aiRank: 1,
    rationale: "Blocks every downstream feature; no user data can be persisted safely until this lands.",
  },
  {
    id: "OMNI-238",
    title: "Provision Postgres schema + migrations pipeline",
    tags: ["infra", "database"],
    assignee: "d3",
    status: "in-review",
    priority: "critical",
    points: 5,
    aiRank: 2,
    rationale: "Hard dependency for auth and billing. Reviewed and ready to merge.",
  },
  {
    id: "OMNI-255",
    title: "Build project Launchpad intake form",
    tags: ["frontend", "ux"],
    assignee: "d1",
    status: "in-progress",
    priority: "high",
    points: 5,
    aiRank: 3,
    rationale: "First user touchpoint; unlocks end-to-end demo flow for stakeholders.",
  },
  {
    id: "OMNI-260",
    title: "Wire repo scaffolding agent to GitHub API",
    tags: ["ai", "integration"],
    assignee: "d5",
    status: "todo",
    priority: "high",
    points: 8,
    aiRank: 4,
    rationale: "Core differentiator. Sequenced after auth so generated repos inherit org permissions.",
  },
  {
    id: "OMNI-249",
    title: "Stripe metered billing for agent runs",
    tags: ["billing", "backend"],
    assignee: "d4",
    status: "todo",
    priority: "medium",
    points: 5,
    aiRank: 5,
    rationale: "Revenue path, but can trail core product loop. Depends on auth + schema.",
  },
  {
    id: "OMNI-271",
    title: "Standup report generation + summarization",
    tags: ["ai", "frontend"],
    assignee: "d1",
    status: "backlog",
    priority: "medium",
    points: 3,
    aiRank: 6,
    rationale: "High delight, low risk. Slotted once data pipeline emits commit events.",
  },
  {
    id: "OMNI-268",
    title: "Mobile shell + push notifications",
    tags: ["mobile"],
    assignee: "d6",
    status: "backlog",
    priority: "low",
    points: 8,
    aiRank: 7,
    rationale: "Deferred to next cycle; web parity prioritized for launch.",
  },
  {
    id: "OMNI-233",
    title: "Telemetry dashboard for agent latency",
    tags: ["infra", "observability"],
    assignee: "d3",
    status: "done",
    priority: "low",
    points: 3,
    aiRank: 8,
    rationale: "Completed. Feeds SLOs for the orchestration layer.",
  },
]

export const standupEntries: StandupEntry[] = [
  {
    devId: "d1",
    commits: 12,
    prsReviewed: 4,
    prsMerged: 2,
    summary:
      "Shipped the Launchpad intake form and refactored the project wizard state machine. Paired with the agent on accessibility fixes.",
    highlights: ["Merged OMNI-255 intake UI", "Reviewed 4 PRs across frontend", "Cut bundle size by 14%"],
  },
  {
    devId: "d2",
    commits: 18,
    prsReviewed: 6,
    prsMerged: 3,
    summary:
      "Landed org-scoped role middleware and session rotation. AI flagged and auto-patched two N+1 queries before merge.",
    highlights: ["Auth middleware live in staging", "Closed 3 security tickets", "Added 22 integration tests"],
  },
  {
    devId: "d3",
    commits: 9,
    prsReviewed: 3,
    prsMerged: 4,
    summary:
      "Finalized the migrations pipeline and rolled out the latency telemetry dashboard. Provisioned preview environments per branch.",
    highlights: ["Migrations pipeline merged", "Telemetry dashboard shipped", "Preview envs automated"],
  },
  {
    devId: "d4",
    commits: 7,
    prsReviewed: 2,
    prsMerged: 1,
    summary: "Spiked Stripe metered billing and drafted the usage event schema. Blocked on auth org IDs.",
    highlights: ["Billing spike documented", "Usage schema drafted"],
  },
  {
    devId: "d5",
    commits: 14,
    prsReviewed: 5,
    prsMerged: 2,
    summary:
      "Built the repo scaffolding agent prototype and connected it to a sandboxed GitHub org. Tuned the ranking model for the Sprint Planner.",
    highlights: ["Scaffolding agent prototype", "Ranking model F1 up to 0.91", "Reviewed 5 ML PRs"],
  },
]
