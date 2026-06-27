import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Send, AlertCircle, CheckCircle2, RefreshCcw, Target, Cpu, Zap, ChevronDown, BookOpen, Layers, Terminal, Trophy } from "lucide-react";
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
      setError("Please identify the target branch.");
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
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 shadow-[0_20px_50px_rgba(16,185,129,0.2)]"
        >
          <CheckCircle2 size={48} strokeWidth={1.5} />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-gradient">Project_Created</h1>
          <p className="text-muted-foreground font-medium uppercase text-[9px] tracking-[0.4em] opacity-60">Redirecting to active projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-5xl mx-auto px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Ambient background effect */}
      <div className="absolute top-0 right-0 w-[40%] h-[500px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.04),transparent_70%)] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="card-premium p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/[0.02]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 pb-8 border-b border-border/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden shrink-0">
               <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
               <Rocket size={28} className="relative z-10" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-3xl font-black tracking-tighter text-gradient leading-none">INITIALIZE PROJECT</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Add a new project to the hub.</p>
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
            <div className="space-y-12">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2 flex items-center gap-2">
                  <Target size={12} className="text-primary" /> Project Title
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Core API Optimization"
                  className="w-full h-11 px-5 bg-background/50 border border-border/50 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-inner"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Difficulty</label>
                  <div className="relative group">
                    <select
                      className="w-full h-11 px-5 bg-background/50 border border-border/50 rounded-xl font-black text-[10px] uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-inner cursor-pointer transition-all group-hover:border-primary/30"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Elite</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                       <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Bounty (Score)</label>
                  <div className="relative group">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full h-11 px-5 bg-background/50 border border-border/50 rounded-xl font-black text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-inner group-hover:border-primary/30"
                      value={formData.bounty}
                      onChange={(e) => setFormData({ ...formData, bounty: e.target.value })}
                    />
                    <Trophy size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Tech Stack (CSV)</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="React, Node.js, etc."
                    className="w-full h-11 px-5 bg-background/50 border border-border/50 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-inner group-hover:border-primary/30"
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  />
                  <Zap size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Required Skills (CSV)</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Docker, Redis..."
                    className="w-full h-11 px-5 bg-background/50 border border-border/50 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-inner group-hover:border-primary/30"
                    value={formData.requiredSkills}
                    onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  />
                  <Cpu size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2 flex items-center gap-2">
                  <BookOpen size={12} className="text-primary" /> Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Define project objectives..."
                  className="w-full px-5 py-4 bg-background/50 border border-border/50 rounded-xl font-medium text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all resize-none shadow-inner custom-scrollbar"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2 flex items-center gap-2">
                  <Layers size={12} className="text-primary" /> Repository
                </label>
                <RepoPicker onSelect={handleRepoSelect} selectedRepo={selectedRepo} />
              </div>

              <AnimatePresence>
                {selectedRepo && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2 flex items-center gap-2">
                      <Terminal size={12} className="text-primary" /> Branch
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
              
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-4 relative overflow-hidden shadow-inner">
                 <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Project Directive</h4>
                 <p className="text-xs font-bold leading-relaxed text-foreground/70 tracking-tight">Initializing this project will broadcast it to the global engineering hub. Contributors can then begin synchronization.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/30">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isCreating || !selectedRepo || !branchName}
              type="submit"
              className="w-full h-14 btn-primary text-[11px] font-black uppercase tracking-[0.4em] rounded-xl shadow-xl shadow-primary/20 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all flex items-center justify-center gap-4"
            >
              {isCreating ? (
                <RefreshCcw size={18} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                  Create Project
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
