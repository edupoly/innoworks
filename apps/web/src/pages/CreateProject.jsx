import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Send, AlertCircle, CheckCircle2, RefreshCcw, Target, Cpu, Zap, ChevronDown, BookOpen, Layers, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RepoPicker from "../components/RepoPicker";
import BranchPicker from "../components/BranchPicker";
import { useCreateProjectMutation } from "../store/api/projectsApiSlice";

const CreateProject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Medium",
    bounty: 0,
    requiredSkills: "",
    techStack: "",
  });
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branchName, setBranchName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    setBranchName("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRepo) {
      setError("Strategic protocol requires a target repository node.");
      return;
    }
    if (!branchName) {
      setError("Please identify the target logic signal (branch).");
      return;
    }

    setError("");
    try {
      await createProject({
        ...formData,
        repoUrl: selectedRepo.html_url,
        branchName: branchName,
        requiredSkills: formData.requiredSkills.split(",").map(s => s.trim()).filter(s => s !== ""),
        techStack: formData.techStack.split(",").map(s => s.trim()).filter(s => s !== ""),
        bounty: Number(formData.bounty),
      }).unwrap();
      setSuccess(true);
      setTimeout(() => navigate("/projects"), 2500);
    } catch (err) {
      setError(err.data?.message || "Protocol initialization failed. Retry sequence.");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-28 h-28 bg-emerald-500/10 text-emerald-500 rounded-[3rem] flex items-center justify-center border border-emerald-500/20 shadow-[0_20px_50px_rgba(16,185,129,0.2)]"
        >
          <CheckCircle2 size={56} strokeWidth={1.5} />
        </motion.div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-gradient">Mission_Propagated</h1>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.4em] opacity-60">Redirecting to active registry sectors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-5xl mx-auto px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Ambient background effect */}
      <div className="absolute top-0 right-0 w-[40%] h-[500px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.04),transparent_70%)] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="card-premium p-10 lg:p-16 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/[0.02]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16 pb-12 border-b border-border/30">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden shrink-0">
               <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
               <Rocket size={32} className="relative z-10" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter text-gradient leading-none">INITIALIZE MISSION</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Invite the collective to solve a protocol challenge.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="px-4 py-2 bg-secondary/80 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border/50 text-muted-foreground shadow-sm">DRAFT_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-[1.5rem] flex items-center gap-4 text-xs font-black uppercase tracking-widest"
            >
              <AlertCircle size={20} className="shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2 flex items-center gap-2">
                  <Target size={14} className="text-primary" /> Mission Designation
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., CORE_DATABASE_OPTIMIZATION"
                  className="w-full px-6 py-4 bg-background/50 border border-border/50 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all shadow-inner"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2">Complexity Node</label>
                  <div className="relative group">
                    <select
                      className="w-full px-6 py-4 bg-background/50 border border-border/50 rounded-2xl font-black text-[11px] uppercase tracking-widest text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none shadow-inner cursor-pointer transition-all group-hover:border-primary/30"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    >
                      <option value="Easy">Easy Phase</option>
                      <option value="Medium">Standard Node</option>
                      <option value="Hard">Elite Level</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                       <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2">Verified Bounty (XP)</label>
                  <div className="relative group">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full px-6 py-4 bg-background/50 border border-border/50 rounded-2xl font-black text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all shadow-inner group-hover:border-primary/30"
                      value={formData.bounty}
                      onChange={(e) => setFormData({ ...formData, bounty: e.target.value })}
                    />
                    <Trophy size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2">Tech Matrix (CSV)</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="React, Rust, AWS, etc."
                    className="w-full px-6 py-4 bg-background/50 border border-border/50 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all shadow-inner group-hover:border-primary/30"
                    value={formData.requiredSkills}
                    onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  />
                  <Zap size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-2 ml-2 opacity-50">Delineate skill required for synchronization</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2">Stack Dependencies (CSV)</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="TypeScript, Docker, Redis..."
                    className="w-full px-6 py-4 bg-background/50 border border-border/50 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all shadow-inner group-hover:border-primary/30"
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  />
                  <Cpu size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2 flex items-center gap-2">
                  <BookOpen size={14} className="text-primary" /> Operational Briefing
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Define mission objectives and architectural requirements..."
                  className="w-full px-6 py-5 bg-background/50 border border-border/50 rounded-[1.5rem] font-medium text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all resize-none shadow-inner custom-scrollbar"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2 flex items-center gap-2">
                  <Layers size={14} className="text-primary" /> Target Registry Node
                </label>
                <RepoPicker onSelect={handleRepoSelect} selectedRepo={selectedRepo} />
              </div>

              <AnimatePresence>
                {selectedRepo && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2 flex items-center gap-2">
                      <Terminal size={14} className="text-primary" /> Source Signal (Branch)
                    </label>
                    <BranchPicker 
                      owner={selectedRepo.owner?.login || selectedRepo.full_name.split('/')[0]} 
                      repo={selectedRepo.name} 
                      onSelect={setBranchName} 
                      selectedBranch={branchName} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2.5rem] space-y-6 relative overflow-hidden shadow-inner">
                 <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Initialization Directive</h4>
                 <p className="text-xs font-bold leading-relaxed text-foreground/70 tracking-tight">Initializing this mission will broadcast the protocol to the global engineering grid. Once launched, contributors can begin synchronization and deployment sequences.</p>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-border/30">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isCreating || !selectedRepo || !branchName}
              type="submit"
              className="w-full btn-primary py-6 text-[11px] font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(99,102,241,0.5)] disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all flex items-center justify-center gap-4"
            >
              {isCreating ? (
                <RefreshCcw size={22} className="animate-spin" />
              ) : (
                <>
                  <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                  Broadcast Mission
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProject;
