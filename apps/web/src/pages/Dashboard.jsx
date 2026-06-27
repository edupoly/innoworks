import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Trophy, 
  Award, 
  Clock, 
  ChevronRight, 
  Plus, 
  Github, 
  Activity, 
  AlertCircle,
  Kanban,
  History,
  CheckCircle2,
  X,
  Edit3,
  Save,
  Terminal,
  ShieldCheck,
  Rocket,
  AlertTriangle,
  Fingerprint,
  Cpu,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMe } from "../hooks/useAuth";
import { EngineeringRadarChart } from "../components/EngineeringRadarChart";
import { useUpdateProfileMutation } from "../store/api/usersApiSlice";
import { useDeleteProjectMutation } from "../store/api/projectsApiSlice";
import SetupWizard from "../components/SetupWizard";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

const Dashboard = () => {
  const { user: authUser, isLoading, isFetching, error, refetch } = useMe();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  const [isEditing, setIsEditing] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState(tabParam || "kanban"); // 'kanban', 'management', 'timeline'

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  }, [setSearchParams]);

  const [editData, setEditData] = useState({ bio: "", skills: "", email: "", phone: "" });

  const profile = authUser;

  useEffect(() => {
    if (profile) {
      setEditData({
        bio: profile.bio || "",
        skills: profile.skills?.join(", ") || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const handleDeleteProject = useCallback(async (projectId) => {
    if (window.confirm("Are you sure you want to delete this challenge?")) {
      try {
        await deleteProject(projectId).unwrap();
      } catch (err) {
        console.error("Failed to delete project:", err);
      }
    }
  }, [deleteProject]);

  const handleUpdateProfile = useCallback(async (e) => {
    e.preventDefault();
    try {
      await updateProfile(editData).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  }, [updateProfile, editData]);

  // Memoized Status mapping and statistics
  const stats = useMemo(() => {
    if (!profile) return [];
    const submissions = profile.submissions || [];
    const pendingCount = submissions.filter(s => ['PENDING', 'TESTING', 'UNDER_REVIEW'].includes(s.status)).length;
    const approvedCount = submissions.filter(s => ['APPROVED', 'MERGED'].includes(s.status)).length;

    return [
      { label: "Global Rank", value: profile.globalRank ? `#${profile.globalRank}` : 'N/A', icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
      { label: "Aggregate XP", value: profile.xp || 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
      { label: "Active Review", value: pendingCount, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
      { label: "Nodes Merged", value: approvedCount, icon: Award, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    ];
  }, [profile]);

  // Memoized Kanban Columns data
  const kanbanData = useMemo(() => {
    if (!profile) return { accepted: [], reviewing: [], changes: [], completed: [] };
    
    const submissions = profile.submissions || [];
    const submittedProjectIds = new Set(submissions.map(s => (s.project?._id || s.project)?.toString()).filter(Boolean));
    
    return {
      accepted: (profile.acceptedProjects || []).filter(p => p && p._id && !submittedProjectIds.has(p._id.toString())),
      reviewing: submissions.filter(s => ['PENDING', 'TESTING', 'UNDER_REVIEW'].includes(s.status)),
      changes: submissions.filter(s => s.status === 'CHANGES_REQUESTED'),
      completed: submissions.filter(s => ['APPROVED', 'MERGED'].includes(s.status)),
      owned: profile.ownedProjects || [],
      allSubmissions: submissions
    };
  }, [profile]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-6">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
      </div>
      <p className="text-muted-foreground font-black font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Establishing Command Link...</p>
    </div>
  );

  if (error && !authUser) return (
    <div className="py-32 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto mb-8 border border-destructive/20">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-3xl font-black mb-4 tracking-tight">Network Connection Lost.</h2>
      <p className="text-muted-foreground mb-6 font-medium leading-relaxed px-6">We encountered a network failure while attempting to synchronize with your command node.</p>
      <button 
        onClick={() => refetch()} 
        disabled={isFetching}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50 transition-opacity"
      >
        {isFetching ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Terminal size={18} />}
        {isFetching ? "Reconnecting..." : "Retry Connection"}
      </button>
    </div>
  );

  return (
    <div className="py-4 max-w-7xl mx-auto px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Dynamic Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative group">
            <motion.div 
              whileHover={{ rotate: 3, scale: 1.02 }}
              className="w-16 h-16 rounded-xl bg-gradient-to-tr from-primary via-indigo-500 to-blue-400 p-[2px] shadow-xl shadow-primary/20 relative z-10"
            >
              <div className="w-full h-full rounded-lg bg-background flex items-center justify-center overflow-hidden border-[3px] border-background">
                 {profile?.avatarUrl ? (
                   <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-secondary flex items-center justify-center text-primary">
                     <Fingerprint size={24} />
                   </div>
                 )}
              </div>
            </motion.div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg border-2 border-background z-20">
              LVL {profile?.level || 1}
            </div>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-black tracking-tight text-gradient">Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.1em] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">@{profile?.username}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.1em] opacity-40">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setShowWizard(true)}
            className="h-8 px-3 text-[8px] font-black uppercase tracking-widest gap-1.5 shadow-sm"
          >
            <Rocket size={10} className="text-primary" /> Onboarding
          </Button>
          
          <Button 
            variant={isEditing ? "destructive" : "secondary"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 px-3 text-[8px] font-black uppercase tracking-widest gap-1.5"
          >
            {isEditing ? <><X size={10} /> Abort</> : <><Edit3 size={10} /> Edit Profile</>}
          </Button>
          
          <Link to="/projects/new">
            <Button size="sm" className="group h-8 px-4 text-[8px] font-black uppercase tracking-widest gap-1.5">
              <Plus size={12} className="group-hover:rotate-90 transition-transform duration-500" />
              New Project
            </Button>
          </Link>
        </div>
      </motion.header>

      <AnimatePresence>
        {showWizard && <SetupWizard onClose={() => setShowWizard(false)} />}
      </AnimatePresence>

      {/* Profile Modification Node */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mb-6"
          >
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden border border-border/50">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Fingerprint size={18} />
                </div>
                <h2 className="text-lg font-black tracking-tight uppercase tracking-widest">Profile Update</h2>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Email Channel</label>
                    <Input
                      type="email"
                      placeholder="Enter contact email..."
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Contact Line</label>
                    <Input
                      type="tel"
                      placeholder="Enter phone number..."
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Engineering Bio</label>
                    <textarea
                      rows={3}
                      className="w-full px-5 py-4 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium resize-none text-xs outline-none shadow-inner custom-scrollbar"
                      placeholder="Define your engineering objective..."
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Tech Matrix (CSV)</label>
                    <Input
                      type="text"
                      placeholder="React, Next.js, Rust..."
                      value={editData.skills}
                      onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                      className="h-10 text-xs"
                    />
                    <p className="text-[7px] text-muted-foreground font-black uppercase tracking-widest mt-1.5 opacity-50 px-1">Synchronize skills across the grid</p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    disabled={isUpdatingProfile}
                    type="submit"
                    className="min-w-[180px] h-10 gap-2 text-[10px] uppercase tracking-widest"
                  >
                    {isUpdatingProfile ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <><Save size={16} /> Save Changes</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isEditing && profile?.bio && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-8 bg-secondary/20 backdrop-blur-2xl rounded-2xl border border-border/50 relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-full group-hover:bg-primary transition-all duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/60">Status_Report</h3>
              <p className="text-xl font-bold leading-snug text-foreground/90 italic max-w-4xl tracking-tight">"{profile.bio}"</p>
            </div>
            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-background/50 text-foreground text-[8px] font-black uppercase tracking-widest rounded-lg border border-border/50 hover:border-primary/30 transition-all shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Ranks & Engineering Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {stats.map((stat, i) => (
              <motion.div variants={item} key={i}>
                <Card className="p-5 flex items-center gap-5 group relative overflow-hidden h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-2 transition-all duration-500 shadow-lg shadow-black/5`}>
                    <stat.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10 space-y-0.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 leading-none">{stat.label}</p>
                    <p className="text-2xl font-black tracking-tighter text-foreground tabular-nums">{stat.value}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Achievements */}
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-card to-secondary/30">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[60px] rounded-full" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                  <Trophy size={16} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Achievements</h3>
              </div>
              
              {profile?.badges?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profile.badges.map((badge, idx) => (
                    <motion.div 
                      whileHover={{ y: -3, scale: 1.01 }}
                      key={idx} 
                      className="p-4 bg-background/40 border border-border/50 rounded-xl flex flex-col items-center text-center group hover:border-amber-500/30 hover:bg-amber-500/5 transition-all shadow-lg shadow-black/5"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-lg relative shadow-inner">
                        <span className="relative z-10">{badge.icon || "🏆"}</span>
                      </div>
                      <p className="text-[9px] font-black text-foreground mb-0.5 tracking-tight uppercase tracking-widest">{badge.name}</p>
                      <p className="text-[7px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-40 line-clamp-1">{badge.description}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <Trophy size={32} className="mx-auto text-muted-foreground opacity-10" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">
                    Empty
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Engineering Radar Matrix */}
        <div className="w-full flex justify-center lg:justify-end">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-[280px]"
          >
            <EngineeringRadarChart stats={profile} />
          </motion.div>
        </div>
      </div>

      {/* Project Deck Tabs */}
      <div className="flex border-b border-border/30 mb-6 gap-6 text-[9px] font-black uppercase tracking-[0.25em] overflow-x-auto no-scrollbar pb-0.5 relative">
        {[
          { id: "kanban", label: "Task Matrix", icon: Kanban },
          { id: "management", label: "My Nodes", icon: Cpu },
          { id: "timeline", label: "Feed", icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`pb-4 border-b-2 flex items-center gap-2 px-0.5 transition-all relative shrink-0 ${
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground opacity-60"
            }`}
          >
            <tab.icon size={14} /> 
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="tab-active" className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Deck Content Node */}
      <AnimatePresence mode="wait">
        {activeTab === "kanban" && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Column: Accepted */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">Accepted</span>
                </div>
                <span className="text-[8px] font-black bg-secondary/80 text-foreground px-2 py-0.5 rounded-md border border-border/50 tabular-nums">{kanbanData.accepted.length}</span>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {kanbanData.accepted.length > 0 ? (
                  kanbanData.accepted.map((project) => (
                    <motion.div 
                      key={project._id || project}
                      whileHover={{ y: -3, scale: 1.01 }}
                    >
                      <Card className="p-5 space-y-6 bg-card/50 hover:bg-card">
                        <p className="font-black text-xs leading-tight tracking-tight text-foreground line-clamp-2">{project.title || "Unknown"}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="default" className="text-[8px] px-2 py-0 h-4">{project.difficulty || 'Easy'}</Badge>
                          <Link to={`/projects/${project._id || project}`} className="text-[8px] font-black uppercase tracking-[0.2em] text-primary hover:brightness-125 flex items-center gap-1.5 group/btn">
                            Engage <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-2xl bg-secondary/5 opacity-40">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column: Validation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">Validation</span>
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[8px] h-4">{kanbanData.reviewing.length}</Badge>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {kanbanData.reviewing.length > 0 ? (
                  kanbanData.reviewing.map((sub) => (
                    <motion.div 
                      key={sub._id}
                      whileHover={{ y: -3, scale: 1.01 }}
                    >
                      <Card className="p-5 space-y-6 bg-card/50 hover:bg-card">
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[8px] px-2 py-0 h-4">{sub.status.replace('_', ' ')}</Badge>
                          <Clock size={12} className="text-blue-500/50" />
                        </div>
                        <p className="font-black text-xs leading-tight tracking-tight text-foreground line-clamp-2">{sub.project?.title || "Project Solution"}</p>
                        <div className="pt-1">
                          {sub.prNumber && (
                            <a href={sub.prUrl} target="_blank" rel="noreferrer" className="text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border/50 transition-all">
                              <Github size={10} /> PR #{sub.prNumber}
                            </a>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-2xl bg-secondary/5 opacity-40">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Quiet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column: Refactor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/40" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">Refactor</span>
                </div>
                <Badge variant="warning" className="text-[8px] h-4">{kanbanData.changes.length}</Badge>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {kanbanData.changes.length > 0 ? (
                  kanbanData.changes.map((sub) => (
                    <motion.div 
                      key={sub._id}
                      whileHover={{ y: -3, scale: 1.01 }}
                    >
                      <Card className="p-5 space-y-6 border-orange-500/30 bg-card/50 hover:bg-card">
                        <div className="flex justify-between items-center">
                          <Badge variant="warning" className="text-[8px] h-4">Adjustment</Badge>
                          <AlertCircle size={12} className="text-orange-500" />
                        </div>
                        <p className="font-black text-xs leading-tight tracking-tight text-foreground line-clamp-2">{sub.project?.title || "Module Patch"}</p>
                        <Link to={`/projects/${sub.project?._id}`} className="block">
                          <Button variant="destructive" size="sm" className="w-full bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 text-[8px] font-black h-8 uppercase tracking-widest">
                            Execute Fix
                          </Button>
                        </Link>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-2xl bg-secondary/5 opacity-40">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Stable</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column: Merged */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Merged</span>
                </div>
                <Badge variant="success" className="text-[8px] h-4">{kanbanData.completed.length}</Badge>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {kanbanData.completed.length > 0 ? (
                  kanbanData.completed.map((sub) => (
                    <motion.div 
                      key={sub._id}
                      whileHover={{ y: -3, scale: 1.01 }}
                    >
                      <Card className="p-5 space-y-6 border-emerald-500/30 bg-card/50 hover:bg-card">
                        <div className="flex justify-between items-center">
                          <Badge variant="success" className="text-[8px] h-4">Complete</Badge>
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        </div>
                        <p className="font-black text-xs leading-tight tracking-tight text-foreground line-clamp-2">{sub.project?.title || "Solved Protocol"}</p>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex -space-x-1.5">
                             <div className="w-5 h-5 rounded-full bg-primary border-2 border-background shadow-sm"></div>
                             <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-background shadow-sm"></div>
                          </div>
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">+XP Credited</span>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-2xl bg-secondary/5 opacity-40">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Empty</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "management" && (
          <motion.div
            key="management"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {kanbanData.owned.length > 0 ? (
              kanbanData.owned.map((project) => (
                <Card key={project._id} className="p-8 space-y-8 group relative overflow-hidden bg-gradient-to-br from-card to-secondary/30">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary shadow-xl shadow-primary/5 group-hover:scale-105 group-hover:rotate-2 transition-all duration-500">
                      <Terminal size={20} />
                    </div>
                    <div className="flex gap-1.5">
                       <Button 
                         variant="secondary"
                         size="icon"
                         onClick={() => navigate(`/projects/${project._id}`)}
                         className="w-8 h-8"
                       >
                         <Edit3 size={14} />
                       </Button>
                       <Button 
                         variant="secondary"
                         size="icon"
                         onClick={() => handleDeleteProject(project._id)}
                         className="w-8 h-8 hover:text-destructive hover:bg-destructive/10"
                       >
                         <X size={14} />
                       </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 font-medium leading-relaxed opacity-80">{project.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-border/30 relative z-10">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-background/50 px-2.5 py-1 rounded-lg border border-border/50">
                      <Activity size={12} className="text-blue-500" />
                      <span>{project.contributors?.length || 0} Nodes</span>
                    </div>
                    <Link to={`/projects/${project._id}`} className="text-[9px] font-black uppercase tracking-widest text-primary hover:brightness-125 transition-all flex items-center gap-1.5">
                      Manage <ChevronRight size={12} />
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-border/30 rounded-2xl bg-secondary/5 space-y-5">
                <ShieldCheck size={48} className="mx-auto text-muted-foreground opacity-10" />
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">No Nodes Under Management</p>
                  <Link to="/projects/new" className="text-primary text-[9px] font-black uppercase tracking-widest hover:underline">Deploy New Node</Link>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto w-full space-y-6"
          >
            {kanbanData.allSubmissions.length > 0 ? (
              kanbanData.allSubmissions.map((sub, idx) => (
                <div key={sub._id} className="relative pl-10 pb-10 last:pb-0 group">
                  {idx !== kanbanData.allSubmissions.length - 1 && (
                    <div className="absolute left-[13px] top-10 bottom-0 w-px bg-border/40 group-hover:bg-primary/30 transition-all duration-700" />
                  )}
                  <div className="absolute left-0 top-1 w-7 h-7 rounded-lg bg-background border-2 border-border/50 flex items-center justify-center z-10 shadow-xl group-hover:border-primary/50 transition-all group-hover:scale-110">
                    <div className={`w-2 h-2 rounded-full ${sub.status === 'MERGED' ? 'bg-emerald-500' : sub.status === 'CHANGES_REQUESTED' ? 'bg-orange-500' : 'bg-primary'} animate-pulse shadow-sm`} />
                  </div>
                  
                  <motion.div whileHover={{ x: 3 }}>
                    <Card className="rounded-2xl p-6 hover:border-primary/20 transition-all">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5 pb-5 border-b border-border/20">
                        <div className="flex items-center gap-2.5">
                          <Badge variant={sub.status === 'MERGED' ? 'success' : sub.status === 'CHANGES_REQUESTED' ? 'warning' : 'default'} className="text-[8px] h-4">
                            {sub.status.replace('_', ' ')}
                          </Badge>
                          <div className="h-3 w-px bg-border/40" />
                          <span className="text-[8px] font-black text-muted-foreground opacity-50 uppercase tracking-widest">{new Date(sub.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] font-mono">TX: {sub._id.slice(-6)}</span>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-black text-lg tracking-tight text-foreground leading-tight">{sub.project?.title || "Project Solution"}</h4>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                          <Zap size={12} className="text-primary" /> Synchronized via Grid
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-6">
                         <a href={sub.prUrl} target="_blank" rel="noreferrer">
                           <Button variant="secondary" size="sm" className="h-8 gap-2 px-3 text-[8px] font-black uppercase tracking-widest">
                             <Github size={12} /> Open Source
                           </Button>
                         </a>
                         <Link to={`/projects/${sub.project?._id}`} className="text-[9px] font-black uppercase tracking-widest text-primary hover:brightness-125 transition-all flex items-center gap-1.5">
                           View Protocol <ChevronRight size={12} />
                         </Link>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-border/30 rounded-2xl bg-secondary/5 space-y-5">
                <History size={48} className="mx-auto text-muted-foreground opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">Awaiting Activity Data</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

