"use client"

import {
  Rocket,
  Users,
  ListChecks,
  Sun,
  Hexagon,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewKey = "launchpad" | "roster" | "sprint" | "standup"

const items: { key: ViewKey; label: string; icon: React.ElementType; hint: string }[] = [
  { key: "launchpad", label: "Launchpad", icon: Rocket, hint: "Start a project" },
  { key: "roster", label: "Company Roster", icon: Users, hint: "Team & workload" },
  { key: "sprint", label: "Sprint Planner", icon: ListChecks, hint: "AI backlog" },
  { key: "standup", label: "Daily Standup", icon: Sun, hint: "Reports" },
]

export function Sidebar({
  active,
  onSelect,
}: {
  active: ViewKey
  onSelect: (key: ViewKey) => void
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-border bg-sidebar lg:h-screen lg:w-64 lg:border-r">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Hexagon className="size-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-foreground">OmniLead</span>
          <span className="text-[11px] text-muted-foreground">Autonomous Tech Lead</span>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={cn(
                "group flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors lg:w-full",
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
              <span className="flex flex-col">
                <span className="font-medium">{item.label}</span>
                <span className="hidden text-[11px] text-muted-foreground lg:block">{item.hint}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="hidden border-t border-border p-3 lg:block">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/40 px-3 py-2.5">
          <Sparkles className="size-4 text-primary" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-foreground">Agent online</span>
            <span className="text-[11px] text-muted-foreground">Monitoring 3 repos</span>
          </div>
          <span className="ml-auto size-2 rounded-full bg-primary shadow-[0_0_8px] shadow-primary" />
        </div>
      </div>
    </aside>
  )
}
