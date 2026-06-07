import { useParams, useNavigate } from "react-router-dom";
import { 
  Trophy, 
  Github, 
  ExternalLink, 
  Activity, 
  CheckCircle2, 
  ChevronLeft,
  Target,
  Fingerprint,
  Cpu,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EngineeringRadarChart } from "../components/EngineeringRadarChart";
import { useGetUserProfileQuery } from "../store/api/usersApiSlice";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useGetUserProfileQuery(username, {
    skip: !username,
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-48 space-y-8">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 w-20 h-20 border-t-2 border-primary rounded-full animate-spin" />
      </div>
      <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Decrypting Developer Node...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="py-32 text-center max-w-md mx-auto space-y-10 px-6">
      <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-[2rem] flex items-center justify-center mx-auto border border-destructive/20 shadow-xl shadow-destructive/5">
         <ShieldCheck size={40} />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black tracking-tighter uppercase tracking-[0.1em] text-gradient">Identity_Not_Found</h2>
        <p className="text-muted-foreground font-medium leading-relaxed opacity-60 uppercase text-[10px] tracking-[0.3em]">The requested engineer has not synchronized with the Innoworks grid yet.</p>
      </div>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/leaderboard")} 
        className="btn-primary w-full py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em]"
      >
        Return to Registry
      </motion.button>
    </div>
  );

  const stats = [
    { label: "Reputation", value: profile.reputationScore, color: "text-indigo-500", bg: "bg-indigo-500/10", icon: Sparkles },
    { label: "Aggregate XP", value: profile.xp, color: "text-amber-500", bg: "bg-amber-500/10", icon: Trophy },
    { label: "Missions", value: profile.acceptedProjects?.length || 0, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Target },
    { label: "Nodes Merged", value: profile.submissions?.filter(s => s.status === 'MERGED').length || 0, color: "text-primary", bg: "bg-primary/10", icon: Cpu }
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Ambient background effect */}
      <div className="absolute top-0 right-0 w-[40%] h-[600px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.05),transparent_70%)] -z-10 pointer-events-none" />

      <div className="relative z-10">
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all group bg-secondary/50 px-4 py-2 rounded-xl border border-border/50 shadow-sm"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Protocol Registry
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Identity Core Column */}
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-10 text-center space-y-10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative mx-auto w-40 h-40 group-hover:scale-105 transition-transform duration-700">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary via-indigo-500 to-blue-400 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative w-full h-full rounded-[3rem] bg-gradient-to-tr from-primary to-indigo-400 p-[3px] shadow-2xl relative z-10 overflow-hidden">
                  <div className="w-full h-full rounded-[2.8rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background shadow-inner">
                    <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground text-[11px] font-black px-4 py-1.5 rounded-2xl border-4 border-background shadow-2xl z-20">
                  LVL {profile.level}
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tighter text-gradient leading-none uppercase">@{profile.username}</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-60">
                  {profile.role || "Engineering Node"}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2.5">
                {profile.skills?.map((skill) => (
                  <span key={skill} className="px-3.5 py-1.5 bg-secondary/80 text-foreground text-[9px] font-black uppercase tracking-widest rounded-xl border border-border/50 shadow-sm hover:border-primary/30 transition-all">
                    {skill}
                  </span>
                ))}
              </div>

              {profile.bio && (
                <div className="relative pt-10 border-t border-border/30">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-card px-4 text-primary opacity-20">
                    <Fingerprint size={24} />
                  </div>
                  <p className="text-[14px] text-foreground/80 leading-relaxed italic font-medium tracking-tight">
                    "{profile.bio}"
                  </p>
                </div>
              )}

              <div className="pt-2">
                <motion.a 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  href={profile.profileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary w-full py-4 text-[10px] uppercase tracking-[0.3em] gap-3 shadow-xl shadow-primary/20"
                >
                  <Github size={18} /> Open Repository
                </motion.a>
              </div>
            </motion.div>

            {/* Performance Matrices Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-6"
            >
               {stats.map((s, i) => (
                 <div key={i} className="card-premium p-6 flex flex-col items-center text-center gap-4 group bg-gradient-to-br from-card to-secondary/[0.02]">
                    <div className={`w-12 h-12 rounded-[1.25rem] ${s.bg} ${s.color} flex items-center justify-center shrink-0 shadow-xl shadow-black/5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                       <s.icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60 leading-none">{s.label}</p>
                      <p className="text-2xl font-black tracking-tighter text-foreground tabular-nums">{s.value}</p>
                    </div>
                 </div>
               ))}
            </motion.div>
          </div>

          {/* Main Contribution Node */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Visual Performance Matrix */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 ml-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/60">
                  Engineering_Matrix_Diagnostics
                </h3>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="card-premium p-10 lg:p-12 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5"
              >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="flex justify-center relative z-10">
                  <EngineeringRadarChart stats={profile} size={340} />
                </div>
              </motion.div>
            </section>

            {/* Achievement Node Registry */}
            <section className="space-y-8">
              <div className="flex items-center justify-between ml-4">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/60">
                    Verified_Achievement_Nodes
                  </h3>
                </div>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">{profile.badges?.length || 0} SECURED</span>
              </div>
              
              <AnimatePresence mode="wait">
                {profile.badges?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {profile.badges.map((badge, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="card-premium p-6 flex items-center gap-6 group hover:border-amber-500/30 hover:bg-amber-500/[0.02]"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 text-3xl shadow-xl shadow-black/5 group-hover:scale-110 transition-transform duration-500">
                          {badge.icon || <Trophy size={28} className="fill-amber-500/20" />}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-sm font-black uppercase tracking-tight text-foreground tracking-tighter">{badge.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 leading-relaxed line-clamp-2">{badge.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center glass-card border-2 border-dashed border-border/50 rounded-[3rem] space-y-4">
                    <Trophy size={56} className="mx-auto text-muted-foreground opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">No identity milestones secured in current sector.</p>
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Solution Portfolio Timeline */}
            <section className="space-y-8 pb-12">
              <div className="flex items-center justify-between ml-4">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/60">
                    Mission_Execution_Portfolio
                  </h3>
                </div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{profile.submissions?.length || 0} DEPLOYED</span>
              </div>
              
              <div className="space-y-6">
                {profile.submissions?.length > 0 ? (
                  profile.submissions.map((sub) => (
                    <motion.div 
                      key={sub._id} 
                      whileHover={{ x: 5 }}
                      className="card-premium p-8 relative overflow-hidden group hover:border-primary/30"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="flex items-center gap-6 min-w-0 flex-1">
                          <div className={`w-14 h-14 rounded-2xl ${sub.status === 'MERGED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'} flex items-center justify-center shrink-0 shadow-xl shadow-black/5 group-hover:scale-110 transition-transform duration-500`}>
                             <CheckCircle2 size={28} />
                          </div>
                          <div className="space-y-2 min-w-0">
                            <h4 className="text-xl font-black tracking-tight text-foreground truncate uppercase tracking-tighter">{sub.project?.title || "Classified Protocol Solution"}</h4>
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                              <span className={sub.status === 'MERGED' ? "text-emerald-500" : "text-primary"}>{sub.status.replace('_', ' ')}</span>
                              <div className="w-1 h-1 rounded-full bg-border" />
                              <span>{new Date(sub.createdAt).toLocaleDateString()} • MISSION_ID: {sub._id.slice(-6)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                           {sub.prUrl && (
                             <motion.a 
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                               href={sub.prUrl} 
                               target="_blank" 
                               rel="noreferrer"
                               className="px-6 py-3 bg-secondary/80 border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary hover:text-primary transition-all flex items-center gap-3 shadow-sm group-hover:shadow-primary/10"
                             >
                               <Github size={16} /> Open Pull Sequence
                             </motion.a>
                           )}
                           <motion.button 
                             whileHover={{ scale: 1.1, rotate: 5 }}
                             whileTap={{ scale: 0.9 }}
                             onClick={() => navigate(`/projects/${sub.project?._id}`)}
                             className="p-3.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-primary border border-border/50 shadow-sm transition-all group-hover:shadow-primary/10"
                           >
                             <ExternalLink size={18} />
                           </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-24 text-center glass-card border-2 border-dashed border-border/50 rounded-[3rem] space-y-6">
                    <Activity size={56} className="mx-auto text-muted-foreground opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Portfolio registry offline. Initiate contribution cycle to populate standings.</p>
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

