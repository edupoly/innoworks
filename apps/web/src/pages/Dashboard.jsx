import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import { 
  Trophy, 
  Users, 
  Send, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  Activity,
  Award,
  AlertCircle,
  Trash2,
  ExternalLink,
  Github,
  ShieldCheck,
  Edit3,
  X,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
  const { user: authUser } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
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

  const submittedIds = new Set(profile?.submissions?.map(s => s.project?._id || s.project));
  const acceptedCount = profile?.acceptedProjects?.filter(id => !submittedIds.has(id)).length || 0;
  const pendingCount = profile?.submissions?.filter(s => s.status === 'PENDING' || s.status === 'TESTING').length || 0;
  const approvedCount = profile?.submissions?.filter(s => s.status === 'APPROVED').length || 0;

  const stats = [
    { label: "Total XP", value: profile?.xp || 0, icon: Trophy, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-500/10" },
    { label: "Accepted", value: acceptedCount, icon: ShieldCheck, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/10" },
    { label: "Approved", value: approvedCount, icon: Award, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
  ];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-medium">Synchronizing your dashboard...</p>
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
            <h1 className="text-3xl font-black tracking-tight">Welcome back, {profile?.username}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1.5 font-medium">
              <Award size={16} className="text-primary" />
              <span>{profile?.role || 'Contributor'} • Level {Math.floor((profile?.xp || 0) / 100) + 1}</span>
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
            Post Challenge
          </Link>
        </div>
      </motion.header>

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
                Customize Your Identity
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Professional Bio</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                      placeholder="Tell the community about yourself..."
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expertise & Skills</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      placeholder="React, Node.js, Cloud, etc. (comma separated)"
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
          className="mb-12 p-8 bg-muted/30 rounded-3xl border border-border/50"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">About You</h3>
          <p className="text-lg font-medium leading-relaxed italic text-foreground/80">"{profile.bio}"</p>
          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {profile.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-md border border-primary/20">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
      >
        {stats.map((stat, i) => (
          <motion.div variants={item} key={i} className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5 group">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-12">
          {/* Your Submissions */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Your Submissions
              </h2>
            </div>
            
            <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              {profile?.submissions?.length > 0 ? (
                profile.submissions.map((submission) => (
                  <div key={submission._id} className="p-6 flex items-center justify-between hover:bg-muted/40 transition-colors border-b last:border-0 border-border/50 group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-background group-hover:text-primary transition-colors">
                        <Github size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{submission.project?.title || 'Unknown Project'}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-semibold text-muted-foreground">{new Date(submission.createdAt).toLocaleDateString()}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span className={`text-xs font-black uppercase tracking-wider ${
                            submission.status === 'APPROVED' ? 'text-emerald-500' :
                            submission.status === 'REJECTED' ? 'text-red-500' :
                            submission.status === 'TESTING' ? 'text-blue-500' : 'text-orange-500'
                          }`}>{submission.status}</span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/projects/${submission.project?._id}`} className="p-2 hover:bg-background border border-transparent hover:border-border rounded-full transition-all text-muted-foreground group-hover:text-foreground">
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Send size={40} className="mx-auto text-muted mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">No missions accepted yet.</p>
                  <Link to="/projects" className="text-primary font-bold text-sm hover:underline mt-2 inline-block">Browse Challenges</Link>
                </div>
              )}
            </div>
          </section>

          {/* Your Posted Challenges */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Send size={20} className="text-primary" />
                Challenges You Posted
              </h2>
            </div>
            
            <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              {profile?.ownedProjects?.length > 0 ? (
                profile.ownedProjects.map((project) => (
                  <div key={project._id} className="p-6 flex items-center justify-between hover:bg-muted/40 transition-colors border-b last:border-0 border-border/50 group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Activity size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{project.title}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            project.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            project.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>{project.difficulty}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span className="text-xs font-bold text-orange-600">{project.bounty} XP</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={project.repoUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-background border border-border rounded-full transition-all text-muted-foreground hover:text-primary">
                        <ExternalLink size={18} />
                      </a>
                      <button 
                        onClick={() => handleDeleteProject(project._id)}
                        className="p-2 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-full transition-all text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Activity size={40} className="mx-auto text-muted mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">You haven't posted any challenges yet.</p>
                  <Link to="/projects/new" className="text-primary font-bold text-sm hover:underline mt-2 inline-block">Post Your First Challenge</Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar / Leaderboard Preview */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold">Your Status</h2>
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 p-4 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
              <Trophy size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-primary-foreground/80 text-sm font-bold uppercase tracking-widest mb-2">XP Rank</p>
              <h3 className="text-4xl font-black mb-4">Elite</h3>
              <p className="text-base leading-relaxed mb-8 text-white/90 font-medium">You're making great progress. Keep solving missions to unlock more rewards!</p>
              <Link to="/leaderboard" className="block w-full py-3.5 bg-white text-primary rounded-xl font-bold hover:bg-opacity-90 active:scale-[0.98] transition-all shadow-lg text-sm text-center">
                View Leaderboard
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;