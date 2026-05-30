import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { Github, LogOut, LayoutDashboard, Code2, User, Moon, Sun, Monitor, Bell, Check, Sparkles, Trophy } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Toggle theme"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute top-2 left-2 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-36 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/40 overflow-hidden z-50"
          >
            <div className="flex flex-col p-1">
              {[
                { name: "Light", value: "light", icon: Sun },
                { name: "Dark", value: "dark", icon: Moon },
                { name: "System", value: "system", icon: Monitor },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    theme === t.value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <t.icon size={14} />
                  {t.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/users/notifications");
      setNotifications(response.data);
    } catch (err) {
      console.error("Failed to load notifications:", err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s as robust fallback
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/users/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadSingle = async (n) => {
    try {
      if (!n.read) {
        await api.put(`/users/notifications/${n._id}/read`);
        setNotifications(prev => prev.map(notif => notif._id === n._id ? { ...notif, read: true } : notif));
      }
      setIsOpen(false);
      if (n.link) {
        navigate(n.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background animate-pulse shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl shadow-black/10 dark:shadow-black/50 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest">Recent Alerts</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Check size={10} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[280px] overflow-y-auto divide-y divide-border/30">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => handleReadSingle(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex gap-3 text-xs ${
                      !n.read ? "bg-primary/5 font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {n.type === 'ACHIEVEMENT_UNLOCKED' ? (
                        <Trophy size={14} className="text-yellow-500 fill-yellow-500/10" />
                      ) : n.type === 'REVIEW_APPROVED' || n.type === 'PR_MERGED' ? (
                        <Sparkles size={14} className="text-emerald-500" />
                      ) : (
                        <Bell size={14} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="leading-relaxed">{n.message}</p>
                      <p className="text-[9px] font-bold opacity-60">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground text-xs font-semibold">
                  All caught up! No notifications.
                </div>
              )}
            </div>

            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block w-full py-2.5 text-center text-[10px] font-bold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-t border-border/50 uppercase tracking-wider"
            >
              Go to Dashboard Timeline
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    navigate("/");
  };

  const navLinks = [
    { name: "Explore", path: "/projects" },
    { name: "Leaderboard", path: "/leaderboard" }
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/40 px-6 py-3 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <Code2 size={22} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            OPENSOURCE
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 pl-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                location.pathname === link.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <ThemeToggle />
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4 pl-4 border-l border-border/50">
              {/* Bell Icon Notification Dropdown */}
              <NotificationDropdown />

              <Link
                to="/dashboard"
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  location.pathname === "/dashboard"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              
              <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-full border border-border/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px] shadow-sm">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                     {user?.avatarUrl ? (
                       <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                       <User size={16} className="text-primary" />
                     )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
                window.location.href = `${apiUrl}/auth/github`;
              }}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-full group shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
            >
              <Github size={18} className="group-hover:rotate-12 transition-transform duration-300" />
              Connect GitHub
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
