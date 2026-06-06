import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  BadgeDollarSign, 
  Layers, 
  Users, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  SlidersHorizontal, 
  BookOpen, 
  Rocket,
  Zap,
  Target,
  Terminal,
  Activity,
  Globe,
  GitFork,
  ChevronDown,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMe } from "../hooks/useAuth";
import { useGetProjectsQuery } from "../store/api/projectsApiSlice";
import { useGetUserProfileQuery } from "../store/api/usersApiSlice";
import { useDebounce } from "../hooks/useDebounce";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

const Projects = () => {
  const { user: authUser } = useMe();

  // Reactive filters states
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [difficulty, setDifficulty] = useState("");
  const [skill, setSkill] = useState("");
  const [sort, setSort] = useState("recent"); // 'recent', 'trending', 'most_active', 'most_contributors', 'bounty'

  const { data: projects, isLoading } = useGetProjectsQuery({
    search: debouncedSearch,
    difficulty,
    skill,
    sort
  });

  const { data: profile } = useGetUserProfileQuery(authUser?.username, {
    skip: !authUser?.username,
  });

  const submittedProjectIds = useMemo(() => {
    return new Set(profile?.submissions?.map(s => (s.project?._id || s.project)?.toString()));
  }, [profile?.submissions]);

  const handleSetSkill = useCallback((s) => setSkill(s), []);
  const handleSetDifficulty = useCallback((e) => setDifficulty(e.target.value), []);
  const handleSetSort = useCallback((e) => setSort(e.target.value), []);
  const handleSetSearch = useCallback((e) => setSearch(e.target.value), []);

  const skillsList = useMemo(() => ["React", "Node.js", "Python", "JavaScript", "TypeScript", "Express", "Docker", "GraphQL", "CSS", "HTML"], []);

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-0 right-0 w-[50%] h-[500px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.05),transparent_70%)] -z-10 pointer-events-none" />

      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-10"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                <Target size={20} className="relative z-10" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Registry Hub</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gradient leading-none">
              Active Missions
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl font-medium leading-relaxed tracking-tight">Explore the global engineering grid and synchronize with high-impact open source challenges.</p>
          </div>

          <div className="flex items-center gap-4">
             <div className="px-6 py-3.5 glass-card rounded-2xl flex items-center gap-3 shadow-xl shadow-black/5 border border-border/50">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">{projects?.length || 0} SECTORS_OPEN</span>
             </div>
             <div className="px-6 py-3.5 glass-card rounded-2xl flex items-center gap-3 shadow-xl shadow-black/5 border border-border/50">
               <Activity size={16} className="text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">GRID_ONLINE</span>
             </div>
          </div>
        </motion.div>

        {/* Intelligence Filters Dashboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card rounded-[2.5rem] p-10 lg:p-12 mb-16 space-y-10 shadow-2xl shadow-black/5 border border-border/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mission Designation Search */}
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Designation Alpha</label>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Scan by mission title..."
                  value={search}
                  onChange={handleSetSearch}
                  className="w-full pl-14 pr-6 py-4 bg-background/50 border border-border/50 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Complexity Node Selector */}
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Complexity Matrix</label>
              <div className="relative group">
                <select
                  value={difficulty}
                  onChange={handleSetDifficulty}
                  className="w-full px-6 py-4 bg-background/50 border border-border/50 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none shadow-inner cursor-pointer transition-all group-hover:border-primary/30"
                >
                  <option value="">All Protocol Levels</option>
                  <option value="Easy">Easy Phase</option>
                  <option value="Medium">Standard Node</option>
                  <option value="Hard">Elite Challenge</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Registry Priority Sort */}
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Signal Priority</label>
              <div className="relative group">
                <select
                  value={sort}
                  onChange={handleSetSort}
                  className="w-full px-6 py-4 bg-background/50 border border-border/50 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none shadow-inner cursor-pointer transition-all group-hover:border-primary/30"
                >
                  <option value="recent">Sequence: Recent</option>
                  <option value="trending">Sequence: Trending</option>
                  <option value="most_active">Sequence: Active</option>
                  <option value="most_contributors">Sequence: Linked</option>
                  <option value="bounty">Sequence: Rewards</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Tech Matrix Filters */}
          <div className="pt-8 border-t border-border/30 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleSetSkill("")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border shadow-sm ${
                !skill 
                  ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105" 
                  : "bg-background/50 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/50"
              }`}
            >
              Full Stack
            </button>
            
            {skillsList.map((s) => {
              const isSel = skill === s;
              return (
                <button
                  key={s}
                  onClick={() => handleSetSkill(s)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border shadow-sm ${
                    isSel 
                      ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105" 
                      : "bg-background/50 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Grid Mission Listing */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-48 space-y-8">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
              </div>
              <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Aggregating Global Signals...</p>
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
                  <div className="card-premium p-10 flex flex-col h-full group relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
                    {/* Hover visual accent glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="flex items-center justify-between mb-10 relative z-10">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[9px] uppercase tracking-[0.3em] font-black px-4 py-1.5 rounded-xl shadow-sm border ${
                            project.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : project.difficulty === "Medium"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          {project.difficulty}
                        </span>
                        {submittedProjectIds.has((project._id || project.id).toString()) && (
                          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-background animate-glow" title="Mission Solved">
                            <CheckCircle2 size={12} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-amber-500 font-black bg-amber-500/10 px-4 py-1.5 rounded-xl border border-amber-500/20 text-[10px] shadow-sm uppercase tracking-widest">
                        <Trophy size={14} className="fill-amber-500/20" />
                        <span>{project.bounty || 100} XP</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-10 flex-grow relative z-10">
                      <h3 className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors leading-tight">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                        {project.description}
                      </p>
                    </div>

                    {/* Meta Signals Registry */}
                    <div className="flex items-center gap-8 mb-10 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 border-y border-border/30 py-5 relative z-10 group-hover:border-primary/20 transition-colors">
                      <span className="flex items-center gap-2.5 hover:text-primary transition-colors"><Star size={16} className="text-amber-500 fill-amber-500/10 group-hover:fill-amber-500/20 transition-all" /> {project.stars || 0}</span>
                      <span className="flex items-center gap-2.5 hover:text-primary transition-colors"><GitFork size={16} className="text-primary opacity-60" /> {project.forks || 0}</span>
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                         <div className="flex -space-x-3">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="w-7 h-7 rounded-xl bg-secondary border-2 border-background flex items-center justify-center shadow-sm overflow-hidden">
                                <Users size={12} className="text-muted-foreground" />
                              </div>
                            ))}
                         </div>
                         <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{project.contributors?.length || 0}+ LINKED</span>
                      </div>
                      
                      <Link
                        to={`/projects/${project._id || project.id}`}
                        className="btn-primary py-3.5 px-8 text-[10px] flex items-center gap-3 font-black uppercase tracking-[0.3em] rounded-2xl group/btn overflow-hidden relative"
                      >
                        <span className="relative z-10">Engage</span>
                        <ArrowRight size={14} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
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
            className="text-center py-48 glass-card rounded-[3rem] border-2 border-dashed border-border/50 max-w-2xl mx-auto backdrop-blur-sm space-y-8"
          >
            <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto relative">
              <Star size={48} className="text-primary opacity-20 animate-pulse" />
              <div className="absolute inset-0 border-2 border-primary/20 rounded-[2.5rem] scale-110 opacity-50" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tighter uppercase tracking-[0.1em]">Signal Lost</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed opacity-60 px-10 uppercase text-[10px] tracking-[0.3em]">No protocols match your current intelligence matrix. Refine search parameters.</p>
            </div>
            <button 
              onClick={() => { setSearch(""); setDifficulty(""); setSkill(""); setSort("recent"); }}
              className="text-primary text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-125 transition-all flex items-center gap-3 mx-auto"
            >
              <Zap size={14} fill="currentColor" /> Reset All Terminals
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Projects;
