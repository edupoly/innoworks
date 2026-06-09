import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../store/slices/authSlice";
import { Github, LogOut, LayoutDashboard, Code2, User, Moon, Sun, Monitor, Bell, Check, Sparkles, Trophy } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

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

  const themes = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "System", value: "system", icon: Monitor },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        className="text-muted-foreground hover:text-foreground relative"
        aria-label="Toggle theme"
      >
        <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute top-2.5 left-2.5 h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-40 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-2xl shadow-2xl shadow-black/10 overflow-hidden z-50 p-1.5"
          >
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2 text-[10px] rounded-xl font-black uppercase tracking-widest transition-all ${
                  theme === t.value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <t.icon size={14} />
                  {t.name}
                </div>
                {theme === t.value && <div className="w-1 h-1 rounded-full bg-current" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useGetNotificationsQuery, useMarkNotificationsReadMutation, useMarkNotificationReadMutation } from "../store/api/usersApiSlice";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { data: notifications = [] } = useGetNotificationsQuery();
  const [markAllRead] = useMarkNotificationsReadMutation();
  const [readSingle] = useMarkNotificationReadMutation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllRead().unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadSingle = async (n) => {
    if (!n.read) {
      try {
        await readSingle(n._id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground relative"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background shadow-lg shadow-primary/20">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 rounded-[2rem] border border-border/50 bg-background/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-50"
          >
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between bg-secondary/30">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[9px] font-black uppercase tracking-widest text-primary hover:brightness-110 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-border/20">
                  {notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => handleReadSingle(n)}
                      className={`w-full text-left px-5 py-4 hover:bg-secondary/50 transition-all flex gap-4 text-xs group ${
                        !n.read ? "bg-primary/5" : "opacity-70"
                      }`}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border border-border/50 transition-colors ${!n.read ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground"}`}>
                        {n.type === 'ACHIEVEMENT_UNLOCKED' ? (
                          <Trophy size={14} className={!n.read ? "fill-primary/20" : ""} />
                        ) : n.type === 'REVIEW_APPROVED' || n.type === 'PR_MERGED' ? (
                          <Sparkles size={14} />
                        ) : (
                          <Bell size={14} />
                        )}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className={`leading-snug truncate ${!n.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{n.message}</p>
                        <p className="text-[9px] font-black uppercase tracking-tighter opacity-40">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • MISSION UPDATE
                        </p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-sm shadow-primary/40" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground/30">
                    <Check size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
                    Sector Clear
                  </p>
                </div>
              )}
            </div>

            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block w-full py-4 text-center text-[9px] font-black uppercase tracking-[0.3em] bg-secondary/50 hover:bg-secondary hover:text-primary transition-all border-t border-border/30"
            >
              Access Intelligence Hub
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useMe } from "../hooks/useAuth";

const Navbar = () => {
  const { isAuthenticated, user } = useMe();
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const navLinks = [
    { name: "Projects", path: "/projects" },
    { name: "Ranking", path: "/leaderboard" }
  ];

  return (
    <nav className="sticky top-0 z-[60] glass border-b border-border/40 px-6 py-2 transition-all duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
              <Code2 size={16} strokeWidth={2.5} className="relative z-10" />
            </div>
            <span className="text-base font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-300 uppercase">
              Innoworks
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative group ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-primary/5 rounded-lg -z-10 border border-primary/10"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 pr-3 border-r border-border/30">
            <ThemeToggle />
            {isAuthenticated && <NotificationDropdown />}
          </div>
          
          <div className="flex items-center gap-2.5 pl-1.5">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${
                    location.pathname === "/dashboard"
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/30"
                  }`}
                >
                  <LayoutDashboard size={12} />
                  <span>Operations Hub</span>
                </Link>
                
                <div className="flex items-center gap-1.5 bg-secondary/30 p-1 rounded-xl border border-border/50">
                  {user?.username && (
                    <Link 
                      to={`/profile/${user.username}`} 
                      className="flex items-center gap-2.5 pr-3 pl-1 hover:bg-background/50 rounded-lg transition-all py-1 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-indigo-400 p-[1.5px] shadow-sm">
                        <div className="w-full h-full rounded-[6px] bg-background flex items-center justify-center overflow-hidden">
                           {user?.avatarUrl ? (
                             <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                             <User size={12} className="text-primary" />
                           )}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[9px] font-black tracking-tight text-foreground uppercase truncate max-w-[70px]">{user.username}</p>
                        <Badge variant="default" className="py-0 px-1 h-auto text-[6px] border-none bg-primary/20">LVL {user.level || 1}</Badge>
                      </div>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Logout"
                  >
                    <LogOut size={12} />
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => {
                  const apiUrl = import.meta.env.VITE_API_URL || "https://innoworks-api.up.railway.app";
                  window.location.href = `${apiUrl}/auth/github`;
                }}
                className="h-9 px-5 gap-2 group text-[10px] font-black uppercase tracking-widest"
              >
                <Github size={14} className="group-hover:rotate-12 transition-transform duration-500" />
                Auth via GitHub
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

