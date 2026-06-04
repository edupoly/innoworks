import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { PageTransition } from "./PageTransition";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "./ThemeProvider";
import { logoutUser } from "../store/slices/authSlice";
import CommandPalette from "./CommandPalette";
import { initiateSocket, disconnectSocket, subscribeToNotifications } from "../lib/socket";
import { Bell, X, ShieldAlert, Sparkles, Trophy, Rocket, AlertCircle, Layers } from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
        if (key === "p") {
          e.preventDefault();
          navigate("/projects");
          matched = true;
        } else if (key === "l") {
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
      const socket = initiateSocket(user._id);

      subscribeToNotifications((newNotification) => {
        // Add new notification to toast notifications stack
        const toastId = Date.now().toString();
        setToasts((prev) => [...prev, { id: toastId, ...newNotification }]);

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
  }, [isAuthenticated, user]);

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
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-300">
      <Navbar />
      <main className="flex-1 relative">
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
            >
              <span>Command Palette</span>
              <kbd className="text-[10px] bg-background border px-1 rounded">{isMac ? "⌘K" : "Ctrl K"}</kbd>
            </button>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Status</a>
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
