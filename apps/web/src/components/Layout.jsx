import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
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
import { Bell, X, ShieldAlert, Sparkles, Trophy, Rocket, AlertCircle, Layers } from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

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
        return <Trophy size={18} className="text-yellow-500 fill-yellow-500/20" />;
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
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-300 relative overflow-x-hidden">
      {/* Dynamic Ambient Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.22)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.18)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <Navbar />
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname} className="w-full h-full">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm font-medium text-muted-foreground border-t border-border/50 bg-card/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Innoworks. Powered by Student Developers.</p>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest bg-muted px-3 py-1.5 rounded-lg border border-border/50 flex items-center gap-1.5"
              aria-label="Open command palette"
            >
              <span>Command Palette</span>
              <kbd className="text-[10px] bg-background border px-1 rounded">{isMac ? "Cmd K" : "Ctrl K"}</kbd>
            </button>
            <span className="text-border">|</span>
            <Link to="/projects" className="hover:text-primary transition-colors">Explore</Link>
            <Link to="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>

      {/* Floating Spotlight Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      {/* Real-time Toast Notifications Hub */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="w-full bg-popover/90 border border-border rounded-2xl p-4 shadow-2xl shadow-black/50 backdrop-blur-xl flex gap-3.5 relative overflow-hidden"
            >
              <div className="w-1.5 h-full absolute left-0 top-0 bg-primary" />
              <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center shrink-0 border border-border">
                {getNotificationIcon(toast.type)}
              </div>
              <div className="flex-grow min-w-0 pr-4">
                <p className="text-xs font-black uppercase tracking-wider text-primary mb-0.5">Real-time Alert</p>
                <p className="text-xs font-semibold leading-relaxed text-foreground">{toast.message}</p>
              </div>
              <button 
                onClick={() => dismissToast(toast.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted p-1.5 rounded-lg h-fit transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Layout;
