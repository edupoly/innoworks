import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Trophy, Medal, Crown, TrendingUp, User } from "lucide-react";

const Leaderboard = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const response = await api.get("/users/leaderboard");
      return response.data;
    },
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-medium">Calculating rankings...</p>
    </div>
  );

  return (
    <div className="py-12 max-w-5xl mx-auto px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black tracking-tight mb-4">Global Leaderboard</h1>
        <p className="text-muted-foreground text-lg">The top engineering talent in the ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users?.map((user, index) => (
          <div
            key={user._id || user.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-border/50 shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] ${
              index === 0 ? "border-yellow-400/50 bg-yellow-50/10" : ""
            }`}
          >
            <div className="flex items-center gap-6">
              <div className="w-10 text-2xl font-black text-muted-foreground/30">
                {index === 0 ? <Crown className="text-yellow-500" /> : index + 1}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-primary" />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{user.username}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <TrendingUp size={12} className="text-green-500" />
                    <span>Level {Math.floor((user.xp || 0) / 100) + 1}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-8">
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">XP</p>
                <p className="text-xl font-black text-primary">{user.xp || 0}</p>
              </div>
              <div className="hidden lg:grid grid-cols-3 xl:grid-cols-6 gap-4 border-l border-border pl-8">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Cons</p>
                  <p className="text-sm font-black">{user.consistencyScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Perf</p>
                  <p className="text-sm font-black">{user.perfectionScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Collab</p>
                  <p className="text-sm font-black">{user.collaborationScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Comm</p>
                  <p className="text-sm font-black">{user.communicationScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Adapt</p>
                  <p className="text-sm font-black">{user.adaptabilityScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Inno</p>
                  <p className="text-sm font-black">{user.innovationScore || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!users || users.length === 0) && (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
          <Trophy size={48} className="mx-auto text-muted mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">The arena is empty</h2>
          <p className="text-muted-foreground">Start contributing to claim your place at the top.</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
