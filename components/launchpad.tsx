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
import { API_BASE_URL } from "@/lib/api"

type Phase = "idle" | "launching" | "done"

const steps = [
  { icon: GitBranch, label: "Scaffolding repositories" },
  { icon: Sparkles, label: "Assigning to available engineers" },
  { icon: Cpu, label: "Analyzing project scope" },
  { icon: FileText, label: "Writing & prioritizing tickets" },
]

export function Launchpad({
  onProjectCreated,
}: {
  onProjectCreated?: (project: { id: string; name: string }) => void
}) {
  const [idea, setIdea] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [step, setStep] = useState(0)
  const [launchResult, setLaunchResult] = useState<any>(null)

  async function launch() {
    if (!idea.trim() || phase === "launching") return
    setPhase("launching")
    setStep(0)
    setLaunchResult(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `ZERO TO ONE: ${idea}`,
          stream_output: true 
        })
      })

      if (!response.ok || !response.body) throw new Error("Failed to start stream")

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let done = false
      let fullText = ""
      let reachedEnd = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          
          if (fullText.includes("STEP 1.5 - SCAFFOLD PROJECT")) {
            setStep(0)
          } 
          if (fullText.includes("STEP 2 - TALENT ACQUISITION")) {
            setStep(1)
          } 
          if (fullText.includes("STEP 2.5 - PRODUCT BLUEPRINT")) {
            setStep(2)
          } 
          if (fullText.includes("STEP 3 - DERIVE ISSUES FROM BLUEPRINT")) {
            setStep(3)
          } 
          if (fullText.includes("__FINAL_JSON__")) {
            reachedEnd = true
            setStep(4)
          }
        }
      }
      
      if (!reachedEnd) {
        throw new Error("Stream closed prematurely without finishing. It might have timed out.")
      }
      
      if (fullText.includes('"error":')) {
         console.error("🔥 AGENT CRASH LOG 🔥\n\n", fullText);
         throw new Error("Agent encountered an error. Check logs.")
      }

      let finalJsonData: any = null
      if (reachedEnd) {
        const parts = fullText.split("__FINAL_JSON__")
        const jsonText = parts[parts.length - 1].trim()
        try {
          finalJsonData = JSON.parse(jsonText)
        } catch (e) {
          console.error("Failed to parse final JSON from agent stream:", e)
        }
      }
      
      setStep(steps.length)
      setPhase("done")

      if (finalJsonData && finalJsonData.zero_to_one) {
        setLaunchResult(finalJsonData.zero_to_one)
      }
    } catch (err) {
      console.error(err)
      setPhase("idle")
      alert("Launch failed: The connection timed out or the AI Agent crashed.")
    }
  }

  function reset() {
    setPhase("idle")
    setIdea("")
    setStep(0)
    setLaunchResult(null)
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
          {phase === "done" && "Project bootstrapped. Tickets are live on GitLab."}
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
          <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="size-5 text-primary" />
              Project Successfully Bootstrapped!
            </div>
            
            {launchResult ? (
              <div className="mb-4 flex flex-col gap-2 text-xs text-muted-foreground">
                <p><span className="font-medium text-foreground">Repository:</span> {launchResult.repo_name}</p>
                <p><span className="font-medium text-foreground">Issues Created:</span> {launchResult.issues_created || launchResult.issues?.length}</p>
                <p><span className="font-medium text-foreground">Team Assigned:</span> {launchResult.team_invited?.join(", ")}</p>
                {launchResult.blueprint?.pages && (
                  <p><span className="font-medium text-foreground">Pages Planned:</span> {launchResult.blueprint.pages.length}</p>
                )}
              </div>
            ) : (
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="accent">Repo scaffolded</Badge>
                <Badge variant="accent">Tickets written & prioritized</Badge>
                <Badge variant="accent">Developers assigned</Badge>
              </div>
            )}
            
            <Button 
              className="w-full font-medium" 
              onClick={() => {
                if (launchResult?.project_id && onProjectCreated) {
                  onProjectCreated({ id: String(launchResult.project_id), name: launchResult.repo_name })
                }
              }}
            >
              Go to Project Dashboard
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
