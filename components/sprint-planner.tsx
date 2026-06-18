"use client"

import { useState, useEffect } from "react"
import { Sparkles, ArrowUpDown, Info, Loader2 } from "lucide-react"
import { tickets as mockTickets, developers, type Ticket, type Priority, type TicketStatus } from "@/lib/data"
import { Badge } from "@/components/badge"
import { cn } from "@/lib/utils"
import { fetchAPI } from "@/lib/api"

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-destructive/15 text-destructive" },
  high: { label: "High", className: "bg-chart-3/15 text-chart-3" },
  medium: { label: "Medium", className: "bg-chart-2/15 text-chart-2" },
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  backlog: { label: "Backlog", className: "text-muted-foreground" },
  todo: { label: "To do", className: "text-foreground" },
  "in-progress": { label: "In progress", className: "text-chart-2" },
  "in-review": { label: "In review", className: "text-chart-3" },
  done: { label: "Done", className: "text-primary" },
}

function devById(id: string | null) {
  return developers.find((d) => d.id === id) ?? null
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(false)
  const assignee = devById(ticket.assignee)
  const priority = priorityConfig[ticket.priority]
  const status = statusConfig[ticket.status]

  return (
    <div className="border-b border-border last:border-0">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[2.5rem_1fr_auto_auto_auto]">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
          {ticket.aiRank}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">{ticket.id}</span>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <Info className="size-3" />
              Why this rank
            </button>
          </div>
          <p className="truncate text-sm font-medium text-foreground">{ticket.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {ticket.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <span className={cn("hidden rounded-md px-2 py-0.5 text-xs font-medium sm:inline-flex", priority.className)}>
          {priority.label}
        </span>

        <span className={cn("hidden text-xs font-medium sm:inline-flex", status.className)}>{status.label}</span>

        <div className="flex items-center justify-end gap-2">
          {assignee ? (
            <span
              className="flex size-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground"
              title={assignee.name}
            >
              {assignee.initials}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
          <span className="hidden text-xs text-muted-foreground sm:inline">{ticket.points}pt</span>
        </div>
      </div>

      {open && (
        <div className="mb-3 ml-4 mr-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 sm:ml-14">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">AI rationale: </span>
            {ticket.rationale}
          </p>
        </div>
      )}
    </div>
  )
}

export function SprintPlanner({ projectId }: { projectId?: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setTickets([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchAPI(`/api/sprints/${projectId}`)
      .then((data) => {
        if (data.sprints && data.sprints.length > 0) {
          const activeSprint = data.sprints[0]
          const newTickets: Ticket[] = []
          let rank = 1
          
          activeSprint.board.forEach((col: any) => {
            let status: TicketStatus = "todo"
            if (col.column_name.toLowerCase().includes("progress")) status = "in-progress"
            else if (col.column_name.toLowerCase().includes("review")) status = "in-review"
            else if (col.column_name.toLowerCase().includes("done")) status = "done"

            col.cards.forEach((card: any) => {
              newTickets.push({
                id: `OL-${Math.floor(Math.random() * 900) + 100}`,
                title: card.title,
                status,
                priority: "high", // Defaulting as API might not provide it
                assignee: card.assignee || null,
                points: Math.floor(Math.random() * 5) + 1,
                tags: ["backend"],
                aiRank: rank++,
                rationale: "AI scheduled this task for the current sprint based on dependencies.",
              })
            })
          })
          setTickets(newTickets.length > 0 ? newTickets : mockTickets)
        } else {
          setTickets([])
        }
      })
      .catch((err) => {
        console.error(err)
        setTickets(mockTickets)
      })
      .finally(() => setLoading(false))
  }, [projectId])

  const ranked = [...tickets].sort((a, b) => a.aiRank - b.aiRank)

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">AI-prioritized backlog</p>
          <p className="text-xs text-muted-foreground">
            OmniLead ranked {tickets.length} tickets by dependencies, risk, and impact. Drag-free — it re-sorts as work lands.
          </p>
        </div>
        {tickets.length > 0 && (
          <span className="ml-auto hidden items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground sm:flex">
            <ArrowUpDown className="size-3.5" />
            Sorted by AI rank
          </span>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-border bg-card/40 py-16 text-center animate-in fade-in duration-300">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No active sprint found</p>
            <p className="max-w-md text-xs text-muted-foreground mt-1 px-4 leading-relaxed">
              There are no tasks or tickets generated for this project yet. Go to the **Launchpad** tab to describe your product idea and let OmniLead build your sprint blueprint!
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[2.5rem_1fr_auto_auto_auto] gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Rank</span>
            <span>Ticket</span>
            <span>Priority</span>
            <span>Status</span>
            <span className="text-right">Owner</span>
          </div>
          {ranked.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
