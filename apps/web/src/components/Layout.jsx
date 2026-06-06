import { Link, Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { PageTransition } from "./PageTransition";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "./ThemeProvider";
import { logoutUser } from "../store/slices/authSlice";
import CommandPalette from "./CommandPalette";
import { useQueryClient } from "@tanstack/react-query";
import { initiateSocket, disconnectSocket, subscribeToNotifications } from "../lib/socket";
import { Bell, X, ShieldAlert, Sparkles, Trophy, Rocket, AlertCircle, Layers, WifiOff, Command } from "lucide-react";
import { Button } from "./ui/Button";

const Layout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Visibility and Network detection for automatic revalidation
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      queryClient.refetchQueries({ stale: true });
    };
    const handleOffline = () => setIsOnline(false);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ stale: true });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const [lastKeyPressed, setLastKeyPressed] = useState("");
  const timeoutRef = useRef(null);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K and sequential shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
        return;
      }

      // 1. Meta Combinations (Ctrl/Cmd + Key)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 2. Shift Combinations (Shift + Key)
      if (e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const key = e.key.toUpperCase();
        if (key === "Q" && isAuthenticated) {
          e.preventDefault();
          dispatch(logoutUser());
          return;
        }
        if (key === "D") {
          e.preventDefault();
          setTheme("dark");
          return;
        }
        if (key === "L") {
          e.preventDefault();
          setTheme("light");
          return;
        }
      }

      // 3. Sequential shortcuts (G then P, G then L, etc)
      const key = e.key.toLowerCase();
      
      if (lastKeyPressed === "g") {
        let matched = false;
        if (key === "p" && isAuthenticated) {
          e.preventDefault();
          navigate("/projects");
          matched = true;
        } else if (key === "l" && isAuthenticated) {
          e.preventDefault();
          navigate("/leaderboard");
          matched = true;
        } else if (key === "d" && isAuthenticated) {
          e.preventDefault();
          navigate("/dashboard");
          matched = true;
        }
        
        if (matched) {
          setLastKeyPressed("");
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
        }
      } 
      
      if (lastKeyPressed === "c") {
        if (key === "p" && isAuthenticated) {
          e.preventDefault();
          navigate("/projects/new");
          setLastKeyPressed("");
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
        }
      }

      // Detect start of sequence
      if (key === "g" || key === "c") {
        setLastKeyPressed(key);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setLastKeyPressed("");
        }, 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate, lastKeyPressed, isAuthenticated, dispatch, setTheme]);

  // WebSockets setup for real-time notifications on auth change
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      initiateSocket(user._id);

      subscribeToNotifications((newNotification) => {
        // Add new notification to toast notifications stack
        const toastId = Date.now().toString();
        setToasts((prev) => [...prev, { id: toastId, ...newNotification }]);

        // Refetch notifications in the background to sync the badge/dropdown
        queryClient.invalidateQueries({ queryKey: ["notifications"] });

        // INTELLIGENCE SYNC: Automatically invalidate related data based on notification type
        if (newNotification.type.includes('PR') || newNotification.type.includes('REVIEW') || newNotification.type.includes('ISSUE') || newNotification.type.includes('COMMENT')) {
           queryClient.invalidateQueries({ queryKey: ["me"] });
           queryClient.invalidateQueries({ queryKey: ["projectIntelligence"] });
           queryClient.invalidateQueries({ queryKey: ["projectSubmissions"] });
           queryClient.invalidateQueries({ queryKey: ["profile"] });
        }

        if (newNotification.type === 'CHALLENGE_ACCEPTED') {
          queryClient.invalidateQueries({ queryKey: ["me"] });
        }

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          dismissToast(toastId);
        }, 6000);
      });
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, queryClient]);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ACHIEVEMENT_UNLOCKED':
        return <Trophy size={18} className="text-yellow-500 fill-yellow-500/10" />;
      case 'REVIEW_APPROVED':
      case 'PR_MERGED':
        return <Sparkles size={18} className="text-emerald-500" />;
      case 'REVIEW_REJECTED':
        return <ShieldAlert size={18} className="text-red-500" />;
      case 'CHALLENGE_ACCEPTED':
        return <Rocket size={18} className="text-primary" />;
      case 'ISSUE_RAISED':
        return <AlertCircle size={18} className="text-red-400" />;
      case 'NEW_SUBMISSION':
        return <Layers size={18} className="text-indigo-400" />;
      default:
        return <Bell size={18} className="text-primary" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-500 relative overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* Premium Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <Navbar />
      
      {/* Offline Alert */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-destructive text-destructive-foreground py-2 px-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 z-[70] relative overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
            <WifiOff size={14} className="relative z-10" />
            <span className="relative z-10">Communications Disrupted - Operating in Offline Protocol</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 relative z-10">
        <PageTransition className="w-full h-full">
          <Outlet />
        </PageTransition>
      </main>

      {/* Premium Footer */}
      <footer className="py-12 border-t border-border/40 bg-background/50 backdrop-blur-md relative z-10 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50 italic">© {new Date().getFullYear()} Innoworks Engineering cluster.</p>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">Forged by student developers for the next generation.</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <Link to="/projects" className="hover:text-primary transition-colors">Logistics</Link>
              <Link to="/leaderboard" className="hover:text-primary transition-colors">Registry</Link>
              <a href="#" className="hover:text-primary transition-colors">Protocol</a>
            </div>
            
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="gap-3 group px-4 py-2"
            >
              <Command size={14} className="group-hover:text-primary transition-colors" />
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <span>{isMac ? "⌘" : "Ctrl"}</span>
                <span>K</span>
              </div>
            </Button>
          </div>
        </div>
      </footer>

      {/* Command Center Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      {/* High-Fidelity Notification Stack */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
              className="w-full glass-card rounded-[1.5rem] p-5 flex gap-5 group relative overflow-hidden border-l-4 border-l-primary"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-2xl rounded-full" />
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                {getNotificationIcon(toast.type)}
              </div>
              <div className="flex-grow min-w-0 pr-2 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Intelligence Signal</p>
                </div>
                <p className="text-xs font-bold leading-relaxed text-foreground/90">{toast.message}</p>
              </div>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 w-8 h-8 rounded-xl"
              >
                <X size={14} />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Layout;

