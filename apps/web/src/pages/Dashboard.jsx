import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Trophy, 
  Sparkles, 
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
  const { user: authUser, isLoading, error } = useMe();
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
      { label: "Aggregate XP", value: profile.xp || 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
      { label: "Engineering Rep", value: profile.reputationScore || 0, icon: Sparkles, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
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

  if (error) return (
    <div className="py-32 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto mb-8 border border-destructive/20">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-3xl font-black mb-4 tracking-tight">System desynchronization.</h2>
      <p className="text-muted-foreground mb-10 font-medium leading-relaxed px-6">We encountered a critical failure while attempting to synchronize with your command node.</p>
      <button onClick={() => window.location.reload()} className="btn-primary w-full">Reinitialize System</button>
    </div>
  );

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Dynamic Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16"
      >
        <div className="flex items-center gap-8">
          <div className="relative group">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-primary via-indigo-500 to-blue-400 p-[2.5px] shadow-2xl shadow-primary/30 relative z-10"
            >
              <div className="w-full h-full rounded-[1.8rem] bg-background flex items-center justify-center overflow-hidden border-[6px] border-background">
                 {profile?.avatarUrl ? (
                   <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-secondary flex items-center justify-center text-primary">
                     <Fingerprint size={40} />
                   </div>
                 )}
              </div>
            </motion.div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl border-4 border-background z-20">
              LVL {profile?.level || 1}
            </div>
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-gradient">Control Center</h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">@{profile?.username}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Engineering Cluster Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            variant="secondary"
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2.5 shadow-sm"
          >
            <Rocket size={16} className="text-primary" /> Ignition Protocol
          </Button>
          
          <Button 
            variant={isEditing ? "destructive" : "secondary"}
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2.5"
          >
            {isEditing ? <><X size={16} /> Abort Edit</> : <><Edit3 size={16} /> Registry Update</>}
          </Button>
          
          <Link to="/projects/new">
            <Button className="group gap-2">
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              New Mission
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
            className="overflow-hidden mb-12"
          >
            <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Fingerprint size={20} />
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase tracking-widest">Biometric Data Update</h2>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Secure Email Channel</label>
                    <Input
                      type="email"
                      placeholder="Enter encrypted email..."
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Direct Telemetry Line</label>
                    <Input
                      type="tel"
                      placeholder="Enter secure contact..."
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Mission Directive (Bio)</label>
                    <textarea
                      rows={4}
                      className="w-full px-6 py-5 bg-background/50 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium resize-none text-sm outline-none shadow-inner custom-scrollbar"
                      placeholder="Define your engineering objective..."
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Core Tech Matrix (CSV)</label>
                    <Input
                      type="text"
                      placeholder="React, Next.js, Rust, Go..."
                      value={editData.skills}
                      onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                    />
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-2 opacity-50 px-1">Synchronize skills across the cluster</p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    disabled={isUpdatingProfile}
                    type="submit"
                    className="min-w-[240px] gap-3"
                  >
                    {isUpdatingProfile ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <><Save size={18} /> Commit Changes</>
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
          className="mb-16 p-10 bg-secondary/20 backdrop-blur-3xl rounded-[3rem] border border-border/50 relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 rounded-full group-hover:bg-primary transition-all duration-700" />
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60">Registry_Status_Report</h3>
              <p className="text-2xl font-bold leading-relaxed text-foreground/90 italic max-w-4xl tracking-tight">"{profile.bio}"</p>
            </div>
            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-background/50 text-foreground text-[9px] font-black uppercase tracking-widest rounded-xl border border-border/50 hover:border-primary/30 transition-all shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Ranks & Engineering Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        <div className="lg:col-span-2 space-y-12">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div variants={item} key={i}>
                <Card className="p-8 flex items-center gap-8 group relative overflow-hidden h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className={`w-16 h-16 rounded-[1.5rem] ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-black/5`}>
                    <stat.icon size={28} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60 leading-none">{stat.label}</p>
                    <p className="text-4xl font-black tracking-tighter text-foreground tabular-nums">{stat.value}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Achievement Registry */}
          <Card className="p-10 relative overflow-hidden bg-gradient-to-br from-card to-secondary/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full" />
            <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                  <Trophy size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em]">Achievement Registry</h3>
              </div>
              
              {profile?.badges?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {profile.badges.map((badge, idx) => (
                    <motion.div 
                      whileHover={{ y: -5, scale: 1.02 }}
                      key={idx} 
                      className="p-6 bg-background/40 border border-border/50 rounded-[2rem] flex flex-col items-center text-center group hover:border-amber-500/30 hover:bg-amber-500/5 transition-all shadow-xl shadow-black/5"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform text-2xl relative shadow-inner">
                        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                        <span className="relative z-10">{badge.icon || "🏆"}</span>
                      </div>
                      <p className="text-xs font-black text-foreground mb-1.5 tracking-tight uppercase tracking-widest">{badge.name}</p>
                      <p className="text-[9px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-40">{badge.description}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-4">
                  <Trophy size={48} className="mx-auto text-muted-foreground opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">
                    Awaiting Achievement Unlocks
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
            className="w-full max-w-sm"
          >
            <EngineeringRadarChart stats={profile} />
          </motion.div>
        </div>
      </div>

      {/* Mission Deck Tabs */}
      <div className="flex border-b border-border/30 mb-12 gap-10 text-[10px] font-black uppercase tracking-[0.3em] overflow-x-auto no-scrollbar pb-0.5 relative">
        {[
          { id: "kanban", label: "Mission Deck", icon: Kanban },
          { id: "management", label: "Directed Nodes", icon: Cpu },
          { id: "timeline", label: "Signal Feed", icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`pb-5 border-b-2 flex items-center gap-3 px-1 transition-all relative shrink-0 ${
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground opacity-60"
            }`}
          >
            <tab.icon size={16} /> 
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* Column: Awaiting Action */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2 pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-70">Accepted</span>
                </div>
                <span className="text-[9px] font-black bg-secondary/80 text-foreground px-2.5 py-1 rounded-lg border border-border/50 tabular-nums">{kanbanData.accepted.length}</span>
              </div>
              <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {kanbanData.accepted.length > 0 ? (
                  kanbanData.accepted.map((project) => (
                    <motion.div 
                      key={project._id || project}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <Card className="p-7 space-y-8 bg-card/50 hover:bg-card">
                        <p className="font-black text-sm leading-tight group-hover:text-primary transition-colors tracking-tight text-foreground line-clamp-2">{project.title || "Unknown Mission"}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="default">{project.difficulty || 'Easy'}</Badge>
                          <Link to={`/projects/${project._id || project}`} className="text-[9px] font-black uppercase tracking-[0.3em] text-primary hover:brightness-125 flex items-center gap-2 group/btn">
                            Engage <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[2.5rem] bg-secondary/5 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Deck Empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column: Intelligence Validation */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2 pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500">Validation</span>
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{kanbanData.reviewing.length}</Badge>
              </div>
              <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {kanbanData.reviewing.length > 0 ? (
                  kanbanData.reviewing.map((sub) => (
                    <motion.div 
                      key={sub._id}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <Card className="p-7 space-y-8 bg-card/50 hover:bg-card">
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{sub.status.replace('_', ' ')}</Badge>
                          <Clock size={14} className="text-blue-500/50" />
                        </div>
                        <p className="font-black text-sm leading-tight tracking-tight text-foreground line-clamp-2">{sub.project?.title || "Project Solution"}</p>
                        <div className="pt-2">
                          {sub.prNumber && (
                            <a href={sub.prUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-xl border border-border/50 transition-all">
                              <Github size={12} /> PR #{sub.prNumber}
                            </a>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[2.5rem] bg-secondary/5 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Signals Quiet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column: Necessary Protocol Adjustments */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2 pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-sm shadow-orange-500/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Refactor</span>
                </div>
                <Badge variant="warning">{kanbanData.changes.length}</Badge>
              </div>
              <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {kanbanData.changes.length > 0 ? (
                  kanbanData.changes.map((sub) => (
                    <motion.div 
                      key={sub._id}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <Card className="p-7 space-y-8 border-orange-500/30 bg-card/50 hover:bg-card">
                        <div className="flex justify-between items-center">
                          <Badge variant="warning">Operational Change</Badge>
                          <AlertCircle size={14} className="text-orange-500" />
                        </div>
                        <p className="font-black text-sm leading-tight tracking-tight text-foreground line-clamp-2">{sub.project?.title || "Module Patch"}</p>
                        <Link to={`/projects/${sub.project?._id}`} className="block">
                          <Button variant="destructive" className="w-full bg-orange-500 hover:bg-orange-600 shadow-orange-500/20">
                            Execute Fix
                          </Button>
                        </Link>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[2.5rem] bg-secondary/5 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">No Discrepancies</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column: Merged / Deployed */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2 pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500">Merged</span>
                </div>
                <Badge variant="success">{kanbanData.completed.length}</Badge>
              </div>
              <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {kanbanData.completed.length > 0 ? (
                  kanbanData.completed.map((sub) => (
                    <motion.div 
                      key={sub._id}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <Card className="p-7 space-y-8 border-emerald-500/30 bg-card/50 hover:bg-card">
                        <div className="flex justify-between items-center">
                          <Badge variant="success">Mission Complete</Badge>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <p className="font-black text-sm leading-tight tracking-tight text-foreground line-clamp-2">{sub.project?.title || "Solved Protocol"}</p>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex -space-x-2">
                             <div className="w-6 h-6 rounded-full bg-primary border-2 border-background shadow-sm"></div>
                             <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-background shadow-sm"></div>
                          </div>
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">+200 XP Credited</span>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[2.5rem] bg-secondary/5 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Registry Empty</p>
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {kanbanData.owned.length > 0 ? (
              kanbanData.owned.map((project) => (
                <Card key={project._id} className="p-10 space-y-10 group relative overflow-hidden bg-gradient-to-br from-card to-secondary/30">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary shadow-xl shadow-primary/5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <Terminal size={24} />
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant="secondary"
                         size="icon"
                         onClick={() => navigate(`/projects/${project._id}`)}
                         className="w-9 h-9"
                       >
                         <Edit3 size={18} />
                       </Button>
                       <Button 
                         variant="secondary"
                         size="icon"
                         onClick={() => handleDeleteProject(project._id)}
                         className="w-9 h-9 hover:text-destructive hover:bg-destructive/10"
                       >
                         <X size={18} />
                       </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 font-medium leading-relaxed opacity-80">{project.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-border/30 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-background/50 px-3 py-1.5 rounded-xl border border-border/50">
                        <Activity size={14} className="text-blue-500" />
                        <span>{project.contributors?.length || 0} Nodes Linked</span>
                      </div>
                    </div>
                    <Link to={`/projects/${project._id}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:brightness-125 transition-all flex items-center gap-2">
                      Manage Briefing <ChevronRight size={14} />
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-border/30 rounded-[3rem] bg-secondary/5 space-y-6">
                <ShieldCheck size={56} className="mx-auto text-muted-foreground opacity-10" />
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">No Directed Nodes Under Management</p>
                  <Link to="/projects/new" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Initialize New Protocol</Link>
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
            className="max-w-3xl mx-auto w-full space-y-8"
          >
            {kanbanData.allSubmissions.length > 0 ? (
              kanbanData.allSubmissions.map((sub, idx) => (
                <div key={sub._id} className="relative pl-12 pb-12 last:pb-0 group">
                  {idx !== kanbanData.allSubmissions.length - 1 && (
                    <div className="absolute left-[15px] top-12 bottom-0 w-px bg-border/40 group-hover:bg-primary/30 transition-all duration-700" />
                  )}
                  <div className="absolute left-0 top-1.5 w-8 h-8 rounded-xl bg-background border-2 border-border/50 flex items-center justify-center z-10 shadow-xl group-hover:border-primary/50 transition-all group-hover:scale-110">
                    <div className={`w-2.5 h-2.5 rounded-full ${sub.status === 'MERGED' ? 'bg-emerald-500' : sub.status === 'CHANGES_REQUESTED' ? 'bg-orange-500' : 'bg-primary'} animate-pulse shadow-sm`} />
                  </div>
                  
                  <motion.div whileHover={{ x: 5 }}>
                    <Card className="rounded-[2.5rem] p-8 hover:border-primary/20 transition-all">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-border/20">
                        <div className="flex items-center gap-3">
                          <Badge variant={sub.status === 'MERGED' ? 'success' : sub.status === 'CHANGES_REQUESTED' ? 'warning' : 'default'}>
                            {sub.status.replace('_', ' ')}
                          </Badge>
                          <div className="h-4 w-px bg-border/40" />
                          <span className="text-[9px] font-black text-muted-foreground opacity-50 uppercase tracking-widest">{new Date(sub.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] font-mono">TX_ID: {sub._id.slice(-8)}</span>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-black text-xl tracking-tight text-foreground leading-tight">{sub.project?.title || "Project Solution"}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] flex items-center gap-2">
                          <Zap size={14} className="text-primary" /> Signal Synchronized via Global Grid
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 pt-8">
                         <a href={sub.prUrl} target="_blank" rel="noreferrer">
                           <Button variant="secondary" className="gap-2.5">
                             <Github size={14} /> Open Source
                           </Button>
                         </a>
                         <Link to={`/projects/${sub.project?._id}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:brightness-125 transition-all flex items-center gap-2">
                           View Protocol <ChevronRight size={14} />
                         </Link>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center border-2 border-dashed border-border/30 rounded-[3rem] bg-secondary/5 space-y-6">
                <History size={56} className="mx-auto text-muted-foreground opacity-10" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">Awaiting Signal Data Streams</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

