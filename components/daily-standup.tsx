"use client"

import { useState, useEffect } from "react"
import { Sun, Loader2, GitCommit, GitPullRequest, GitMerge, Sparkles, CheckCircle2 } from "lucide-react"
import { standupEntries as mockEntries, developers } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fetchAPI } from "@/lib/api"

type Phase = "idle" | "generating" | "ready"

function devById(id: string) {
  return developers.find((d) => d.id === id)!
}

export function DailyStandup({ projectId }: { projectId?: string }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [entries, setEntries] = useState(mockEntries)

  useEffect(() => {
    if (!projectId) {
      setEntries([])
      setPhase("idle")
      return
    }
    fetchAPI(`/api/standups/${projectId}/history`)
      .then(data => {
        if (data.standups && data.standups.length > 0) {
          try {
            const parsed = JSON.parse(data.standups[0].report)
            if (Array.isArray(parsed)) {
              setEntries(parsed)
              setPhase("ready")
            }
          } catch (e) {
            console.error("Failed to parse standup report:", e)
          }
        } else {
          // Fallback to mock entries if no history exists yet
          setEntries(mockEntries)
        }
      })
      .catch(err => {
        console.error(err)
        setEntries(mockEntries)
      })
  }, [projectId])

  async function generate() {
    if (!projectId) return
    setPhase("generating")
    try {
      const res = await fetchAPI(`/api/standups/${projectId}/generate`, { method: "POST" })
      if (res.standup && res.standup.report) {
        let parsed = res.standup.report
        if (typeof parsed === "string") {
          parsed = JSON.parse(parsed)
        }
        if (Array.isArray(parsed)) {
          setEntries(parsed)
          setPhase("ready")
          return
        }
      }
      throw new Error("Invalid response format")
    } catch (e) {
      console.error("Failed to generate standup:", e)
      setPhase("idle")
    }
  }

  const totals = entries.reduce(
    (acc, e) => ({
      commits: acc.commits + e.commits,
      reviewed: acc.reviewed + e.prsReviewed,
      merged: acc.merged + e.prsMerged,
    }),
    { commits: 0, reviewed: 0, merged: 0 },
  )

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sun className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-card-foreground">Daily Standup</h2>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
        </div>
        <Button size="lg" onClick={generate} disabled={phase === "generating"}>
          {phase === "generating" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating report…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              {phase === "ready" ? "Regenerate report" : "Generate Standup"}
            </>
          )}
        </Button>
      </div>

      {phase === "idle" && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sun className="size-6" />
          </div>
          <p className="text-sm font-medium text-foreground">No report yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            OmniLead will scan commits, reviews, and merges across all repos and summarize each engineer&apos;s day.
          </p>
        </div>
      )}

      {phase === "generating" && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Aggregating git activity…</p>
          <p className="text-sm text-muted-foreground">Summarizing {entries.length} engineers across 3 repos.</p>
        </div>
      )}

      {phase === "ready" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <SummaryStat icon={GitCommit} label="Commits pushed" value={totals.commits} />
            <SummaryStat icon={GitPullRequest} label="PRs reviewed" value={totals.reviewed} />
            <SummaryStat icon={GitMerge} label="PRs merged by AI" value={totals.merged} accent />
          </div>

          <div className="flex flex-col gap-4">
            {entries.map((entry) => {
              const dev = devById(entry.devId) || { initials: "?", name: entry.devId, role: "Engineer" }
              return (
                <div key={entry.devId} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {dev.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-sm font-semibold text-card-foreground">{dev.name}</h3>
                        <span className="text-xs text-muted-foreground">{dev.role}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{entry.summary}</p>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <GitCommit className="size-3.5 text-primary" />
                          {entry.commits} commits
                        </span>
                        <span className="flex items-center gap-1.5">
                          <GitPullRequest className="size-3.5 text-chart-2" />
                          {entry.prsReviewed} reviewed
                        </span>
                        <span className="flex items-center gap-1.5">
                          <GitMerge className="size-3.5 text-chart-3" />
                          {entry.prsMerged} merged
                        </span>
                      </div>

                      <ul className="mt-3 flex flex-col gap-1.5">
                        {entry.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-xs text-foreground">
                            <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className={cn("size-4", accent ? "text-primary" : "text-muted-foreground")} />
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", accent ? "text-primary" : "text-card-foreground")}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
