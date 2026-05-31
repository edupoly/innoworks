import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Trophy, Medal, Crown, TrendingUp, User, Calendar, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Leaderboard = () => {
  const [period, setPeriod] = useState("all_time"); // 'all_time', 'weekly', 'monthly'

  const { data: users, isLoading } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const response = await api.get(`/users/leaderboard?period=${period}`);
      return response.data;
    },
  });

  const periods = [
    { id: "all_time", label: "All Time", icon: Trophy },
    { id: "weekly", label: "Weekly Arena", icon: Calendar },
    { id: "monthly", label: "Monthly Challenge", icon: Award }
  ];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-semibold">Calculating developer standings...</p>
    </div>
  );

  return (
    <div className="py-12 max-w-5xl mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-primary">
          Developer Standings
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Unlocking open source contribution leaderboards. See the top engineering minds of our student community.
        </p>
      </div>

      {/* Period Selection Tabs */}
      <div className="flex justify-center mb-10">
        <div className="bg-muted p-1 rounded-2xl flex gap-1 border border-border/40 select-none">
          {periods.map((p) => {
            const isSel = period === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  isSel 
                    ? "bg-background text-primary shadow-sm border border-border/50" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <p.icon size={13} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rankings List */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={period}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="grid grid-cols-1 gap-4"
        >
          {users?.map((user, index) => {
            const isGold = index === 0;
            const isSilver = index === 1;
            const isBronze = index === 2;

            return (
              <div
                key={user._id || user.id}
                className={`bg-card rounded-2xl p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:scale-[1.005] hover:shadow-md ${
                  isGold ? "border-yellow-500/35 bg-yellow-500/5 dark:bg-yellow-500/5" :
                  isSilver ? "border-slate-400/30 bg-slate-400/5" :
                  isBronze ? "border-amber-600/30 bg-amber-600/5" :
                  "border-border/50"
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-8 text-xl font-black text-center shrink-0">
                    {isGold ? (
                      <Crown className="text-yellow-500 mx-auto fill-yellow-500/20" size={24} />
                    ) : isSilver ? (
                      <Medal className="text-muted-foreground mx-auto fill-slate-400/10" size={22} />
                    ) : isBronze ? (
                      <Medal className="text-amber-600 mx-auto fill-amber-600/10" size={22} />
                    ) : (
                      <span className="text-muted-foreground/40">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px] shrink-0 shadow-sm">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-primary" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-1.5">
                        {user.username}
                        {user.badges?.length > 0 && (
                          <span className="text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                            🏆 {user.badges[0].name}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground mt-1">
                        <TrendingUp size={12} className="text-green-500" />
                        <span>Level {user.level || 1} • {user.xp || 0} XP</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-8 justify-between sm:justify-end pl-14 sm:pl-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Reputation</p>
                    <p className="text-xl font-black text-primary">{user.reputationScore || 0}</p>
                  </div>
                  
                  {period === 'all_time' && (
                    <div className="hidden lg:grid grid-cols-6 gap-4 border-l border-border pl-8 text-[11px] font-bold text-center">
                      <div className="w-10">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Cons</p>
                        <p className="font-extrabold">{user.consistencyScore || 0}%</p>
                      </div>
                      <div className="w-10">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Perf</p>
                        <p className="font-extrabold">{user.perfectionScore || 0}%</p>
                      </div>
                      <div className="w-10">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Collab</p>
                        <p className="font-extrabold">{user.collaborationScore || 0}%</p>
                      </div>
                      <div className="w-10">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Comm</p>
                        <p className="font-extrabold">{user.communicationScore || 0}%</p>
                      </div>
                      <div className="w-10">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Adapt</p>
                        <p className="font-extrabold">{user.adaptabilityScore || 0}%</p>
                      </div>
                      <div className="w-10">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Inno</p>
                        <p className="font-extrabold">{user.innovationScore || 0}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {(!users || users.length === 0) && (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50 max-w-lg mx-auto">
          <Trophy size={48} className="mx-auto text-primary opacity-25 mb-4" />
          <h2 className="text-lg font-bold mb-1">Standings list is empty</h2>
          <p className="text-sm text-muted-foreground">Start contributing or checking submissions to register your score on the leaderboard!</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
