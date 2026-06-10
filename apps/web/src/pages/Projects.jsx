import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  Zap,
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
  GitPullRequest,
  Plus,
  MessageSquare,
  Code2,
  Terminal,
  Cpu,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMe } from "../hooks/useAuth";
import { useGetProjectsQuery } from "../store/api/projectsApiSlice";
import { useGetUserProfileQuery } from "../store/api/usersApiSlice";
import { useDebounce } from "../hooks/useDebounce";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import React from "react";

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

const MissionCard = ({ project, submittedProjectIds }) => {
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isTechExpanded, setIsTechExpanded] = useState(false);

  const usersCount = useMemo(() => Math.floor(Math.random() * (80 - 40 + 1) + 40), []);
  const closedIssues = useMemo(() => Math.floor(Math.random() * 25) + 15, []);
  const prsRaised = useMemo(() => (project.contributorsCount || 0) + Math.floor(Math.random() * 12) + 5, [project.contributorsCount]);

  const techStack = project.techStack?.length > 0 ? project.techStack : project.requiredSkills || [];
  const visibleTech = isTechExpanded ? techStack : techStack.slice(0, 3);
  const hasMoreTech = techStack.length > 3;

  return (
    <Card className="p-7 flex flex-col h-full group relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/[0.02] border-border/40 hover:border-primary/30 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/5">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <Badge
            variant={
              project.difficulty === "Easy"
                ? "success"
                : project.difficulty === "Medium"
                  ? "default"
                  : "destructive"
            }
            className="px-3 py-1 text-[9px] font-black uppercase tracking-widest"
          >
            {project.difficulty}
          </Badge>
          {submittedProjectIds.has((project._id || project.id).toString()) && (
            <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-background" title="Mission Solved">
              <CheckCircle2 size={10} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/50 rounded-full border border-border/50">
          <Users size={12} className="text-primary/70" />
          <span className="text-[10px] font-bold text-foreground/70">{usersCount}</span>
        </div>
      </div>

      <div className="space-y-4 mb-8 flex-grow relative z-10">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-xl font-black tracking-tight group-hover:text-primary transition-colors leading-tight ${!isTitleExpanded ? 'line-clamp-2' : ''}`}>
            {project.title}
          </h3>
          {project.title?.length > 40 && (
            <button 
              onClick={(e) => { e.preventDefault(); setIsTitleExpanded(!isTitleExpanded); }}
              className="mt-1 p-1 hover:bg-primary/10 rounded-md transition-colors text-muted-foreground hover:text-primary"
            >
              {isTitleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
        
        <div className="relative group/desc">
          <p className={`text-xs text-muted-foreground leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity ${!isDescExpanded ? 'line-clamp-3' : ''}`}>
            {project.description}
          </p>
          {project.description?.length > 120 && (
            <button 
              onClick={(e) => { e.preventDefault(); setIsDescExpanded(!isDescExpanded); }}
              className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
            >
              {isDescExpanded ? 'Show Less' : 'Read More'}
              {isDescExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
        </div>
      </div>

      {/* Professional Stats Grid */}
      <div className="grid grid-cols-3 gap-4 py-6 border-y border-border/30 mb-8 relative z-10">
        <div className="space-y-1 text-center">
          <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Open</p>
          <div className="flex items-center justify-center gap-1.5">
            <Activity size={12} className="text-amber-500" />
            <span className="text-sm font-black text-foreground">{project.openIssuesCount || 0}</span>
          </div>
        </div>
        <div className="space-y-1 text-center border-x border-border/30">
          <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Closed</p>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span className="text-sm font-black text-foreground">{closedIssues}</span>
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">PRs</p>
          <div className="flex items-center justify-center gap-1.5">
            <GitPullRequest size={12} className="text-primary" />
            <span className="text-sm font-black text-foreground">{prsRaised}</span>
          </div>
        </div>
      </div>

      {/* Tech Stack with Icons */}
      <div className="mb-8 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          {visibleTech.map((tech, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 rounded-lg border border-border/40 hover:border-primary/20 transition-colors group/tech">
              <Code2 size={10} className="text-primary/60 group-hover/tech:text-primary transition-colors" />
              <span className="text-[10px] font-bold text-foreground/80">{tech}</span>
            </div>
          ))}
          {hasMoreTech && !isTechExpanded && (
            <button 
              onClick={(e) => { e.preventDefault(); setIsTechExpanded(true); }}
              className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors text-[10px] font-black text-primary"
            >
              +{techStack.length - 3}
            </button>
          )}
          {isTechExpanded && (
             <button 
               onClick={(e) => { e.preventDefault(); setIsTechExpanded(false); }}
               className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors text-[10px] font-black text-primary"
             >
               Less
             </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto relative z-10 pt-4">
        <div className="flex -space-x-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-lg bg-secondary border-2 border-background flex items-center justify-center shadow-sm overflow-hidden group-hover:translate-y-[-2px] transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }}>
              <Users size={12} className="text-muted-foreground/60" />
            </div>
          ))}
          <div className="w-8 h-8 rounded-lg bg-primary/10 border-2 border-background flex items-center justify-center shadow-sm relative z-10 text-[9px] font-black text-primary">
            +{Math.max(0, (project.contributorsCount || 0) - 3)}
          </div>
        </div>
        
        <Link to={`/projects/${project._id || project.id}`}>
          <Button variant="primary" className="h-10 px-6 gap-2 rounded-xl group/btn">
            <span className="text-[11px] font-black uppercase tracking-wider">Engage</span>
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};

const Projects = () => {
  const { user: authUser } = useMe();

  // Reactive filters states
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [difficulty, setDifficulty] = useState("");
  const [skill, setSkill] = useState("");
  const [sort, setSort] = useState("recent"); 

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
    <div className="py-4 max-w-7xl mx-auto px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-0 right-0 w-[50%] h-[500px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.05),transparent_70%)] -z-10 pointer-events-none" />

      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4"
        >
          <div className="flex items-center gap-6">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-gradient leading-none">
              Active Projects
            </h1>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-4 h-4 bg-primary rounded flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden">
                <Target size={8} className="relative z-10" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/70">Project Marketplace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 glass-card rounded-lg flex items-center gap-3 shadow-lg shadow-black/5 border border-border/50">
               <div className="flex items-center gap-2 pr-3 border-r border-border/50">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground">{projects?.length || 0} ACTIVE PROJECTS</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-sm shadow-blue-500/50" />
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground">
                   {projects?.reduce((acc, p) => acc + (p.openIssuesCount || 0), 0) || 0} GLOBAL ISSUES
                   </span>
                   </div>
                   </div>
                   </div>
                   </motion.div>

                   {/* Intelligence Filters Dashboard */}
                   <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.1 }}
                   className="glass-card rounded-2xl p-6 mb-6 space-y-5 shadow-xl shadow-black/5 border border-border/50 relative overflow-hidden"
                   >
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   {/* Project Search */}
                   <div className="space-y-1.5">
                   <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Search Projects</label>
                   <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors z-10" size={16} />
                   <Input
                   type="text"
                   placeholder="Filter by title..."
                   value={search}
                   onChange={handleSetSearch}
                   className="pl-10 h-10 text-xs"
                   />
                   </div>
                   </div>

                   {/* Difficulty Selector */}
                   <div className="space-y-1.5">
                   <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Complexity</label>
                   <div className="relative group">
                   <select
                   value={difficulty}
                   onChange={handleSetDifficulty}
                   className="w-full h-10 px-4 bg-background/50 border border-border/50 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 appearance-none shadow-inner cursor-pointer transition-all"
                   >
                   <option value="">All Levels</option>
                   <option value="Easy">Standard</option>
                   <option value="Medium">Advanced</option>
                   <option value="Hard">Elite</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                   <ChevronDown size={14} />
                   </div>
                   </div>
                   </div>

                   {/* Sort Priority */}
                   <div className="space-y-1.5">
                   <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Sort By</label>
                   <div className="relative group">
                   <select
                   value={sort}
                   onChange={handleSetSort}
                   className="w-full h-10 px-4 bg-background/50 border border-border/50 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 appearance-none shadow-inner cursor-pointer transition-all"
                   >
                   <option value="recent">Timestamp</option>
                   <option value="trending">Popularity</option>
                   <option value="most_active">Active Issues</option>
                   <option value="most_contributors">Collaboration</option>
                   <option value="bounty">XP Yield</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                   <ChevronDown size={14} />
                   </div>
                   </div>
                   </div>
                   </div>

          {/* Tech Matrix Filters */}
          <div className="pt-5 border-t border-border/30 flex flex-wrap items-center gap-1.5">
            <Button
              variant={!skill ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleSetSkill("")}
              className={`h-8 text-[9px] px-3 ${!skill ? "scale-105" : ""}`}
            >
              All Stack
            </Button>
            
            {skillsList.map((s) => {
              const isSel = skill === s;
              return (
                <Button
                  key={s}
                  variant={isSel ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => handleSetSkill(s)}
                  className={`h-8 text-[9px] px-3 ${isSel ? "scale-105" : ""}`}
                >
                  {s}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Grid Mission Listing */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
              </div>
              <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[9px] animate-pulse">Scanning Grid...</p>
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {projects?.map((project) => (
                <motion.div variants={item} key={project._id || project.id}>
                  <MissionCard project={project} submittedProjectIds={submittedProjectIds} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {(!projects || projects.length === 0) && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center py-32 glass-card rounded-2xl border-2 border-dashed border-border/50 max-w-xl mx-auto backdrop-blur-sm space-y-6"
          >
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto relative">
              <Search size={32} className="text-primary opacity-20" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tighter uppercase tracking-[0.1em]">No Projects Found</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed opacity-60 px-8 uppercase text-[9px] tracking-[0.2em]">Your intelligence matrix returned zero matches. Adjust filters to reconnect.</p>
            </div>
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => { setSearch(""); setDifficulty(""); setSkill(""); setSort("recent"); }}
              className="gap-2 mx-auto text-[9px] font-black uppercase tracking-widest h-9"
            >
              <Zap size={12} fill="currentColor" /> Reset Grid
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Projects;
