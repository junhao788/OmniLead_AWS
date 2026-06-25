"use client"

import { useState, useEffect } from "react"
import { Activity, GitMerge, Sun, Wrench, ShieldAlert, Sparkles, FolderGit2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import { fetchAPI } from "@/lib/api"
import { Badge } from "@/components/badge"
import { cn } from "@/lib/utils"

function formatDistanceToNow(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  return "a while ago"
}

type AuditLogEntry = {
  project_id: string
  timestamp: number
  action: string
  title: string
  description: string
  metadata: any
}

function getActionIcon(action: string) {
  if (action.includes("AUTO_REMEDIATED") || action.includes("AUTO_FIX")) return <Wrench className="size-4 text-blue-500" />
  if (action.includes("MR_APPROVED")) return <CheckCircle2 className="size-4 text-emerald-500" />
  if (action.includes("MR_REJECTED") || action.includes("MR_NEEDS_WORK")) return <ShieldAlert className="size-4 text-rose-500" />
  if (action.includes("TRIAGE")) return <Sparkles className="size-4 text-purple-500" />
  if (action.includes("SPRINT")) return <GitMerge className="size-4 text-amber-500" />
  if (action.includes("STANDUP")) return <Sun className="size-4 text-orange-400" />
  if (action.includes("PROJECT")) return <FolderGit2 className="size-4 text-primary" />
  return <Activity className="size-4 text-muted-foreground" />
}

function LogEntry({ log }: { log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const dateStr = new Date(log.timestamp * 1000).toLocaleString()
  const relativeTime = formatDistanceToNow(new Date(log.timestamp * 1000))

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-6 h-full w-px bg-border/60 last:hidden" />
      
      {/* Icon node */}
      <div className="absolute left-0 top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card shadow-sm">
        {getActionIcon(log.action)}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
        <div 
          className="flex cursor-pointer flex-col gap-1.5 p-4 sm:flex-row sm:items-start sm:justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">{log.title}</span>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{log.action.replace(/_/g, " ")}</Badge>
            </div>
            <span className="text-sm text-muted-foreground">{log.description}</span>
          </div>
          <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1 text-right shrink-0 mt-1 sm:mt-0">
            <span className="text-xs font-medium text-foreground">{relativeTime}</span>
            <span className="text-[11px] text-muted-foreground">{dateStr}</span>
            <div className="mt-1 flex items-center justify-center rounded-full bg-secondary p-1 text-muted-foreground hover:bg-secondary/80 sm:hidden">
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </div>
          </div>
        </div>

        {expanded && log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="border-t border-border bg-muted/20 p-4">
            <pre className="overflow-x-auto rounded-lg bg-black/80 p-3 text-xs text-blue-300 font-mono">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export function AuditLog({ projectId }: { projectId?: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchAPI(`/api/audit-log/${projectId}`)
      .then((data) => {
        if (data.logs) {
          setLogs(data.logs)
        }
      })
      .catch((err) => console.error("Failed to load audit logs", err))
      .finally(() => setLoading(false))
  }, [projectId])

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight">Activity Timeline</h2>
          <p className="text-sm text-muted-foreground">Real-time audit log of OmniLead's autonomous actions.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Activity className="mr-1.5 size-3.5" />
          {logs.length} Actions
        </Badge>
      </div>

      {loading ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50">
          <Activity className="size-5 animate-pulse text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading timeline...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 text-center px-4">
          <Activity className="size-6 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">No autonomous activity yet</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            When OmniLead performs tasks like code review, triaging, or generating reports, they will appear here.
          </p>
        </div>
      ) : (
        <div className="relative pt-2">
          {logs.map((log) => (
            <LogEntry key={`${log.timestamp}-${log.action}`} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}
