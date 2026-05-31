import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { 
  Trophy, 
  ChevronRight, 
  Clock, 
  Award,
  AlertCircle,
  Trash2,
  ExternalLink,
  Github,
  ShieldCheck,
  Edit3,
  X,
  Save,
  Layers,
  Sparkles,
  Kanban,
  KanbanSquare,
  Activity,
  History,
  Rocket,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

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

// Custom SVG Radar Chart component for professional grade engineering metrics
const EngineeringRadarChart = ({ stats }) => {
  const {
    collaborationScore = 75,
    innovationScore = 60,
    consistencyScore = 80,
    communicationScore = 70,
    perfectionScore = 65,
    adaptabilityScore = 85
  } = stats || {};

  const metrics = [
    { label: "Collaboration", value: collaborationScore },
    { label: "Innovation", value: innovationScore },
    { label: "Consistency", value: consistencyScore },
    { label: "Communication", value: communicationScore },
    { label: "Perfection", value: perfectionScore },
    { label: "Adaptability", value: adaptabilityScore }
  ];

  // SVG parameters
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const totalLevels = 4;

  // Calculate coordinates for vertices
  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / 6) * index - Math.PI / 2;
    const distance = (value / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // Draw concentric polygon rings for grid
  const rings = Array.from({ length: totalLevels }, (_, i) => {
    const value = (100 / totalLevels) * (i + 1);
    const points = metrics.map((_, idx) => {
      const { x, y } = getCoordinates(idx, value);
      return `${x},${y}`;
    }).join(" ");
    return points;
  });

  // Calculate coordinates for user stats polygon path
  const userStatsPoints = metrics.map((m, idx) => {
    const { x, y } = getCoordinates(idx, m.value);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border border-border/50 rounded-3xl relative">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Engineering Profile</h3>
      
      <svg width={size} height={size} className="overflow-visible">
        {/* Ring Grid */}
        {rings.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            className="stroke-border"
            strokeWidth={1}
          />
        ))}

        {/* Web Axes lines */}
        {metrics.map((_, idx) => {
          const outer = getCoordinates(idx, 100);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              className="stroke-border"
              strokeWidth={1}
            />
          );
        })}

        {/* User stats area */}
        <polygon
          points={userStatsPoints}
          fill="rgba(99, 102, 241, 0.2)"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Score nodes */}
        {metrics.map((m, idx) => {
          const coord = getCoordinates(idx, m.value);
          return (
            <circle
              key={idx}
              cx={coord.x}
              cy={coord.y}
              r={4}
              className="fill-primary stroke-background"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Metric labels */}
        {metrics.map((m, idx) => {
          const textCoord = getCoordinates(idx, 120);
          // Adjust alignments based on position
          let textAnchor = "middle";
          if (idx === 1 || idx === 2) textAnchor = "start";
          if (idx === 4 || idx === 5) textAnchor = "end";

          return (
            <text
              key={idx}
              x={textCoord.x}
              y={textCoord.y + 4}
              textAnchor={textAnchor}
              className="text-[10px] font-black uppercase fill-muted-foreground select-none"
            >
              {m.label} ({m.value})
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const Dashboard = () => {
  const { user: authUser } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("kanban"); // 'kanban', 'timeline', 'badges'
  const [editData, setEditData] = useState({ bio: "", skills: "" });

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", authUser?.username],
    queryFn: async () => {
      if (!authUser?.username) return null;
      const response = await api.get(`/users/profile/${authUser.username}`);
      return response.data;
    },
    enabled: !!authUser?.username,
  });

  useEffect(() => {
    if (profile) {
      setEditData({
        bio: profile.bio || "",
        skills: profile.skills?.join(", ") || ""
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put("/users/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["profile", authUser?.username]);
      setIsEditing(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => api.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["profile", authUser?.username]);
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
  const acceptedCount = profile?.acceptedProjects?.length || 0;
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
  // Col 1: Accepted / Planned (Accepted but not yet submitted)
  const submittedProjectIds = new Set(submissions.map(s => (s.project?._id || s.project)?.toString()));
  const acceptedProjectsDetails = (profile?.acceptedProjects || []).filter(p => p && !submittedProjectIds.has(p._id || p));

  // Col 2: Active / Testing (PENDING, TESTING, UNDER_REVIEW)
  const reviewingSubmissions = submissions.filter(s => ['PENDING', 'TESTING', 'UNDER_REVIEW'].includes(s.status));

  // Col 3: Changes Requested (CHANGES_REQUESTED)
  const changesRequiredSubmissions = submissions.filter(s => s.status === 'CHANGES_REQUESTED');

  // Col 4: Completed / Merged (APPROVED, MERGED)
  const completedSubmissions = submissions.filter(s => ['APPROVED', 'MERGED'].includes(s.status));

  // Col 5: Owned Projects
  const ownedProjects = profile?.ownedProjects || [];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold">Synchronizing engineering data...</p>
    </div>
  );

  if (error) return (
    <div className="py-20 text-center">
      <AlertCircle size={48} className="mx-auto text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Failed to load dashboard</h2>
      <p className="text-muted-foreground">Please try refreshing the page.</p>
    </div>
  );

  return (
    <div className="py-12 max-w-7xl mx-auto px-4">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
      >
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-blue-400 p-[3px] shadow-lg shadow-primary/20">
            <div className="w-full h-full rounded-[21px] bg-background flex items-center justify-center overflow-hidden">
               {profile?.avatarUrl ? (
                 <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
               ) : (
                 <Activity size={32} className="text-primary" />
               )}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{profile?.username}'s Space</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1.5 font-bold uppercase text-xs tracking-wider">
              <Award size={14} className="text-primary" />
              <span>Level {profile?.level || 1} • {profile?.roles?.join(" & ") || 'Developer'}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary px-5 py-2.5 flex items-center gap-2"
          >
            {isEditing ? <><X size={18} /> Cancel</> : <><Edit3 size={18} /> Edit Profile</>}
          </button>
          <Link to="/projects/new" className="btn-primary px-5 py-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2">
            <Plus size={18} /> Post Challenge
          </Link>
        </div>
      </motion.header>

      {/* Edit Profile Panel */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <div className="bg-card border border-primary/20 rounded-3xl p-8 shadow-xl shadow-primary/5">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Edit3 size={20} className="text-primary" />
                Customize Developer Profile
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Professional Bio</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none text-sm"
                      placeholder="Tell the community about yourself..."
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Expertise & Skills</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                      placeholder="React, Node.js, GraphQL, etc. (comma separated)"
                      value={editData.skills}
                      onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-2">Separate skills with commas</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Discard
                  </button>
                  <button 
                    disabled={updateProfileMutation.isLoading}
                    type="submit"
                    className="btn-primary px-8 py-2.5 flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {updateProfileMutation.isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <><Save size={18} /> Update Profile</>
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
          className="mb-12 p-6 bg-muted/20 rounded-3xl border border-border/50"
        >
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Professional Bio</h3>
          <p className="text-base font-semibold leading-relaxed italic text-foreground/80">"{profile.bio}"</p>
          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.skills.map((skill, i) => (
                <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider rounded-md border border-primary/20">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Ranks & Engineering Metrics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Stats Summary Grid */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-6">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full"
          >
            {stats.map((stat, i) => (
              <motion.div variants={item} key={i} className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm flex items-center gap-5 group">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-115 transition-transform duration-300`}>
                  <stat.icon size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Badges Preview Section */}
          <div className="bg-card p-6 rounded-3xl border border-border/50 w-full h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Achievements Unlocked</h3>
              {profile?.badges?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {profile.badges.map((badge, idx) => (
                    <div key={idx} className="p-4 bg-muted/40 border border-border/50 rounded-2xl flex flex-col items-center text-center group hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Trophy size={20} className="fill-yellow-500/10" />
                      </div>
                      <p className="text-xs font-bold text-foreground mb-1">{badge.name}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-xs font-semibold">
                  Solve issues and review code to earn badges!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Engineering Radar Chart */}
        <div className="w-full flex justify-center">
          <EngineeringRadarChart stats={profile} />
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-border/50 mb-8 gap-6 text-sm font-bold select-none">
        <button 
          onClick={() => setActiveTab("kanban")}
          className={`pb-4 border-b-2 flex items-center gap-2 px-1 ${
            activeTab === "kanban" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Kanban size={16} /> My Contributions
        </button>
        <button 
          onClick={() => setActiveTab("management")}
          className={`pb-4 border-b-2 flex items-center gap-2 px-1 ${
            activeTab === "management" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers size={16} /> Managed Projects
        </button>
        <button 
          onClick={() => setActiveTab("timeline")}
          className={`pb-4 border-b-2 flex items-center gap-2 px-1 ${
            activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History size={16} /> Activity History
        </button>
      </div>

      {/* Tabs Content */}
      <AnimatePresence mode="wait">
        {activeTab === "kanban" && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Column 1: Planned / Accepted */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Accepted Challenge</span>
                <span className="text-[10px] font-black bg-muted text-foreground px-2 py-0.5 rounded-full">{acceptedProjectsDetails.length}</span>
              </div>
              <div className="space-y-3.5">
                {acceptedProjectsDetails.length > 0 ? (
                  acceptedProjectsDetails.map((project) => (
                    <div key={project._id || project} className="bg-card p-5 border border-border/50 rounded-2xl space-y-4 hover:border-primary/40 transition-colors group">
                      <p className="font-bold text-sm leading-relaxed group-hover:text-primary transition-colors">{project.title || "Challenge"}</p>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-orange-500 font-bold bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10">{project.bounty || 100} XP</span>
                        <Link to={`/projects/${project._id || project}`} className="font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-0.5">
                          Start <ChevronRight size={10} />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-xs border-2 border-dashed border-border rounded-2xl bg-muted/10 font-semibold">
                    No active challenges.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: In Review / Testing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-black uppercase tracking-widest text-blue-500">In Review & Tests</span>
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">{reviewingSubmissions.length}</span>
              </div>
              <div className="space-y-3.5">
                {reviewingSubmissions.length > 0 ? (
                  reviewingSubmissions.map((sub) => (
                    <div key={sub._id} className="bg-card p-5 border border-border/50 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20">{sub.status}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-sm leading-relaxed">{sub.project?.title || "Project Solution"}</p>
                      <div className="flex items-center gap-2">
                        {sub.prNumber && (
                          <a href={sub.prUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-muted-foreground hover:text-foreground flex items-center gap-1 bg-muted px-2.5 py-1 rounded border border-border">
                            <Github size={12} /> PR #{sub.prNumber}
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-xs border-2 border-dashed border-border rounded-2xl bg-muted/10 font-semibold">
                    No active reviews.
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Changes Requested */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-black uppercase tracking-widest text-orange-500">Action Required</span>
                <span className="text-[10px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">{changesRequiredSubmissions.length}</span>
              </div>
              <div className="space-y-3.5">
                {changesRequiredSubmissions.length > 0 ? (
                  changesRequiredSubmissions.map((sub) => (
                    <div key={sub._id} className="bg-card p-5 border border-orange-500/30 dark:border-orange-500/20 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded border border-orange-500/20">Refactor</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-sm leading-relaxed">{sub.project?.title || "Project Solution"}</p>
                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <a href={sub.prUrl} target="_blank" rel="noreferrer" className="font-black text-primary hover:underline flex items-center gap-0.5">
                          View Feedback <ExternalLink size={10} />
                        </a>
                        <Link to={`/projects/${sub.project?._id}`} className="text-muted-foreground hover:text-foreground font-bold">Resubmit</Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-xs border-2 border-dashed border-border rounded-2xl bg-muted/10 font-semibold">
                    No actions pending.
                  </div>
                )}
              </div>
            </div>

            {/* Column 4: Completed / Merged */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Merged / Completed</span>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">{completedSubmissions.length}</span>
              </div>
              <div className="space-y-3.5">
                {completedSubmissions.length > 0 ? (
                  completedSubmissions.map((sub) => (
                    <div key={sub._id} className="bg-card p-5 border border-emerald-500/20 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-colors group">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded border border-emerald-500/20">{sub.status}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-sm leading-relaxed group-hover:text-emerald-500 transition-colors">{sub.project?.title || "Project Solution"}</p>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">+200 XP Bounty</span>
                        {sub.prNumber && (
                          <a href={sub.prUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                            <Github size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-xs border-2 border-dashed border-border rounded-2xl bg-muted/10 font-semibold">
                    No solutions completed.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "management" && (
          <motion.div
            key="management"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4 max-w-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Managed Challenges</span>
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">{ownedProjects.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ownedProjects.length > 0 ? (
                ownedProjects.map((project) => (
                  <div key={project._id} className="bg-card p-6 border border-primary/20 rounded-2xl space-y-4 group relative">
                    <div className="flex justify-between items-start">
                      <Link to={`/projects/${project._id}`} className="font-bold text-base leading-relaxed hover:text-primary transition-colors line-clamp-2">{project.title}</Link>
                      <button 
                        onClick={() => handleDeleteProject(project._id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2">
                      <span className="text-muted-foreground font-black uppercase tracking-widest">{project.difficulty}</span>
                      <Link to={`/projects/${project._id}`} className="btn-primary py-2 px-4 text-[10px] font-black uppercase tracking-wider">Manage Submissions</Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-2xl bg-muted/10 font-semibold">
                  No challenges posted yet.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-card p-8 rounded-3xl border border-border/50 space-y-6"
          >
            <h3 className="text-base font-bold flex items-center gap-2 border-b border-border/50 pb-4">
              <Activity size={18} className="text-primary" />
              Activity Feed & Timelines
            </h3>

            {submissions.length > 0 ? (
              <div className="relative border-l border-border pl-6 space-y-8 ml-3 py-2">
                {submissions.map((sub) => (
                  <div key={sub._id} className="relative">
                    {/* Ring timeline bullet */}
                    <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-background border-4 border-primary shadow-sm" />
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-foreground">{sub.project?.title || "Open Source Solution"}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground">{new Date(sub.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                        Solution branch "{sub.branchName}" validated and raised PR. Status is currenty{" "}
                        <span className="font-bold text-primary">{sub.status}</span>.
                      </p>
                      {sub.testOutput && (
                        <pre className="mt-3 p-4 bg-muted/50 border border-border/50 text-[10px] font-mono leading-relaxed text-muted-foreground rounded-xl max-w-xl max-h-[100px] overflow-y-auto">
                          {sub.testOutput}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm font-semibold">
                No activity logs available yet. Accept a challenge!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;