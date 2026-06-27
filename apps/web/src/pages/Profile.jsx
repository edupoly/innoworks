import { useParams, useNavigate } from "react-router-dom";
import { 
  Trophy, 
  Github, 
  ExternalLink, 
  Activity, 
  CheckCircle2, 
  ChevronLeft,
  Fingerprint,
  ShieldCheck,
  Flame,
  Star,
  Verified
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EngineeringRadarChart } from "../components/EngineeringRadarChart";
import { useGetUserProfileQuery } from "../store/api/usersApiSlice";
import ActivityHeatmap from "../components/ui/ActivityHeatmap";
import { useGetUserEvaluationsQuery } from "../store/api/evaluationsApiSlice";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useGetUserProfileQuery(username, {
    skip: !username,
  });

  const { data: evaluations } = useGetUserEvaluationsQuery(username, {
    skip: !username,
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
      </div>
      <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[9px] animate-pulse">Syncing Node...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="py-24 text-center max-w-md mx-auto space-y-8 px-6">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto border border-destructive/20 shadow-xl">
         <ShieldCheck size={32} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tighter uppercase tracking-[0.1em] text-gradient">Identity_Not_Found</h2>
        <p className="text-muted-foreground font-medium leading-relaxed opacity-60 uppercase text-[9px] tracking-[0.2em]">Engineer not synchronized with grid.</p>
      </div>
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/leaderboard")} 
        className="btn-primary w-full py-3 rounded-xl text-[9px] uppercase tracking-[0.2em]"
      >
        Back to Leaderboard
      </motion.button>
    </div>
  );

  const stats = [
    { label: "Rating", value: profile.overallRating ? `${profile.overallRating}/10` : 'N/A', color: "text-amber-500", bg: "bg-amber-500/10", icon: Star },
    { label: "Current Streak", value: `${profile.currentStreak || 0} Days`, color: "text-orange-500", bg: "bg-orange-500/10", icon: Flame },
    { label: "Verified", value: profile.verifiedContributionsCount || 0, color: "text-green-500", bg: "bg-green-500/10", icon: Verified },
    { label: "Aggregate XP", value: profile.xp, color: "text-indigo-500", bg: "bg-indigo-500/10", icon: Trophy }
  ];

  return (
    <div className="py-8 max-w-7xl mx-auto px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Ambient background effect */}
      <div className="absolute top-0 right-0 w-[40%] h-[600px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.05),transparent_70%)] -z-10 pointer-events-none" />

      <div className="relative z-10">
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50 shadow-sm"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Leaderboard
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Identity Core Column */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-8 text-center space-y-8 relative overflow-hidden group border border-border/40 bg-card rounded-2xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative mx-auto w-32 h-32 group-hover:scale-105 transition-transform duration-700">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary via-indigo-500 to-blue-400 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-primary to-indigo-400 p-[2.5px] shadow-xl relative z-10 overflow-hidden">
                  <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden border-[4px] border-background shadow-inner">
                    <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[9px] font-black px-3 py-1 rounded-lg border-2 border-background shadow-lg z-20">
                  LVL {profile.level}
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tighter text-gradient leading-none uppercase">@{profile.username}</h1>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">
                  {profile.role || "Engineering Node"}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {profile.skills?.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 bg-secondary/80 text-foreground text-[8px] font-black uppercase tracking-widest rounded-lg border border-border/50 shadow-sm hover:border-primary/30 transition-all">
                    {skill}
                  </span>
                ))}
              </div>

              {profile.bio && (
                <div className="relative pt-8 border-t border-border/30">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-card px-3 text-primary opacity-20">
                    <Fingerprint size={20} />
                  </div>
                  <p className="text-[13px] text-foreground/80 leading-relaxed italic font-medium tracking-tight">
                    "{profile.bio}"
                  </p>
                </div>
              )}

              <div className="pt-1">
                <motion.a 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={profile.profileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary w-full py-3.5 text-[9px] uppercase tracking-[0.2em] gap-2.5 shadow-lg shadow-primary/20 rounded-xl"
                >
                  <Github size={16} /> Repository
                </motion.a>
              </div>
            </motion.div>

            {/* Performance Matrices Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
               {stats.map((s, i) => (
                 <div key={i} className="bg-card rounded-2xl p-5 flex flex-col items-center text-center gap-3 group bg-gradient-to-br from-card to-secondary/[0.01] border border-border/40 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 shadow-lg shadow-black/5 group-hover:scale-105 transition-all duration-500`}>
                       <s.icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 leading-none">{s.label}</p>
                      <p className="text-xl font-black tracking-tighter text-foreground tabular-nums leading-none">{s.value}</p>
                    </div>
                 </div>
               ))}
            </motion.div>
          </div>

          {/* Main Contribution Node */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Consistency Heatmap */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                <div className="w-1 h-1 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                  Consistency_Heatmap
                </h3>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/40 shadow-sm">
                <ActivityHeatmap activities={profile.dailyActivities || []} />
                <div className="mt-4 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Longest Streak</p>
                        <p className="text-xs font-black text-foreground">{profile.longestStreak || 0} Days</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Monthly Consistency</p>
                        <p className="text-xs font-black text-foreground">{profile.monthlyConsistency || 0}%</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Flame size={12} /> {profile.currentStreak || 0} Day Fire
                      </p>
                   </div>
                </div>
              </div>
            </section>

            {/* Evaluation Registry */}
            <section className="space-y-6">
              <div className="flex items-center justify-between ml-2">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                    Evaluation_Reports
                  </h3>
                </div>
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">{evaluations?.length || 0} LOGGED</span>
              </div>
              
              <div className="space-y-4">
                {evaluations?.length > 0 ? (
                  evaluations.map((ev) => (
                    <div key={ev._id} className="bg-card rounded-2xl p-6 border border-border/40 space-y-4 shadow-sm hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img src={ev.evaluator?.avatarUrl} alt="" className="w-8 h-8 rounded-lg border shadow-sm" />
                          <div>
                            <p className="text-xs font-black">Evaluated by @{ev.evaluator?.username}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">For {ev.project?.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xl font-black text-primary tracking-tighter">{ev.overallScore}/10</div>
                           <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter opacity-40">{new Date(ev.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/70 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-4">"{ev.feedback}"</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        {Object.entries(ev.categories).map(([key, val]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-[7px] font-black text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${val * 10}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center bg-card rounded-2xl border-2 border-dashed border-border/50">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">No official evaluations synchronized.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Visual Performance Matrix */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                <div className="w-1 h-1 rounded-full bg-primary shadow-sm shadow-primary/50" />
                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                  Matrix_Diagnostics
                </h3>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl p-8 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border border-border/40 shadow-sm"
              >
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="flex justify-center relative z-10">
                  <EngineeringRadarChart stats={profile} size={300} />
                </div>
              </motion.div>
            </section>

            {/* Achievement Node Registry */}
            <section className="space-y-6">
              <div className="flex items-center justify-between ml-2">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                    Achievements
                  </h3>
                </div>
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">{profile.badges?.length || 0} SECURED</span>
              </div>
              
              <AnimatePresence mode="wait">
                {profile.badges?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.badges.map((badge, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ y: -3, scale: 1.01 }}
                        className="bg-card rounded-2xl p-5 flex items-center gap-4 group hover:border-primary/30 hover:bg-amber-500/[0.01] border border-border/40 shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 text-2xl shadow-xl shadow-black/5 group-hover:scale-105 transition-transform duration-500">
                          {badge.icon || <Trophy size={20} className="fill-amber-500/20" />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-tight text-foreground tracking-tighter">{badge.name}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 leading-relaxed line-clamp-2">{badge.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-16 text-center bg-card rounded-2xl border-2 border-dashed border-border/50 space-y-3">
                    <Trophy size={40} className="mx-auto text-muted-foreground opacity-10" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">No identity milestones secured.</p>
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Solution Portfolio Timeline */}
            <section className="space-y-6 pb-8">
              <div className="flex items-center justify-between ml-2">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                    Portfolio
                  </h3>
                </div>
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">{profile.submissions?.length || 0} DEPLOYED</span>
              </div>
              
              <div className="space-y-4">
                {profile.submissions?.length > 0 ? (
                  profile.submissions.map((sub) => (
                    <motion.div 
                      key={sub._id} 
                      whileHover={{ x: 3 }}
                      className="bg-card rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 border border-border/40 shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-5 min-w-0 flex-1">
                          <div className={`w-12 h-12 rounded-xl ${sub.status === 'MERGED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'} flex items-center justify-center shrink-0 shadow-lg shadow-black/5 group-hover:scale-105 transition-transform duration-500`}>
                             <CheckCircle2 size={24} />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <h4 className="text-lg font-black tracking-tight text-foreground truncate uppercase tracking-tighter">{sub.project?.title || "Classified Protocol Solution"}</h4>
                            <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                              <span className={sub.status === 'MERGED' ? "text-emerald-500" : "text-primary"}>{sub.status.replace('_', ' ')}</span>
                              <div className="w-1 h-1 rounded-full bg-border" />
                              <span>{new Date(sub.createdAt).toLocaleDateString()} • ID: {sub._id.slice(-6)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           {sub.prUrl && (
                             <motion.a 
                               whileHover={{ scale: 1.02 }}
                               whileTap={{ scale: 0.98 }}
                               href={sub.prUrl} 
                               target="_blank" 
                               rel="noreferrer"
                               className="px-4 py-2 bg-secondary/80 border border-border/50 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] hover:bg-secondary hover:text-primary transition-all flex items-center gap-2 shadow-sm"
                             >
                               <Github size={14} /> Pull Sequence
                             </motion.a>
                           )}
                           <motion.button 
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             onClick={() => navigate(`/projects/${sub.project?._id}`)}
                             className="p-2.5 rounded-lg bg-secondary/80 text-muted-foreground hover:text-primary border border-border/50 shadow-sm transition-all"
                           >
                             <ExternalLink size={16} />
                           </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-16 text-center bg-card rounded-2xl border-2 border-dashed border-border/50 space-y-4">
                    <Activity size={40} className="mx-auto text-muted-foreground opacity-10" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">No portfolio projects found.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
