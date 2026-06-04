import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  ShieldCheck,
  Code2,
  Trophy,
  History,
  Activity,
  GitBranch,
  Star,
  Eye,
  GitFork,
  BookOpen,
  Plus,
  GitPullRequest,
  ClipboardList,
  FileCode2,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import RepoPicker from "../components/RepoPicker";
import BranchPicker from "../components/BranchPicker";

import { useMe } from "../hooks/useAuth";

const ProjectDetails = () => {
  const { id } = useParams();
  const { user: authUser } = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Fetch live repository intelligence using high-performance GraphQL endpoint
  const { data: intelligence, isLoading: loadingIntel, error: intelError } = useQuery({
    queryKey: ["projectIntelligence", id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}/intelligence`);
      return response.data;
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // 2. Fetch basic project details
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
  });

  // 3. Fetch submissions for this project
  const { data: projectSubmissions } = useQuery({
    queryKey: ["projectSubmissions", id],
    queryFn: async () => {
      const response = await api.get(`/submissions/project/${id}`);
      return response.data;
    },
  });
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'stats', 'dev_flow', 'test_flow'
  
  // Start Developing states
  const [forkStatus, setForkStatus] = useState(null);
  const [issuesList, setIssuesList] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueBody, setNewIssueBody] = useState("");
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  
  // Start Developing Submission states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [devError, setDevError] = useState("");
  const [devSuccess, setDevSuccess] = useState(false);
  const [submittingDev, setSubmittingDev] = useState(false);

  // Start Testing Flow states
  const [selectedPR, setSelectedPR] = useState(null);
  const [testRating, setTestRating] = useState(5);
  const [testBugs, setTestBugs] = useState("");
  const [testSuggestions, setTestSuggestions] = useState("");
  const [testFeedback, setTestFeedback] = useState("");
  const [testOutcome, setTestOutcome] = useState("APPROVED"); // 'APPROVED', 'NEEDS_CHANGES', 'REJECTED'
  const [checklist, setChecklist] = useState([
    { item: "Code compiles successfully and has no build errors", checked: false },
    { item: "Features correctly solve the challenge requirements", checked: false },
    { item: "Tests added or modified correctly cover features", checked: false },
    { item: "Code style matches guidelines (no hardcoded secrets)", checked: false },
    { item: "Documentation or README has been updated accordingly", checked: false }
  ]);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState("");
  const [submittingTest, setSubmittingTest] = useState(false);

  // Edit Project states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBounty, setEditBounty] = useState(100);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  useEffect(() => {
    if (project) {
      setEditTitle(project.title);
      setEditDescription(project.description);
      setEditBounty(project.bounty || 100);
    }
  }, [project]);

  const updateProjectMutation = useMutation({
    mutationFn: (data) => api.put(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["project", id]);
      setIsEditing(false);
    },
  });

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setIsUpdatingProject(true);
    try {
      await updateProjectMutation.mutateAsync({
        title: editTitle,
        description: editDescription,
        bounty: editBounty
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const closeIssueMutation = useMutation({
    mutationFn: (issueNumber) => api.patch(`/projects/${id}/issues/${issueNumber}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries(["projectIntelligence", id]);
    },
  });

  const handleCloseIssue = (issueNumber) => {
    if (window.confirm(`Are you sure you want to close issue #${issueNumber}?`)) {
      closeIssueMutation.mutate(issueNumber);
    }
  };

  const activeSubmissions = projectSubmissions?.filter(s => s.status !== 'MERGED' && s.status !== 'REJECTED') || [];
  const submissionHistory = projectSubmissions?.filter(s => s.status === 'MERGED' || s.status === 'REJECTED') || [];

  const mySubmissions = projectSubmissions?.filter(s => s.user?._id === authUser?._id || s.user === authUser?._id) || [];

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      navigate("/projects");
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/projects/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries(["me"]);
      checkFork();
    },
  });

  const checkFork = async () => {
    try {
      const res = await api.get(`/projects/${id}/fork-status`);
      setForkStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (authUser?.acceptedProjects?.includes(id)) {
      checkFork();
    }
  }, [authUser, id]);

  const handleCreateGitHubIssue = async (e) => {
    e.preventDefault();
    if (!newIssueTitle) return;
    setIsCreatingIssue(true);
    try {
      const res = await api.post(`/projects/${id}/issues`, {
        title: newIssueTitle,
        body: newIssueBody,
        labels: ["student-contribution"]
      });
      setNewIssueTitle("");
      setNewIssueBody("");
      setShowIssueForm(false);
      queryClient.invalidateQueries(["projectIntelligence", id]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingIssue(false);
    }
  };

  const handleDevSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRepo || !selectedBranch) return;
    setSubmittingDev(true);
    try {
      await api.post("/submissions", {
        projectId: id,
        forkUrl: selectedRepo.html_url,
        branchName: selectedBranch,
      });
      setDevSuccess(true);
      queryClient.invalidateQueries(["projectSubmissions", id]);
    } catch (err) {
      setDevError(err.response?.data?.message || "Failed to submit contribution.");
    } finally {
      setSubmittingDev(false);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPR || !testFeedback) return;
    setSubmittingTest(true);
    try {
      const reviewTarget = selectedPR._id || selectedPR.number;
      await api.post(`/submissions/${reviewTarget}/reviews`, {
        projectId: id,
        feedback: testFeedback,
        outcome: testOutcome,
        checklist,
        rating: testRating,
        bugsFound: testBugs.split("\n").filter(b => b.trim() !== ""),
        suggestions: testSuggestions
      });
      setTestSuccess(true);
      setTimeout(() => {
        setTestSuccess(false);
        setSelectedPR(null);
        queryClient.invalidateQueries(["projectIntelligence", id]);
        queryClient.invalidateQueries(["projectSubmissions", id]);
      }, 3000);
    } catch (err) {
      setTestError("Failed to submit review.");
    } finally {
      setSubmittingTest(false);
    }
  };

  const mergeMutation = useMutation({
    mutationFn: (submissionId) => api.post(`/submissions/${submissionId}/merge`),
    onSuccess: () => {
      queryClient.invalidateQueries(["projectIntelligence", id]);
      queryClient.invalidateQueries(["projectSubmissions", id]);
    },
  });

  const handleMerge = (submissionId) => {
    if (window.confirm("Are you sure you want to merge this?")) {
      mergeMutation.mutate(submissionId);
    }
  };

  const toggleChecklist = (index) => {
    setChecklist(prev => prev.map((item, idx) => 
      idx === index ? { ...item, checked: !item.checked } : item
    ));
  };

  const isAccepted = authUser?.acceptedProjects?.includes(id);

  if (loadingProject || loadingIntel) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold">Querying live GitHub GraphQL intelligence...</p>
    </div>
  );

  return (
    <div className="py-12 max-w-7xl mx-auto px-4">
      <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm mb-8 group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Explore Missions
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-card p-6 border border-border/50 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
            <Github size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">{project?.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">{intelligence?.overview?.license} License • Branch: {intelligence?.overview?.defaultBranch}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) ? (
            <>
              <button 
                onClick={handleDelete}
                className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all mr-2"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={() => setActiveTab("management")}
                className={`px-6 py-3 font-black uppercase tracking-wider text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md ${activeTab === "management" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
              >
                <Layers size={14} /> Manage Mission
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { if (!isAccepted) acceptMutation.mutate(); setActiveTab("dev_flow"); }}
                className={`px-6 py-3 font-black uppercase tracking-wider text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md ${activeTab === "dev_flow" ? "bg-primary text-primary-foreground" : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"}`}
              >
                <Rocket size={14} /> Start Developing
              </button>
              <button 
                onClick={() => setActiveTab("test_flow")}
                className={`px-6 py-3 font-black uppercase tracking-wider text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md ${activeTab === "test_flow" ? "bg-primary text-primary-foreground" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"}`}
              >
                <ShieldCheck size={14} /> Start Testing
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-border/50 mb-8 gap-6 text-sm font-bold select-none">
        <button onClick={() => setActiveTab("overview")} className={`pb-4 border-b-2 px-1 ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Base Overview</button>
        <button onClick={() => setActiveTab("stats")} className={`pb-4 border-b-2 px-1 ${activeTab === "stats" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Analytics</button>
        {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) && (
          <button onClick={() => setActiveTab("management")} className={`pb-4 border-b-2 px-1 ${activeTab === "management" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Submissions</button>
        )}
        <button onClick={() => setActiveTab("activity")} className={`pb-4 border-b-2 px-1 ${activeTab === "activity" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Activity</button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border/50 rounded-3xl p-8 space-y-4 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mission Briefing</h3>
                <p className="text-base text-foreground leading-relaxed">{project?.description}</p>
              </div>
              <div className="bg-card border border-border/50 rounded-3xl p-8 space-y-6 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileCode2 size={16} className="text-primary" /> README.md Preview
                </h3>
                <div className="p-6 bg-slate-950 rounded-2xl max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed text-muted-foreground select-text">
                  <pre className="whitespace-pre-wrap">{intelligence?.overview?.readmePreview}</pre>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Original Repository</h4>
                <a href={intelligence?.overview?.repositoryUrl} target="_blank" rel="noreferrer" className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <Github size={22} className="group-hover:text-primary" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{intelligence?.overview?.owner}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase">View Source</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "stats" && (
          <motion.div key="stats" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Stars", value: intelligence?.statistics?.stars, icon: Star, color: "text-yellow-500" },
                { label: "Forks", value: intelligence?.statistics?.forks, icon: GitFork, color: "text-indigo-500" },
                { label: "Issues", value: intelligence?.statistics?.openIssues, icon: AlertCircle, color: "text-red-500" },
                { label: "Watchers", value: intelligence?.statistics?.watchers, icon: Eye, color: "text-emerald-500" },
              ].map((m, idx) => (
                <div key={idx} className="bg-card p-5 border border-border/50 rounded-2xl flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 ${m.color}`}><m.icon size={20} /></div>
                  <div><p className="text-[10px] font-black uppercase text-muted-foreground">{m.label}</p><p className="text-xl font-black">{m.value}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "management" && (
          <motion.div key="management" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
             <div className="bg-card border border-border/50 rounded-3xl p-6">
               <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Submissions Management</h3>
               {activeSubmissions.length > 0 ? (
                 <div className="space-y-4">
                   {activeSubmissions.map(sub => (
                     <div key={sub._id} className="p-4 border rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-10 h-10 rounded-full" />
                         <div><p className="text-sm font-bold">@{sub.user?.username}</p><p className="text-xs text-muted-foreground">Branch: {sub.branchName}</p></div>
                       </div>
                       <button onClick={() => setSelectedPR(sub)} className="btn-primary py-2 px-4 text-xs">Review</button>
                     </div>
                   ))}
                 </div>
               ) : <p className="text-center py-8 italic text-muted-foreground">No active submissions.</p>}
             </div>
          </motion.div>
        )}

        {activeTab === "dev_flow" && (
          <motion.div key="dev_flow" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border/50 rounded-3xl p-6">
                  <h3 className="text-xs font-black uppercase mb-4">1. Fork Repository</h3>
                  {!isAccepted ? (
                    <button onClick={() => acceptMutation.mutate()} className="btn-primary py-2 px-6">Accept & Fork</button>
                  ) : <p className="text-emerald-500 font-bold">Repository Synchronized</p>}
                </div>
             </div>
             <div className="bg-card border border-border/50 rounded-3xl p-6">
                <h3 className="text-xs font-black uppercase mb-4">2. Submit Solution</h3>
                <form onSubmit={handleDevSubmit} className="space-y-4">
                   <RepoPicker onSelect={setSelectedRepo} selectedRepo={selectedRepo} />
                   <BranchPicker owner={selectedRepo?.owner?.login || authUser?.username} repo={selectedRepo?.name} onSelect={setSelectedBranch} selectedBranch={selectedBranch} />
                   <button type="submit" disabled={!selectedRepo || !selectedBranch} className="w-full btn-primary py-3">Submit</button>
                </form>
             </div>
          </motion.div>
        )}

        {activeTab === "test_flow" && (
          <motion.div key="test_flow" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-card border border-border/50 rounded-3xl p-6">
               <h3 className="text-xs font-black uppercase mb-4">Pull Requests</h3>
               <p className="text-muted-foreground text-sm">Select a PR from GitHub to review.</p>
             </div>
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-card border border-border/50 rounded-3xl p-6">
               <h3 className="text-xs font-black uppercase mb-4">History</h3>
               <p className="text-muted-foreground text-sm">Recent commits and events.</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-card border border-border/50 rounded-[32px] p-8 shadow-2xl">
              <h2 className="text-xl font-black mb-6">Edit Briefing</h2>
              <form onSubmit={handleUpdateProject} className="space-y-4">
                <input type="text" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full p-4 bg-muted/20 border rounded-2xl" placeholder="Title" />
                <textarea rows={4} value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} className="w-full p-4 bg-muted/20 border rounded-2xl" placeholder="Description" />
                <button type="submit" className="w-full btn-primary py-4">Save Changes</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetails;
