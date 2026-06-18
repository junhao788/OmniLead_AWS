"use client"

import { useState, useRef, useEffect } from "react"
import {
  Rocket,
  Users,
  ListChecks,
  Sun,
  Hexagon,
  Sparkles,
  ChevronsUpDown,
  Check,
  FolderGit2,
  Plus,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/badge"

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
  projects = [],
  selectedProjectId = "",
  onSelectProject,
  loadingProjects = false,
}: {
  active: ViewKey
  onSelect: (key: ViewKey) => void
  projects?: any[]
  selectedProjectId?: string
  onSelectProject?: (id: string) => void
  loadingProjects?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const activeProject = projects.find((p) => p.id === selectedProjectId)
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name_with_namespace.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[3px] transition-all duration-200 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className="flex w-full shrink-0 flex-col border-border bg-sidebar lg:h-screen lg:w-64 lg:border-r z-50">
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

        <div className="relative border-t border-border p-3 hidden lg:block" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-sidebar-accent/35 p-2 text-left hover:bg-sidebar-accent/80 hover:border-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary relative">
              <FolderGit2 className="size-4.5" />
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary animate-pulse" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-xs font-semibold text-foreground">
                {loadingProjects ? (
                  <span className="opacity-50">Loading projects...</span>
                ) : activeProject ? (
                  activeProject.name
                ) : (
                  "Select Project"
                )}
              </span>
              <span className="block truncate text-[10px] text-muted-foreground mt-0.5">
                {activeProject ? `${activeProject.type} Repo` : "OmniLead Workspace"}
              </span>
            </div>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/80" />
          </button>

          {isOpen && (
            <div className="absolute bottom-full left-3 right-3 z-50 mb-1.5 max-h-80 flex flex-col rounded-lg border border-border bg-popover p-1.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="relative mb-1.5 flex items-center">
                <Search className="absolute left-2.5 size-3.5 text-muted-foreground/70" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-border bg-secondary pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto max-h-48 flex flex-col gap-0.5 pr-0.5">
                {filteredProjects.length === 0 ? (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No projects found
                  </div>
                ) : (
                  filteredProjects.map((p) => {
                    const isSelected = p.id === selectedProjectId
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (onSelectProject) onSelectProject(p.id)
                          setIsOpen(false)
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                          isSelected
                            ? "bg-sidebar-accent text-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                        )}
                      >
                        <FolderGit2 className={cn("size-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">{p.name}</span>
                          <span className="block truncate text-[9px] text-muted-foreground mt-0.5">{p.name_with_namespace}</span>
                        </div>
                        <Badge variant={p.type === "Personal" ? "default" : "secondary"} className="text-[8px] px-1 py-0 scale-90 select-none">
                          {p.type}
                        </Badge>
                        {isSelected && <Check className="size-3 text-primary shrink-0 ml-1" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

