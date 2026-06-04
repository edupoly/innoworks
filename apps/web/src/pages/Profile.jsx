import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { 
  Trophy, 
  Award, 
  Github, 
  ExternalLink, 
  Activity, 
  Layers, 
  CheckCircle2, 
  ChevronLeft,
  Mail,
  MapPin,
  Link as LinkIcon,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { EngineeringRadarChart } from "../components/EngineeringRadarChart";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const response = await api.get(`/users/profile/${username}`);
      return response.data;
    },
    enabled: !!username
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold font-mono text-xs uppercase tracking-widest">Decoding Developer Identity...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="py-20 text-center">
      <h2 className="text-3xl font-black mb-4 tracking-tight">Developer Not Found</h2>
      <p className="text-muted-foreground mb-8">The engineer you are looking for has not joined the Innoworks yet.</p>
      <button onClick={() => navigate("/leaderboard")} className="btn-primary px-8">Back to Leaderboard</button>
    </div>
  );

  return (
    <div className="py-12 max-w-6xl mx-auto px-4">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Identity */}
        <div className="space-y-6">
          <div className="bg-card border border-border/50 rounded-3xl p-8 text-center space-y-6 shadow-sm">
            <div className="relative mx-auto w-32 h-32 rounded-3xl bg-gradient-to-tr from-primary to-blue-400 p-[4px] shadow-xl shadow-primary/20">
              <div className="w-full h-full rounded-[24px] bg-background flex items-center justify-center overflow-hidden">
                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-1 rounded-lg border-4 border-card shadow-lg">
                LVL {profile.level}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight">{profile.username}</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {profile.roles?.join(" / ") || "Innoworks Contributor"}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {profile.skills?.map((skill, i) => (
                <span key={i} className="px-2 py-1 bg-muted text-muted-foreground text-[9px] font-black uppercase rounded border border-border/50">
                  {skill}
                </span>
              ))}
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed italic border-t border-border/30 pt-6">
                "{profile.bio}"
              </p>
            )}

            <div className="pt-6 border-t border-border/30 space-y-3">
              <a 
                href={profile.profileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn-secondary w-full flex items-center justify-center gap-2 text-xs font-black py-2.5"
              >
                <Github size={16} /> GitHub Profile
              </a>
            </div>
          </div>

          {/* Gamification Stats */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 grid grid-cols-2 gap-4 shadow-sm">
             <div className="p-4 bg-muted/30 rounded-2xl border border-border/30 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mb-1">Reputation</p>
                <p className="text-xl font-black text-indigo-500">{profile.reputationScore}</p>
             </div>
             <div className="p-4 bg-muted/30 rounded-2xl border border-border/30 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mb-1">Total XP</p>
                <p className="text-xl font-black text-yellow-500">{profile.xp}</p>
             </div>
             <div className="p-4 bg-muted/30 rounded-2xl border border-border/30 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mb-1">Accepted</p>
                <p className="text-xl font-black text-emerald-500">{profile.acceptedProjects?.length || 0}</p>
             </div>
             <div className="p-4 bg-muted/30 rounded-2xl border border-border/30 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mb-1">Merged</p>
                <p className="text-xl font-black text-blue-500">{profile.submissions?.filter(s => s.status === 'MERGED').length || 0}</p>
             </div>
          </div>
        </div>

        {/* Right Column: Contributions & Experience */}
        <div className="lg:col-span-2 space-y-8">
          {/* Engineering Metrics Section */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Engineering Performance
            </h3>
            <div className="flex justify-center bg-card border border-border/50 rounded-[3rem] p-8 shadow-sm">
              <EngineeringRadarChart stats={profile} size={280} />
            </div>
          </section>

          {/* Achievements Section */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Award size={16} className="text-primary" />
              Verified Achievements
            </h3>
            {profile.badges?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.badges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-2xl group hover:border-yellow-500/30 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0 text-2xl">
                      {badge.icon || <Trophy size={24} className="fill-yellow-500/10" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{badge.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-muted/10 border border-dashed border-border rounded-2xl text-xs font-bold text-muted-foreground">
                No achievements unlocked yet.
              </div>
            )}
          </section>

          {/* Submissions Section */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Solution Portfolio
            </h3>
            <div className="space-y-4">
              {profile.submissions?.length > 0 ? (
                profile.submissions.map((sub) => (
                  <div key={sub._id} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/20 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-black">{sub.project?.title || "Project Solution"}</p>
                        <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2">
                          <CheckCircle2 size={12} className={sub.status === 'MERGED' ? "text-blue-500" : "text-muted-foreground"} />
                          {sub.status.replace('_', ' ')} • {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                         {sub.prUrl && (
                           <a 
                             href={sub.prUrl} 
                             target="_blank" 
                             rel="noreferrer"
                             className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg border border-border/50"
                           >
                             <Github size={14} /> Pull Request
                           </a>
                         )}
                         <button 
                           onClick={() => navigate(`/projects/${sub.project?._id}`)}
                           className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                         >
                           <ExternalLink size={14} />
                         </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-muted/10 border border-dashed border-border rounded-2xl text-xs font-bold text-muted-foreground">
                  No submissions published to the Innoworks yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
