import { useState, useMemo, memo } from "react";
import { Trophy, Medal, Crown, TrendingUp, User, Calendar, Award, Star, Zap, Activity, ChevronRight, Search, Target, Fingerprint, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useGetLeaderboardQuery } from "../store/api/usersApiSlice";
import { useDebounce } from "../hooks/useDebounce";

const Metric = memo(({ label, value }) => {
  return (
    <div className="text-center w-14">
      <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">{label}</p>
      <div className="relative w-full h-1.5 bg-secondary rounded-full overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value || 0}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        />
      </div>
      <p className="text-[9px] font-black mt-2 tabular-nums">{value || 0}%</p>
    </div>
  );
});
Metric.displayName = "Metric";

const LeaderboardRow = memo(({ user, rank, period }) => {
  if (!user || !user.username) return null;

  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className="card-premium p-8 flex flex-col md:flex-row md:items-center justify-between gap-10 group relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/[0.02]"
    >
      <div className="flex items-center gap-10">
        <div className="w-12 h-12 rounded-[1.25rem] bg-secondary/80 flex items-center justify-center font-black text-muted-foreground border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 shadow-sm tabular-nums">
          {rank}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative group/avatar">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-primary/20 to-indigo-400/20 p-[1.5px] shrink-0 border border-border/50 group-hover:border-primary/40 transition-all duration-500 overflow-hidden shadow-xl">
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background rounded-lg border border-border/50 flex items-center justify-center shadow-lg group-hover:border-primary/30 transition-colors">
               <Fingerprint size={12} className="text-primary opacity-60" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black tracking-tighter flex items-center gap-3">
              {user.username}
              {user.badges?.length > 0 && (
                <span className="text-[8px] font-black uppercase bg-primary text-primary-foreground px-2.5 py-1 rounded-lg shadow-lg shadow-primary/20 tracking-widest">
                  {user.badges[0].icon || "🏆"} {user.badges[0].name}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-primary tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">
                <Zap size={10} className="fill-primary" />
                LVL {user.level}
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                {user.xp} XP_AGGREGATE
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-16 justify-between md:justify-end">
        {period === 'all_time' && (
          <div className="hidden lg:flex items-center gap-8 border-r border-border/30 pr-16 py-1">
            <Metric label="Collab" value={user.collaborationScore} />
            <Metric label="Inno" value={user.innovationScore} />
            <Metric label="Cons" value={user.consistencyScore} />
            <Metric label="Perf" value={user.perfectionScore} />
          </div>
        )}
        
        <div className="text-right min-w-[100px] space-y-1">
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50">Reputation</p>
          <p className="text-3xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors tabular-nums">{user.reputationScore}</p>
        </div>
        
        <Link 
          to={`/profile/${user.username}`}
          className="p-4 rounded-2xl bg-secondary/80 text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm group-hover:shadow-primary/20"
        >
          <ChevronRight size={20} />
        </Link>
      </div>
    </motion.div>
  );
});
LeaderboardRow.displayName = "LeaderboardRow";

const PodiumCard = memo(({ user, rank, color, bgColor, borderColor, featured }) => {
  if (!user || !user.username) return null;

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`relative glass-card border-2 ${borderColor} rounded-[3.5rem] p-12 text-center shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] transition-all group ${featured ? 'md:pb-20 border-primary/20' : 'scale-95'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
      
      {featured && (
        <div className="absolute inset-x-0 -top-10 flex justify-center z-20">
          <div className="px-8 py-3 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-[0_20px_40px_-10px_rgba(234,179,8,0.4)] flex items-center gap-3">
             <Crown size={16} className="fill-black" />
             Grand Champion
          </div>
        </div>
      )}
      
      <div className={`absolute -top-6 -left-6 w-16 h-16 ${bgColor} ${color} rounded-[1.5rem] flex items-center justify-center font-black text-2xl border-2 ${borderColor} shadow-2xl backdrop-blur-2xl rotate-[-12deg] group-hover:rotate-0 transition-all duration-700 z-10`}>
        #{rank}
      </div>

      <div className={`relative mx-auto w-40 h-40 rounded-[3rem] bg-gradient-to-tr from-primary via-indigo-500 to-blue-400 p-[3.5px] mb-10 group-hover:scale-110 transition-transform duration-700 shadow-2xl relative`}>
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-full h-full rounded-[2.8rem] bg-background flex items-center justify-center overflow-hidden relative z-10 border-4 border-background">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <User size={64} className="text-primary opacity-20" />
          )}
        </div>
        <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground border-4 border-background px-4 py-1.5 rounded-2xl shadow-xl z-20">
          <span className="text-[11px] font-black tracking-widest uppercase">LVL {user.level}</span>
        </div>
      </div>

      <div className="space-y-2 mb-10">
        <h3 className="text-3xl font-black tracking-tighter group-hover:text-primary transition-colors uppercase leading-none">{user.username}</h3>
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">Elite Protocol Contributor</p>
      </div>
      
      <div className="flex flex-col items-center gap-6">
         <div className="px-6 py-2.5 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3 shadow-sm">
           <Trophy size={14} className="text-amber-500 fill-amber-500/20" />
           <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">{user.xp} XP_SYNC</span>
         </div>
         
         <div className="grid grid-cols-2 gap-10 w-full pt-8 border-t border-border/30">
            <div className="text-center space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60 leading-none">Reputation</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{user.reputationScore}</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60 leading-none">Badges</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{user.badges?.length || 0}</p>
            </div>
         </div>
      </div>
      
      <Link to={`/profile/${user.username}`} className="mt-12 btn-primary w-full py-5 text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] flex items-center justify-center gap-3 group/btn shadow-xl shadow-primary/20">
        Access Node <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
});
PodiumCard.displayName = "PodiumCard";

const Leaderboard = () => {
  const [period, setPeriod] = useState("all_time");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: users, isLoading } = useGetLeaderboardQuery(period);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!debouncedSearch) return users;
    return users.filter(u => 
      u.username.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [users, debouncedSearch]);

  const periods = [
    { id: "all_time", label: "Cycle: Global", icon: Trophy },
    { id: "weekly", label: "Cycle: Weekly", icon: Calendar },
    { id: "monthly", label: "Cycle: Monthly", icon: Award }
  ];

  const topThree = useMemo(() => filteredUsers.slice(0, 3), [filteredUsers]);
  const restOfUsers = useMemo(() => filteredUsers.slice(3), [filteredUsers]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 space-y-8">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-t-2 border-primary rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Scanning Global Standings...</p>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8 selection:bg-primary/20 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.04),transparent_70%)] -z-10" />

      <div className="relative z-10">
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-secondary/80 border border-border/50 text-primary text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-2xl shadow-xl mb-10"
          >
            <Activity size={14} className="animate-pulse" />
            Signal Analysis Active
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 text-gradient leading-none">
            Engineering Elite
          </h1>
          <p className="text-muted-foreground text-2xl max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            The global rankings of engineering excellence. Compete, contribute, and dominate the cluster.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-32">
          <div className="bg-secondary/30 backdrop-blur-3xl p-2 rounded-[2.5rem] flex flex-wrap justify-center gap-2 border border-border/50 shadow-2xl shadow-black/5">
            {periods.map((p) => {
              const isSel = period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`flex items-center gap-4 px-10 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-700 ${
                    isSel 
                      ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 border border-primary/20 scale-105" 
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <p.icon size={16} className={isSel ? "animate-glow" : ""} />
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="relative group min-w-[340px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search registry elite..."
              className="w-full pl-16 pr-8 py-5 bg-background/50 border border-border/50 rounded-[2rem] font-bold text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner backdrop-blur-3xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {topThree.length > 0 && !debouncedSearch && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-32 items-end px-4">
            {topThree[1] && (
              <div className="order-2 lg:order-1">
                <PodiumCard user={topThree[1]} rank={2} color="text-slate-400" bgColor="bg-slate-400/10" borderColor="border-slate-400/20" />
              </div>
            )}

            {topThree[0] && (
              <div className="order-1 lg:order-2 z-10">
                <PodiumCard user={topThree[0]} rank={1} color="text-yellow-500" bgColor="bg-yellow-500/10" borderColor="border-yellow-500/30" featured />
              </div>
            )}

            {topThree[2] && (
              <div className="order-3 lg:order-3">
                <PodiumCard user={topThree[2]} rank={3} color="text-amber-600" bgColor="bg-amber-600/10" borderColor="border-amber-600/20" />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-24">
          <AnimatePresence mode="popLayout">
            {debouncedSearch 
              ? filteredUsers.map((user, index) => (
                  <LeaderboardRow key={user._id || user.id} user={user} rank={index + 1} period={period} />
                ))
              : restOfUsers.map((user, index) => (
                  <LeaderboardRow key={user._id || user.id} user={user} rank={index + 4} period={period} />
                ))
            }
          </AnimatePresence>
        </div>

        {(!users || users.length === 0) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-48 glass-card rounded-[4rem] border-2 border-dashed border-border/50 max-w-2xl mx-auto space-y-10"
          >
            <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto">
              <Trophy size={64} className="text-primary opacity-10 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tighter uppercase tracking-[0.1em]">Registry Arena Empty</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed opacity-60 uppercase text-[10px] tracking-[0.4em]">
                The mission leaderboard is awaiting data. Synchronize your engineering node to register your standing.
              </p>
            </div>
            <Link to="/projects" className="btn-primary py-4 px-10 rounded-2xl text-[10px] uppercase tracking-[0.3em] inline-flex items-center gap-3">
               <Zap size={14} fill="currentColor" /> Initialize Contribution
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

