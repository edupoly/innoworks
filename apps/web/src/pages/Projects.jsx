import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import api from "../lib/api.js";
import { Link } from "react-router-dom";
import { BadgeDollarSign, Layers, Users, Star, ArrowRight, CheckCircle2, Search, SlidersHorizontal, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

import { useMe } from "../hooks/useAuth";

const Projects = () => {
  const { user: authUser } = useMe();

  // Reactive filters states
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [skill, setSkill] = useState("");
  const [sort, setSort] = useState("recent"); // 'recent', 'trending', 'most_active', 'most_contributors', 'bounty'
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", search, difficulty, skill, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (difficulty) params.append("difficulty", difficulty);
      if (skill) params.append("skill", skill);
      if (sort) params.append("sort", sort);
      
      const response = await api.get(`/projects?${params.toString()}`);
      return response.data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", authUser?.username],
    queryFn: async () => {
      if (!authUser?.username) return null;
      const response = await api.get(`/users/profile/${authUser.username}`);
      return response.data;
    },
    enabled: !!authUser?.username,
  });

  const submittedProjectIds = new Set(profile?.submissions?.map(s => (s.project?._id || s.project)?.toString()));

  const skillsList = ["React", "Node.js", "Python", "JavaScript", "TypeScript", "Express", "Docker", "GraphQL", "CSS", "HTML"];

  return (
    <div className="py-12 max-w-7xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
            Active Challenges
          </h1>
          <p className="text-muted-foreground text-base">Select and claim missions from premium open source codebases to increase your stats.</p>
        </div>

        {/* Floating Quick Count Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-card border border-border/50 rounded-2xl shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <BookOpen size={14} className="text-primary" />
            <span>{projects?.length || 0} active missions</span>
          </div>
        </div>
      </div>

      {/* Reactive Filter & Search Dashboard */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 mb-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Text Search input */}
          <div className="relative flex items-center bg-background border border-border rounded-2xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-muted-foreground shrink-0 mr-2" size={18} />
            <input
              type="text"
              placeholder="Search challenges by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm font-semibold leading-relaxed text-foreground"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div className="relative">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:focus:ring-primary/20 font-semibold text-foreground"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy Level</option>
              <option value="Medium">Medium Level</option>
              <option value="Hard">Hard Level</option>
            </select>
          </div>

          {/* Sort parameter Dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:focus:ring-primary/20 font-semibold text-foreground"
            >
              <option value="recent">Latest Challenges</option>
              <option value="trending">Trending (Stars & Forks)</option>
              <option value="most_active">Most Active (Open Issues)</option>
              <option value="most_contributors">Most Contributors</option>
              <option value="bounty">Highest Bounty XP</option>
            </select>
          </div>
        </div>

        {/* Skill Tag Filters Row */}
        <div className="border-t border-border/30 pt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSkill("")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
              !skill 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
            }`}
          >
            All Skills
          </button>
          
          {skillsList.map((s) => {
            const isSel = skill === s;
            return (
              <button
                key={s}
                onClick={() => setSkill(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                  isSel 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid listing */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-muted-foreground font-semibold mt-4">Discovering active missions...</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {projects?.map((project) => (
              <motion.div variants={item} key={project._id || project.id}>
                <div className="bg-card rounded-3xl p-6 border border-border/50 flex flex-col h-full group relative overflow-hidden hover:border-primary/45 transition-colors shadow-sm">
                  {/* Hover visual accent glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] uppercase tracking-widest font-black px-3 py-1 rounded-full shadow-sm border ${
                          project.difficulty === "Easy"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : project.difficulty === "Medium"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {project.difficulty}
                      </span>
                      {submittedProjectIds.has((project._id || project.id).toString()) && (
                        <span className="text-[9px] uppercase tracking-widest font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                          <CheckCircle2 size={10} />
                          Submitted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 text-xs shadow-sm">
                      <BadgeDollarSign size={14} />
                      <span>{project.bounty || 100} XP</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors relative z-10">{project.title}</h3>
                  <p className="text-xs text-muted-foreground mb-6 line-clamp-3 leading-relaxed flex-grow relative z-10">
                    {project.description}
                  </p>

                  {/* GitHub Stars & Forks indicators */}
                  <div className="flex items-center gap-4 mb-5 text-[11px] font-bold text-muted-foreground border-y border-border/30 py-3 relative z-10">
                    <span className="flex items-center gap-1"><Star size={13} className="text-yellow-500 fill-yellow-500/20" /> {project.stars || 0}</span>
                    <span className="flex items-center gap-1"><Users size={13} className="text-indigo-500" /> {project.forks || 0} forks</span>
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/40 px-2.5 py-1 rounded border border-border/40">
                      <Layers size={13} className="text-primary/70" />
                      <span>{project.requiredSkills?.length || 0} Skills</span>
                    </div>
                    <Link
                      to={`/projects/${project._id || project.id}`}
                      className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider"
                    >
                      Solve Challenge
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {(!projects || projects.length === 0) && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50 max-w-xl mx-auto"
        >
          <Star size={48} className="mx-auto text-primary opacity-25 mb-4 animate-spin" />
          <h2 className="text-lg font-bold mb-1">No challenges match your filters</h2>
          <p className="text-sm text-muted-foreground">Adjust your skills list, search queries, or difficulties parameters to discover open challenges!</p>
        </motion.div>
      )}
    </div>
  );
};

export default Projects;
