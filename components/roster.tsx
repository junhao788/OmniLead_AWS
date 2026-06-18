"use client"

import { useState, useEffect } from "react"
import { Plus, X, Loader2 } from "lucide-react"
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

function DeveloperCard({ dev }: { dev: Developer }) {
  const status = availabilityConfig[dev.availability]
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
          {dev.initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-card-foreground">{dev.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{dev.role}</p>
        </div>
        <span className={cn("flex items-center gap-1.5 text-xs font-medium", status.text)}>
          <span className={cn("size-2 rounded-full", status.dot)} />
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {dev.skills.map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-auto">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Workload</span>
          <span className="font-medium text-card-foreground">
            {dev.openIssues} / {dev.capacity} open issues
          </span>
        </div>
        <WorkloadBar open={dev.openIssues} capacity={dev.capacity} />
      </div>
    </div>
  )
}

const inputClass =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"

function AddMemberDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (dev: Developer) => void
}) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [skills, setSkills] = useState("")
  const [availability, setAvailability] = useState<Availability>("available")
  const [openIssues, setOpenIssues] = useState("0")
  const [capacity, setCapacity] = useState("8")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return
    const cap = Math.max(1, Number(capacity) || 8)
    const open = Math.min(cap, Math.max(0, Number(openIssues) || 0))
    
    const newDev = {
      name: name.trim(),
      username: name.trim().toLowerCase().replace(/\s+/g, ""),
      github_username: "",
      role: role.trim(),
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      experience_level: "Mid",
      availability,
      timezone: "UTC+8"
    }

    try {
      await fetchAPI("/api/team", {
        method: "POST",
        body: JSON.stringify(newDev)
      })
      onAdd({
        id: newDev.username,
        name: newDev.name,
        initials: initialsFromName(newDev.name),
        role: newDev.role,
        skills: newDev.skills,
        availability: newDev.availability as Availability,
        openIssues: open,
        capacity: cap,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert("Failed to add team member")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">Add team member</h2>
            <p className="text-xs text-muted-foreground">Add an engineer to the company roster.</p>
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="m-name" className="text-xs font-medium text-card-foreground">
              Full name
            </label>
            <input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className={inputClass}
              autoFocus
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="m-skills" className="text-xs font-medium text-card-foreground">
              Skills <span className="text-muted-foreground">(comma separated)</span>
            </label>
            <input
              id="m-skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, TypeScript, Node.js"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="m-avail" className="text-xs font-medium text-card-foreground">
                Availability
              </label>
              <select
                id="m-avail"
                value={availability}
                onChange={(e) => setAvailability(e.target.value as Availability)}
                className={inputClass}
              >
                {availabilityOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="m-open" className="text-xs font-medium text-card-foreground">
                  Open
                </label>
                <input
                  id="m-open"
                  type="number"
                  min={0}
                  value={openIssues}
                  onChange={(e) => setOpenIssues(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="m-cap" className="text-xs font-medium text-card-foreground">
                  Capacity
                </label>
                <input
                  id="m-cap"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !role.trim()}>
              Add member
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI("/api/team")
      .then((data) => {
        const mapped = data.team.map((d: any) => ({
          id: d.username || `d-${Date.now()}`,
          name: d.name,
          initials: initialsFromName(d.name),
          role: d.role || "Developer",
          skills: d.skills || [],
          availability: (d.availability?.toLowerCase() || "available") as Availability,
          openIssues: d.current_open_issues || 0,
          capacity: 8,
        }))
        setDevelopers(mapped)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const available = developers.filter((d) => d.availability === "available").length
  const totalOpen = developers.reduce((sum, d) => sum + d.openIssues, 0)
  const totalCapacity = developers.reduce((sum, d) => sum + d.capacity, 0) || 1

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {developers.length} engineers on the roster
        </p>
        <Button onClick={() => setDialogOpen(true)}>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {developers.map((dev) => (
          <DeveloperCard key={dev.id} dev={dev} />
        ))}
      </div>

      {dialogOpen && (
        <AddMemberDialog
          onClose={() => setDialogOpen(false)}
          onAdd={(dev) => setDevelopers((prev) => [...prev, dev])}
        />
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
