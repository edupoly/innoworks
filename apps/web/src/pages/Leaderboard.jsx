import { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { 
  Trophy, 
  Calendar, 
  Award, 
  ChevronRight, 
  Zap, 
  Search, 
  Activity, 
  Flame, 
  Star, 
  CheckCircle2, 
  GitPullRequest,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetLeaderboardQuery } from "../store/api/usersApiSlice";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useDebounce } from "../hooks/useDebounce";

const Metric = ({ label, value, color, icon: Icon }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex items-center gap-1">
      {Icon && <Icon size={12} className={color} />}
      <span className="text-xs font-black text-foreground tabular-nums">{value}</span>
    </div>
    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
  </div>
);

const LeaderboardRow = memo(({ user, rank }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ scale: 1.005, y: -2 }}
      transition={{ duration: 0.4 }}
      className="group relative"
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="relative bg-card/65 backdrop-blur-md rounded-2xl p-5 border border-border/40 hover:border-primary/30 flex flex-col md:flex-row items-center justify-between gap-6 transition-all shadow-sm">
        <div className="flex items-center gap-6 w-full md:w-auto">
          {/* Rank Badge */}
          <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center font-black text-muted-foreground border border-border/50 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-500 shadow-sm tabular-nums text-xs">
            #{rank}
          </div>

          {/* User Details */}
          <div className="flex items-center gap-4">
            <div className="relative group/avatar">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-indigo-400 p-[2px] shadow-md group-hover/avatar:scale-105 transition-transform duration-500">
                <div className="w-full h-full rounded-[10px] bg-background overflow-hidden flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <Trophy size={16} className="text-primary/30" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-2 uppercase">
                @{user.username}
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              </h3>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="border-none bg-primary/10 text-primary gap-1 px-2 py-0.5 h-4.5 text-[8px] font-black uppercase tracking-widest">
                  <Zap size={9} className="fill-primary" />
                  SCORE {user.contributionScore || 0}
                </Badge>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">
                  {user.contributionScore || 0} SCORE_SYNC
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Panel */}
        <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border/30">
          <div className="grid grid-cols-4 gap-6">
             <Metric label="Rating" value={user.overallRating ? `${user.overallRating}/10` : '0.0'} color="text-amber-500" icon={Star} />
             <Metric label="Streak" value={`${user.currentStreak || 0}d`} color="text-orange-500" icon={Flame} />
             <Metric label="PRs" value={user.contributionStats?.mergedPrsCount || 0} color="text-indigo-500" icon={GitPullRequest} />
             <Metric label="Issues" value={user.contributionStats?.issuesCount || 0} color="text-emerald-500" icon={CheckCircle2} />
          </div>
          
          <div className="text-right min-w-[90px] space-y-0.5">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Verified</p>
            <p className="text-2xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors tabular-nums leading-none">{user.verifiedContributionsCount || 0}</p>
          </div>
          
          <Link to={`/profile/${user.username}`}>
            <Button variant="secondary" size="icon" className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-lg transition-all duration-500">
              <ChevronRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
});
LeaderboardRow.displayName = "LeaderboardRow";

const PodiumCard = memo(({ user, rank, color, bgColor, borderColor, featured }) => {
  if (!user || !user.username) return null;

  return (
    <motion.div 
      whileHover={{ y: -6 }}
      className={`relative bg-card/60 backdrop-blur-md border-2 ${borderColor} rounded-[2.5rem] p-8 text-center shadow-xl hover:border-primary/40 transition-all group ${featured ? 'lg:pb-12 border-yellow-500/30 scale-100 z-10 shadow-yellow-500/5' : 'scale-95 opacity-90 hover:opacity-100'}`}
    >
      {/* Dynamic ambient spotlight */}
      <div className={`absolute inset-0 bg-gradient-to-b ${featured ? 'from-yellow-500/[0.03] to-transparent' : 'from-primary/[0.02] to-transparent'} rounded-[2.3rem] pointer-events-none`} />
      
      {featured && (
        <div className="absolute inset-x-0 -top-5 flex justify-center z-20">
          <div className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-xl shadow-lg flex items-center gap-2 border border-yellow-400/20">
             <Crown size={12} className="fill-black" />
             Grand Champion
          </div>
        </div>
      )}
      
      {/* Rank Shield Badge */}
      <div className={`absolute -top-4 -left-4 w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center font-black text-xl border-2 ${borderColor} shadow-xl backdrop-blur-2xl rotate-[-8deg] group-hover:rotate-0 transition-all duration-700 z-10`}>
        #{rank}
      </div>

      {/* Avatar Container */}
      <div className={`relative mx-auto w-32 h-32 rounded-[2rem] bg-gradient-to-tr ${featured ? 'from-yellow-500 via-amber-500 to-yellow-400' : 'from-primary via-indigo-500 to-blue-400'} p-[3px] mb-8 group-hover:scale-105 transition-transform duration-700 shadow-xl`}>
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-full h-full rounded-[28px] bg-background flex items-center justify-center overflow-hidden relative z-10 border-[4px] border-background">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <Trophy size={48} className="text-primary opacity-20" />
          )}
        </div>
        <div className="absolute -bottom-2.5 -right-2.5 bg-primary text-primary-foreground border-2 border-background px-3 py-1.5 rounded-xl shadow-lg z-20 font-black text-[9px] tracking-widest uppercase">
          SCORE {user.contributionScore || 0}
        </div>
      </div>

      <div className="space-y-1 mb-8">
        <h3 className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors uppercase leading-none">{user.username}</h3>
        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">Elite Contributor</p>
      </div>
      
      <div className="flex flex-col items-center gap-4">
         <Badge variant="default" className="px-5 py-2.5 bg-primary/10 rounded-xl flex items-center gap-2.5 shadow-sm border-none">
           <Trophy size={12} className="text-amber-500 fill-amber-500/20" />
           <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">{user.contributionScore || 0} SCORE_SYNC</span>
         </Badge>
         
         <div className="grid grid-cols-3 gap-4 w-full pt-6 border-t border-border/30">
            <div className="text-center space-y-0.5">
              <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 leading-none">Rating</p>
              <p className="text-lg font-black text-amber-500 tabular-nums leading-none">{user.overallRating || '0.0'}</p>
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 leading-none">Streak</p>
              <p className="text-lg font-black text-orange-500 tabular-nums leading-none">{user.currentStreak || 0}d</p>
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 leading-none">Verified</p>
              <p className="text-lg font-black text-primary tabular-nums leading-none">{user.verifiedContributionsCount || 0}</p>
            </div>
         </div>
      </div>
      
      <Link to={`/profile/${user.username}`} className="mt-8 block">
        <Button size="sm" className="w-full py-4.5 rounded-xl gap-2 group/btn shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest">
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

  const { data: users = [], isLoading } = useGetLeaderboardQuery(period);

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => u && u.username && u.username !== "undefined")
      .filter(u => !debouncedSearch || u.username.toLowerCase().includes(debouncedSearch.toLowerCase()));
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
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[9px] animate-pulse">Scanning Grid Standings...</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto px-6 lg:px-8 selection:bg-primary/20 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.04),transparent_70%)] -z-10" />

      <div className="relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-secondary/80 border border-border/50 text-primary text-[8px] font-black uppercase tracking-[0.3em] backdrop-blur-2xl shadow-lg mb-6"
          >
            <Activity size={10} className="animate-pulse" />
            Standings Synchronized
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-gradient leading-none uppercase">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            Global rankings of engineering excellence. Compete and dominate.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-5 mb-16">
          <div className="bg-secondary/40 backdrop-blur-md p-1 rounded-2xl flex flex-wrap justify-center gap-1 border border-border/50 shadow-xl">
            {periods.map((p) => {
              const isSel = period === p.id;
              return (
                <Button
                  key={p.id}
                  variant={isSel ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(p.id)}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-500 border-none ${
                    isSel 
                      ? "shadow-xl shadow-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <p.icon size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors z-10" size={16} />
            <Input
              type="text"
              placeholder="Search users..."
              className="pl-12 pr-5 h-11 rounded-2xl backdrop-blur-md text-xs border-border/50 group-hover:border-primary/20 transition-all focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Podium cards grid - Rank #1 in the middle for Awwwards layout */}
        {topThree.length > 0 && !debouncedSearch && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 items-end px-4">
            {/* Rank #2 Podium Card */}
            {topThree[1] && (
              <div className="order-2 lg:order-1">
                <PodiumCard user={topThree[1]} rank={2} color="text-slate-400" bgColor="bg-slate-400/10" borderColor="border-slate-400/20" />
              </div>
            )}

            {/* Rank #1 Podium Card */}
            {topThree[0] && (
              <div className="order-1 lg:order-2 z-10">
                <PodiumCard user={topThree[0]} rank={1} color="text-yellow-500" bgColor="bg-yellow-500/10" borderColor="border-yellow-500/30" featured />
              </div>
            )}

            {/* Rank #3 Podium Card */}
            {topThree[2] && (
              <div className="order-3 lg:order-3">
                <PodiumCard user={topThree[2]} rank={3} color="text-amber-600" bgColor="bg-amber-600/10" borderColor="border-amber-600/20" />
              </div>
            )}
          </div>
        )}

        {/* Table Rows list of users */}
        <div className="grid grid-cols-1 gap-4 mb-16">
          <AnimatePresence mode="popLayout">
            {debouncedSearch 
              ? filteredUsers.map((user, index) => (
                  <LeaderboardRow key={user._id || user.id} user={user} rank={index + 1} />
                ))
              : restOfUsers.map((user, index) => (
                  <LeaderboardRow key={user._id || user.id} user={user} rank={index + 4} />
                ))
            }
          </AnimatePresence>
        </div>

        {(!filteredUsers || filteredUsers.length === 0) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-card/45 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-border/50 max-w-xl mx-auto space-y-6"
          >
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto">
              <Trophy size={32} className="text-primary opacity-10" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black tracking-tighter uppercase tracking-[0.1em]">Leaderboard Empty</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed opacity-60 uppercase text-[8px] tracking-[0.3em]">
                The leaderboard is awaiting data synchronization.
              </p>
            </div>
            <Link to="/projects">
               <Button size="sm" className="gap-2 px-6 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
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
