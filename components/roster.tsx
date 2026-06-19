"use client"

import { useState, useEffect } from "react"
import { Plus, X, Loader2, Trash2, Edit2, Check, AlertCircle } from "lucide-react"
import type { Availability, Developer } from "@/lib/data"
import { Badge } from "@/components/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fetchAPI } from "@/lib/api"

const availabilityConfig: Record<Availability, { label: string; dot: string; text: string }> = {
  available: { label: "Available", dot: "bg-primary", text: "text-primary" },
  busy: { label: "Heads down", dot: "bg-chart-3", text: "text-chart-3" },
  "in-meeting": { label: "In meeting", dot: "bg-chart-2", text: "text-chart-2" },
  off: { label: "Off today", dot: "bg-muted-foreground", text: "text-muted-foreground" },
}

const availabilityOptions: { value: Availability; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Heads down" },
  { value: "in-meeting", label: "In meeting" },
  { value: "off", label: "Off today" },
]

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function WorkloadBar({ open, capacity }: { open: number; capacity: number }) {
  const pct = Math.min(100, Math.round((open / capacity) * 100))
  const tone = pct >= 85 ? "bg-destructive" : pct >= 60 ? "bg-chart-3" : "bg-primary"
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function DeveloperCard({ dev, onDelete, onEdit, onViewWorkload }: { dev: Developer; onDelete?: (id: string) => void; onEdit?: (dev: Developer) => void; onViewWorkload?: (dev: Developer) => void }) {
  const status = availabilityConfig[dev.availability]
  const isOwner = dev.id === "owner_admin"
  
  return (
    <div className={cn(
      "flex flex-col gap-4 rounded-xl border p-5 transition-colors relative",
      isOwner ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(34,197,94,0.08)]" : "border-border bg-card hover:border-primary/30"
    )}>
      <div className="absolute right-3 top-3 flex gap-1 z-10">
        {onEdit && (
          <button onClick={() => onEdit(dev)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-md transition-colors" title="Edit member">
            <Edit2 className="size-3.5" />
          </button>
        )}
        {onDelete && !isOwner && (
          <button onClick={() => onDelete(dev.id)} className="p-1.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors" title="Delete member">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-start gap-3 mt-2">
        <div className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold relative",
          isOwner ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}>
          {dev.initials}
          {isOwner && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background border border-border text-[10px]">
              👑
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="truncate text-sm font-semibold text-card-foreground">{dev.name}</h3>
          <p className="truncate text-xs font-medium text-primary">@{dev.id}</p>
          <p className="truncate text-xs text-muted-foreground mt-0.5">{dev.role}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {dev.skills.map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 text-xs font-medium", status.text)}>
          <span className={cn("size-2 rounded-full", status.dot)} />
          {status.label}
        </span>
        {!isOwner && (
          <div 
            className="flex flex-col items-end gap-1 w-1/2 cursor-pointer hover:bg-secondary/40 p-1.5 -m-1.5 rounded-md transition-colors"
            onClick={() => onViewWorkload?.(dev)}
            title="Click to view assigned tasks"
          >
            <div className="flex items-center justify-between text-[10px] w-full">
              <span className="text-muted-foreground">Workload <span className="underline ml-0.5">View</span></span>
              <span className="font-medium text-card-foreground">
                {dev.openIssues} / {dev.capacity} issues
              </span>
            </div>
            <WorkloadBar open={dev.openIssues} capacity={dev.capacity} />
          </div>
        )}
      </div>
    </div>
  )
}

const inputClass =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"

const AVAILABLE_SKILLS = [
  "React", "TypeScript", "Node.js", "Python", "AWS", "Next.js", 
  "Tailwind CSS", "Go", "Docker", "Kubernetes", "PostgreSQL", 
  "MongoDB", "GraphQL", "Java", "C++", "Rust", "Vue.js", 
  "Angular", "PHP", "Ruby on Rails", "Swift", "Kotlin", "C#"
]

function MemberDialog({
  onClose,
  onAdd,
  onUpdate,
  editDev,
}: {
  onClose: () => void
  onAdd?: (dev: Developer) => void
  onUpdate?: (dev: Developer) => void
  editDev?: Developer
}) {
  const [gitlabUsername, setGitlabUsername] = useState(editDev?.id || "")
  const [fullname, setFullname] = useState(editDev?.name || "")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState(editDev?.role || "")
  const [skills, setSkills] = useState<string[]>(editDev?.skills || [])
  const [experience, setExperience] = useState("Mid")
  const [availability, setAvailability] = useState(editDev?.availability || "available")
  const [opentask, setOpentask] = useState(editDev?.openIssues || 0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullname.trim() || !role.trim() || !gitlabUsername.trim()) return
    setError(null)
    setIsSubmitting(true)
    
    const newDev = {
      username: gitlabUsername.trim(),
      name: fullname.trim(),
      github_username: "",
      role: role.trim(),
      experience_level: experience,
      skills: skills,
      availability: availability,
      opentask: opentask,
      timezone: "UTC+8"
    }

    try {
      if (editDev) {
        await fetchAPI(`/api/team/${editDev.id}`, {
          method: "PUT",
          body: JSON.stringify(newDev)
        })
        if (onUpdate) {
          onUpdate({
            ...editDev,
            id: newDev.username,
            name: newDev.name,
            initials: initialsFromName(newDev.name),
            role: newDev.role,
            skills: newDev.skills,
          })
        }
      } else {
        await fetchAPI("/api/team", {
          method: "POST",
          body: JSON.stringify(newDev)
        })
        if (onAdd) {
          onAdd({
            id: newDev.username,
            name: newDev.name,
            initials: initialsFromName(newDev.name),
            role: newDev.role,
            skills: newDev.skills,
            availability: newDev.availability as Availability,
            openIssues: newDev.opentask,
            capacity: 8,
          })
        }
      }
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      console.error(err)
      setError(editDev ? "Failed to update team member. Please try again." : "Failed to add team member. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-xl border border-primary/20 bg-card p-8 shadow-2xl flex flex-col items-center justify-center text-center transform animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Check className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-card-foreground">
            {editDev ? "Update Successful!" : "Member Added!"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {editDev 
              ? `${fullname}'s profile has been updated.` 
              : `${fullname} has been added to the roster.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">
              {editDev ? "Edit team member" : "Add team member"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {editDev ? "Update engineer details." : "Add an engineer to the company roster."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-card-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="size-4" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-4 max-h-[50vh] min-h-[30vh] overflow-y-auto px-1 pb-1">
            <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="m-gitlab" className="text-xs font-medium text-card-foreground">
                GitLab Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground font-medium">@</span>
                <input
                  id="m-gitlab"
                  value={gitlabUsername}
                  onChange={(e) => setGitlabUsername(e.target.value.replace(/^@/, ""))}
                  placeholder="jane_doe"
                  className={cn(inputClass, "pl-7")}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="m-name" className="text-xs font-medium text-card-foreground">
                Full name
              </label>
              <input
                id="m-name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="m-email" className="text-xs font-medium text-card-foreground">
                Email
              </label>
              <input
                id="m-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="m-role" className="text-xs font-medium text-card-foreground">
                Role
              </label>
              <input
                id="m-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior Backend Engineer"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-medium text-card-foreground">
                Skills
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto rounded-lg border border-border bg-secondary p-2">
                {AVAILABLE_SKILLS.map((skill) => (
                  <label key={skill} className="flex items-center gap-2 text-xs text-card-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skills.includes(skill)}
                      onChange={(e) => {
                        if (e.target.checked) setSkills([...skills, skill])
                        else setSkills(skills.filter((s) => s !== skill))
                      }}
                      className="rounded border-border"
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="m-exp" className="text-xs font-medium text-card-foreground">
                Experience
              </label>
              <select
                id="m-exp"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className={inputClass}
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
          </div>
          </div>

          <div className="mt-2 flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!fullname.trim() || !role.trim() || !gitlabUsername.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : (editDev ? "Save changes" : "Add member")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Roster() {
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDev, setEditingDev] = useState<Developer | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewingWorkloadDev, setViewingWorkloadDev] = useState<Developer | null>(null)
  const [workloadIssues, setWorkloadIssues] = useState<any[]>([])
  const [loadingWorkload, setLoadingWorkload] = useState(false)

  const ownerDev: Developer = {
    id: "owner_admin",
    name: "System Owner",
    initials: "SO",
    role: "Product Owner",
    skills: ["Leadership", "Product", "Agile"],
    availability: "available",
    openIssues: 0,
    capacity: 8,
  }

  useEffect(() => {
    fetchAPI("/api/team")
      .then((data) => {
        const mapped = data.team.map((d: any) => ({
          id: d.username || d.gitlabUsername || `d-${Date.now()}`,
          name: d.name,
          initials: initialsFromName(d.name),
          role: d.role,
          skills: d.skills || [],
          availability: "available",
          openIssues: d.current_open_issues || 0,
          capacity: 8,
        }))
        setDevelopers([ownerDev, ...mapped])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to remove this member?")) {
      try {
        await fetchAPI(`/api/team/${id}`, { method: "DELETE" })
        setDevelopers((prev) => prev.filter((d) => d.id !== id))
      } catch (err) {
        console.error(err)
        alert("Failed to delete member")
      }
    }
  }

  function handleEdit(dev: Developer) {
    setEditingDev(dev)
  }

  async function handleViewWorkload(dev: Developer) {
    setViewingWorkloadDev(dev)
    setLoadingWorkload(true)
    setWorkloadIssues([])
    try {
      const data = await fetchAPI(`/api/team/${dev.id}/issues`)
      setWorkloadIssues(data.issues || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingWorkload(false)
    }
  }

  const available = developers.filter((d) => d.availability === "available").length
  const totalOpen = developers.reduce((sum, d) => sum + d.openIssues, 0)
  const totalCapacity = developers.reduce((sum, d) => sum + d.capacity, 0)

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {developers.length} engineers on the roster
        </p>
        <Button onClick={() => { setEditingDev(null); setDialogOpen(true); }}>
          <Plus className="size-4" />
          Add member
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Engineers" value={developers.length.toString()} />
        <StatCard label="Available now" value={available.toString()} accent />
        <StatCard label="Open issues" value={totalOpen.toString()} />
        <StatCard label="Avg load" value={`${Math.round((totalOpen / totalCapacity) * 100)}%`} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {developers.map((dev) => (
          <DeveloperCard key={dev.id} dev={dev} onDelete={handleDelete} onEdit={handleEdit} onViewWorkload={handleViewWorkload} />
        ))}
      </div>

      {(dialogOpen || editingDev) && (
        <MemberDialog
          editDev={editingDev || undefined}
          onClose={() => {
            setDialogOpen(false)
            setEditingDev(null)
          }}
          onAdd={(dev) => setDevelopers((prev) => [...prev, dev])}
          onUpdate={(dev) => setDevelopers((prev) => prev.map((d) => (d.id === editingDev?.id ? dev : d)))}
        />
      )}

      {viewingWorkloadDev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Workload Details</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Open issues assigned to {viewingWorkloadDev.name}
                </p>
              </div>
              <button
                onClick={() => setViewingWorkloadDev(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto pr-2">
              {loadingWorkload ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : workloadIssues.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {workloadIssues.map((issue, idx) => (
                    <li key={idx} className="rounded-lg border border-border bg-secondary/30 p-3 flex flex-col gap-1.5 hover:bg-secondary/60 transition-colors">
                      <a href={issue.web_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary hover:underline">
                        {issue.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-sm font-medium text-card-foreground">No open issues found</p>
                  <p className="text-xs text-muted-foreground mt-1">This member has no active assigned issues on GitLab.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setViewingWorkloadDev(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight", accent ? "text-primary" : "text-card-foreground")}>
        {value}
      </p>
    </div>
  )
}
