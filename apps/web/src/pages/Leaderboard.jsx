import { useState, useMemo, memo } from "react";
import { Trophy, Crown, User, Calendar, Award, Zap, Activity, ChevronRight, Search, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useGetLeaderboardQuery } from "../store/api/usersApiSlice";
import { useDebounce } from "../hooks/useDebounce";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

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
      whileHover={{ x: 3 }}
    >
      <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 group relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/[0.01] border border-border/40 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center font-black text-muted-foreground border border-border/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 shadow-sm tabular-nums text-[10px]">
            {rank}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group/avatar">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/20 to-indigo-400/20 p-[1.5px] shrink-0 border border-border/30 group-hover:border-primary/40 transition-all duration-500 overflow-hidden shadow-lg">
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="text-lg font-black tracking-tighter flex items-center gap-2.5 truncate max-w-[180px] md:max-w-xs">
                <span className="truncate">{user.username}</span>
                {user.badges?.length > 0 && (
                  <Badge variant="default" className="shadow-md shadow-primary/10 text-[7px] px-1.5 py-0 h-4">
                    {user.badges[0].icon || "🏆"} {user.badges[0].name}
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="border-none bg-primary/10 gap-1.5 px-2 py-0 h-4 text-[7px]">
                  <Zap size={8} className="fill-primary" />
                  LVL {user.level}
                </Badge>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.1em]">
                  {user.xp} XP_AGGREGATE
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 justify-between md:justify-end">
          {period === 'all_time' && (
            <div className="hidden lg:flex items-center gap-6 border-r border-border/30 pr-8 py-0.5">
              <Metric label="Collab" value={user.collaborationScore} />
              <Metric label="Inno" value={user.innovationScore} />
              <Metric label="Cons" value={user.consistencyScore} />
              <Metric label="Perf" value={user.perfectionScore} />
            </div>
          )}
          
          <div className="text-right min-w-[80px] space-y-0.5">
            <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">Reputation</p>
            <p className="text-2xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors tabular-nums leading-none">{user.reputationScore}</p>
          </div>
          
          <Link to={`/profile/${user.username}`}>
            <Button variant="secondary" size="icon" className="w-8 h-8 group-hover:bg-primary group-hover:text-white group-hover:shadow-primary/20">
              <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
});
LeaderboardRow.displayName = "LeaderboardRow";

const PodiumCard = memo(({ user, rank, color, bgColor, borderColor, featured }) => {
  if (!user || !user.username) return null;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative glass-card border-2 ${borderColor} rounded-2xl p-8 text-center shadow-2xl transition-all group ${featured ? 'md:pb-12 border-primary/20' : 'scale-95'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
      
      {featured && (
        <div className="absolute inset-x-0 -top-6 flex justify-center z-20">
          <div className="px-6 py-2 bg-yellow-500 text-black text-[8px] font-black uppercase tracking-[0.3em] rounded-xl shadow-lg flex items-center gap-2">
             <Crown size={12} className="fill-black" />
             Grand Champion
          </div>
        </div>
      )}
      
      <div className={`absolute -top-4 -left-4 w-12 h-12 ${bgColor} ${color} rounded-xl flex items-center justify-center font-black text-xl border-2 ${borderColor} shadow-xl backdrop-blur-2xl rotate-[-8deg] group-hover:rotate-0 transition-all duration-700 z-10`}>
        #{rank}
      </div>

      <div className={`relative mx-auto w-32 h-32 rounded-2xl bg-gradient-to-tr from-primary via-indigo-500 to-blue-400 p-[3px] mb-8 group-hover:scale-105 transition-transform duration-700 shadow-xl relative`}>
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden relative z-10 border-[4px] border-background">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-primary opacity-20" />
          )}
        </div>
        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground border-2 border-background px-3 py-1 rounded-xl shadow-lg z-20">
          <span className="text-[9px] font-black tracking-widest uppercase">LVL {user.level}</span>
        </div>
      </div>

      <div className="space-y-1 mb-8">
        <h3 className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors uppercase leading-none">{user.username}</h3>
        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">Elite Contributor</p>
      </div>
      
      <div className="flex flex-col items-center gap-4">
         <Badge variant="default" className="px-5 py-2 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2.5 shadow-sm border-none">
           <Trophy size={12} className="text-amber-500 fill-amber-500/20" />
           <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">{user.xp} XP_SYNC</span>
         </Badge>
         
         <div className="grid grid-cols-2 gap-8 w-full pt-6 border-t border-border/30">
            <div className="text-center space-y-0.5">
              <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60 leading-none">Reputation</p>
              <p className="text-xl font-black text-foreground tabular-nums leading-none">{user.reputationScore}</p>
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60 leading-none">Badges</p>
              <p className="text-xl font-black text-foreground tabular-nums leading-none">{user.badges?.length || 0}</p>
            </div>
         </div>
      </div>
      
      <Link to={`/profile/${user.username}`} className="mt-8 block">
        <Button size="sm" className="w-full py-4 rounded-xl gap-2 group/btn shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest">
          Access Node <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </Button>
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
    { id: "all_time", label: "Global", icon: Trophy },
    { id: "weekly", label: "Weekly", icon: Calendar },
    { id: "monthly", label: "Monthly", icon: Award }
  ];

  const topThree = useMemo(() => filteredUsers.slice(0, 3), [filteredUsers]);
  const restOfUsers = useMemo(() => filteredUsers.slice(3), [filteredUsers]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[9px] animate-pulse">Scanning Grid Standings...</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto px-6 lg:px-8 selection:bg-primary/20 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.04),transparent_70%)] -z-10" />

      <div className="relative z-10">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-3 py-1 rounded-lg bg-secondary/80 border border-border/50 text-primary text-[8px] font-black uppercase tracking-[0.3em] backdrop-blur-2xl shadow-lg mb-4"
          >
            <Activity size={10} className="animate-pulse" />
            Standings Synchronized
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-gradient leading-none uppercase">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            Global rankings of engineering excellence. Compete and dominate.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-5 mb-12">
          <div className="bg-secondary/30 backdrop-blur-3xl p-1 rounded-xl flex flex-wrap justify-center gap-1 border border-border/50 shadow-xl">
            {periods.map((p) => {
              const isSel = period === p.id;
              return (
                <Button
                  key={p.id}
                  variant={isSel ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(p.id)}
                  className={`flex items-center gap-2.5 px-5 py-2 rounded-lg transition-all duration-500 ${
                    isSel 
                      ? "shadow-xl shadow-primary/20 border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <p.icon size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="relative group min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors z-10" size={16} />
            <Input
              type="text"
              placeholder="Search registry..."
              className="pl-12 pr-5 h-10 rounded-lg backdrop-blur-3xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {topThree.length > 0 && !debouncedSearch && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 items-end px-4">
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

        <div className="grid grid-cols-1 gap-3 mb-12">
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
            className="text-center py-20 glass-card rounded-2xl border-2 border-dashed border-border/50 max-w-xl mx-auto space-y-6"
          >
            <div className="w-16 h-16 bg-primary/5 rounded-xl flex items-center justify-center mx-auto">
              <Trophy size={36} className="text-primary opacity-10" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black tracking-tighter uppercase tracking-[0.1em]">Registry Empty</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed opacity-60 uppercase text-[8px] tracking-[0.3em]">
                The leaderboard is awaiting data synchronization.
              </p>
            </div>
            <Link to="/projects">
               <Button size="sm" className="gap-2 px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                 <Zap size={12} fill="currentColor" /> Begin Contribution
               </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

