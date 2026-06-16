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
  Terminal, 
  Atom, 
  Hexagon, 
  Play, 
  FileJson, 
  Shield, 
  Box, 
  Share2, 
  Palette, 
  Code,
  Database,
  Server,
  Globe,
  Layers,
  Cpu,
  Cloud,
  Lock
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
import VerifiedBadge from "../components/ui/VerifiedBadge";

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

  const techStack = project.techStack?.length > 0 
    ? project.techStack 
    : (project.requiredSkills?.length > 0 ? project.requiredSkills : ["Analyzing Technical Core..."]);
  const visibleTech = isTechExpanded ? techStack : techStack.slice(0, 3);
  const hasMoreTech = techStack.length > 3;

  // Icon mapping for tech stack
  const getTechIcon = (tech) => {
    const t = tech.toLowerCase();
    if (t.includes('react')) return <Atom size={12} />;
    if (t.includes('node') || t.includes('express')) return <Hexagon size={12} />;
    if (t.includes('python') || t.includes('django') || t.includes('flask')) return <Play size={12} />;
    if (t.includes('js') || t.includes('javascript')) return <FileJson size={12} />;
    if (t.includes('ts') || t.includes('typescript')) return <Shield size={12} />;
    if (t.includes('docker') || t.includes('kubernetes')) return <Box size={12} />;
    if (t.includes('graphql')) return <Share2 size={12} />;
    if (t.includes('css') || t.includes('tailwind') || t.includes('sass')) return <Palette size={12} />;
    if (t.includes('html')) return <Code size={12} />;
    if (t.includes('mongo') || t.includes('db') || t.includes('sql') || t.includes('postgres') || t.includes('database')) return <Database size={12} />;
    if (t.includes('api') || t.includes('rest') || t.includes('server')) return <Server size={12} />;
    if (t.includes('web') || t.includes('site') || t.includes('network')) return <Globe size={12} />;
    if (t.includes('fullstack') || t.includes('stack')) return <Layers size={12} />;
    if (t.includes('hardware') || t.includes('iot') || t.includes('ai') || t.includes('ml')) return <Cpu size={12} />;
    if (t.includes('aws') || t.includes('cloud') || t.includes('azure') || t.includes('gcp') || t.includes('vercel')) return <Cloud size={12} />;
    if (t.includes('auth') || t.includes('security') || t.includes('jwt')) return <Lock size={12} />;
    return <Terminal size={12} />;
  };

  return (
    <Card className="p-6 flex flex-col h-full group relative overflow-hidden bg-[#FFFFFF] border-border/40 hover:border-primary/40 transition-all duration-500 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.03]">
      {/* Visual background accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full group-hover:bg-primary/10 transition-colors duration-700" />
      
      {/* Header: Difficulty & Users */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              project.difficulty === "Easy"
                ? "success"
                : project.difficulty === "Medium"
                  ? "default"
                  : "destructive"
            }
            className="px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md"
          >
            {project.difficulty}
          </Badge>
          {submittedProjectIds.has((project._id || project.id).toString()) && (
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20" title="Mission Solved">
              <CheckCircle2 size={10} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-100">
          <Users size={10} className="text-primary/70" />
          <span className="text-[10px] font-black text-slate-500 tabular-nums">{usersCount} Active</span>
        </div>
      </div>

      {/* Title Section */}
      <div className="mb-4 relative z-10">
        <div className="flex items-start justify-between gap-2 group/title">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-snug ${!isTitleExpanded ? 'line-clamp-2' : ''}`}>
              {project.title}
            </h3>
            {project.isVerified && <VerifiedBadge size="sm" />}
          </div>
          {(project.title?.length > 35) && (
            <button 
              onClick={(e) => { e.preventDefault(); setIsTitleExpanded(!isTitleExpanded); }}
              className="mt-1 opacity-0 group-hover/title:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary"
            >
              {isTitleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="mb-6 flex-grow relative z-10">
        <p className={`text-xs text-slate-500 leading-relaxed font-medium ${!isDescExpanded ? 'line-clamp-3' : ''}`}>
          {project.description}
        </p>
        {project.description?.length > 100 && (
          <button 
            onClick={(e) => { e.preventDefault(); setIsDescExpanded(!isDescExpanded); }}
            className="mt-2 text-[9px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            {isDescExpanded ? 'Show Less' : 'Read More'}
            {isDescExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
      </div>

      {/* Stats Section */}
      <div className="flex items-center justify-between gap-2 py-4 border-y border-slate-50 mb-6 relative z-10">
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-1.5">
            <Activity size={12} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-700 tabular-nums">{project.openIssuesCount || 0}</span>
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Open</span>
        </div>
        <div className="w-px h-6 bg-slate-100" />
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-700 tabular-nums">{closedIssues}</span>
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Closed</span>
        </div>
        <div className="w-px h-6 bg-slate-100" />
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-1.5">
            <GitPullRequest size={12} className="text-primary" />
            <span className="text-xs font-bold text-slate-700 tabular-nums">{prsRaised}</span>
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PRs</span>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mb-6 relative z-10">
        <div className="flex flex-wrap gap-2">
          {visibleTech.map((tech, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 hover:border-primary/20 hover:bg-white transition-all duration-300 group/tech">
              <span className="text-primary/60 group-hover/tech:text-primary transition-colors">
                {getTechIcon(tech)}
              </span>
              <span className="text-[9px] font-bold text-slate-600">{tech}</span>
            </div>
          ))}
          {hasMoreTech && (
            <button 
              onClick={(e) => { e.preventDefault(); setIsTechExpanded(!isTechExpanded); }}
              className="px-2 py-1 bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/10 transition-colors text-[9px] font-bold text-primary"
            >
              {isTechExpanded ? 'Less' : `+${techStack.length - 3}`}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between relative z-10 mt-auto pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-slate-100 p-0.5 shadow-sm group-hover:border-primary/30 transition-colors duration-500 overflow-hidden bg-white">
            <img 
              src={project.owner?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.owner?.username || 'owner'}`} 
              alt={project.owner?.username} 
              className="w-full h-full rounded-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Owner</span>
            <span className="text-[11px] font-bold text-slate-900 leading-none group-hover:text-primary transition-colors">@{project.owner?.username || 'unknown'}</span>
          </div>
        </div>
        
        <Link to={`/projects/${project._id || project.id}`}>
          <Button size="sm" className="h-9 px-5 gap-2 rounded-xl font-bold text-xs uppercase tracking-wider group/btn shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
            Engage
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
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors z-10" size={20} />
                <Input
                  type="text"
                  placeholder="Scan by mission title..."
                  value={search}
                  onChange={handleSetSearch}
                  className="pl-14"
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
                  className="w-full h-12 px-6 bg-background/50 border border-border/50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 appearance-none shadow-inner cursor-pointer transition-all"
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
                  className="w-full h-12 px-6 bg-background/50 border border-border/50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 appearance-none shadow-inner cursor-pointer transition-all"
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
            <Button
              variant={!skill ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleSetSkill("")}
              className={!skill ? "scale-105" : ""}
            >
              Full Stack
            </Button>
            
            {skillsList.map((s) => {
              const isSel = skill === s;
              return (
                <Button
                  key={s}
                  variant={isSel ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => handleSetSkill(s)}
                  className={isSel ? "scale-105" : ""}
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
            className="text-center py-48 glass-card rounded-[3rem] border-2 border-dashed border-border/50 max-w-2xl mx-auto backdrop-blur-sm space-y-8"
          >
            <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto relative">
              <Search size={48} className="text-primary opacity-20" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tighter uppercase tracking-[0.1em]">Signal Lost</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed opacity-60 px-10 uppercase text-[10px] tracking-[0.3em]">No protocols match your current intelligence matrix. Refine search parameters.</p>
            </div>
            <Button 
              variant="ghost"
              onClick={() => { setSearch(""); setDifficulty(""); setSkill(""); setSort("recent"); }}
              className="gap-3 mx-auto"
            >
              <Zap size={14} fill="currentColor" /> Reset All Terminals
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Projects;
