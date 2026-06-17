"use client"

import { useState } from "react"
import { Search, Bell } from "lucide-react"
import { Sidebar, type ViewKey } from "@/components/sidebar"
import { Launchpad } from "@/components/launchpad"
import { Roster } from "@/components/roster"
import { SprintPlanner } from "@/components/sprint-planner"
import { DailyStandup } from "@/components/daily-standup"

const titles: Record<ViewKey, { title: string; subtitle: string }> = {
  launchpad: { title: "Launchpad", subtitle: "Turn a raw idea into a scaffolded project." },
  roster: { title: "Company Roster", subtitle: "Your engineering team and live workload." },
  sprint: { title: "Sprint Planner", subtitle: "Backlog automatically prioritized by OmniLead." },
  standup: { title: "Daily Standup", subtitle: "AI-generated summary of what shipped today." },
}

export default function Page() {
  const [view, setView] = useState<ViewKey>("launchpad")
  const meta = titles[view]

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar active={view} onSelect={setView} />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border bg-background/80 px-5 py-4 backdrop-blur lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{meta.title}</h1>
            <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground md:flex">
              <Search className="size-4" />
              <span className="text-xs">Search…</span>
            </div>
            <button
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              AV
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          {view === "launchpad" && <Launchpad />}
          {view === "roster" && <Roster />}
          {view === "sprint" && <SprintPlanner />}
          {view === "standup" && <DailyStandup />}
        </div>
      </main>
    </div>
  )
}
