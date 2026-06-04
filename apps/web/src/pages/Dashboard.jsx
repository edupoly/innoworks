import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
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
  Layers,
  CheckCircle2,
  X,
  Edit3,
  Save,
  Rocket,
  Zap,
  Star,
  Terminal,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMe } from "../hooks/useAuth";
import { EngineeringRadarChart } from "../components/EngineeringRadarChart";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

const Dashboard = () => {
  const { user: authUser, isLoading, error } = useMe();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("kanban"); // 'kanban', 'management', 'timeline'
  const [editData, setEditData] = useState({ bio: "", skills: "" });

  const profile = authUser;

  useEffect(() => {
    if (profile) {
      setEditData({
        bio: profile.bio || "",
        skills: profile.skills?.join(", ") || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put("/users/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["me"]);
      setIsEditing(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => api.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["me"]);
    },
  });

  const handleDeleteProject = (projectId) => {
    if (window.confirm("Are you sure you want to delete this challenge?")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(editData);
  };

  // Status mapping and statistics
  const submissions = profile?.submissions || [];
  
  const pendingCount = submissions.filter(s => ['PENDING', 'TESTING', 'UNDER_REVIEW'].includes(s.status)).length;
  const approvedCount = submissions.filter(s => ['APPROVED', 'MERGED'].includes(s.status)).length;

  const stats = [
    { label: "Total XP", value: profile?.xp || 0, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { label: "Reputation", value: profile?.reputationScore || 0, icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Testing / Review", value: pendingCount, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Merged / Approved", value: approvedCount, icon: Award, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  // Organize Kanban Columns
  const submittedProjectIds = new Set(submissions.map(s => (s.project?._id || s.project)?.toString()));
  const acceptedProjectsDetails = (profile?.acceptedProjects || []).filter(p => p && !submittedProjectIds.has(p._id || p));

  const reviewingSubmissions = submissions.filter(s => ['PENDING', 'TESTING', 'UNDER_REVIEW'].includes(s.status));
  const changesRequiredSubmissions = submissions.filter(s => s.status === 'CHANGES_REQUESTED');
  const completedSubmissions = submissions.filter(s => ['APPROVED', 'MERGED'].includes(s.status));
  const ownedProjects = profile?.ownedProjects || [];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold font-mono text-xs uppercase tracking-widest">Synchronizing engineering data...</p>
    </div>
  );

  if (error) return (
    <div className="py-20 text-center">
      <AlertCircle size={48} className="mx-auto text-destructive mb-4" />
      <h2 className="text-2xl font-black mb-2 tracking-tight">System Desync</h2>
      <p className="text-muted-foreground mb-8">Failed to establish link with command center.</p>
      <button onClick={() => window.location.reload()} className="btn-primary px-8">Reinitialize</button>
    </div>
  );

  return (
    <div className="py-20 max-w-7xl mx-auto px-4 md:px-6 relative selection:bg-primary/30">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16"
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-primary via-indigo-500 to-blue-400 p-[3px] shadow-2xl shadow-primary/20 animate-glow">
              <div className="w-full h-full rounded-[1.8rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background">
                 {profile?.avatarUrl ? (
                   <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                 ) : (
                   <Activity size={32} className="text-primary" />
                 )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg border-2 border-background">
              LVL {profile?.level || 1}
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">Command Center</h1>
            <p className="text-muted-foreground flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] opacity-70">
              <Award size={14} className="text-primary" />
              <span>{profile?.username} • Strategic Contributor</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="group btn-secondary px-6 py-3 flex items-center gap-3 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl hover:border-primary/30 transition-all"
          >
            {isEditing ? <><X size={18} /> Discard</> : <><Edit3 size={18} className="group-hover:rotate-12 transition-transform" /> Preferences</>}
          </button>
          <Link to="/projects/new" className="btn-primary px-8 py-3 shadow-[0_15px_30px_-5px_rgba(99,102,241,0.3)] hover:shadow-primary/40 flex items-center gap-3 rounded-2xl font-black uppercase tracking-widest text-xs">
            <Plus size={20} /> New Mission
          </Link>
        </div>
      </motion.header>

      {/* Edit Profile Panel */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: "3rem" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-primary/20 rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 relative overflow-hidden text-foreground">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3 tracking-tight">
                <Edit3 size={24} className="text-primary" />
                Engineering Profile
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Professional Summary</label>
                    <textarea
                      rows={4}
                      className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium resize-none text-sm outline-none text-foreground"
                      placeholder="High-level overview of your expertise..."
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tech Stack (CSV)</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-bold text-sm outline-none text-foreground"
                      placeholder="React, Rust, AWS, etc."
                      value={editData.skills}
                      onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-2 opacity-50">Comma-separated values</p>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button 
                    disabled={updateProfileMutation.isLoading}
                    type="submit"
                    className="btn-primary px-10 py-4 flex items-center gap-3 shadow-xl shadow-primary/20 rounded-2xl font-black uppercase tracking-widest text-xs"
                  >
                    {updateProfileMutation.isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <><Save size={18} /> Synchronize Profile</>
                    )}
                  </button>
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
          className="mb-16 p-8 bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] border border-white/5 relative group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-full group-hover:bg-primary transition-colors"></div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-4">Transmission_Bio</h3>
          <p className="text-xl font-bold leading-relaxed text-foreground/90 italic">"{profile.bio}"</p>
          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-8">
              {profile.skills.map((skill, i) => (
                <span key={i} className="px-4 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary/10">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Ranks & Engineering Metrics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
        {/* Stats Summary Grid */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-10">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full"
          >
            {stats.map((stat, i) => (
              <motion.div variants={item} key={i} className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all">
                <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <stat.icon size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">{stat.label}</p>
                  <p className="text-4xl font-black tracking-tighter text-foreground">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Badges Preview Section */}
          <div className="bg-card/30 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 w-full h-full flex flex-col justify-between shadow-2xl">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-8">Achievements_Log</h3>
              {profile?.badges?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {profile.badges.map((badge, idx) => (
                    <div key={idx} className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col items-center text-center group hover:border-yellow-500/20 hover:bg-yellow-500/5 transition-all">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-xl shadow-inner">
                        {badge.icon || <Trophy size={22} />}
                      </div>
                      <p className="text-xs font-black text-foreground mb-1 tracking-tight">{badge.name}</p>
                      <p className="text-[9px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tighter opacity-60">{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                  Awaiting Achievement Unlocks...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Engineering Radar Chart */}
        <div className="w-full flex justify-center lg:justify-end">
          <EngineeringRadarChart stats={profile} />
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-border/50 mb-12 gap-10 text-xs font-black uppercase tracking-[0.2em] overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "kanban", label: "Contribution Deck", icon: Kanban },
          { id: "management", label: "Managed Nodes", icon: Layers },
          { id: "timeline", label: "Activity Stream", icon: History }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-5 border-b-2 flex items-center gap-3 px-2 transition-all shrink-0 ${
              activeTab === tab.id ? "border-primary text-primary opacity-100" : "border-transparent text-muted-foreground hover:text-foreground opacity-50"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <AnimatePresence mode="wait">
        {activeTab === "kanban" && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* Column 1: Planned / Accepted */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted animate-pulse"></div>
                  Accepted
                </span>
                <span className="text-[9px] font-black bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border/50">{acceptedProjectsDetails.length}</span>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                {acceptedProjectsDetails.length > 0 ? (
                  acceptedProjectsDetails.map((project) => (
                    <motion.div 
                      whileHover={{ y: -5 }}
                      key={project._id || project} 
                      className="bg-card p-6 border border-border/50 rounded-3xl space-y-6 hover:border-primary/40 transition-all group shadow-xl hover:shadow-primary/5"
                    >
                      <p className="font-black text-sm leading-tight group-hover:text-primary transition-colors tracking-tight text-foreground">{project.title || "Elite Mission"}</p>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-primary font-black bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 tracking-widest uppercase">{project.difficulty || 'Easy'}</span>
                        <Link to={`/projects/${project._id || project}`} className="font-black uppercase tracking-[0.2em] text-primary hover:underline flex items-center gap-1.5 group/btn">
                          Execute <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-2 border-dashed border-border rounded-3xl opacity-30">
                    Station_Idle
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: In Review / Testing */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  Testing
                </span>
                <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-lg border border-blue-500/20">{reviewingSubmissions.length}</span>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                {reviewingSubmissions.length > 0 ? (
                  reviewingSubmissions.map((sub) => (
                    <motion.div 
                      whileHover={{ y: -5 }}
                      key={sub._id} 
                      className="bg-card p-6 border border-border/50 rounded-3xl space-y-6 hover:border-blue-500/40 transition-all shadow-xl hover:shadow-blue-500/5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-lg border border-blue-500/20">{sub.status}</span>
                        <span className="text-[9px] font-black text-muted-foreground opacity-50">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-black text-sm leading-tight tracking-tight text-foreground">{sub.project?.title || "Quantum Module"}</p>
                      <div className="flex items-center gap-3">
                        {sub.prNumber && (
                          <a href={sub.prUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border">
                            <Github size={12} /> PR #{sub.prNumber}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-2 border-dashed border-border rounded-3xl opacity-30">
                    No_Active_Reviews
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Changes Requested */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  Actions
                </span>
                <span className="text-[9px] font-black bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-lg border border-orange-500/20">{changesRequiredSubmissions.length}</span>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                {changesRequiredSubmissions.length > 0 ? (
                  changesRequiredSubmissions.map((sub) => (
                    <motion.div 
                      whileHover={{ y: -5 }}
                      key={sub._id} 
                      className="bg-card p-6 border border-orange-500/30 rounded-3xl space-y-6 hover:border-orange-500/50 transition-all shadow-xl hover:shadow-orange-500/5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg border border-orange-500/20">Refactor</span>
                        <AlertCircle size={14} className="text-orange-500" />
                      </div>
                      <p className="font-black text-sm leading-tight tracking-tight text-foreground">{sub.project?.title || "Code Module"}</p>
                      <Link to={`/projects/${sub.project?._id}`} className="block text-center w-full py-3 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-500 hover:text-white transition-all">
                        Fix Discrepancies
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-2 border-dashed border-border rounded-3xl opacity-30">
                    All_Systems_Nominal
                  </div>
                )}
              </div>
            </div>

            {/* Column 4: Merged / Completed */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Deployed
                </span>
                <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg border border-emerald-500/20">{completedSubmissions.length}</span>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                {completedSubmissions.length > 0 ? (
                  completedSubmissions.map((sub) => (
                    <motion.div 
                      whileHover={{ y: -5 }}
                      key={sub._id} 
                      className="bg-card p-6 border border-emerald-500/30 rounded-3xl space-y-6 hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">Archived</span>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                      <p className="font-black text-sm leading-tight tracking-tight text-foreground">{sub.project?.title || "Project Solution"}</p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex -space-x-2">
                           <div className="w-6 h-6 rounded-full bg-primary border-2 border-background"></div>
                           <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-background"></div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">+200 XP Earned</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-2 border-dashed border-border rounded-3xl opacity-30">
                    Mission_Pending
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "management" && (
          <motion.div
            key="management"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {ownedProjects.length > 0 ? (
              ownedProjects.map((project) => (
                <div key={project._id} className="bg-card border border-border/50 rounded-3xl p-8 space-y-6 hover:border-primary/30 transition-all shadow-xl">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary/5 rounded-2xl">
                      <Terminal size={24} className="text-primary" />
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => navigate(`/projects/${project._id}`)}
                         className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                       >
                         <Edit3 size={18} />
                       </button>
                       <button 
                         onClick={() => handleDeleteProject(project._id)}
                         className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:text-red-500 transition-colors"
                       >
                         <X size={18} />
                       </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-2 tracking-tight text-foreground">{project.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 font-medium leading-relaxed">{project.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <Activity size={12} className="text-blue-500" />
                        {project.contributors?.length || 0} Nodes
                      </div>
                    </div>
                    <Link to={`/projects/${project._id}`} className="btn-secondary px-4 py-2 text-[10px] font-black uppercase rounded-xl">
                      Manage Briefing
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5">
                <ShieldCheck size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">No Nodes Under Management</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto w-full space-y-6"
          >
            {submissions.length > 0 ? (
              submissions.map((sub, idx) => (
                <div key={sub._id} className="relative pl-10 pb-8 last:pb-0 group">
                  {idx !== submissions.length - 1 && (
                    <div className="absolute left-[11px] top-10 bottom-0 w-0.5 bg-border/50 group-hover:bg-primary/30 transition-colors"></div>
                  )}
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-3xl p-6 hover:border-primary/20 transition-all shadow-xl shadow-black/5">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                        {sub.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground opacity-50">{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-bold text-base mb-2 text-foreground">{sub.project?.title || "Project Solution"}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-4">Transmission ID: {sub._id.slice(-8)}</p>
                    <div className="flex items-center gap-3">
                       <a href={sub.prUrl} target="_blank" rel="noreferrer" className="btn-secondary px-4 py-2 text-[10px] font-black uppercase rounded-xl flex items-center gap-2">
                         <Github size={12} /> View Source
                       </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5">
                <History size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Awaiting Data Streams</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
