"use client"

import { useState, useEffect } from "react"
import { Search, Bell } from "lucide-react"
import { Sidebar, type ViewKey } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Launchpad } from "@/components/launchpad"
import { Roster } from "@/components/roster"
import { SprintPlanner } from "@/components/sprint-planner"
import { DailyStandup } from "@/components/daily-standup"
import { fetchAPI } from "@/lib/api"

const titles: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Project health and agent command center." },
  launchpad: { title: "Launchpad", subtitle: "Turn a raw idea into a scaffolded project." },
  roster: { title: "Company Roster", subtitle: "Your engineering team and live workload." },
  sprint: { title: "Sprint Planner", subtitle: "Backlog automatically prioritized by OmniLead." },
  standup: { title: "Daily Standup", subtitle: "AI-generated summary of what shipped today." },
}

export default function Page() {
  const [view, setView] = useState<ViewKey>("dashboard")
  const [projectId, setProjectId] = useState<string>("")
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const meta = titles[view]

  useEffect(() => {
    setLoadingProjects(true)
    fetchAPI("/api/projects")
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects)
          const savedId = localStorage.getItem("omnilead_selected_project_id")
          const isValid = data.projects.some((p: any) => p.id === savedId)
          if (savedId && isValid) {
            setProjectId(savedId)
          } else if (data.projects.length > 0) {
            setProjectId(data.projects[0].id)
            localStorage.setItem("omnilead_selected_project_id", data.projects[0].id)
          } else if (data.projects.length === 0) {
            // If no projects, force launchpad
            setView("launchpad")
          }
        }
      })
      .catch((err) => console.error("Failed to load projects:", err))
      .finally(() => setLoadingProjects(false))
  }, [])

  const handleSelectProject = (id: string) => {
    setProjectId(id)
    localStorage.setItem("omnilead_selected_project_id", id)
  }

  const handleProjectCreated = (newProject: { id: string; name: string }) => {
    const formatted = {
      id: newProject.id,
      name: newProject.name,
      name_with_namespace: newProject.name,
      type: "Personal",
      web_url: `https://gitlab.com/${newProject.name}`,
    }
    setProjects((prev) => [formatted, ...prev])
    setProjectId(newProject.id)
    localStorage.setItem("omnilead_selected_project_id", newProject.id)
    setView("dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      <Sidebar
        active={view}
        onSelect={setView}
        projects={projects}
        selectedProjectId={projectId}
        onSelectProject={handleSelectProject}
        loadingProjects={loadingProjects}
      />

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
          {view === "dashboard" && <Dashboard projectId={projectId} />}
          {view === "launchpad" && <Launchpad onProjectCreated={handleProjectCreated} />}
          {view === "roster" && <Roster />}
          {view === "sprint" && <SprintPlanner projectId={projectId} />}
          {view === "standup" && <DailyStandup projectId={projectId} />}
        </div>
      </main>
    </div>
  )
}

