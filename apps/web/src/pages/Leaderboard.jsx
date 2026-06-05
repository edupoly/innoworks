import { useState, useMemo, memo } from "react";
import { Trophy, Medal, Crown, TrendingUp, User, Calendar, Award, Star, Zap, Activity, ChevronRight, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useGetLeaderboardQuery } from "../store/api/usersApiSlice";
import { useDebounce } from "../hooks/useDebounce";

const Metric = memo(({ label, value }) => {
  return (
    <div className="text-center w-12">
      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
      <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value || 0}%` }}
          className="absolute top-0 left-0 h-full bg-primary"
        />
      </div>
      <p className="text-[10px] font-black mt-1.5">{value || 0}%</p>
    </div>
  );
});

const LeaderboardRow = memo(({ user, rank, period }) => {
  if (!user || !user.username) return null;

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-border/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 hover:bg-card transition-all group">
      <div className="flex items-center gap-8">
        <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center font-black text-muted-foreground border border-border group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
          {rank}
        </div>
        
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-muted p-[2px] shrink-0 border border-border/50 group-hover:border-primary/30 transition-colors overflow-hidden">
            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              {user.username}
              {user.badges?.length > 0 && (
                <span className="text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg">
                  {user.badges[0].icon || "🏆"} {user.badges[0].name}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                <Zap size={10} className="text-primary fill-primary" />
                Level {user.level}
              </div>
              <div className="w-1 h-1 rounded-full bg-border"></div>
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                {user.xp} XP
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-12 justify-between md:justify-end">
        {period === 'all_time' && (
          <div className="hidden lg:flex items-center gap-6 border-r border-border/50 pr-12">
            <Metric label="Collab" value={user.collaborationScore} />
            <Metric label="Inno" value={user.innovationScore} />
            <Metric label="Cons" value={user.consistencyScore} />
            <Metric label="Perf" value={user.perfectionScore} />
          </div>
        )}
        
        <div className="text-right">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Reputation</p>
          <p className="text-2xl font-black text-primary tracking-tighter">{user.reputationScore}</p>
        </div>
        
        <Link 
          to={`/profile/${user.username}`}
          className="p-3 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
        >
          <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  );
});

const PodiumCard = memo(({ user, rank, color, bgColor, borderColor, featured }) => {
  if (!user || !user.username) return null;

  return (
    <div className={`relative bg-card border ${borderColor} rounded-[3rem] p-10 text-center shadow-2xl transition-all hover:shadow-primary/5 group ${featured ? 'md:pb-16' : ''}`}>
      {featured && (
        <div className="absolute inset-x-0 -top-8 flex justify-center">
          <div className="px-6 py-2 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl animate-bounce">Grand Champion</div>
        </div>
      )}
      
      <div className={`absolute -top-5 -left-5 w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center font-black text-xl border ${borderColor} shadow-xl backdrop-blur-xl rotate-[-12deg] group-hover:rotate-0 transition-transform duration-500`}>
        #{rank}
      </div>

      <div className={`relative mx-auto w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-primary to-blue-400 p-[3px] mb-8 group-hover:scale-110 transition-transform duration-500 shadow-2xl`}>
        <div className="w-full h-full rounded-[2.3rem] bg-background flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-primary opacity-20" />
          )}
        </div>
        <div className="absolute -bottom-2 -right-2 bg-background border border-border px-3 py-1 rounded-xl shadow-lg">
          <span className="text-[10px] font-black text-primary">LVL {user.level}</span>
        </div>
      </div>

      <h3 className="text-2xl font-black mb-2 tracking-tight group-hover:text-primary transition-colors">{user.username}</h3>
      
      <div className="flex flex-col items-center gap-4 mt-6">
         <div className="px-4 py-1.5 bg-muted/50 rounded-full border border-border/50 flex items-center gap-2">
           <Star size={12} className="text-yellow-500 fill-yellow-500" />
           <span className="text-xs font-black uppercase tracking-widest">{user.xp} XP</span>
         </div>
         
         <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-border/50">
            <div className="text-center">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Reputation</p>
              <p className="text-lg font-black text-primary">{user.reputationScore}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Badges</p>
              <p className="text-lg font-black text-foreground">{user.badges?.length || 0}</p>
            </div>
         </div>
      </div>
      
      <Link to={`/profile/${user.username}`} className="mt-8 btn-secondary w-full py-4 text-[10px] font-black uppercase rounded-2xl flex items-center justify-center gap-2 group/btn">
        View Portfolio <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
});

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
    { id: "all_time", label: "All Time", icon: Trophy },
    { id: "weekly", label: "Weekly Arena", icon: Calendar },
    { id: "monthly", label: "Monthly Challenge", icon: Award }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Calculating developer standings...</p>
      </div>
    );
  }

  const topThree = useMemo(() => filteredUsers.slice(0, 3), [filteredUsers]);
  const restOfUsers = useMemo(() => filteredUsers.slice(3), [filteredUsers]);

  return (
    <div className="py-20 max-w-6xl mx-auto px-4 selection:bg-primary/30 relative">
      <div className="relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 border border-border/50 text-primary text-[10px] font-black uppercase tracking-[0.25em] backdrop-blur-xl shadow-sm mb-8"
          >
            <Zap size={12} className="fill-primary" />
            Live Analytics Sync
          </motion.div>
          <h1 className="text-6xl md:text-[5rem] font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 leading-[1]">
            Engineering Elite
          </h1>
          <p className="text-muted-foreground text-xl max-w-xl mx-auto font-medium leading-relaxed">
            The global rankings of student engineering excellence. Compete, contribute, and dominate.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-24">
          <div className="bg-card/50 backdrop-blur-2xl p-2 rounded-[2.5rem] flex gap-1.5 border border-border/50 shadow-2xl shadow-black/5">
            {periods.map((p) => {
              const isSel = period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                    isSel 
                      ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/20 border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <p.icon size={16} className={isSel ? "animate-pulse" : ""} />
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="relative group min-w-[300px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search engineering elite..."
              className="w-full pl-14 pr-6 py-4 bg-card/50 border border-border/50 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm backdrop-blur-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {topThree.length > 0 && !debouncedSearch && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 items-end px-4">
            {topThree[1] && (
              <div className="order-2 md:order-1">
                <PodiumCard user={topThree[1]} rank={2} color="text-slate-400" bgColor="bg-slate-400/10" borderColor="border-slate-400/20" />
              </div>
            )}

            {topThree[0] && (
              <div className="order-1 md:order-2 z-10 scale-105">
                <PodiumCard user={topThree[0]} rank={1} color="text-yellow-500" bgColor="bg-yellow-500/10" borderColor="border-yellow-500/30" featured />
              </div>
            )}

            {topThree[2] && (
              <div className="order-3 md:order-3">
                <PodiumCard user={topThree[2]} rank={3} color="text-amber-600" bgColor="bg-amber-600/10" borderColor="border-amber-600/20" />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {debouncedSearch 
            ? filteredUsers.map((user, index) => (
                <LeaderboardRow key={user._id || user.id} user={user} rank={index + 1} period={period} />
              ))
            : restOfUsers.map((user, index) => (
                <LeaderboardRow key={user._id || user.id} user={user} rank={index + 4} period={period} />
              ))
          }
        </div>

        {(!users || users.length === 0) && (
          <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/50 max-w-xl mx-auto backdrop-blur-sm">
            <Trophy size={64} className="mx-auto text-primary opacity-20 mb-6" />
            <h2 className="text-2xl font-black mb-2 tracking-tight">Standings Arena Empty</h2>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
              The mission leaderboard is awaiting data. Start contributing or checking submissions to register your score!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
