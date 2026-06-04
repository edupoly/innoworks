import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Bell, Check, Trophy, Sparkles, Clock, Trash2, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/users/notifications");
      return response.data;
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put("/users/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    }
  });

  const readSingleMutation = useMutation({
    mutationFn: (id) => api.put(`/users/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    }
  });

  const handleNotificationClick = (n) => {
    if (!n.read) {
      readSingleMutation.mutate(n._id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold font-mono text-xs uppercase tracking-widest">Loading Alerts...</p>
    </div>
  );

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="py-12 max-w-3xl mx-auto px-4">
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                  {unreadCount} NEW
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Innoworks Activity & Updates</p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllReadMutation.mutate()}
            className="text-xs font-black text-primary hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-all"
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </motion.header>

      <div className="space-y-3">
        {notifications?.length > 0 ? (
          notifications.map((n, idx) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group flex gap-4 ${
                !n.read 
                  ? "bg-card border-primary/20 shadow-lg shadow-primary/5" 
                  : "bg-muted/30 border-border/50 opacity-80 hover:opacity-100 hover:bg-card"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${
                n.type === 'ACHIEVEMENT_UNLOCKED' ? "bg-yellow-500/10 text-yellow-600" :
                n.type === 'REVIEW_APPROVED' || n.type === 'PR_MERGED' ? "bg-emerald-500/10 text-emerald-600" :
                "bg-primary/10 text-primary"
              }`}>
                {n.type === 'ACHIEVEMENT_UNLOCKED' ? <Trophy size={20} /> :
                 n.type === 'REVIEW_APPROVED' || n.type === 'PR_MERGED' ? <Sparkles size={20} /> :
                 <Bell size={20} />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm leading-relaxed ${!n.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                    {n.message}
                  </p>
                  <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap pt-0.5">
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-primary transition-colors">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {n.type.replace('_', ' ')}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <Bell size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-bold text-muted-foreground">No notifications yet</h3>
            <p className="text-xs font-medium text-muted-foreground/60 mt-1 uppercase tracking-widest">We'll alert you when something happens</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
