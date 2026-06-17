"use client"

import { useState } from "react"
import {
  Rocket,
  GitBranch,
  FileText,
  Loader2,
  CheckCircle2,
  Cpu,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/badge"
import { cn } from "@/lib/utils"

type Phase = "idle" | "launching" | "done"

const steps = [
  { icon: Cpu, label: "Analyzing project scope" },
  { icon: GitBranch, label: "Scaffolding repositories" },
  { icon: FileText, label: "Writing & prioritizing tickets" },
  { icon: Sparkles, label: "Assigning to available engineers" },
]

export function Launchpad() {
  const [idea, setIdea] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [step, setStep] = useState(0)

  function launch() {
    if (!idea.trim() || phase === "launching") return
    setPhase("launching")
    setStep(0)
    let current = 0
    const timer = setInterval(() => {
      current += 1
      if (current >= steps.length) {
        clearInterval(timer)
        setPhase("done")
      } else {
        setStep(current)
      }
    }, 900)
  }

  function reset() {
    setPhase("idle")
    setIdea("")
    setStep(0)
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-card-foreground">New Project</h2>
            <p className="text-sm text-muted-foreground">Describe it in plain language. OmniLead does the rest.</p>
          </div>
        </div>

        <label htmlFor="idea" className="mb-2 block text-sm font-medium text-card-foreground">
          Project idea
        </label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          disabled={phase !== "idle"}
          placeholder="e.g. A subscription billing portal where customers manage plans, view invoices, and update payment methods. Needs admin analytics and Stripe integration."
          className="h-44 w-full resize-none rounded-lg border border-input bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/30 disabled:opacity-60"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{idea.trim().split(/\s+/).filter(Boolean).length} words</span>
          {phase === "done" ? (
            <Button variant="outline" size="lg" onClick={reset}>
              Launch another
            </Button>
          ) : (
            <Button size="lg" onClick={launch} disabled={!idea.trim() || phase === "launching"}>
              {phase === "launching" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Launching…
                </>
              ) : (
                <>
                  <Rocket className="size-4" />
                  Launch Project
                </>
              )}
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-1 text-sm font-semibold text-card-foreground">Autonomous pipeline</h3>
        <p className="mb-5 text-xs text-muted-foreground">
          {phase === "idle" && "Waiting for a project idea to begin."}
          {phase === "launching" && "OmniLead is working in the background…"}
          {phase === "done" && "Project bootstrapped. Tickets are in the Sprint Planner."}
        </p>

        <ol className="flex flex-col gap-2.5">
          {steps.map((s, i) => {
            const Icon = s.icon
            const state =
              phase === "done" || i < step ? "done" : phase === "launching" && i === step ? "active" : "pending"
            return (
              <li
                key={s.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  state === "done" && "border-primary/30 bg-primary/5 text-foreground",
                  state === "active" && "border-primary/40 bg-primary/10 text-foreground",
                  state === "pending" && "border-border text-muted-foreground",
                )}
              >
                <span className="flex size-7 items-center justify-center rounded-md bg-background">
                  {state === "done" ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : state === "active" ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                {s.label}
              </li>
            )
          })}
        </ol>

        {phase === "done" && (
          <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              Bootstrap complete
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">3 repos created</Badge>
              <Badge variant="accent">14 tickets written</Badge>
              <Badge variant="accent">6 assignees</Badge>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
