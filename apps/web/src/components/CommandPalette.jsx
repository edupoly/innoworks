import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Code2, Trophy, LayoutDashboard, Moon, Sun, Terminal, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/slices/authSlice";
import api from "../lib/api";

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  // Keyboard shortcut listener for opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Fetch projects matching query
  useEffect(() => {
    if (!query) {
      setProjects([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/projects?search=${query}`);
        setProjects(response.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to query projects for command palette:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Command palette navigation items
  const navigationItems = [
    { name: "Explore Active Challenges", icon: Code2, action: () => navigate("/projects"), shortcut: "G P" },
    { name: "Global Leaderboard", icon: Trophy, action: () => navigate("/leaderboard"), shortcut: "G L" },
    ...(isAuthenticated ? [
      { name: "My Developer Dashboard", icon: LayoutDashboard, action: () => navigate("/dashboard"), shortcut: "G D" },
      { name: "Post a Challenge", icon: Terminal, action: () => navigate("/projects/new"), shortcut: "C P" },
      { name: "Sign Out", icon: LogOut, action: () => {
        dispatch(logoutUser());
      }, shortcut: isMac ? "⇧ Q" : "Shift Q" }
    ] : []),
    { name: "Switch to Dark Mode", icon: Moon, action: () => setTheme("dark"), shortcut: isMac ? "⇧ D" : "Shift D" },
    { name: "Switch to Light Mode", icon: Sun, action: () => setTheme("light"), shortcut: isMac ? "⇧ L" : "Shift L" }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalItems = filteredNavigation.length + projects.length;

  // Handle arrow keys and select
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter") {
        e.preventDefault();
        
        // Execute active selection
        if (selectedIndex < filteredNavigation.length) {
          filteredNavigation[selectedIndex].action();
        } else {
          const projectIndex = selectedIndex - filteredNavigation.length;
          const project = projects[projectIndex];
          if (project) {
            navigate(`/projects/${project._id}`);
          }
        }
        onClose();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, totalItems, filteredNavigation, projects]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-2xl bg-popover/95 border border-border rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
          >
            {/* Search Input bar */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
              <Search className="text-muted-foreground shrink-0" size={20} />
              <input 
                ref={inputRef}
                type="text" 
                className="w-full bg-transparent border-0 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 text-base font-medium"
                placeholder="Type a command or search active missions..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <span className="text-[10px] font-black uppercase text-muted-foreground bg-muted px-2 py-1 rounded border border-border select-none">ESC</span>
            </div>

            {/* Scrollable list */}
            <div className="max-h-[350px] overflow-y-auto p-2 space-y-1 select-none">
              {totalItems === 0 && !isLoading && (
                <div className="py-8 text-center text-muted-foreground text-sm font-medium">
                  No matching results found.
                </div>
              )}

              {/* Dynamic Project Query results */}
              {projects.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Challenges</div>
                  {projects.map((project, idx) => {
                    const actualIdx = filteredNavigation.length + idx;
                    const isSelected = actualIdx === selectedIndex;
                    return (
                      <button
                        key={project._id}
                        onClick={() => {
                          navigate(`/projects/${project._id}`);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(actualIdx)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-left ${
                          isSelected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Code2 size={16} className={isSelected ? "text-primary-foreground" : "text-primary"} />
                          <span className="font-bold text-sm truncate">{project.title}</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary border border-primary/20"
                          }`}>{project.difficulty}</span>
                        </div>
                        <span className="text-[10px] font-bold opacity-60">Open Mission</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Basic Navigation Commands */}
              {filteredNavigation.length > 0 && (
                <div className="space-y-1 pt-1.5">
                  <div className="px-3 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Navigation & Actions</div>
                  {filteredNavigation.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-left ${
                          isSelected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={16} className={isSelected ? "text-primary-foreground" : "text-muted-foreground"} />
                          <span className="font-bold text-sm">{item.name}</span>
                        </div>
                        {item.shortcut && (
                          <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded select-none ${
                            isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
                          }`}>
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-muted/50 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <div className="flex items-center gap-4">
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
              </div>
              <span>Command Palette v1.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
