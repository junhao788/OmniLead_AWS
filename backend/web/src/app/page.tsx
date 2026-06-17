"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  WalletCards, 
  Activity, 
  Search,
  Settings,
  Sparkles,
  Bell,
  ChevronDown,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  GitCommit,
  CalendarDays,
  Bot,
  Zap,
  Rocket,
  ExternalLink,
  GitBranch,
  FolderGit2,
  ListChecks,
  FileCode2,
  CheckCheck,
  Users,
  UserCheck,
  BrainCircuit,
  ArrowRight,
  UserPlus,
  Trash2,
  Plus,
  Briefcase,
  Pencil,
  Clock,
  Code,
  Tag,
  Wrench,
  FileText,
  Package
} from 'lucide-react';

const getColumnColor = (name: string) => {
  if (!name) return { text: 'text-accent', border: 'border-accent/30', bg: 'bg-accent/10', glow: 'hover:border-accent/60' };
  const n = name.toUpperCase();
  if (n.includes('DONE') || n.includes('COMPLETED')) return { text: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10', glow: 'hover:border-green-500/50' };
  if (n.includes('PROGRESS') || n.includes('DOING') || n.includes('ACTIVE')) return { text: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', glow: 'hover:border-indigo-500/50' };
  if (n.includes('BLOCK') || n.includes('CRITICAL') || n.includes('P0')) return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', glow: 'hover:border-red-500/50' };
  if (n.includes('HIGH') || n.includes('P1')) return { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', glow: 'hover:border-blue-500/50' };
  if (n.includes('BACKLOG') || n.includes('TODO')) return { text: 'text-slate-400', border: 'border-slate-500/30', bg: 'bg-slate-500/10', glow: 'hover:border-slate-500/50' };
  return { text: 'text-accent', border: 'border-accent/30', bg: 'bg-accent/10', glow: 'hover:border-accent/60' };
};

const getColumnIcon = (name: string) => {
  if (!name) return <LayoutGrid className="w-4 h-4 shrink-0" />;
  const n = name.toUpperCase();
  if (n.includes('DONE') || n.includes('COMPLETED')) return <CheckCircle2 className="w-4 h-4 shrink-0" />;
  if (n.includes('PROGRESS') || n.includes('DOING')) return <Activity className="w-4 h-4 shrink-0" />;
  if (n.includes('BLOCK') || n.includes('CRITICAL')) return <AlertCircle className="w-4 h-4 shrink-0" />;
  if (n.includes('BACKLOG')) return <ListChecks className="w-4 h-4 shrink-0" />;
  return <LayoutGrid className="w-4 h-4 shrink-0" />;
};

const StandupRenderer = ({ text }: { text?: string }) => {
  if (!text) return null;
  let reportData: any = null;
  let remainingText = "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.report) reportData = parsed.report;
      // Fallbacks
      if (!reportData && parsed.standup) reportData = parsed.standup;
      if (!reportData && parsed.briefing) reportData = parsed.briefing;
      remainingText = text.replace(jsonMatch[0], "").trim();
    }
  } catch (e) {
    console.error("Failed to parse report JSON", e);
  }

  if (!reportData) {
    return <div className="text-sm font-mono text-text-secondary whitespace-pre-wrap bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 p-5 rounded-xl">{text}</div>;
  }

  // Handle fallback if LLM returned old data
  const activityList = reportData.activity || reportData.members || [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10">
      {/* Activity Summary */}
      <div className="border-b border-white/5 pb-5 mb-2">
        <h3 className="text-[11px] font-bold text-accent uppercase tracking-widest flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5" /> Daily Activity Summary
        </h3>
        <p className="text-text-primary text-[15px] font-medium leading-relaxed">{reportData.summary}</p>
      </div>

      {/* Team Activity Feed */}
      <div className="flex flex-col gap-10">
        {activityList.length === 0 ? (
          <div className="text-center py-10 text-text-tertiary text-sm">No activity recorded today.</div>
        ) : (
          activityList.map((user: any, i: number) => (
            <div key={i} className="flex gap-4">
              
              {/* Avatar Column */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 flex items-center justify-center text-text-primary font-bold text-sm shrink-0 z-10">
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
                {i !== activityList.length - 1 && (
                  <div className="w-px h-full bg-border/40 mt-2"></div>
                )}
              </div>

              {/* Feed Content */}
              <div className="flex-1 pt-1 pb-4">
                <h4 className="font-bold text-text-primary text-[15px] mb-4">{user.name}</h4>
                
                <div className="flex flex-col gap-5">
                  
                  {/* Commits */}
                  {user.commits && user.commits.length > 0 && (
                    <div className="bg-[#0c0c0e]/60 backdrop-blur-xl rounded-xl p-4 border border-white/5">
                      <h5 className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2 mb-3">
                        <Code className="w-3.5 h-3.5" /> Commits
                      </h5>
                      <ul className="space-y-2.5">
                        {user.commits.map((commit: string, j: number) => (
                          <li key={j} className="text-[13px] text-text-secondary flex items-start gap-3">
                            <span className="text-accent mt-1.5 shrink-0 text-[6px]">●</span>
                            <span className="font-mono text-[12px]">{commit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Merge Requests */}
                  {user.merge_requests && user.merge_requests.length > 0 && (
                    <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/10">
                      <h5 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <GitPullRequest className="w-3.5 h-3.5" /> Merge Requests
                      </h5>
                      <ul className="space-y-2.5">
                        {user.merge_requests.map((mr: string, j: number) => (
                          <li key={j} className="text-[13px] text-indigo-200/80 flex items-start gap-3 font-medium">
                            <span className="text-indigo-400 mt-[5px] shrink-0 text-[10px]">●</span>
                            <span>{mr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Closed Issues */}
                  {user.closed_issues && user.closed_issues.length > 0 && (
                    <div className="bg-green-500/5 rounded-xl p-4 border border-green-500/10">
                      <h5 className="text-[11px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Closed Issues
                      </h5>
                      <ul className="space-y-2.5">
                        {user.closed_issues.map((issue: string, j: number) => (
                          <li key={j} className="text-[13px] text-green-200/80 flex items-start gap-3 font-medium">
                            <span className="text-green-500 mt-[5px] shrink-0 text-[10px]">●</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(!user.commits?.length && !user.merge_requests?.length && !user.closed_issues?.length) && (
                    <div className="text-[13px] text-text-tertiary italic p-3 border border-dashed border-white/5 rounded-lg">
                      No tracked git activity today.
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {remainingText && (
        <div className="mt-4 p-4 bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl font-mono text-sm whitespace-pre-wrap text-text-secondary overflow-y-auto custom-scrollbar flex-1">
          {remainingText}
        </div>
      )}
    </div>
  );
};

const AgentOutputCardRenderer = ({ text, inputBoardData }: { text?: string, inputBoardData?: any }) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  if (!text && !inputBoardData) return null;

  let boardData: any = inputBoardData;
  let remainingText = "";
  
  if (!boardData && text) {
    let jsonString = text;
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
      remainingText = text.replace(jsonMatch[0], '').trim();
      try { boardData = JSON.parse(jsonString); } catch(e) {}
    } else {
      const firstBrace = text.indexOf('{');
      if (firstBrace !== -1) {
        for (let i = text.length - 1; i >= firstBrace; i--) {
          if (text[i] === '}') {
            try {
              jsonString = text.substring(firstBrace, i + 1);
              boardData = JSON.parse(jsonString);
              remainingText = text.substring(0, firstBrace) + text.substring(i + 1);
              remainingText = remainingText.trim();
              break;
            } catch(e) {}
          }
        }
      }
    }
    
    if (!boardData) {
      try { boardData = JSON.parse(text); } catch (e) {
        return <div className="font-mono text-sm whitespace-pre-wrap">{text}</div>;
      }
    }
  }
  
  if (!boardData || !boardData.board) {
     return <div className="font-mono text-sm whitespace-pre-wrap">{text || JSON.stringify(inputBoardData)}</div>;
  }

  const teamSize = boardData.team_size || 1;
  const perPersonCapacity = boardData.per_person_capacity_hours || 25;
  
  // Calculate individual active workloads (only P0 CRITICAL + P1 HIGH PRIORITY, exclude BACKLOG)
  const workloads: Record<string, number> = {};
  if (boardData.board) {
    boardData.board
      .filter((col: any) => {
        const name = (col.columnName || '').toUpperCase();
        return name.includes('P0') || name.includes('P1') || name.includes('CRITICAL') || name.includes('HIGH');
      })
      .forEach((col: any) => {
        col.cards?.forEach((card: any) => {
          if (!card.checked) {
            const assignee = card.assigned_to || 'Unassigned';
            workloads[assignee] = (workloads[assignee] || 0) + (card.estimated_hours || 0);
          }
        });
      });
  }

  const assigneeKeys = Object.keys(workloads).sort();

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-4">
      {/* Individual Capacity Headers */}
      {assigneeKeys.length > 0 && (
        <div className="flex flex-col gap-2 shrink-0 bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-3">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Active Workload</div>
          {assigneeKeys.map(assignee => {
            const used = workloads[assignee];
            const capacity = assignee === 'Unassigned' ? (used || 1) : perPersonCapacity; // Don't show fake capacity for unassigned
            const pct = Math.min((used / capacity) * 100, 100);
            const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-sky-500' : 'bg-blue-500';
            
            return (
              <div key={assignee} className="flex items-center gap-3">
                <div className="w-24 shrink-0 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-sky-900/40 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-sky-400 uppercase">{assignee.charAt(0)}</span>
                  </div>
                  <span className="text-xs font-medium text-text-primary truncate">{assignee}</span>
                </div>
                <div className="flex-1 h-2 bg-[#0c0c0e]/60 backdrop-blur-xl rounded-full border border-white/5 overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-text-secondary shrink-0 w-12 text-right">{used}{assignee !== 'Unassigned' ? `/${capacity}h` : 'h'}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* List Groups container */}
      <div className="flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2 pb-8 flex-1 min-h-0">
        {boardData.board.map((col: any, cIdx: number) => {
          const colors = getColumnColor(col.columnName);
          const colHours = col.cards?.reduce((sum: number, c: any) => sum + (c.estimated_hours || 0), 0) || 0;
          
          return (
            <div key={cIdx} className="flex flex-col">
              {/* Minimalist Group Header */}
              <div className="flex items-center gap-3 mb-3 pl-2">
                <h3 className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${colors.text}`}>
                  {getColumnIcon(col.columnName)}
                  {col.columnName}
                </h3>
                <span className="text-text-tertiary text-xs">•</span>
                <span className="text-text-secondary text-xs font-medium">{col.cards?.length || 0} issues</span>
                {colHours > 0 && (
                  <>
                    <span className="text-text-tertiary text-xs">•</span>
                    <span className="text-sky-500 text-xs font-mono">{colHours}h</span>
                  </>
                )}
              </div>
              
              {/* Linear-style List Container */}
              <div className="flex flex-col bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden shadow-sm">
                {col.cards && col.cards.map((card: any, cardIdx: number) => {
                  const cardId = `sprint-${cIdx}-${cardIdx}`;
                  const isExpanded = expandedCards[cardId];
                  return (
                  <div key={cardIdx} className={`flex flex-col border-b border-white/5 last:border-b-0 ${card.checked ? 'opacity-60 bg-[#0c0c0e]/60 backdrop-blur-xl' : ''}`}>
                    <div 
                      onClick={() => toggleCard(cardId)}
                      className="group flex items-center gap-3 p-3 hover:bg-[#0c0c0e]/60 backdrop-blur-xl transition-colors cursor-pointer"
                    >
                      {/* Status Icon */}
                      <div className="shrink-0 pl-1">
                        {card.checked ? (
                           <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        ) : (
                           <div className={`w-4 h-4 rounded-full border border-dashed ${colors.text.replace('text-', 'border-')} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        )}
                      </div>
                      
                      {/* Title */}
                      <div className="flex-1 min-w-0">
                         <p className={`text-sm font-medium text-text-primary truncate ${card.checked ? 'line-through text-text-secondary' : ''}`}>
                           {card.title}
                         </p>
                      </div>
                      
                      {/* Badges */}
                      {card.badges && card.badges.length > 0 && (
                        <div className="flex shrink-0 gap-1.5 hidden md:flex">
                          {card.badges
                            .filter((b: string) => !['high', 'medium', 'low', 'critical', 'p0', 'p1'].includes(b.toLowerCase()))
                            .map((badge: string, bIdx: number) => (
                            <span key={bIdx} className={`text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-md border border-white/5 text-text-secondary bg-[#0c0c0e]/60 backdrop-blur-xl group-hover:border-white/5 transition-colors`}>
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Time Estimate */}
                      {card.estimated_hours && (
                        <div className="shrink-0 flex items-center justify-end min-w-[32px] ml-2">
                          <span className="text-xs font-mono text-sky-500/80 group-hover:text-sky-400 transition-colors">{card.estimated_hours}h</span>
                        </div>
                      )}
                      
                      {/* Assignee */}
                      {card.assigned_to && (
                        <div className="shrink-0 flex items-center gap-2 pl-3 ml-3 border-l border-white/5">
                           <div className="w-5 h-5 rounded-full bg-sky-900/40 border border-sky-500/30 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-sky-400 uppercase">{card.assigned_to.charAt(0)}</span>
                           </div>
                           <span className="text-xs text-text-secondary hidden lg:inline-block truncate max-w-[80px]">
                             {card.assigned_to}
                           </span>
                        </div>
                      )}
                      
                      {/* Expand Icon */}
                      <div className="shrink-0 pl-3 ml-2 flex items-center justify-center">
                        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {isExpanded && card.description && (
                      <div className="pl-10 pr-4 pb-3 pt-1">
                        <div className="border border-sky-500/50 p-3 bg-sky-950/20 text-sm text-text-secondary whitespace-pre-wrap rounded-md">
                          {card.description}
                        </div>
                      </div>
                    )}
                  </div>
                )})}
                
                {(!col.cards || col.cards.length === 0) && (
                  <div className="p-4 flex items-center gap-2 text-text-tertiary text-xs italic">
                    <div className="w-4 h-4 rounded-full border border-dashed border-white/5 shrink-0 opacity-40 ml-1" />
                    No issues in this group
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {remainingText && (
        <div className="mt-2 p-3 bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-lg font-mono text-xs whitespace-pre-wrap text-text-secondary overflow-y-auto custom-scrollbar shrink-0 max-h-32">
          {remainingText}
        </div>
      )}
    </div>
  );
};

const SprintCountdown = ({ createdAt, onExpired }: { createdAt: number; onExpired?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [hasExpired, setHasExpired] = useState(false);
  const expiredCallbackRef = useRef(false);
  
  useEffect(() => {
    const updateCountdown = () => {
      const endsAt = (createdAt * 1000) + (7 * 24 * 60 * 60 * 1000); // 7 days later
      const now = Date.now();
      const diff = endsAt - now;
      
      if (diff <= 0) {
        setTimeLeft('Sprint Ended');
        setHasExpired(true);
        if (onExpired && !expiredCallbackRef.current) {
          expiredCallbackRef.current = true;
          onExpired();
        }
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s remaining`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [createdAt, onExpired]);

  if (hasExpired) {
    return <span className="ml-3 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-md font-mono border border-red-500/30 flex items-center gap-1.5"><Clock className="w-3 h-3" />Sprint Ended</span>;
  }

  return <span className="ml-3 px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-md font-mono border border-accent/30 animate-pulse flex items-center gap-1.5"><Clock className="w-3 h-3" />{timeLeft}</span>;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };
  
  const fetchProjects = async () => {
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/projects');
      const data = await res.json();
      if (data.projects && data.projects.length > 0) {
        setProjects(data.projects);
        setSelectedProjectId(data.projects[0].id);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchDashboardMetrics = async (projectId: string) => {
    setIsLoadingMetrics(true);
    try {
      const res = await fetch(`https://hackathon-030e.onrender.com/api/dashboard/${projectId}`);
      const data = await res.json();
      setDashboardMetrics(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    }
    setIsLoadingMetrics(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      // 1. Fetch dashboard metrics and start interval
      fetchDashboardMetrics(selectedProjectId);
      const interval = setInterval(() => fetchDashboardMetrics(selectedProjectId), 20000);
      
      // 2. Prefetch LIGHTWEIGHT data only (no AI agent calls to avoid OOM on 512MB Render)
      fetchTechReviews();
      fetchSprintHistory();
      fetchRoster();
      // NOTE: fetchTeamWorkload() is intentionally NOT called here.
      // It triggers the AI agent which uses 300MB+ RAM and crashes Render's 512MB free tier.
      // User must manually click "Sync Team Data" to trigger it.
      
      return () => clearInterval(interval);
    }
  }, [selectedProjectId]);

  // State for Agent Terminal
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'SYSTEM INITIALIZED. Connected to GitLab node.' }
  ]);
  const [input, setInput] = useState('');

  // State for Standup Tab
  const [standupReport, setStandupReport] = useState<string | null>(null);
  const [loadingStandup, setLoadingStandup] = useState(false);
  const [standupHistory, setStandupHistory] = useState<any[]>([]);
  const [selectedStandupDate, setSelectedStandupDate] = useState<string | null>(null);
  const [savingStandup, setSavingStandup] = useState(false);

  // State for Issue Intel Tab
  const [issueQuery, setIssueQuery] = useState('');
  const [issueResult, setIssueResult] = useState<string | null>(null);
  const [loadingIssue, setLoadingIssue] = useState(false);

  // State for Sprint Tab
  const [sprintPlan, setSprintPlan] = useState<string | null>(null);
  const [loadingSprint, setLoadingSprint] = useState(false);

  // State for Architect Tab
  const [techReviews, setTechReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchTechReviews = async () => {
    if (!selectedProjectId) return;
    setLoadingReviews(true);
    try {
      const res = await fetch(`https://hackathon-030e.onrender.com/api/reviews/${selectedProjectId}`);
      const data = await res.json();
      setTechReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const [architectIdea, setArchitectIdea] = useState('');
  const [architectResult, setArchitectResult] = useState<string | null>(null);
  const [loadingArchitect, setLoadingArchitect] = useState(false);

  // State for Zero-to-One Tab
  const [zeroIdea, setZeroIdea] = useState('');
  const [zeroResult, setZeroResult] = useState<any>(null);
  const [zeroRawText, setZeroRawText] = useState<string | null>(null);
  const [loadingZero, setLoadingZero] = useState(false);
  const [zeroProgress, setZeroProgress] = useState<string[]>([]);
  const zeroAbortControllerRef = useRef<AbortController | null>(null);

  const abortZeroToOne = () => {
    if (zeroAbortControllerRef.current) {
      zeroAbortControllerRef.current.abort();
      zeroAbortControllerRef.current = null;
    }
    setLoadingZero(false);
    setZeroProgress(p => [...p, '🛑 AI Emergency Abort Triggered.']);
  };

  // State for Team Dashboard Tab
  const [teamResult, setTeamResult] = useState<any>(null);
  const [teamRawText, setTeamRawText] = useState<string | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // State for Company Roster Tab
  const [rosterMembers, setRosterMembers] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '', username: '', github_username: '', role: 'Developer', skills: '',
    experience_level: 'Mid', availability: 'High'
  });
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [isDetectingSkills, setIsDetectingSkills] = useState(false);
  const [deletingUsername, setDeletingUsername] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  // State for Release Notes
  const [releaseReport, setReleaseReport] = useState<string | null>(null);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [publishingRelease, setPublishingRelease] = useState(false);
  const [releaseVersion, setReleaseVersion] = useState('v0.1.0');

  // State for Sprint History
  const [sprintHistory, setSprintHistory] = useState<any[]>([]);
  const [loadingSprintHistory, setLoadingSprintHistory] = useState(false);
  const [savingSprint, setSavingSprint] = useState(false);
  const [syncingSprintId, setSyncingSprintId] = useState<string | null>(null);

  const fetchTeamWorkload = async () => {
    if (!selectedProjectId) return;
    setLoadingTeam(true);
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Execute TEAM WORKLOAD DASHBOARD protocol. Fetch team profiles and their assigned issues.', project_id: selectedProjectId })
      });
      const data = await res.json();
      const text = data.response;
      try {
        const fb = text.indexOf('{');
        const lb = text.lastIndexOf('}');
        if (fb !== -1 && lb !== -1) {
          const parsed = JSON.parse(text.substring(fb, lb + 1));
          if (parsed.team_dashboard) {
            setTeamResult(parsed.team_dashboard);
          } else {
            setTeamRawText(text);
          }
        } else {
          setTeamRawText(text);
        }
      } catch {
        setTeamRawText(text);
      }
    } catch (e) {
      setTeamRawText('Error connecting to Agent.');
    }
    setLoadingTeam(false);
  };

  const fetchSprintHistory = async () => {
    if (!selectedProjectId) return;
    setLoadingSprintHistory(true);
    try {
      const res = await fetch(`https://hackathon-030e.onrender.com/api/sprints/${selectedProjectId}`);
      const data = await res.json();
      setSprintHistory(data.sprints || []);
    } catch (err) {
      console.error('Failed to fetch sprint history', err);
    }
    setLoadingSprintHistory(false);
  };

  useEffect(() => {
    let sprintIntervalId: NodeJS.Timeout | null = null;
    
    if (activeTab === 'techlead' && selectedProjectId) {
      fetchTechReviews();
      const interval = setInterval(() => fetchTechReviews(), 15000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'sprint' && selectedProjectId) {
      fetchSprintHistory();
      // Fast polling (5s) for Sprint History to reflect automatic webhook updates (MR merge/Issue close)
      // This is cheap because it just reads a local JSON file, unlike the heavy GitLab API calls.
      sprintIntervalId = setInterval(() => {
        fetchSprintHistory();
      }, 5000);
    }
    if (activeTab === 'team' && selectedProjectId) {
      fetchTeamWorkload();
    }
    
    return () => {
      if (sprintIntervalId) clearInterval(sprintIntervalId);
    };
  }, [activeTab, selectedProjectId]);

  const handleSaveSprint = async () => {
    if (!sprintPlan || !selectedProjectId) return;
    setSavingSprint(true);
    try {
      let pureJson = sprintPlan;
      const jsonMatch = sprintPlan.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pureJson = jsonMatch[0];
      }
      await fetch(`https://hackathon-030e.onrender.com/api/sprints/${selectedProjectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprint_data: pureJson })
      });
      await fetchSprintHistory();
      setSprintPlan(null); // Clear after saving
    } catch (err) {
      console.error('Failed to save sprint', err);
    }
    setSavingSprint(false);
  };

  // ── Auto-Generate Next Sprint (Carryover Logic) ──────────────────────
  const [autoGeneratingSprintId, setAutoGeneratingSprintId] = useState<string | null>(null);
  
  const handleCompleteAndAutoGenerate = async (expiredSprint: any) => {
    if (!selectedProjectId || autoGeneratingSprintId) return;
    
    const sprintId = expiredSprint?.sprint_id;
    if (!sprintId) return;
    
    // Prevent duplicate auto-generations
    setAutoGeneratingSprintId(sprintId);
    setLoadingSprint(true);
    setSprintPlan('⚡ Sprint expired! AI is automatically generating the next Sprint with carryover tasks...');
    
    // Collect unchecked (incomplete) tasks from the expired sprint
    const carryoverTasks: string[] = [];
    if (expiredSprint.board) {
      expiredSprint.board.forEach((col: any) => {
        if (col.cards) {
          col.cards.forEach((card: any) => {
            if (!card.checked) {
              carryoverTasks.push(card.title);
            }
          });
        }
      });
    }
    
    let promptMsg = 'Execute SPRINT PROTOCOL.';
    
    if (carryoverTasks.length > 0) {
      promptMsg += ` [SYSTEM DIRECTIVE - CARRYOVER]: The previous Sprint has ENDED. The following ${carryoverTasks.length} tasks were NOT completed and MUST be carried over into this new Sprint. You MUST include ALL of them, tag each with a "CARRYOVER ⚠️" badge, and place them in P0 CRITICAL priority: ${JSON.stringify(carryoverTasks)}. Then fill the remaining capacity with new open issues from the backlog.`;
    } else {
      promptMsg += ' The previous Sprint was fully completed! Generate a fresh Sprint from the remaining open issues backlog.';
    }
    
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptMsg, project_id: selectedProjectId })
      });
      const data = await res.json();
      const sprintPlanResult = data.response || "";
      
      // Auto-save the new sprint
      let pureJson = sprintPlanResult;
      const jsonMatch = sprintPlanResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) pureJson = jsonMatch[0];
      
      await fetch(`https://hackathon-030e.onrender.com/api/sprints/${selectedProjectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprint_data: pureJson })
      });
      
      await fetchSprintHistory();
      setSprintPlan(null);
    } catch (e) {
      setSprintPlan('Error auto-generating next Sprint.');
    }
    setLoadingSprint(false);
    setAutoGeneratingSprintId(null);
  };

  const handleSyncSprint = async (sprint: any) => {
    if (!selectedProjectId) return;
    setSyncingSprintId(sprint.sprint_id);
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `Execute SPRINT SYNC PROTOCOL. Current sprint plan JSON: ${JSON.stringify(sprint)}`, 
          project_id: selectedProjectId 
        })
      });
      const data = await res.json();
      
      // Save the updated JSON back to history
      await fetch(`https://hackathon-030e.onrender.com/api/sprints/${selectedProjectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprint_data: data.response })
      });
      await fetchSprintHistory();
    } catch (err) {
      console.error('Failed to sync sprint', err);
    }
    setSyncingSprintId(null);
  };

  const fetchRoster = async () => {
    setLoadingRoster(true);
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/team');
      const data = await res.json();
      setRosterMembers(data.team || []);
    } catch (err) {
      console.error('Failed to fetch roster', err);
    }
    setLoadingRoster(false);
  };

  const handleEditClick = (dev: any) => {
    setEditingUsername(dev.username);
    setNewMember({
      name: dev.name,
      username: dev.username,
      github_username: dev.github_username || '',
      role: dev.role || '',
      skills: (dev.skills || []).join(', '),
      experience_level: dev.experience_level || 'Mid',
      availability: dev.availability || 'High'
    });
    setShowAddForm(true);
    setRosterError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAutoDetectSkills = async () => {
    const targetUsername = newMember.github_username || newMember.username;
    if (!targetUsername) return;
    
    setIsDetectingSkills(true);
    try {
      const res = await fetch(`https://hackathon-030e.onrender.com/api/github/${targetUsername}/skills`);
      if (res.ok) {
        const data = await res.json();
        if (data.skills && data.skills.length > 0) {
          setNewMember(prev => ({
            ...prev,
            skills: data.skills.join(', ')
          }));
        }
      }
    } catch (e) {
      console.error('Failed to auto-detect skills', e);
    }
    setIsDetectingSkills(false);
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim() || !newMember.username.trim()) return;
    setAddingMember(true);
    setRosterError(null);
    try {
      const method = editingUsername ? 'PUT' : 'POST';
      const url = editingUsername 
        ? `https://hackathon-030e.onrender.com/api/team/${editingUsername}` 
        : 'https://hackathon-030e.onrender.com/api/team';
        
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMember,
          skills: newMember.skills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        setRosterError(err.detail || 'Failed to save member.');
      } else {
        setNewMember({ name: '', username: '', github_username: '', role: 'Developer', skills: '', experience_level: 'Mid', availability: 'High' });
        setShowAddForm(false);
        setEditingUsername(null);
        fetchRoster();
      }
    } catch (e) {
      setRosterError('Network error. Is the backend running?');
    }
    setAddingMember(false);
  };

  const handleDeleteMember = async (username: string) => {
    setDeletingUsername(username);
    try {
      await fetch(`https://hackathon-030e.onrender.com/api/team/${username}`, { method: 'DELETE' });
      fetchRoster();
    } catch (e) {
      console.error('Failed to delete member', e);
    }
    setDeletingUsername(null);
  };

  // Auto-fetch roster when tab is activated
  useEffect(() => {
    if (activeTab === 'roster') fetchRoster();
    if (activeTab === 'standup') fetchStandupHistory();
  }, [activeTab, selectedProjectId]);

  const sidebarIcons = [
    { id: 'dashboard', icon: LayoutGrid, title: 'Dashboard' },
    { id: 'roster', icon: UserPlus, title: 'Company Roster' },
    { id: 'team', icon: Users, title: 'Team Workload' },
    { id: 'zerotoone', icon: Rocket, title: 'Launchpad' },
    { id: 'architect', icon: Zap, title: 'Auto-Architect' },
    { id: 'techlead', icon: Code, title: 'AI Tech Lead' },
    { id: 'standup', icon: CalendarDays, title: 'Standup Generator' },
    { id: 'issues', icon: Search, title: 'Issue Intelligence' },
    { id: 'sprint', icon: WalletCards, title: 'Sprint Planner' },
  ];

  const handleSendTerminal = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setMessages(prev => [...prev, { role: 'agent', content: 'Processing directive...' }]);
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, project_id: selectedProjectId })
      });
      const data = await res.json();
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'agent', content: data.response };
        return newMsgs;
      });
    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'agent', content: 'SYSTEM ERROR.' };
        return newMsgs;
      });
    }
  };

  const fetchStandupHistory = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`https://hackathon-030e.onrender.com/api/standups/${selectedProjectId}/history`);
      const data = await res.json();
      setStandupHistory(data.standups || []);
      // Auto-load today's standup if it exists and nothing is currently displayed
      if (!standupReport && data.standups?.length > 0) {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const todayEntry = data.standups.find((s: any) => s.date === today);
        if (todayEntry) {
          setStandupReport(todayEntry.report);
          setSelectedStandupDate(todayEntry.date);
        }
      }
    } catch (e) { console.error('Failed to fetch standup history', e); }
  };

  const saveStandup = async (report: string) => {
    if (!selectedProjectId) return;
    setSavingStandup(true);
    try {
      await fetch(`https://hackathon-030e.onrender.com/api/standups/${selectedProjectId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });
      // Refresh the history after saving
      await fetchStandupHistory();
    } catch (e) { console.error('Failed to save standup', e); }
    setSavingStandup(false);
  };

  const handleGenerateStandup = async () => {
    setLoadingStandup(true);
    setSelectedStandupDate(null);
    setStandupReport('Executing STANDUP GENERATOR protocol...');
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Execute STANDUP GENERATOR protocol. Generate a strict Activity Report. IMPORTANT: 1. Convert all GitLab UTC timestamps to UTC+8 (Malaysia Time) before filtering for today. 2. You MUST include every single team member in the JSON array, even if they have absolutely NO activity today. 3. Werd How (howwerd0898) and Jun Hao INTI (JunnnHaoooo) are COMPLETELY SEPARATE accounts, do NOT merge them! 4. Merge JunHaoGitHub into Werd How. 5. STRICTLY use the `closed_by` field to determine who closed an issue, not the assignees.', project_id: selectedProjectId })
      });
      const data = await res.json();
      setStandupReport(data.response);
      // Auto-save immediately after successful generation
      if (data.response && !data.response.startsWith('Error')) {
        await saveStandup(data.response);
      }
    } catch (e) {
      setStandupReport('Error connecting to Agent.');
    }
    setLoadingStandup(false);
  };

  const handleSearchIssue = async () => {
    if (!issueQuery) return;
    setLoadingIssue(true);
    setIssueResult('Executing ISSUE INTEL protocol...');
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Execute ISSUE INTEL protocol for: ${issueQuery}`, project_id: selectedProjectId })
      });
      const data = await res.json();
      setIssueResult(data.response);
    } catch (e) {
      setIssueResult('Error connecting to Agent.');
    }
    setLoadingIssue(false);
  };

  const handleGenerateSprint = async () => {
    setLoadingSprint(true);
    setSprintPlan('Executing SPRINT PROTOCOL...');
    
    let promptMsg = 'Execute SPRINT PROTOCOL.';
    if (sprintHistory && sprintHistory.length > 0) {
      const activeTasks: string[] = [];
      let hasExpiredSprints = false;

      sprintHistory.forEach((sprint: any) => {
        const isActive = (Date.now() - (sprint.created_at * 1000)) < (7 * 24 * 60 * 60 * 1000);
        if (isActive) {
          if (sprint.board) {
            sprint.board.forEach((col: any) => {
              if (col.cards) {
                col.cards.forEach((card: any) => {
                  if (!card.checked) activeTasks.push(card.title);
                });
              }
            });
          }
        } else {
          hasExpiredSprints = true;
        }
      });

      if (activeTasks.length > 0) {
        promptMsg += ` IMPORTANT: There are active Sprints currently running. You MUST NOT include the following tasks in the new sprint plan because they are already scheduled: ${JSON.stringify(activeTasks)}. Select completely different open issues.`;
      }
      
      if (hasExpiredSprints) {
        promptMsg += ` Additionally, previous Sprints have ended. If there are any open issues that were NOT completed in those expired Sprints, you SHOULD prioritize them and ROLL THEM OVER into this new Sprint.`;
      }
    }

    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptMsg, project_id: selectedProjectId })
      });
      const data = await res.json();
      const sprintOutput = data.response;
      
      // Auto-save logic
      let pureJson = sprintOutput;
      const jsonMatch = sprintOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pureJson = jsonMatch[0];
      }
      
      if (pureJson && pureJson.includes('sprint_capacity_hours')) {
         await fetch(`https://hackathon-030e.onrender.com/api/sprints/${selectedProjectId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sprint_data: pureJson })
         });
         await fetchSprintHistory();
         setSprintPlan(null); // Clear the temporary text box since it's saved and now in history
      } else {
         setSprintPlan(sprintOutput); // Just show the text if it's not valid JSON
      }
    } catch (e) {
      setSprintPlan('Error connecting to Agent.');
    }
    setLoadingSprint(false);
  };

  const handleArchitect = async () => {
    if (!architectIdea) return;
    setLoadingArchitect(true);
    setArchitectResult('Executing FEATURE ARCHITECT protocol...\nAutonomously analyzing request and writing to GitLab repository...');
    try {
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Execute FEATURE ARCHITECT protocol for: ${architectIdea}`, project_id: selectedProjectId })
      });
      const data = await res.json();
      setArchitectResult(data.response);
      setArchitectIdea('');
    } catch (e) {
      setArchitectResult('Error connecting to Agent.');
    }
    setLoadingArchitect(false);
  };

  const handleZeroToOne = async () => {
    if (!zeroIdea) return;
    setLoadingZero(true);
    setZeroResult(null);
    setZeroRawText(null);
    setZeroProgress(['⏳ Initiating LAUNCHPAD protocol...', '🔄 Agent is creating repository...']);
    
    // Simulate progress updates
    const progressTimer1 = setTimeout(() => setZeroProgress(p => [...p, '📦 Scaffolding project framework...']), 6000);
    const progressTimer2 = setTimeout(() => setZeroProgress(p => [...p, '🚀 Pushing skeleton to GitLab...']), 12000);
    const progressTimer3 = setTimeout(() => setZeroProgress(p => [...p, '👥 Inviting core team members...']), 18000);
    const progressTimer4 = setTimeout(() => setZeroProgress(p => [...p, '📋 Creating backlog issues...']), 24000);
    
    try {
      const controller = new AbortController();
      zeroAbortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 300s max wait
      
      const res = await fetch('https://hackathon-030e.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Execute ZERO TO ONE protocol for: ${zeroIdea}`, project_id: selectedProjectId, stream_output: true }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setZeroRawText(fullText.split('__FINAL_JSON__')[0]);
      }
      
      const parts = fullText.split('__FINAL_JSON__');
      const jsonText = parts.length > 1 ? parts[1] : parts[0];
      
      // Try to extract zero_to_one JSON
      try {
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const parsed = JSON.parse(jsonText.substring(firstBrace, lastBrace + 1));
          if (parsed.zero_to_one) {
            setZeroResult(parsed.zero_to_one);
            
            const newProjectId = parsed.zero_to_one.project_id || selectedProjectId;
            if (parsed.zero_to_one.project_id) {
               await fetchProjects();
               setTimeout(() => { setSelectedProjectId(newProjectId.toString()); }, 500);
            }

            // --- NEW: Automatically run Sprint Planner and save it ---
            setZeroProgress(p => [...p, '🚀 🏃‍♂️ Executing Sprint Planner...']);
            try {
              const sprintController = new AbortController();
              const sprintTimeout = setTimeout(() => sprintController.abort(), 300000);
              
              const sprintRes = await fetch('https://hackathon-030e.onrender.com/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Execute SPRINT PROTOCOL.', project_id: newProjectId }),
                signal: sprintController.signal
              });
              clearTimeout(sprintTimeout);
              
              const sprintData = await sprintRes.json();
              const sprintPlanResult = sprintData.response || "";
              
              setZeroProgress(p => [...p, '💾 Saving Sprint Plan to Database...']);
              let pureJson = sprintPlanResult;
              const jsonMatch = sprintPlanResult.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
              if (jsonMatch) {
                pureJson = jsonMatch[1];
              } else {
                const match2 = sprintPlanResult.match(/\{[\s\S]*\}/);
                if (match2) pureJson = match2[0];
              }
              
              await fetch(`https://hackathon-030e.onrender.com/api/sprints/${newProjectId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sprint_data: pureJson })
              });
              
              setZeroProgress(p => [...p, '✅ Launchpad & Sprint Planning Complete!']);
            } catch (sprintErr) {
              console.error("Sprint planner failed during Launchpad", sprintErr);
              setZeroProgress(p => [...p, '⚠️ Sprint Planner failed, but Launchpad completed.']);
            }
            // ---------------------------------------------------------
            
          } else {
            setZeroRawText(jsonText);
          }
        } else {
          setZeroRawText(jsonText);
        }
      } catch {
        setZeroRawText(jsonText);
      }
      setZeroIdea('');
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setZeroRawText('Agent process aborted by user.');
      } else {
        setZeroRawText('Error connecting to Agent.');
      }
    }
    zeroAbortControllerRef.current = null;
    clearTimeout(progressTimer1);
    clearTimeout(progressTimer2);
    clearTimeout(progressTimer3);
    clearTimeout(progressTimer4);
    setZeroProgress([]);
    setLoadingZero(false);
  };

  return (
    <div className="min-h-screen bg-transparent flex text-text-primary font-sans p-4 gap-4">
      
      {/* Premium Sidebar */}
      <aside className="w-56 flex flex-col bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl shrink-0 h-[calc(100vh-32px)] sticky top-4 overflow-hidden">
        {/* Logo / Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center shadow-lg shadow-accent/20">
              <BrainCircuit className="w-4.5 h-4.5 text-background" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary leading-none">OmniLead</h2>
              <p className="text-[10px] text-text-tertiary mt-0.5">AI Command Center</p>
            </div>
          </div>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
          {/* Overview */}
          <div>
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-[0.15em] px-2 mb-2">Overview</p>
            <div className="space-y-0.5">
              {[
                { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
                { id: 'roster', icon: UserPlus, label: 'Company Roster' },
                { id: 'team', icon: Users, label: 'Team Workload' },
              ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-accent/15 text-accent border border-accent/20 shadow-sm shadow-accent/5'
                      : 'text-text-secondary hover:text-text-primary hover:bg-border/30 border border-transparent'
                  }`}>
                  <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} strokeWidth={activeTab === item.id ? 2.5 : 1.8} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Agents */}
          <div>
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-[0.15em] px-2 mb-2">AI Agents</p>
            <div className="space-y-0.5">
              {[
                { id: 'zerotoone', icon: Rocket, label: 'Launchpad' },
                { id: 'architect', icon: Zap, label: 'Auto-Architect' },
                { id: 'techlead', icon: Code, label: 'Tech Lead' },
              ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-accent/15 text-accent border border-accent/20 shadow-sm shadow-accent/5'
                      : 'text-text-secondary hover:text-text-primary hover:bg-border/30 border border-transparent'
                  }`}>
                  <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} strokeWidth={activeTab === item.id ? 2.5 : 1.8} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Planning */}
          <div>
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-[0.15em] px-2 mb-2">Planning</p>
            <div className="space-y-0.5">
              {[
                { id: 'standup', icon: CalendarDays, label: 'Daily Standup' },
                { id: 'sprint', icon: WalletCards, label: 'Sprint Planner' },
                { id: 'issues', icon: Search, label: 'Issue Intel' },
                { id: 'releases', icon: Package, label: 'Release Notes' },
              ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-accent/15 text-accent border border-accent/20 shadow-sm shadow-accent/5'
                      : 'text-text-secondary hover:text-text-primary hover:bg-border/30 border border-transparent'
                  }`}>
                  <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} strokeWidth={activeTab === item.id ? 2.5 : 1.8} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom Status */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50"></div>
            <span className="text-[10px] text-text-tertiary font-medium">Agent Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent/50 relative z-10 p-6 md:p-8">
        
        {/* Top Navigation & Project Selector */}
        <div className="flex justify-between items-center mb-8 relative z-30">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent via-indigo-400 to-indigo-400 flex items-center gap-3">
              <span className="bg-accent/10 p-2 rounded-xl border border-accent/20">
                <Rocket className="w-6 h-6 text-accent" />
              </span>
              OmniLead
            </h1>
            <p className="text-sm text-text-secondary mt-2 font-medium">AI-Powered GitLab Project Management & Architecture</p>
          </div>
          
          <div className="relative">
            <div 
              onClick={() => {
                if (activeTab === 'dashboard') {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              className={`flex items-center gap-3 bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 p-2.5 rounded-xl backdrop-blur-md transition-all min-w-[320px] ${
                activeTab === 'dashboard' 
                  ? 'cursor-pointer hover:border-accent/50 shadow-lg' 
                  : 'cursor-not-allowed opacity-70'
              }`}
              title={activeTab === 'dashboard' ? 'Switch Target Project' : 'Project switching is only allowed on the Dashboard tab'}
            >
              <div className="bg-accent/10 p-1.5 rounded-lg border border-accent/20 shrink-0">
                <GitBranch className="w-5 h-5 text-accent" />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-[10px] font-bold text-accent/70 uppercase tracking-widest mb-0.5">Target Project</span>
                <span className="text-sm font-semibold text-text-primary truncate">
                  {projects.length === 0 
                    ? 'No Active Projects' 
                    : (projects.find(p => p.id === selectedProjectId)?.name_with_namespace || 'Loading projects...')}
                </span>
              </div>
              {activeTab === 'dashboard' && projects.length > 0 && (
                <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </div>

            {/* Custom Dropdown Menu */}
            {isDropdownOpen && activeTab === 'dashboard' && projects.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-full min-w-[360px] bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {projects.length === 0 && (
                    <div className="p-3 text-sm text-text-tertiary text-center">No projects found.</div>
                  )}
                  {projects.map(p => {
                    const isSelected = p.id === selectedProjectId;
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 rounded-lg flex flex-col cursor-pointer transition-all ${isSelected ? 'bg-accent/10 border border-accent/30' : 'hover:bg-transparent border border-transparent'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${p.type === 'Personal' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                            {p.type}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-accent" />}
                        </div>
                        <span className={`text-sm truncate ${isSelected ? 'text-accent font-bold' : 'text-text-primary font-medium'}`}>
                          {p.name_with_namespace}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-full flex flex-col relative z-20">
        
        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          
          {/* LOADING STATE */}
          {loadingProjects && (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-surface border-t-accent animate-spin shadow-[0_0_15px_rgba(var(--accent),0.3)]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent animate-pulse drop-shadow-md" />
                </div>
              </div>
              <p className="mt-8 text-text-secondary font-semibold tracking-[0.2em] animate-pulse text-xs uppercase">Initializing Agent Connection</p>
            </div>
          )}

          {/* EMPTY STATE FOR PROJECT-DEPENDENT TABS */}
          {!loadingProjects && projects.length === 0 && ['dashboard', 'standup', 'issues', 'sprint', 'architect', 'techlead', 'releases', 'team'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#18181b] border border-white/5 rounded-3xl p-10 max-w-lg w-full text-center shadow-xl relative overflow-hidden flex-shrink-0">
                
                <div className="w-20 h-20 mx-auto mb-6 bg-[#0c0c0e]/60 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/5 shadow-sm">
                  <FolderGit2 className="w-10 h-10 text-text-secondary" />
                </div>
                
                <h2 className="text-2xl font-bold text-text-primary mb-3">No Active Projects</h2>
                <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                  Your workspace is clean. It's time to build something new. Use the Agent's Launchpad capability to transform an idea into a fully scaffolded GitLab repository, complete with assigned issues and a team.
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setActiveTab('zerotoone')}
                    className="w-full py-3.5 bg-accent text-background font-bold rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5"
                  >
                    <Rocket className="w-5 h-5" />
                    Go to Launchpad
                  </button>
                  <button 
                    onClick={() => setActiveTab('roster')}
                    className="w-full py-3.5 bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 text-text-primary font-bold rounded-xl hover:border-blue-500/50 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5 text-blue-400" />
                    Setup Talent Pool First
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && projects.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
              {/* Top Left: Main Metrics & Breakdown */}
              <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col min-h-[340px]">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Project Health Score</h2>
                    <p className="text-xs text-text-secondary">AI-calculated repository health and velocity.</p>
                  </div>
                  <button 
                    onClick={() => fetchDashboardMetrics(selectedProjectId)}
                    disabled={isLoadingMetrics}
                    className="px-4 py-2 bg-accent/10 border border-accent/20 text-accent font-semibold text-sm rounded-lg hover:bg-accent hover:text-background transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingMetrics ? <Activity className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    {isLoadingMetrics ? 'Syncing...' : 'Sync Status'}
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
                  {/* SVG Ring */}
                  <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" className="stroke-surface/50" strokeWidth="8" fill="none" />
                      {dashboardMetrics && (
                        <circle 
                          cx="50" cy="50" r="40" 
                          className={`transition-all duration-1000 ease-out ${dashboardMetrics.health_score >= 70 ? 'stroke-accent' : dashboardMetrics.health_score >= 50 ? 'stroke-yellow-400' : 'stroke-red-400'}`} 
                          strokeWidth="8" 
                          strokeDasharray={251.2} 
                          strokeDashoffset={251.2 - (dashboardMetrics.health_score / 100) * 251.2} 
                          strokeLinecap="round" 
                          fill="none" 
                        />
                      )}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold font-mono tracking-tight text-text-primary">
                        {dashboardMetrics ? dashboardMetrics.health_score : '--'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Score Breakdown */}
                  <div className="flex-1 w-full bg-[#0c0c0e]/60 backdrop-blur-xl rounded-xl p-4 border border-white/5">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Score Analysis</h3>
                    {isLoadingMetrics && !dashboardMetrics ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-[#0c0c0e]/60 backdrop-blur-xl rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-[#0c0c0e]/60 backdrop-blur-xl rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-[#0c0c0e]/60 backdrop-blur-xl rounded w-5/6 animate-pulse"></div>
                      </div>
                    ) : dashboardMetrics?.score_breakdown ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center text-text-primary">
                          <span className="text-text-secondary">Base Score</span>
                          <span className="font-mono">+{dashboardMetrics.score_breakdown.base_score}</span>
                        </div>
                        <div className="flex justify-between items-center text-green-400">
                          <span>Completion Rate Bonus</span>
                          <span className="font-mono">+{dashboardMetrics.score_breakdown.completion_bonus}</span>
                        </div>
                        {dashboardMetrics.score_breakdown.blocker_penalty > 0 && (
                          <div className="flex justify-between items-center text-red-400">
                            <span>Blockers Penalty</span>
                            <span className="font-mono">-{dashboardMetrics.score_breakdown.blocker_penalty}</span>
                          </div>
                        )}
                        {dashboardMetrics.score_breakdown.mr_penalty > 0 && (
                          <div className="flex justify-between items-center text-blue-400">
                            <span>Open MR Bottleneck</span>
                            <span className="font-mono">-{dashboardMetrics.score_breakdown.mr_penalty}</span>
                          </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center font-bold">
                          <span className={dashboardMetrics.health_score >= 70 ? 'text-accent' : dashboardMetrics.health_score >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                            {dashboardMetrics.status_text}
                          </span>
                          <span className="font-mono text-text-primary">{dashboardMetrics.health_score} / 100</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-text-tertiary">No breakdown available.</div>
                    )}
                  </div>
                </div>
                {/* Metric Sub-cards */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div className="bg-transparent rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-secondary flex items-center gap-2 font-semibold">
                        <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />
                        Open MRs
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono">
                      {dashboardMetrics ? dashboardMetrics.open_mrs_count : '-'}
                    </div>
                  </div>
                  <div className="bg-transparent rounded-xl p-4 border border-white/5 hover:border-red-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-secondary flex items-center gap-2 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        Blockers
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-red-100">
                      {dashboardMetrics ? dashboardMetrics.blockers_count : '-'}
                    </div>
                  </div>
                  <div className="bg-transparent rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-secondary flex items-center gap-2 font-semibold">
                        <Activity className="w-3.5 h-3.5 text-blue-400" />
                        Open Issues
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-blue-100">
                      {dashboardMetrics ? dashboardMetrics.open_issues_count : '-'}
                    </div>
                  </div>
                  <div className="bg-transparent rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-secondary flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        Closed Issues
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-green-100">
                      {dashboardMetrics ? dashboardMetrics.closed_issues_count : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Right: Agent Terminal */}
              <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col p-0 overflow-hidden min-h-[340px]">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0c0c0e]/60 backdrop-blur-xl">
                  <h2 className="text-sm font-semibold">Agent Command Center</h2>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    <span className="text-[10px] text-text-secondary font-mono uppercase">Online</span>
                  </div>
                </div>
                <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-transparent/30 font-mono text-xs">
                  {messages.map((msg, i) => (
                    <div key={i} className="flex gap-3 text-text-secondary">
                      <span className="text-accent shrink-0">{msg.role === 'user' ? 'YOU' : '>'}</span>
                      <p className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-accent' : ''}`}>{msg.content}</p>
                    </div>
                  ))}
                  <div className="mt-auto">
                     <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-lg p-3 flex items-center gap-3">
                       <span className="text-accent font-bold">{">"}</span>
                       <input 
                         type="text" 
                         value={input}
                         onChange={(e) => setInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleSendTerminal()}
                         placeholder="Ask agent to check MRs..." 
                         className="bg-transparent border-none outline-none w-full text-text-primary placeholder:text-text-tertiary"
                       />
                     </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Recent Activity Feed (Terminal Log) */}
              {dashboardMetrics && (dashboardMetrics.recent_issues?.length > 0 || dashboardMetrics.recent_mrs?.length > 0) && (
                (() => {
                  const combinedActivity = [
                    ...(dashboardMetrics.recent_issues || []).flatMap((i: any) => {
                      const events = [{ type: 'ISSUE', data: { ...i, activity_time: i.created_at, action_word: 'opened' } }];
                      if (i.state === 'closed') {
                        events.push({ type: 'ISSUE', data: { ...i, activity_time: i.closed_at || i.created_at, action_word: 'closed' } });
                      }
                      return events;
                    }),
                    ...(dashboardMetrics.recent_mrs || []).flatMap((m: any) => {
                      const events = [{ type: 'MR', data: { ...m, activity_time: m.created_at, action_word: 'opened' } }];
                      if (m.state === 'merged') {
                        events.push({ type: 'MR', data: { ...m, activity_time: m.merged_at || m.created_at, action_word: 'merged' } });
                      } else if (m.state === 'closed') {
                        events.push({ type: 'MR', data: { ...m, activity_time: m.closed_at || m.created_at, action_word: 'closed' } });
                      }
                      return events;
                    })
                  ].sort((a, b) => new Date(b.data.activity_time).getTime() - new Date(a.data.activity_time).getTime());
                  
                  return (
                    <div className="xl:col-span-2 flex flex-col mt-4 w-full animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                      <div className="bg-[#1a1a1a] border border-white/5 border-b-0 rounded-t-xl px-4 py-2.5 flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                          <div className="w-3 h-3 rounded-full bg-sky-500/80"></div>
                          <div className="w-3 h-3 rounded-full bg-blue-500/80"></div>
                        </div>
                        <span className="text-xs font-mono text-text-tertiary">agent@cmd:~/repo/activity-log</span>
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-b-xl overflow-hidden shadow-2xl p-4 font-mono text-xs flex flex-col h-[400px] overflow-y-auto custom-scrollbar">
                        {combinedActivity.map((event, idx) => {
                          const dateObj = new Date(event.data.activity_time);
                          const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                          
                          const isIssue = event.type === 'ISSUE';
                          const tagColor = isIssue ? 'text-sky-400' : 'text-indigo-400';
                          const tagText = isIssue ? 'ISSUE' : ' MR  ';
                          const idPrefix = isIssue ? '#' : '!';
                          const actionWord = event.data.action_word;
                          
                                  const actionColor = actionWord === 'opened' ? 'text-green-400' : actionWord === 'closed' ? 'text-red-400' : actionWord === 'merged' ? 'text-purple-400' : 'text-text-tertiary';
                                  
                                  return (
                                    <a 
                                      key={idx} 
                                      href={event.data.web_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="group flex flex-wrap md:flex-nowrap items-start md:items-center gap-x-3 gap-y-1 py-1.5 px-2 rounded hover:bg-white/5 transition-colors text-text-secondary"
                                    >
                                      <span className="text-text-tertiary/60 shrink-0 select-none">[{dateStr}]</span>
                                      <span className={`shrink-0 select-none font-bold ${tagColor}`}>[{tagText}]</span>
                                      <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                                        <span className="text-blue-400 shrink-0">@{event.data.author}</span>
                                        <span className={`shrink-0 select-none font-medium ${actionColor}`}>{actionWord}</span>
                                <span className={`${tagColor} font-bold shrink-0`}>{idPrefix}{event.data.iid}:</span>
                                <span className="text-text-primary group-hover:text-white transition-colors truncate">{event.data.title}</span>
                              </div>
                            </a>
                          );
                        })}
                        <div className="mt-4 flex items-center gap-2 px-2 animate-pulse text-text-tertiary select-none">
                          <span className="text-blue-400">➜</span>
                          <span className="text-indigo-400">~</span>
                          <span className="w-2 h-4 bg-text-primary/70 inline-block" />
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* TAB: STANDUP */}
          {activeTab === 'standup' && projects.length > 0 && (
            <div className="dashboard-card min-h-[500px] flex flex-col">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-xl font-semibold text-text-primary">Automated Standup</h2>
                   <p className="text-sm text-text-secondary">Synthesizes recent commits and MRs into a team report. Auto-saves daily.</p>
                 </div>
                 <div className="flex items-center gap-2">
                   {savingStandup && <span className="text-xs text-blue-400 animate-pulse">💾 Saving...</span>}
                   <button 
                     onClick={handleGenerateStandup}
                     disabled={loadingStandup}
                     className="px-4 py-2 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
                   >
                     <Bot className="w-4 h-4" />
                     {loadingStandup ? 'Generating...' : 'Generate Report'}
                   </button>
                 </div>
               </div>
               
               <div className="flex flex-1 gap-4 overflow-hidden">
                 {/* History Sidebar */}
                 <div className="w-48 shrink-0 flex flex-col bg-background/50 border border-border rounded-xl overflow-hidden">
                   <div className="px-3 py-2 border-b border-border">
                     <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">History</span>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar">
                     {standupHistory.length === 0 ? (
                       <div className="p-3 text-xs text-text-tertiary">No saved standups yet.</div>
                     ) : (
                       standupHistory.map((entry: any) => (
                         <button
                           key={entry.date}
                           onClick={() => { setStandupReport(entry.report); setSelectedStandupDate(entry.date); }}
                           className={`w-full text-left px-3 py-2.5 text-xs border-b border-border/50 transition-colors hover:bg-surface ${
                             selectedStandupDate === entry.date ? 'bg-accent/10 text-accent font-bold border-l-2 border-l-accent' : 'text-text-secondary'
                           }`}
                         >
                           <div className="font-mono">{entry.date}</div>
                           <div className="text-[10px] text-text-tertiary mt-0.5">Saved {new Date(entry.saved_at).toLocaleTimeString()}</div>
                         </button>
                       ))
                     )}
                   </div>
                 </div>

                 {/* Report Display */}
                 <div className="flex-1 bg-transparent border border-border rounded-xl p-6 overflow-y-auto custom-scrollbar">
                    {standupReport ? <StandupRenderer text={standupReport} /> : <span className="text-text-tertiary font-mono text-sm">No standup generated yet. Click the button above to execute the protocol.</span>}
                 </div>
               </div>
            </div>
          )}

          {/* TAB: ISSUES */}
          {activeTab === 'issues' && projects.length > 0 && (
            <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] min-h-[500px] flex flex-col">
               <div className="mb-6">
                 <h2 className="text-xl font-semibold text-text-primary mb-2">Issue Intelligence</h2>
                 <p className="text-sm text-text-secondary mb-4">Deep dive into any issue to aggregate context, blocking MRs, and related code.</p>
                 
                 <div className="flex gap-3 max-w-xl">
                   <input 
                     type="text"
                     value={issueQuery}
                     onChange={(e) => setIssueQuery(e.target.value)}
                     placeholder="Enter Issue # (e.g. #42) or keywords..."
                     className="flex-1 bg-transparent border border-white/5 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                   />
                   <button 
                     onClick={handleSearchIssue}
                     disabled={loadingIssue}
                     className="px-6 py-2 bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 hover:border-accent text-text-primary font-semibold rounded-lg transition-colors"
                   >
                     Analyze
                   </button>
                 </div>
               </div>
               
               <div className="flex-1 bg-transparent border border-white/5 rounded-xl p-6 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                  {issueResult || <span className="text-text-tertiary">Agent context output will appear here.</span>}
               </div>
            </div>
          )}

          {/* TAB: SPRINT */}
          {activeTab === 'sprint' && projects.length > 0 && (
            <div className="flex flex-col gap-6 pb-6">


              {/* Sprint History Section */}
              {loadingSprintHistory && sprintHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in duration-500">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-surface border-t-accent animate-spin shadow-[0_0_15px_rgba(var(--accent),0.3)]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-accent animate-pulse drop-shadow-md" />
                    </div>
                  </div>
                  <p className="mt-8 text-text-secondary font-semibold tracking-[0.2em] animate-pulse text-xs uppercase">Loading Sprint History...</p>
                </div>
              ) : sprintHistory.length > 0 ? (
                <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-accent" />
                    Saved Sprints & Checklists
                    {loadingSprintHistory && <Activity className="w-4 h-4 text-accent animate-spin ml-2" />}
                  </h3>
                  <div className="flex flex-col gap-6">
                    {sprintHistory.map((sprint, idx) => (
                      <div key={idx} className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5 overflow-hidden flex flex-col shadow-sm">
                        <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4">
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-bold text-text-primary text-lg">Sprint {sprintHistory.length - idx}</h4>
                              <SprintCountdown createdAt={sprint.created_at} onExpired={() => handleCompleteAndAutoGenerate(sprint)} />
                            </div>
                            <p className="text-xs text-text-secondary font-mono mt-1">{new Date(sprint.created_at * 1000).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCompleteAndAutoGenerate(sprint)}
                              disabled={autoGeneratingSprintId === sprint.sprint_id || loadingSprint}
                              className={`px-3 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                                autoGeneratingSprintId === sprint.sprint_id
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/50 cursor-not-allowed'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                              }`}
                            >
                              <Zap className={`w-4 h-4 ${autoGeneratingSprintId === sprint.sprint_id ? 'animate-pulse' : ''}`} />
                              {autoGeneratingSprintId === sprint.sprint_id ? 'Auto-Planning...' : 'Complete & Auto-Plan Next'}
                            </button>
                          </div>
                        </div>
                        <div className="h-[450px] overflow-y-auto custom-scrollbar">
                          <AgentOutputCardRenderer inputBoardData={sprint} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center min-h-[400px]">
                  <div className="text-center max-w-md">
                    <CalendarDays className="w-16 h-16 text-text-tertiary opacity-20 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-text-primary mb-2">No Sprints Yet</h3>
                    <p className="text-sm text-text-secondary mb-8">
                      Generate your first AI-powered Sprint to automatically plan, assign, and track tasks based on your GitLab issues.
                    </p>
                    <button 
                      onClick={handleGenerateSprint}
                      disabled={loadingSprint}
                      className="px-6 py-3 bg-accent text-background font-bold rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-2 mx-auto shadow-lg shadow-accent/20"
                    >
                      {loadingSprint ? (
                        <span className="animate-pulse">Generating Sprint...</span>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Generate First Sprint
                        </>
                      )}
                    </button>
                    {sprintPlan && (
                      <div className="mt-6 bg-transparent border border-white/5 rounded-xl p-4 text-left overflow-y-auto max-h-[300px] custom-scrollbar">
                        <AgentOutputCardRenderer text={sprintPlan} />
                        <button
                          onClick={handleSaveSprint}
                          disabled={savingSprint}
                          className="mt-4 w-full px-4 py-2 bg-accent/20 text-accent border border-accent/30 font-semibold rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          {savingSprint ? 'Saving...' : 'Save Sprint'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: ARCHITECT */}
          {activeTab === 'architect' && projects.length > 0 && (
            <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] min-h-[500px] flex flex-col">
               <div className="mb-6">
                 <div className="flex items-center gap-3 mb-2">
                   <Zap className="w-6 h-6 text-yellow-400" />
                   <h2 className="text-xl font-semibold text-text-primary">Auto-Architect</h2>
                 </div>
                 <p className="text-sm text-text-secondary mb-4">Input a feature idea. The Agent will autonomously decompose it and write actual tasks directly into your GitLab repository.</p>
                 
                 <div className="flex flex-col gap-3 w-full">
                   <textarea 
                     value={architectIdea}
                     onChange={(e) => setArchitectIdea(e.target.value)}
                     placeholder="e.g. Add a Web3 crypto wallet login..."
                     className="w-full bg-transparent border border-white/5 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent resize-y min-h-[120px]"
                     onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleArchitect(); } }}
                   />
                   <div className="flex justify-end">
                     <button 
                       onClick={handleArchitect}
                       disabled={loadingArchitect}
                       className="px-6 py-2 bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-400/30 font-semibold rounded-lg transition-colors flex items-center gap-2"
                     >
                       {loadingArchitect ? <span className="animate-pulse">Building...</span> : 'Execute'}
                     </button>
                   </div>
                 </div>
               </div>
               
               <div className="flex-1 bg-transparent border border-white/5 rounded-xl p-6 overflow-hidden flex flex-col relative">
                 {architectResult ? (
                   <AgentOutputCardRenderer text={architectResult} />
                 ) : (
                   <div className="m-auto text-center flex flex-col items-center gap-4 text-text-tertiary">
                     <Zap className="w-12 h-12 opacity-20" />
                     <p>Agent is standing by for architectural directives.</p>
                   </div>
                 )}
               </div>
            </div>
          )}

                    {/* TAB: TECH LEAD */}
          {activeTab === 'techlead' && projects.length > 0 && (
            <div className="flex flex-col gap-6 h-full pb-6">
              <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-3">
                      <Code className="w-6 h-6 text-indigo-400" /> AI Tech Lead Review
                    </h2>
                    <p className="text-sm text-text-secondary">Automated code reviews triggered by AI Git Watcher. Auto-refreshes every 15s.</p>
                  </div>
                  <button onClick={fetchTechReviews} className="px-4 py-2 bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 hover:border-accent text-text-primary text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${loadingReviews ? 'animate-spin text-accent' : ''}`} /> Refresh History
                  </button>
                </div>

                <div className="flex-1 bg-[#121214] border border-white/5 rounded-xl p-6 overflow-y-auto custom-scrollbar">
                  {techReviews.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-tertiary">
                      <CheckCheck className="w-12 h-12 opacity-20 mb-4" />
                      <p>No code reviews found. Open a Merge Request in GitLab to trigger the Tech Lead!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {techReviews.map((rev: any, idx: number) => {
                        const statusColor = 
                          rev.review?.status === 'APPROVED' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                          rev.review?.status === 'REJECTED' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                          'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';

                        return (
                          <div key={idx} className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-white/5 flex justify-between items-start bg-[#0c0c0e]/60 backdrop-blur-xl">
                              <div>
                                <h3 className="font-bold text-text-primary text-lg">MR #{rev.mr_iid}: {rev.mr_title}</h3>
                                <p className="text-xs text-text-secondary mt-1">{new Date(rev.created_at * 1000).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {rev.review?.auto_fixed && (
                                  <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 flex items-center gap-1">
                                    <Wrench className="w-3 h-3" /> AUTO-FIXED {rev.review?.fix_commit && <span className="font-mono opacity-70">({rev.review.fix_commit})</span>}
                                  </span>
                                )}
                                <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wider border ${statusColor}`}>
                                  {rev.review?.status || 'UNKNOWN'}
                                </span>
                              </div>
                            </div>
                            <div className="p-5">
                              <p className="text-sm text-text-primary leading-relaxed mb-4">{rev.review?.summary}</p>
                              {rev.review?.feedback && rev.review.feedback.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Feedback</h4>
                                  {rev.review.feedback.map((fb: any, fidx: number) => (
                                    <div key={fidx} className="bg-[#18181b] border border-white/5 rounded-lg p-3">
                                      <div className="text-xs font-mono text-accent mb-2">{fb.file}</div>
                                      <p className="text-sm text-text-secondary">{fb.comment}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LAUNCHPAD */}
          {activeTab === 'zerotoone' && (
            <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] min-h-[500px] flex flex-col">
               <div className="mb-6">
                 <div className="flex items-center gap-3 mb-2">
                   <Rocket className="w-6 h-6 text-indigo-400" />
                   <h2 className="text-xl font-semibold text-text-primary">Launchpad</h2>
                   <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">Full Lifecycle</span>
                 </div>
                 <p className="text-sm text-text-secondary mb-4">Describe a project idea. The Agent will autonomously <strong>create a repository</strong>, <strong>plan the backlog</strong>, <strong>write starter code</strong>, and <strong>open a Merge Request</strong> — all in one shot.</p>
                 
                 <div className="flex flex-col gap-3 w-full">
                   <textarea 
                     value={zeroIdea}
                     onChange={(e) => setZeroIdea(e.target.value)}
                     disabled={loadingZero}
                     placeholder="e.g. Build a real-time chat app with WebSocket support..."
                     className={`w-full bg-transparent border border-white/5 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-indigo-400 text-sm resize-y min-h-[120px] ${loadingZero ? 'opacity-50 cursor-not-allowed' : ''}`}
                     onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleZeroToOne(); } }}
                   />
                   <div className="flex justify-end gap-3 mt-3">
                     {loadingZero && (
                       <button 
                         onClick={abortZeroToOne}
                         className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 font-semibold rounded-lg transition-colors flex items-center gap-2"
                       >
                         <AlertCircle className="w-4 h-4" /> Emergency Abort AI
                       </button>
                     )}
                     <button 
                       onClick={handleZeroToOne}
                       disabled={loadingZero}
                       className="px-6 py-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/30 font-semibold rounded-lg transition-colors flex items-center gap-2"
                     >
                       {loadingZero ? <span className="animate-pulse">Deploying...</span> : <><Rocket className="w-4 h-4" /> Launch</>}
                     </button>
                   </div>
                 </div>
               </div>
               
               <div className="flex-1 bg-transparent border border-white/5 rounded-xl p-6 overflow-y-auto custom-scrollbar">
                 {/* Progress indicators */}
                 {loadingZero && zeroProgress.length > 0 && (
                   <div className="space-y-3 mb-6">
                     {zeroProgress.map((step, i) => (
                       <div key={i} className="flex items-center gap-3 text-sm font-mono">
                         <span className={i === zeroProgress.length - 1 ? 'animate-pulse text-indigo-300' : 'text-accent'}>{step}</span>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Success Result */}
                 {zeroResult && (
                   <div className="space-y-6">
                     {/* Success Banner */}
                     <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-4">
                       <CheckCheck className="w-8 h-8 text-accent shrink-0" />
                       <div>
                         <h3 className="text-lg font-bold text-accent">LAUNCHPAD PROTOCOL COMPLETE</h3>
                         <p className="text-sm text-text-secondary">All {zeroResult.steps_completed?.length || 6} automation steps executed successfully.</p>
                       </div>
                     </div>

                     {/* Steps Timeline */}
                     {zeroResult.steps_completed && (
                       <div className="flex flex-wrap gap-2">
                         {zeroResult.steps_completed.map((step: string, i: number) => (
                           <span key={i} className="text-[10px] uppercase font-bold tracking-wider bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                             <CheckCircle2 className="w-3 h-3" /> {step}
                           </span>
                         ))}
                       </div>
                     )}

                     {/* Cards Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {/* Repo Card */}
                       <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5 hover:border-indigo-400/50 transition-colors group">
                         <div className="flex items-center gap-3 mb-3">
                           <FolderGit2 className="w-5 h-5 text-indigo-400" />
                           <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Repository</h4>
                         </div>
                         <p className="text-lg font-semibold text-text-primary mb-2">{zeroResult.repo_name}</p>
                         {zeroResult.repo_url && (
                           <a href={zeroResult.repo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1 underline">
                             <ExternalLink className="w-3 h-3" /> Open in GitLab
                           </a>
                         )}
                       </div>

                       {/* Issues Card */}
                       <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5 hover:border-indigo-400/50 transition-colors">
                         <div className="flex items-center gap-3 mb-3">
                           <ListChecks className="w-5 h-5 text-indigo-400" />
                           <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Backlog Issues</h4>
                         </div>
                         <p className="text-3xl font-bold font-mono text-text-primary mb-2">{zeroResult.issues_created || zeroResult.issues?.length || 0}</p>
                         {zeroResult.issues && (
                           <ul className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                             {zeroResult.issues.map((issue: any, i: number) => (
                               <li key={i} className="text-xs text-text-secondary flex items-center gap-2">
                                 <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                 <span>#{issue.iid} {issue.title}</span>
                                 {issue.estimated_hours && (
                                   <span className="text-sky-300 font-mono shrink-0">{issue.estimated_hours}h</span>
                                 )}
                                 {issue.assigned_to && (
                                   <span className="text-sky-300 font-bold ml-auto shrink-0">→ @{issue.assigned_to}</span>
                                 )}
                               </li>
                             ))}
                           </ul>
                         )}
                       </div>
                     </div>
                     
                     {/* Note about pure project management */}
                     <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-4 text-center mt-4">
                       <p className="text-xs text-text-secondary italic">✨ Pure Project Management Protocol: Repository created and all initial tasks instantly batch-assigned to the best developers.</p>
                     </div>
                   </div>
                 )}

                 {/* Raw text fallback */}
                 {zeroRawText && !zeroResult && (
                   <div className="font-mono text-sm whitespace-pre-wrap text-text-secondary">{zeroRawText}</div>
                 )}

                 {/* Empty state */}
                 {!loadingZero && !zeroResult && !zeroRawText && (
                   <div className="m-auto text-center flex flex-col items-center gap-4 text-text-tertiary h-full justify-center">
                     <Rocket className="w-16 h-16 opacity-15" />
                     <div>
                       <p className="text-lg font-medium mb-1">From Zero to One</p>
                       <p className="text-sm">Type your project idea above, and watch the Agent build your entire GitLab project from scratch.</p>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* TAB: TEAM WORKLOAD */}
          {activeTab === 'team' && projects.length > 0 && (
            <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] min-h-[500px] flex flex-col">
               <div className="mb-6 flex items-center justify-between">
                 <div>
                   <div className="flex items-center gap-3 mb-2">
                     <Users className="w-6 h-6 text-indigo-400" />
                     <h2 className="text-xl font-semibold text-text-primary">Team Workload Dashboard</h2>
                   </div>
                   <p className="text-sm text-text-secondary">View detailed profiles of all team members and their current task assignments.</p>
                 </div>
                 <button 
                   onClick={fetchTeamWorkload}
                   disabled={loadingTeam}
                   className="px-4 py-2 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
                 >
                   {loadingTeam ? <span className="animate-pulse">Syncing Data...</span> : <><Activity className="w-4 h-4" /> Sync Team Data</>}
                 </button>
               </div>
               
               <div className="flex-1 bg-transparent border border-white/5 rounded-xl p-6 overflow-y-auto custom-scrollbar">
                 {/* Loading State */}
                 {loadingTeam && !teamResult && (
                   <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-4">
                     <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
                     <p className="animate-pulse text-sm">Agent is fetching profiles and matching issues from GitLab...</p>
                   </div>
                 )}

                  {/* Success Result */}
                  {teamResult && (
                    <div className="space-y-10">
                      {/* IN PROJECT SECTION */}
                      <div className="mb-8">
                        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
                          <Activity className="w-5 h-5 text-accent" /> Active in Project ({teamResult.filter((d: any) => d.in_project).length})
                        </h3>
                        {teamResult.filter((d: any) => d.in_project).length === 0 ? (
                          <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-6 text-center text-text-tertiary text-sm">
                            No team members are currently assigned to this project.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {teamResult.filter((d: any) => d.in_project).map((dev: any, idx: number) => (
                              <div key={idx} className="flex flex-col bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden shadow-sm">
                                
                                {/* Tier 1: Assignee Header */}
                                <div className="flex items-center justify-between p-3 bg-[#0c0c0e]/60 backdrop-blur-xl border-b border-white/5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full border border-blue-500/30 flex items-center justify-center text-xs font-bold uppercase shadow-sm bg-blue-900/40 text-blue-400 shrink-0">
                                      {dev.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                                        {dev.name} 
                                        <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-md border border-white/5 text-text-secondary bg-[#0c0c0e]/60 backdrop-blur-xl">
                                          {dev.role}
                                        </span>
                                      </span>
                                      <span className="text-[10px] text-text-tertiary font-mono">@{dev.username}</span>
                                    </div>
                                  </div>
                                  <div className="pr-2">
                                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
                                      {dev.assigned_issues?.length || 0} Tasks
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Tier 2: Task List */}
                                <div className="flex flex-col">
                                  {dev.assigned_issues && dev.assigned_issues.length > 0 ? (
                                    dev.assigned_issues.map((issue: any, iIdx: number) => {
                                      const cardId = `team-${dev.username}-${iIdx}`;
                                      const isExpanded = expandedCards[cardId];
                                      return (
                                      <div key={iIdx} className="flex flex-col border-b border-white/5 last:border-b-0 hover:bg-[#0c0c0e]/60 backdrop-blur-xl transition-colors">
                                        <div 
                                          onClick={() => toggleCard(cardId)}
                                          className="group flex items-center justify-between px-4 py-2.5 cursor-pointer"
                                        >
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Indentation line & Icon */}
                                            <div className="flex items-center gap-3 shrink-0">
                                              <div className="w-4 h-px bg-border/40 ml-2"></div>
                                              {issue.state === 'closed' ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 opacity-80 shrink-0" />
                                              ) : (
                                                <div className="w-3 h-3 rounded-full border border-dashed border-accent/50 opacity-60 group-hover:opacity-100 group-hover:border-solid transition-all bg-accent/10 shrink-0" />
                                              )}
                                            </div>
                                            {/* Task Info */}
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <span className="text-xs font-mono text-accent/80 font-bold shrink-0">#{issue.iid}</span>
                                              <span className={`text-xs transition-colors truncate ${issue.state === 'closed' ? 'text-text-tertiary line-through' : 'text-text-secondary group-hover:text-text-primary'}`}>{issue.title}</span>
                                            </div>
                                          </div>
                                          
                                          {/* Expand Icon */}
                                          <div className="shrink-0 pl-3 ml-2 flex items-center justify-center">
                                            <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                          </div>
                                        </div>
                                        {isExpanded && issue.description && (
                                          <div className="pl-14 pr-4 pb-3 pt-0">
                                            <div className="border border-sky-500/50 p-3 bg-sky-950/20 text-xs text-text-secondary whitespace-pre-wrap rounded-md">
                                              {issue.description}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )})
                                  ) : (
                                    <div className="flex items-center gap-3 px-4 py-3 text-text-tertiary text-xs italic bg-[#0c0c0e]/60 backdrop-blur-xl">
                                      <div className="w-4 h-px bg-border/40 ml-2 shrink-0"></div>
                                      <CheckCircle2 className="w-3.5 h-3.5 opacity-50 shrink-0 text-blue-400" /> No active tasks assigned. Available for work!
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* NOT IN PROJECT SECTION */}
                      <div>
                        <h3 className="text-base font-bold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wide">
                          <Briefcase className="w-5 h-5" /> Available Company Talent ({teamResult.filter((d: any) => d.in_project === false).length})
                        </h3>
                        {teamResult.filter((d: any) => d.in_project === false).length === 0 ? (
                          <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-6 text-center text-text-tertiary text-sm">
                            All talent from your company roster is currently active in this project.
                          </div>
                        ) : (
                          <div className="flex flex-col bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden shadow-sm opacity-60 hover:opacity-100 transition-all duration-300">
                            {teamResult.filter((d: any) => d.in_project === false).map((dev: any, idx: number) => (
                              <div key={idx} className="group flex items-center justify-between p-3 border-b border-white/5 last:border-b-0 hover:bg-[#0c0c0e]/60 backdrop-blur-xl transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-xs font-bold uppercase shadow-sm bg-transparent text-text-tertiary shrink-0">
                                    {dev.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-text-secondary">{dev.name}</span>
                                    <span className="text-[10px] text-text-tertiary font-mono">@{dev.username}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-md border border-white/5 text-text-tertiary bg-[#0c0c0e]/60 backdrop-blur-xl">
                                    {dev.role}
                                  </span>
                                  <span className="text-[10px] font-mono text-text-tertiary/60 hidden md:block">
                                    // Not currently active in this project
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                 {/* Raw fallback */}
                 {teamRawText && !teamResult && !loadingTeam && (
                   <div className="font-mono text-sm whitespace-pre-wrap text-text-secondary">{teamRawText}</div>
                 )}

                 {/* Empty state */}
                 {!loadingTeam && !teamResult && !teamRawText && (
                   <div className="m-auto text-center flex flex-col items-center gap-4 text-text-tertiary h-full justify-center">
                     <Users className="w-16 h-16 opacity-15" />
                     <div>
                       <p className="text-lg font-medium mb-1">No Data Synced</p>
                       <p className="text-sm">Click "Sync Team Data" to fetch the latest team workload.</p>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* TAB: RELEASE NOTES */}
          {activeTab === 'releases' && projects.length > 0 && (
            <div className="flex flex-col gap-6 pb-6">
              <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Package className="w-5 h-5 text-text-secondary" />
                      <h2 className="text-xl font-bold text-text-primary">Release Notes</h2>
                    </div>
                    <p className="text-sm text-text-secondary">Generate automated release notes from merged MRs and closed issues.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-text-secondary font-medium">Version</label>
                      <input
                        type="text"
                        value={releaseVersion}
                        onChange={(e) => setReleaseVersion(e.target.value)}
                        className="bg-transparent border border-white/5 rounded-lg px-3 py-1.5 text-sm font-mono text-text-primary w-24 focus:outline-none focus:border-accent transition-colors"
                        placeholder="v1.0.0"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        setLoadingRelease(true);
                        setReleaseReport(null);
                        try {
                          const res = await fetch(`https://hackathon-030e.onrender.com/api/releases/${selectedProjectId}/generate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ version: releaseVersion })
                          });
                          const data = await res.json();
                          setReleaseReport(data.response);
                        } catch (err) {
                          setReleaseReport('Error generating release notes.');
                        }
                        setLoadingRelease(false);
                      }}
                      disabled={loadingRelease}
                      className="px-5 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {loadingRelease ? (
                        <><div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generate</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Release Notes Content */}
                {loadingRelease && !releaseReport ? (
                  <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
                    <p className="text-sm animate-pulse">AI is analyzing merged MRs and closed issues...</p>
                  </div>
                ) : releaseReport ? (() => {
                  let releaseData: any = null;
                  try {
                    const jsonMatch = releaseReport.match(/\{[\s\S]*\}/);
                    if (jsonMatch) releaseData = JSON.parse(jsonMatch[0]);
                  } catch {}

                  if (!releaseData?.release) {
                    return <pre className="text-sm text-text-secondary whitespace-pre-wrap bg-[#121214] rounded-xl p-6 border border-white/5">{releaseReport}</pre>;
                  }

                  const rel = releaseData.release;
                  const categories = rel.categories || {};

                  // Build markdown for publishing
                  const buildMarkdown = () => {
                    let md = `# ${rel.title}\n\n${rel.summary}\n\n`;
                    if (categories.features?.length) {
                      md += `## ✨ New Features\n`;
                      categories.features.forEach((f: any) => md += `- **${f.title}** (MR !${f.mr_iid}) — ${f.description || ''} (@${f.author})\n`);
                      md += '\n';
                    }
                    if (categories.bugfixes?.length) {
                      md += `## 🐛 Bug Fixes\n`;
                      categories.bugfixes.forEach((f: any) => md += `- **${f.title}** (MR !${f.mr_iid}) — ${f.description || ''} (@${f.author})\n`);
                      md += '\n';
                    }
                    if (categories.performance?.length) {
                      md += `## ⚡ Performance\n`;
                      categories.performance.forEach((f: any) => md += `- **${f.title}** (MR !${f.mr_iid}) — ${f.description || ''} (@${f.author})\n`);
                      md += '\n';
                    }
                    if (categories.maintenance?.length) {
                      md += `## 🔧 Maintenance\n`;
                      categories.maintenance.forEach((f: any) => md += `- **${f.title}** (MR !${f.mr_iid}) — ${f.description || ''} (@${f.author})\n`);
                      md += '\n';
                    }
                    if (rel.contributors?.length) {
                      md += `## 👥 Contributors\n${rel.contributors.map((c: string) => `@${c}`).join(', ')}\n`;
                    }
                    return md;
                  };

                  return (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      {/* Release Header */}
                      <div className="pb-6 border-b border-white/5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <Tag className="w-6 h-6 text-text-secondary" />
                              <h3 className="text-3xl font-bold text-text-primary">{rel.title || rel.version}</h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {rel.date}</span>
                              <span className="flex items-center gap-1.5"><GitPullRequest className="w-4 h-4" /> {rel.stats?.total_mrs || 0} MRs</span>
                              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {rel.stats?.total_issues_closed || 0} Issues</span>
                            </div>
                            <p className="text-base text-text-primary leading-relaxed">{rel.summary}</p>
                          </div>
                        </div>
                      </div>

                      {/* Categories (Vertical Document Flow) */}
                      <div className="space-y-8">
                        {[
                          { key: 'features', label: 'New Features', icon: Sparkles, color: 'text-blue-400', items: categories.features || [] },
                          { key: 'bugfixes', label: 'Bug Fixes', icon: AlertCircle, color: 'text-red-400', items: categories.bugfixes || [] },
                          { key: 'performance', label: 'Performance', icon: Zap, color: 'text-yellow-400', items: categories.performance || [] },
                          { key: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-slate-400', items: categories.maintenance || [] },
                        ].map(cat => cat.items.length > 0 && (
                          <div key={cat.key}>
                            <h4 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 pb-2 border-b border-white/5">
                              <cat.icon className={`w-5 h-5 ${cat.color}`} /> {cat.label}
                            </h4>
                            <ul className="space-y-3">
                              {cat.items.map((item: any, iIdx: number) => (
                                <li key={iIdx} className="flex items-start gap-3">
                                  <span className="text-text-tertiary mt-1">•</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-medium text-text-primary">{item.title}</span>
                                      <span className="text-xs font-mono text-text-tertiary">(!{item.mr_iid})</span>
                                      <span className="text-xs text-text-secondary">by @{item.author}</span>
                                    </div>
                                    {item.description && <p className="text-sm text-text-secondary mt-0.5">{item.description}</p>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Contributors */}
                      {rel.contributors && rel.contributors.length > 0 && (
                        <div className="pt-6 border-t border-white/5">
                          <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-text-secondary" /> Contributors
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {rel.contributors.map((c: string, cIdx: number) => (
                              <span key={cIdx} className="text-sm text-text-secondary">@{c}{cIdx < rel.contributors.length - 1 ? ',' : ''}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Publish Button */}
                      <div className="pt-8 flex justify-end">
                        <button
                          onClick={async () => {
                            setPublishingRelease(true);
                            try {
                              const res = await fetch(`https://hackathon-030e.onrender.com/api/releases/${selectedProjectId}/publish`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  tag_name: rel.version || releaseVersion,
                                  name: rel.title || `Release ${releaseVersion}`,
                                  description: buildMarkdown()
                                })
                              });
                              const data = await res.json();
                              if (data.status === 'success') {
                                alert(`🎉 Release ${rel.version} published to GitLab successfully!`);
                              } else {
                                alert(`Error: ${data.error || 'Failed to publish'}`);
                              }
                            } catch (err) {
                              alert('Failed to publish release.');
                            }
                            setPublishingRelease(false);
                          }}
                          disabled={publishingRelease}
                          className="px-6 py-2.5 bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 hover:border-accent hover:bg-accent/5 text-text-primary font-semibold rounded-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          {publishingRelease ? (
                            <><div className="w-4 h-4 border-2 border-text-tertiary border-t-text-primary rounded-full animate-spin" /> Publishing...</>
                          ) : (
                            <><Rocket className="w-4 h-4 text-accent" /> Publish to GitLab</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                    <FileText className="w-16 h-16 opacity-15 mb-4" />
                    <p className="text-lg font-medium mb-1">No Release Notes Yet</p>
                    <p className="text-sm">Enter a version number and click &quot;Generate Notes&quot; to create AI-powered release notes.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: COMPANY ROSTER */}
          {activeTab === 'roster' && (
            <div className="flex flex-col gap-6 pb-6">
              {/* Header */}
              <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-gradient-to-br from-blue-500/20 to-sky-500/20 p-2.5 rounded-xl border border-blue-500/20">
                        <Briefcase className="w-6 h-6 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-text-primary">Company Talent Pool</h2>
                    </div>
                    <p className="text-sm text-text-secondary">Manage the engineers available for AI-powered project assignment. Add your real GitLab teammates here.</p>
                  </div>
                  <button
                    onClick={() => { 
                      setShowAddForm(!showAddForm); 
                      setRosterError(null);
                      if (showAddForm) {
                        setEditingUsername(null);
                        setNewMember({ name: '', username: '', github_username: '', role: 'Developer', skills: '', experience_level: 'Mid', availability: 'High' });
                      }
                    }}
                    className={`px-5 py-2.5 font-semibold rounded-xl transition-all flex items-center gap-2 text-sm ${
                      showAddForm 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
                        : 'bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]'
                    }`}
                  >
                    {showAddForm ? <><AlertCircle className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Member</>}
                  </button>
                </div>

                {/* Add Member Form (Expandable) */}
                {showAddForm && (
                  <div className="mt-6 bg-transparent/80 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      {editingUsername ? <><Pencil className="w-4 h-4" /> Edit Team Member</> : <><UserPlus className="w-4 h-4" /> New Team Member</>}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Full Name *</label>
                        <input
                          type="text"
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          placeholder="e.g. John Doe"
                          className="w-full bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-text-tertiary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">GitLab Username *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-mono text-sm">@</span>
                          <input
                            type="text"
                            value={newMember.username}
                            onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                            placeholder="gitlab_username"
                            className="w-full bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-lg pl-8 pr-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-text-tertiary font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">GitHub Username (Auto-Skills)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 font-mono text-sm">@</span>
                          <input
                            type="text"
                            value={newMember.github_username}
                            onChange={(e) => setNewMember({ ...newMember, github_username: e.target.value })}
                            placeholder="github_username"
                            className="w-full bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-lg pl-8 pr-4 py-2.5 text-text-primary focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all placeholder:text-text-tertiary font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Role / Title</label>
                        <input
                          type="text"
                          value={newMember.role}
                          onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                          placeholder="e.g. Senior Frontend Engineer"
                          className="w-full bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-text-tertiary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Skills (comma-separated)</label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={newMember.skills}
                            onChange={(e) => setNewMember({ ...newMember, skills: e.target.value })}
                            placeholder="React, Python, Docker, AWS"
                            className="w-full bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-lg pl-4 pr-24 py-2.5 text-text-primary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-text-tertiary"
                          />
                          <button
                            type="button"
                            onClick={handleAutoDetectSkills}
                            disabled={isDetectingSkills || (!newMember.username && !newMember.github_username)}
                            className="absolute right-2 text-[10px] bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isDetectingSkills ? <span className="animate-spin">⏳</span> : '✨ Detect'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Experience Level</label>
                        <select
                          value={newMember.experience_level}
                          onChange={(e) => setNewMember({ ...newMember, experience_level: e.target.value })}
                          className="w-full bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                        >
                          <option value="Junior">Junior</option>
                          <option value="Mid">Mid-Level</option>
                          <option value="Senior">Senior</option>
                          <option value="Lead">Lead / Staff</option>
                        </select>
                      </div>

                    </div>

                    {/* Error Display */}
                    {rosterError && (
                      <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {rosterError}
                      </div>
                    )}

                    <button
                      onClick={handleAddMember}
                      disabled={addingMember || !newMember.name.trim() || !newMember.username.trim()}
                      className="mt-5 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-sky-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {addingMember ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                      ) : (
                        <>{editingUsername ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} {editingUsername ? 'Save Changes' : 'Add to Talent Pool'}</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Roster Stats Header */}
              {rosterMembers.length > 0 && (
                <div className="flex items-center justify-between mb-4 mt-2 px-2">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Total:</span>
                      <span className="text-sm font-bold font-mono text-blue-400">{rosterMembers.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Available:</span>
                      <span className="text-sm font-bold font-mono text-sky-400">{rosterMembers.filter((m: any) => m.availability === 'High').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Seniors:</span>
                      <span className="text-sm font-bold font-mono text-sky-400">{rosterMembers.filter((m: any) => m.experience_level === 'Senior' || m.experience_level === 'Lead').length}</span>
                    </div>
                  </div>
                  <button
                    onClick={fetchRoster}
                    className="text-xs text-text-tertiary hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    <Activity className={`w-3 h-3 ${loadingRoster ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
              )}

              {/* Roster Grid -> Linear List */}
              {loadingRoster && rosterMembers.length === 0 ? (
                <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4 text-text-tertiary">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                    <p className="text-sm animate-pulse">Loading company roster...</p>
                  </div>
                </div>
              ) : rosterMembers.length === 0 ? (
                <div className="bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center py-20 text-text-tertiary">
                  <Users className="w-16 h-16 opacity-15 mb-4" />
                  <p className="text-lg font-medium mb-1">Talent Pool is Empty</p>
                  <p className="text-sm">Click "Add Member" above to register your first team member.</p>
                </div>
              ) : (
                <div className="flex flex-col bg-[#0c0c0e]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden shadow-sm mb-8">
                  {rosterMembers.map((dev: any, idx: number) => {
                    const avatarColor = dev.experience_level === 'Senior' || dev.experience_level === 'Lead'
                      ? 'bg-sky-900/40 border-sky-500/30 text-sky-400'
                      : dev.experience_level === 'Mid'
                        ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-400'
                        : 'bg-blue-900/40 border-blue-500/30 text-blue-400';
                    
                    return (
                      <div key={dev.username} className={`group flex items-center gap-4 p-3 border-b border-white/5 last:border-b-0 hover:bg-[#0c0c0e]/60 backdrop-blur-xl transition-colors`}>
                        
                        {/* Avatar */}
                        <div className="shrink-0 pl-1">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold uppercase shadow-sm ${avatarColor}`}>
                            {dev.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                        </div>
                        
                        {/* Name & Username */}
                        <div className="flex flex-col w-[160px] shrink-0">
                          <span className="text-sm font-medium text-text-primary">{dev.name}</span>
                          <span className="text-xs text-text-tertiary font-mono">@{dev.username}</span>
                        </div>

                        {/* Badges (Role & Seniority) */}
                        <div className="flex shrink-0 gap-1.5 hidden md:flex w-[180px]">
                          <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-md border border-white/5 text-text-secondary bg-[#0c0c0e]/60 backdrop-blur-xl">
                            {dev.role}
                          </span>
                          <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-md border border-white/5 text-text-secondary bg-[#0c0c0e]/60 backdrop-blur-xl">
                            {dev.experience_level}
                          </span>
                        </div>

                        {/* Skills */}
                        <div className="flex-1 flex flex-wrap gap-1.5 hidden lg:flex min-w-0">
                          {(dev.skills || []).map((skill: string, sIdx: number) => (
                            <span key={sIdx} className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded cursor-default whitespace-nowrap">
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-1 pl-3 pr-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <button
                            onClick={() => handleEditClick(dev)}
                            className="p-1.5 rounded hover:bg-blue-500/20 text-text-tertiary hover:text-blue-400 transition-colors"
                            title={`Edit @${dev.username}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!(dev.role?.toLowerCase().includes('owner')) && dev.assignable !== false && (
                            <button
                              onClick={() => handleDeleteMember(dev.username)}
                              disabled={deletingUsername === dev.username}
                              className="p-1.5 rounded hover:bg-red-500/20 text-text-tertiary hover:text-red-400 transition-colors"
                              title={`Remove @${dev.username}`}
                            >
                              {deletingUsername === dev.username
                                ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />
                              }
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
