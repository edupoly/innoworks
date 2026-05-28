import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { 
  Github, 
  ExternalLink, 
  BadgeDollarSign, 
  Layers, 
  Clock, 
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Rocket,
  ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../lib/api";
import RepoPicker from "../components/RepoPicker";
import BranchPicker from "../components/BranchPicker";

const ProjectDetails = () => {
  const { id } = useParams();
  const { user: authUser } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branchName, setBranchName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data;
    },
    enabled: !!authUser,
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/projects/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries(["me"]);
    },
  });

  const isAccepted = userData?.acceptedProjects?.includes(id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRepo) {
      setSubmitError("Please select your fork repository.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    // Additional client-side validation
    if (!branchName) {
      setSubmitError("Please select a branch.");
      setIsSubmitting(false);
      return;
    }

    const projectOwner = project.repoUrl.split("/")[3]?.toLowerCase();
    const isOwner = projectOwner === authUser?.username?.toLowerCase();
    const isBaseBranch = branchName === (project.branchName || "main");

    if (isOwner && isBaseBranch) {
      setSubmitError("You are the project owner. To submit a solution and create a PR, please work on a different branch than the base branch.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/submissions", {
        projectId: id,
        forkUrl: selectedRepo.html_url,
        branchName: branchName,
      });
      setSubmitSuccess(true);
      queryClient.invalidateQueries(["profile", authUser?.username]);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !project) return (
    <div className="py-20 text-center">
      <AlertCircle size={48} className="mx-auto text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Project not found</h2>
      <Link to="/projects" className="text-primary hover:underline font-bold">Back to Missions</Link>
    </div>
  );

  return (
    <div className="py-12 max-w-7xl mx-auto px-4">
      <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm mb-8 group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Missions
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-3xl p-8 md:p-10 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <span className={`text-[10px] uppercase tracking-widest font-black px-4 py-2 rounded-full shadow-sm ${
                project.difficulty === "Easy" ? "bg-green-100 text-green-700 dark:bg-green-500/10" :
                project.difficulty === "Medium" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10" :
                "bg-red-100 text-red-700 dark:bg-red-500/10"
              }`}>
                {project.difficulty} Level
              </span>
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-500/10 px-4 py-2 rounded-full">
                <BadgeDollarSign size={20} />
                <span className="text-lg">{project.bounty || 0} XP Bounty</span>
              </div>
            </div>

            <h1 className="text-4xl font-black mb-6 tracking-tight">{project.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10 whitespace-pre-wrap">
              {project.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border/50">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills?.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-muted rounded-lg text-xs font-bold border border-border/50">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Original Repository</h3>
                <a 
                  href={project.repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 p-4 bg-background border border-border rounded-2xl hover:border-primary/50 transition-all w-full group"
                >
                  <Github size={24} className="group-hover:text-primary transition-colors" />
                  <div className="flex-grow">
                    <p className="text-sm font-bold truncate max-w-[200px]">{project.repoUrl.replace("https://github.com/", "")}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase">View Source</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Submission Sidebar */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border/50 rounded-3xl p-8 shadow-xl shadow-primary/5 sticky top-8"
          >
            {!isAccepted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Ready to contribute?</h3>
                <p className="text-sm text-muted-foreground mb-8">Accept this mission to start working on it and unlock the submission form.</p>
                
                {acceptMutation.isError && (
                  <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2 text-xs font-medium">
                    <AlertCircle size={14} />
                    {acceptMutation.error?.response?.data?.message || "Failed to accept mission"}
                  </div>
                )}

                <button
                  disabled={acceptMutation.isLoading}
                  onClick={() => acceptMutation.mutate()}
                  className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                >
                  {acceptMutation.isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Rocket size={18} />
                      Accept Mission
                    </>
                  )}
                </button>
              </div>
            ) : submitSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-emerald-600">Submission Successful!</h3>
                <p className="text-sm text-muted-foreground mb-6 font-medium">Your solution has been submitted and tests are queued. A PR will be raised automatically.</p>
                <div className="flex flex-col gap-3">
                  <Link to="/dashboard" className="w-full btn-primary block py-3">Go to Dashboard</Link>
                  <button 
                    onClick={() => setSubmitSuccess(false)}
                    className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Need to change something? Resubmit
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Send size={20} className="text-primary" />
                    Submit Solution
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">Accepted</span>
                </div>
                
                {submitError && (
                  <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2 text-xs font-medium">
                    <AlertCircle size={14} />
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Base Branch</label>
                    <div className="p-3 bg-muted/50 border border-border rounded-xl flex items-center gap-3">
                      <Layers size={16} className="text-primary" />
                      <span className="text-xs font-bold">{project.branchName || 'main'}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Your solution must be compatible with this branch.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Your Fork</label>
                    <RepoPicker onSelect={setSelectedRepo} selectedRepo={selectedRepo} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Your Branch</label>
                    <BranchPicker 
                      owner={selectedRepo?.owner?.login || selectedRepo?.full_name?.split('/')[0]} 
                      repo={selectedRepo?.name} 
                      onSelect={setBranchName} 
                      selectedBranch={branchName} 
                    />
                  </div>

                  <button
                    disabled={isSubmitting || !selectedRepo || !branchName}
                    type="submit"
                    className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Rocket size={18} />
                        Submit Mission
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 p-4 bg-muted/50 rounded-2xl border border-border/50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock size={12} />
                    How it works
                  </h4>
                  <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                    1. Fork the original repository.<br/>
                    2. Implement your solution in a new branch.<br/>
                    3. Select your fork and branch above.<br/>
                    4. Submit! Our engine will run tests and a PR will be automatically raised.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;