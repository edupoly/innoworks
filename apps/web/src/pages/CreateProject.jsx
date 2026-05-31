import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "../lib/api";
import RepoPicker from "../components/RepoPicker";
import BranchPicker from "../components/BranchPicker";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRepo) {
      setError("Please select a repository for this challenge.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.post("/projects", {
        ...formData,
        repoUrl: selectedRepo.html_url,
        branchName: branchName,
        requiredSkills: formData.requiredSkills.split(",").map(s => s.trim()).filter(s => s !== ""),
        techStack: formData.techStack.split(",").map(s => s.trim()).filter(s => s !== ""),
        bounty: Number(formData.bounty),
      });
      setSuccess(true);
      setTimeout(() => navigate("/projects"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-black mb-2">Challenge Posted!</h1>
        <p className="text-muted-foreground">Redirecting you to the active missions...</p>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-4xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-xl shadow-primary/5"
      >
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Rocket size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Post a Challenge</h1>
            <p className="text-muted-foreground font-medium">Invite the community to solve a mission in your repository.</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Mission Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Optimize Database Queries"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Difficulty Level</label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Bounty (XP)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={formData.bounty}
                  onChange={(e) => setFormData({ ...formData, bounty: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Required Skills</label>
                <input
                  type="text"
                  placeholder="React, Node.js, MongoDB"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Separate with commas</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tech Stack</label>
                <input
                  type="text"
                  placeholder="Tailwind, TypeScript, Docker"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={formData.techStack}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Separate with commas</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Mission Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the problem and expected solution..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Select Repository</label>
                <RepoPicker onSelect={setSelectedRepo} selectedRepo={selectedRepo} />
              </div>

              {selectedRepo && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Select Base Branch</label>
                  <BranchPicker 
                    owner={selectedRepo.owner?.login || selectedRepo.full_name.split('/')[0]} 
                    repo={selectedRepo.name} 
                    onSelect={setBranchName} 
                    selectedBranch={branchName} 
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-border/50">
            <button
              disabled={isLoading || !selectedRepo || !branchName}
              type="submit"
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={20} />
                  Launch Mission
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProject;