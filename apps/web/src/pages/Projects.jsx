import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Link } from "react-router-dom";
import { BadgeDollarSign, Layers, Users, Star, ArrowRight, CheckCircle2, Search, SlidersHorizontal, BookOpen, Rocket } from "lucide-react";
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
    <div className="py-20 max-w-7xl mx-auto px-4 relative selection:bg-primary/20 noise-bg">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/50 text-primary text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-xl shadow-sm"
            >
              <Rocket size={12} className="fill-primary" />
              Mission Deployment Hub
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Active Challenges
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">Select and claim missions from premium open source codebases to increase your stats.</p>
          </div>

          {/* Floating Quick Count Badge */}
          <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-card border border-border/50 rounded-2xl shadow-xl shadow-black/5 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-foreground">
              <BookOpen size={16} className="text-primary" />
              <span>{projects?.length || 0} Open Missions</span>
            </div>
          </div>
        </div>

        {/* Reactive Filter & Search Dashboard */}
        <div className="bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-8 mb-12 space-y-8 shadow-2xl shadow-black/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Text Search input */}
            <div className="relative flex items-center bg-background/50 border border-border/50 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="text-muted-foreground shrink-0 mr-3" size={20} />
              <input
                type="text"
                placeholder="Search missions by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm font-bold leading-relaxed text-foreground"
              />
            </div>

            {/* Difficulty Dropdown */}
            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full text-sm bg-background/50 border border-border/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:focus:ring-primary/20 font-bold text-foreground appearance-none cursor-pointer hover:bg-background transition-colors"
              >
                <option value="">All Difficulty Levels</option>
                <option value="Easy">Easy Level</option>
                <option value="Medium">Medium Level</option>
                <option value="Hard">Hard Level</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                 <SlidersHorizontal size={14} />
              </div>
            </div>

            {/* Sort parameter Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full text-sm bg-background/50 border border-border/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:focus:ring-primary/20 font-bold text-foreground appearance-none cursor-pointer hover:bg-background transition-colors"
              >
                <option value="recent">Sort by: Latest</option>
                <option value="trending">Sort by: Trending</option>
                <option value="most_active">Sort by: Activity</option>
                <option value="most_contributors">Sort by: Community</option>
                <option value="bounty">Sort by: Reward XP</option>
              </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                 <Star size={14} />
              </div>
            </div>
          </div>

          {/* Skill Tag Filters Row */}
          <div className="border-t border-border/30 pt-6 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setSkill("")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                !skill 
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
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
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                    isSel 
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
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
            <div className="flex flex-col items-center justify-center py-40">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-8 animate-pulse">Initializing Data Stream...</p>
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              {projects?.map((project) => (
                <motion.div variants={item} key={project._id || project.id}>
                  <div className="bg-card/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-border/50 flex flex-col h-full group relative overflow-hidden hover:border-primary/40 hover:bg-card transition-all duration-500 shadow-xl shadow-black/[0.02]">
                    {/* Hover visual accent glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase tracking-widest font-black px-3.5 py-1.5 rounded-xl shadow-sm border ${
                            project.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : project.difficulty === "Medium"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          {project.difficulty}
                        </span>
                        {submittedProjectIds.has((project._id || project.id).toString()) && (
                          <span className="text-[9px] uppercase tracking-widest font-black px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center gap-1.5 border border-indigo-500/20">
                            <CheckCircle2 size={10} />
                            Deployed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-orange-500 font-black bg-orange-500/10 px-4 py-1.5 rounded-xl border border-orange-500/20 text-[10px] shadow-sm uppercase tracking-widest">
                        <BadgeDollarSign size={14} />
                        <span>{project.bounty || 100} XP</span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black mb-3 tracking-tight group-hover:text-primary transition-colors relative z-10 leading-tight">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mb-8 line-clamp-3 leading-relaxed font-medium flex-grow relative z-10">
                      {project.description}
                    </p>

                    {/* GitHub Stars & Forks indicators */}
                    <div className="flex items-center gap-6 mb-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-y border-border/30 py-4 relative z-10">
                      <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Star size={14} className="text-yellow-500 fill-yellow-500/20" /> {project.stars || 0}</span>
                      <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Users size={14} className="text-indigo-500" /> {project.forks || 0} forks</span>
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                        <Layers size={14} className="text-primary" />
                        <span>{project.requiredSkills?.length || 0} Skills</span>
                      </div>
                      <Link
                        to={`/projects/${project._id || project.id}`}
                        className="btn-primary py-3 px-6 text-[10px] flex items-center gap-2.5 font-black uppercase tracking-widest rounded-2xl"
                      >
                        Solve
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
            className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/50 max-w-2xl mx-auto backdrop-blur-sm"
          >
            <Star size={64} className="mx-auto text-primary opacity-20 mb-8 animate-pulse" />
            <h2 className="text-2xl font-black mb-2 tracking-tight">No matching missions found</h2>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">Adjust your skills list, search queries, or difficulty parameters to discover open challenges.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Projects;
