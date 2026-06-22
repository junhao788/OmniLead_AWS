"use client"

import { useState, useEffect } from "react"
import { Activity, GitPullRequest, AlertCircle, CheckCircle2 } from "lucide-react"
import { fetchAPI } from "@/lib/api"


export function Dashboard({ projectId }: { projectId: string }) {
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "agent", content: "Agent online. Type a command or ask a question about this repository." },
  ])
  const [input, setInput] = useState("")

  const loadDashboardMetrics = async (id: string) => {
    setIsLoadingMetrics(true)
    try {
      const data = await fetchAPI(`/api/dashboard/${id}`)
      if (data) {
        setDashboardMetrics(data)
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics", err)
    } finally {
      setIsLoadingMetrics(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadDashboardMetrics(projectId)
      const interval = setInterval(() => loadDashboardMetrics(projectId), 20000)
      return () => clearInterval(interval)
    }
  }, [projectId])

  const handleSendTerminal = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: "user", content: input }])
    const currentInput = input
    setInput("")

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: `Executing protocol "${currentInput}"... \nNote: Terminal interaction is currently mocked in UI.`,
        },
      ])
    }, 1000)
  }

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        Select a project to view dashboard.
      </div>
    )
  }

  let combinedActivity: any[] = []
  if (dashboardMetrics && (dashboardMetrics.recent_issues?.length > 0 || dashboardMetrics.recent_mrs?.length > 0)) {
    combinedActivity = [
      ...(dashboardMetrics.recent_issues || []).flatMap((i: any) => {
        const events = [{ type: "ISSUE", data: { ...i, activity_time: i.created_at, action_word: "opened" } }]
        if (i.state === "closed") {
          events.push({
            type: "ISSUE",
            data: { ...i, activity_time: i.closed_at || i.created_at, action_word: "closed" },
          })
        }
        return events
      }),
      ...(dashboardMetrics.recent_mrs || []).flatMap((m: any) => {
        const events = [{ type: "MR", data: { ...m, activity_time: m.created_at, action_word: "opened" } }]
        if (m.state === "merged") {
          events.push({
            type: "MR",
            data: { ...m, activity_time: m.merged_at || m.created_at, action_word: "merged" },
          })
        } else if (m.state === "closed") {
          events.push({
            type: "MR",
            data: { ...m, activity_time: m.closed_at || m.created_at, action_word: "closed" },
          })
        }
        return events
      }),
    ].sort((a, b) => new Date(b.data.activity_time).getTime() - new Date(a.data.activity_time).getTime())
  }

  const scoreColor = dashboardMetrics
    ? dashboardMetrics.health_score >= 70
      ? "text-primary"
      : dashboardMetrics.health_score >= 50
        ? "text-yellow-500"
        : "text-destructive"
    : "text-muted-foreground"

  const ringColor = dashboardMetrics
    ? dashboardMetrics.health_score >= 70
      ? "stroke-primary"
      : dashboardMetrics.health_score >= 50
        ? "stroke-yellow-500"
        : "stroke-destructive"
    : "stroke-muted/20"

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6 animate-in fade-in duration-500">
      {/* Top Left: Main Metrics & Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6 relative flex flex-col min-h-[340px] shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Project Health Score</h2>
            <p className="text-xs text-muted-foreground">AI-calculated repository health and velocity.</p>
          </div>
          <button
            onClick={() => loadDashboardMetrics(projectId)}
            disabled={isLoadingMetrics}
            className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary font-semibold text-xs rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoadingMetrics ? <Activity className="size-3.5 animate-spin" /> : <Activity className="size-3.5" />}
            {isLoadingMetrics ? "Syncing..." : "Sync Status"}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
          {/* SVG Ring */}
          <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" className="stroke-muted" strokeWidth="8" fill="none" />
              {dashboardMetrics && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`transition-all duration-1000 ease-out ${ringColor}`}
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (dashboardMetrics.health_score / 100) * 251.2}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {dashboardMetrics ? dashboardMetrics.health_score : "--"}
              </span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="flex-1 w-full bg-secondary/50 rounded-xl p-4 border border-border">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Score Analysis</h3>
            {isLoadingMetrics && !dashboardMetrics ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
              </div>
            ) : dashboardMetrics?.score_breakdown ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-foreground">
                  <span className="text-muted-foreground">Base Score</span>
                  <span className="font-mono text-xs">+{dashboardMetrics.score_breakdown.base_score}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-500">
                  <span className="text-muted-foreground">Completion Rate Bonus</span>
                  <span className="font-mono text-xs">+{dashboardMetrics.score_breakdown.completion_bonus}</span>
                </div>
                {dashboardMetrics.score_breakdown.blocker_penalty > 0 && (
                  <div className="flex justify-between items-center text-destructive">
                    <span className="text-muted-foreground">Blockers Penalty</span>
                    <span className="font-mono text-xs">-{dashboardMetrics.score_breakdown.blocker_penalty}</span>
                  </div>
                )}
                {dashboardMetrics.score_breakdown.mr_penalty > 0 && (
                  <div className="flex justify-between items-center text-blue-500">
                    <span className="text-muted-foreground">Open MR Bottleneck</span>
                    <span className="font-mono text-xs">-{dashboardMetrics.score_breakdown.mr_penalty}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-border flex justify-between items-center font-bold">
                  <span className={`text-xs ${scoreColor}`}>{dashboardMetrics.status_text}</span>
                  <span className="font-mono text-foreground text-xs">{dashboardMetrics.health_score} / 100</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No breakdown available.</div>
            )}
          </div>
        </div>

        {/* Metric Sub-cards */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <div className="bg-secondary/30 rounded-xl p-4 border border-border hover:border-indigo-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                <GitPullRequest className="size-3.5 text-indigo-500" />
                Open MRs
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {dashboardMetrics ? dashboardMetrics.open_mrs_count : "-"}
            </div>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border hover:border-destructive/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                <AlertCircle className="size-3.5 text-destructive" />
                Blockers
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {dashboardMetrics ? dashboardMetrics.blockers_count : "-"}
            </div>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                <Activity className="size-3.5 text-blue-500" />
                Open Issues
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {dashboardMetrics ? dashboardMetrics.open_issues_count : "-"}
            </div>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Closed Issues
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {dashboardMetrics ? dashboardMetrics.closed_issues_count : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Top Right: Agent Command Center */}
      <div className="bg-card border border-border rounded-2xl flex flex-col p-0 overflow-hidden min-h-[340px] shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
          <h2 className="text-sm font-semibold tracking-tight">Agent Command Center</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Online</span>
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden bg-background/30 font-mono text-xs">
          <div className="flex-1 pr-4 overflow-y-auto">
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className="flex gap-3 text-muted-foreground">
                  <span className={msg.role === "user" ? "text-primary shrink-0" : "text-emerald-500 shrink-0"}>
                    {msg.role === "user" ? "YOU" : ">"}
                  </span>
                  <p className={`whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "text-foreground" : "text-muted-foreground"}`}>
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-2">
            <div className="bg-secondary/50 border border-border rounded-lg p-2.5 flex items-center gap-3">
              <span className="text-primary font-bold">{">"}</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendTerminal()}
                placeholder="Ask agent to check MRs..."
                className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity Feed (Terminal Log) */}
      {combinedActivity.length > 0 && (
        <div className="xl:col-span-2 flex flex-col mt-2 w-full">
          <div className="bg-[#1e1e1e] border border-border border-b-0 rounded-t-xl px-4 py-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">agent@cmd:~/repo/activity-log</span>
          </div>
          <div className="bg-[#0f0f0f] border border-border rounded-b-xl overflow-hidden shadow-inner p-4 font-mono text-xs flex flex-col h-[350px]">
            <div className="flex-1 pr-4 overflow-y-auto">
              <div className="flex flex-col">
                {combinedActivity.map((event, idx) => {
                  const dateObj = new Date(event.data.activity_time)
                  const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(
                    dateObj.getDate(),
                  ).padStart(2, "0")} ${String(dateObj.getHours()).padStart(2, "0")}:${String(
                    dateObj.getMinutes(),
                  ).padStart(2, "0")}`

                  const isIssue = event.type === "ISSUE"
                  const tagColor = isIssue ? "text-sky-400" : "text-indigo-400"
                  const tagText = isIssue ? "ISSUE" : " MR  "
                  const idPrefix = isIssue ? "#" : "!"
                  const actionWord = event.data.action_word

                  const actionColor =
                    actionWord === "opened"
                      ? "text-emerald-400"
                      : actionWord === "closed"
                        ? "text-red-400"
                        : actionWord === "merged"
                          ? "text-purple-400"
                          : "text-muted-foreground"

                  return (
                    <a
                      key={idx}
                      href={event.data.web_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-wrap md:flex-nowrap items-start md:items-center gap-x-3 gap-y-1 py-1.5 px-2 rounded hover:bg-white/5 transition-colors text-muted-foreground"
                    >
                      <span className="text-muted-foreground/60 shrink-0 select-none">[{dateStr}]</span>
                      <span className={`shrink-0 select-none font-bold ${tagColor}`}>[{tagText}]</span>
                      <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                        <span className="text-blue-400 shrink-0">@{event.data.author?.username || event.data.author}</span>
                        <span className={`shrink-0 select-none font-medium ${actionColor}`}>{actionWord}</span>
                        <span className={`${tagColor} font-bold shrink-0`}>
                          {idPrefix}
                          {event.data.iid}:
                        </span>
                        <span className="text-foreground/90 group-hover:text-white transition-colors truncate">
                          {event.data.title}
                        </span>
                      </div>
                    </a>
                  )
                })}
                <div className="mt-3 flex items-center gap-2 px-2 animate-pulse text-muted-foreground select-none">
                  <span className="text-primary">➜</span>
                  <span className="text-emerald-500">~</span>
                  <span className="w-2 h-4 bg-foreground/70 inline-block" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
