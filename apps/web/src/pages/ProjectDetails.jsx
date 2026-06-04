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
  ChevronRight,
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
        {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) ? (
          <button onClick={() => setActiveTab("management")} className={`pb-4 border-b-2 px-1 ${activeTab === "management" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Submissions</button>
        ) : (
          <>
            <button onClick={() => setActiveTab("dev_flow")} className={`pb-4 border-b-2 px-1 ${activeTab === "dev_flow" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Develop</button>
            <button onClick={() => setActiveTab("test_flow")} className={`pb-4 border-b-2 px-1 ${activeTab === "test_flow" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Test</button>
          </>
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
                <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                    <GitFork size={18} className="text-primary" /> 
                    1. Mission Synchronization
                  </h3>
                  
                  {!isAccepted ? (
                    <div className="space-y-6">
                      <p className="text-sm font-medium text-foreground/80 leading-relaxed max-w-xl">
                        Accepting this mission will automatically fork the repository to your GitHub account and grant you strategic access to the codebase.
                      </p>
                      <button 
                        onClick={() => acceptMutation.mutate()} 
                        disabled={acceptMutation.isLoading}
                        className="btn-primary py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 flex items-center gap-3"
                      >
                        {acceptMutation.isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <><Rocket size={16} /> Accept & Initialize Fork</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">Mission Active</p>
                          <p className="text-xs font-medium text-muted-foreground">The repository has been linked to your profile.</p>
                        </div>
                      </div>
                      
                      {forkStatus?.forkExists ? (
                        <div className="p-6 bg-muted/30 border border-border/50 rounded-2xl space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GitHub Workspace</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                              <Activity size={12} /> Live Link
                            </span>
                          </div>
                          <p className="text-sm font-bold text-foreground font-mono break-all">{forkStatus.forkFullName}</p>
                          <div className="flex gap-3">
                            <a 
                              href={forkStatus.forkUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn-secondary px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                            >
                              <Github size={14} /> View Fork
                            </a>
                            <button className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border/50 hover:bg-muted/50 transition-colors">
                              Clone Setup
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 animate-pulse">
                             <Clock size={20} />
                           </div>
                           <p className="text-xs font-bold text-orange-500 leading-relaxed uppercase tracking-wider">
                             Waiting for GitHub to finish forking... <br/>
                             <span className="text-[9px] opacity-70">This usually takes 10-20 seconds.</span>
                           </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
                   <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                     <BookOpen size={18} className="text-primary" /> 
                     Development Guidelines
                   </h3>
                   <ul className="space-y-4">
                     {[
                       "Create a new branch for your specific feature or fix.",
                       "Ensure all tests pass locally before submitting.",
                       "Maintain clean code standards and descriptive commits.",
                       "Follow the project's specific contribution guidelines."
                     ].map((guide, i) => (
                       <li key={i} className="flex items-start gap-3 text-sm font-medium text-foreground/70">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                         {guide}
                       </li>
                     ))}
                   </ul>
                </div>
             </div>

             <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Send size={18} className="text-primary" /> 
                  2. Deploy Solution
                </h3>
                
                {devSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center space-y-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                      <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-xl font-black tracking-tight">Transmission Successful</h4>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-relaxed">
                      Your solution has been deployed to the verification queue. Automated testing will begin shortly.
                    </p>
                    <button 
                      onClick={() => navigate("/dashboard")}
                      className="btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] mt-4"
                    >
                      Return to Command Center
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleDevSubmit} className="space-y-8">
                    {devError && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-xl flex items-center gap-3">
                        <AlertCircle size={18} />
                        {devError}
                      </div>
                    )}
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Source Repository</label>
                        <RepoPicker onSelect={setSelectedRepo} selectedRepo={selectedRepo} />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Working Branch</label>
                        <BranchPicker 
                          owner={selectedRepo?.owner?.login || authUser?.username} 
                          repo={selectedRepo?.name} 
                          onSelect={setSelectedBranch} 
                          selectedBranch={selectedBranch} 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={!selectedRepo || !selectedBranch || submittingDev} 
                      className="w-full btn-primary py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                    >
                      {submittingDev ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <><Rocket size={16} /> Deploy to Validation</>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                      Syncing this branch will create an automated PR on the upstream repository.
                    </p>
                  </form>
                )}
             </div>
          </motion.div>
        )}

        {activeTab === "test_flow" && (
          <motion.div key="test_flow" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 bg-card border border-border/50 rounded-3xl p-6 space-y-6 h-fit">
               <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Submissions Pending Test</h3>
               {activeSubmissions.filter(s => s.user?._id !== authUser?._id && s.user !== authUser?._id).length > 0 ? (
                 <div className="space-y-4">
                   {activeSubmissions.filter(s => s.user?._id !== authUser?._id && s.user !== authUser?._id).map(sub => (
                     <div 
                       key={sub._id} 
                       onClick={() => { setSelectedPR(sub); setTestSuccess(false); setTestError(""); }}
                       className={`p-4 border rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-muted/10 transition-all ${selectedPR?._id === sub._id ? 'border-primary bg-primary/5' : 'border-border/50'}`}
                     >
                       <div className="flex items-center gap-3">
                         <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-10 h-10 rounded-full" />
                         <div>
                           <p className="text-sm font-bold">@{sub.user?.username}</p>
                           <p className="text-xs text-muted-foreground">Branch: {sub.branchName}</p>
                         </div>
                       </div>
                       <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                         <span>Status: {sub.status}</span>
                         <span className="text-primary flex items-center gap-1">Review <ChevronRight size={12} /></span>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <ClipboardList size={36} className="mx-auto text-muted-foreground opacity-30 mb-3" />
                   <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">No submissions to test</p>
                 </div>
               )}
             </div>

             <div className="lg:col-span-2 bg-card border border-border/50 rounded-3xl p-8 space-y-6">
               {selectedPR ? (
                 <>
                   <div className="flex items-center justify-between pb-6 border-b border-border/50">
                     <div className="flex items-center gap-4">
                       <img src={selectedPR.user?.avatarUrl} alt={selectedPR.user?.username} className="w-12 h-12 rounded-full" />
                       <div>
                         <h3 className="text-lg font-black">Reviewing @{selectedPR.user?.username}'s Solution</h3>
                         <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Fork: <a href={selectedPR.forkUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{selectedPR.forkUrl?.replace("https://github.com/", "")}</a></p>
                       </div>
                     </div>
                     <button onClick={() => setSelectedPR(null)} className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground"><X size={16} /></button>
                   </div>

                   {testSuccess ? (
                     <div className="flex flex-col items-center justify-center py-12 text-center">
                       <CheckCircle2 size={48} className="text-emerald-500 mb-4 animate-bounce" />
                       <h4 className="text-lg font-black">Review Submitted Successfully!</h4>
                       <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">XP and Reputation sync pending webhook confirmation.</p>
                     </div>
                   ) : (
                     <form onSubmit={handleTestSubmit} className="space-y-6">
                       {testError && (
                         <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center gap-2">
                           <AlertCircle size={16} />
                           {testError}
                         </div>
                       )}

                       <div className="space-y-4">
                         <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">1. Quality Checklist</h4>
                         <div className="space-y-3">
                           {checklist.map((item, idx) => (
                             <label key={idx} className="flex items-start gap-3 cursor-pointer select-none">
                               <input 
                                 type="checkbox" 
                                 checked={item.checked} 
                                 onChange={() => toggleChecklist(idx)}
                                 className="mt-1 rounded border-border text-primary focus:ring-primary/20 w-4 h-4"
                               />
                               <span className="text-sm font-medium leading-tight">{item.item}</span>
                             </label>
                           ))}
                         </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/30">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Outcome Decision</label>
                           <select 
                             value={testOutcome} 
                             onChange={(e) => setTestOutcome(e.target.value)}
                             className="w-full px-4 py-3 bg-background border border-border rounded-xl font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                           >
                             <option value="APPROVED">Approve Submission</option>
                             <option value="NEEDS_CHANGES">Request Changes</option>
                             <option value="REJECTED">Reject / Close Submission</option>
                           </select>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Rating Score (1-5)</label>
                           <select 
                             value={testRating} 
                             onChange={(e) => setTestRating(Number(e.target.value))}
                             className="w-full px-4 py-3 bg-background border border-border rounded-xl font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                           >
                             {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                           </select>
                         </div>
                       </div>

                       <div className="space-y-2 pt-4 border-t border-border/30">
                         <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">General Feedback & Review Details</label>
                         <textarea 
                           required 
                           rows={4} 
                           placeholder="Provide constructive review comments regarding features, performance, code cleanliness..."
                           value={testFeedback}
                           onChange={(e) => setTestFeedback(e.target.value)}
                           className="w-full px-4 py-3 bg-background border border-border rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                         />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/30">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Bugs Found (One per line)</label>
                           <textarea 
                             rows={3} 
                             placeholder="List any identified errors or flaws..."
                             value={testBugs}
                             onChange={(e) => setTestBugs(e.target.value)}
                             className="w-full px-4 py-3 bg-background border border-border rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Suggestions for Improvement</label>
                           <textarea 
                             rows={3} 
                             placeholder="Recommended improvements or visual enhancements..."
                             value={testSuggestions}
                             onChange={(e) => setTestSuggestions(e.target.value)}
                             className="w-full px-4 py-3 bg-background border border-border rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                           />
                         </div>
                       </div>

                       <button 
                         type="submit" 
                         disabled={submittingTest || !testFeedback}
                         className="w-full btn-primary py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                       >
                         {submittingTest ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Send size={14} /> Submit Review Report</>}
                       </button>
                     </form>
                   )}
                 </>
               ) : (
                 <div className="text-center py-24">
                   <ShieldCheck size={64} className="mx-auto text-primary opacity-20 mb-6 animate-pulse" />
                   <h4 className="text-lg font-black">Interactive QA & Testing Workspace</h4>
                   <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed mt-2">Select a submission from the pending list on the left to begin quality-assurance check, verify metrics, and post review logs directly to GitHub.</p>
                 </div>
               )}
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
