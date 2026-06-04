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

  const userData = authUser;

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
    if (userData?.acceptedProjects?.includes(id)) {
      checkFork();
    }
  }, [userData, id]);

  const loadIssues = async () => {
    if (!intelligence?.overview) return;
    try {
      const { owner, name } = intelligence.overview;
      // In a real app, query GitHub REST or load from the GraphQL query
      setIssuesList(intelligence.recentActivityFeed?.filter(a => a.type === "issue") || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (intelligence) {
      loadIssues();
    }
  }, [intelligence]);

  // Create Issue directly on GitHub
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
      setSelectedIssue({
        number: res.data.number,
        title: res.data.title,
        html_url: res.data.html_url
      });
      setNewIssueTitle("");
      setNewIssueBody("");
      setShowIssueForm(false);
      // Reload intelligence
      queryClient.invalidateQueries(["projectIntelligence", id]);
    } catch (err) {
      console.error(err);
      setDevError("Failed to create issue on GitHub.");
    } finally {
      setIsCreatingIssue(false);
    }
  };

  // Submit Development Contribution with Critical PR fix validations
  const handleDevSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRepo) {
      setDevError("Please select your fork repository.");
      return;
    }
    if (!selectedBranch) {
      setDevError("Please select a branch.");
      return;
    }

    setSubmittingDev(true);
    setDevError("");

    try {
      await api.post("/submissions", {
        projectId: id,
        forkUrl: selectedRepo.html_url,
        branchName: selectedBranch,
      });
      setDevSuccess(true);
      queryClient.invalidateQueries(["projectSubmissions", id]);
      queryClient.invalidateQueries(["profile", authUser?.username]);
    } catch (err) {
      setDevError(err.response?.data?.message || "Verification failed: Verify branch contains commits pushes.");
    } finally {
      setSubmittingDev(false);
    }
  };

  // Submit Testing review report
  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPR) {
      setTestError("Please select a pull request to test.");
      return;
    }
    if (!testFeedback) {
      setTestError("Please provide checklist comment reviews.");
      return;
    }

    setSubmittingTest(true);
    setTestError("");

    try {
      const reviewTarget = selectedPR._id || selectedPR.number;
      await api.post(`/submissions/${reviewTarget}/reviews`, {
        projectId: id, // Pass projectId for auto-sync
        feedback: testFeedback,
        outcome: testOutcome,
        checklist,
        rating: testRating,
        bugsFound: testBugs.split("\n").filter(b => b.trim() !== ""),
        suggestions: testSuggestions
      });
      setTestSuccess(true);
      
      // Clear form and sync data after successful submission
      setTimeout(() => {
        setTestSuccess(false);
        setSelectedPR(null);
        setTestFeedback("");
        setTestRating(5);
        setTestBugs("");
        setTestSuggestions("");
        setTestOutcome("APPROVED");
        setChecklist(prev => prev.map(c => ({ ...c, checked: false })));
        
        // Refresh project data to show new reviews immediately
        queryClient.invalidateQueries(["projectIntelligence", id]);
        queryClient.invalidateQueries(["projectSubmissions", id]);
      }, 3000);
    } catch (err) {
      setTestError(err.response?.data?.message || "Failed to submit reviewer report.");
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
    if (window.confirm("Are you sure you want to merge this contribution into the base branch?")) {
      mergeMutation.mutate(submissionId);
    }
  };

  const toggleChecklist = (index) => {
    setChecklist(prev => prev.map((item, idx) => 
      idx === index ? { ...item, checked: !item.checked } : item
    ));
  };

  const isAccepted = userData?.acceptedProjects?.includes(id);

  if (loadingProject || loadingIntel) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold">Querying live GitHub GraphQL intelligence...</p>
    </div>
  );

  return (
    <div className="py-12 max-w-7xl mx-auto px-4">
      {/* Back button */}
      <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm mb-8 group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Explore Missions
      </Link>

      {/* Header bar strictly containing TWO action buttons */}
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

        {/* ACTION BUTTONS BASED ON ROLE */}
        <div className="flex items-center gap-3">
          {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) ? (
            <>
              <button 
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all mr-2"
                title="Delete Project"
              >
                {deleteMutation.isLoading ? (
                  <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin"></div>
                ) : (
                  <Trash2 size={20} />
                )}
              </button>
              
              <button 
                onClick={() => setActiveTab("management")}
                className={`px-6 py-3 font-black uppercase tracking-wider text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
                  activeTab === "management" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                <Layers size={14} /> Manage Mission
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  if (!isAccepted) {
                    acceptMutation.mutate();
                  }
                  setActiveTab("dev_flow");
                }}
                className={`px-6 py-3 font-black uppercase tracking-wider text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
                  activeTab === "dev_flow" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                }`}
              >
                <Rocket size={14} /> Start Developing
              </button>
              
              <button 
                onClick={() => setActiveTab("test_flow")}
                className={`px-6 py-3 font-black uppercase tracking-wider text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
                  activeTab === "test_flow" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                }`}
              >
                <ShieldCheck size={14} /> Start Testing
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border/50 mb-8 gap-6 text-sm font-bold select-none">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`pb-4 border-b-2 flex items-center gap-2 px-1 ${
            activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen size={16} /> Base Overview
        </button>
        <button 
          onClick={() => setActiveTab("stats")}
          className={`pb-4 border-b-2 flex items-center gap-2 px-1 ${
            activeTab === "stats" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity size={16} /> Repository Analytics
        </button>
        {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) && (
          <button 
            onClick={() => setActiveTab("management")}
            className={`pb-4 border-b-2 flex items-center gap-2 px-1 ${
              activeTab === "management" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers size={16} /> Management & Submissions
          </button>
        )}
        <button 
          onClick={() => setActiveTab("activity")}
          className={`pb-4 border-b-2 flex items-center gap-2 px-1 ${
            activeTab === "activity" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History size={16} /> Activity Feed
        </button>
      </div>

      {/* Workspace Display Area */}
      <AnimatePresence mode="wait">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-card border border-border/50 rounded-3xl p-8 space-y-4 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mission Briefing</h3>
                <p className="text-base text-foreground leading-relaxed leading-relaxed">{project?.description}</p>
                
                <div className="flex flex-wrap gap-2 pt-4">
                  {intelligence?.overview?.topics?.map((topic, i) => (
                    <span key={i} className="px-2.5 py-1 bg-muted rounded-lg text-xs font-semibold text-muted-foreground">
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* README preview */}
              <div className="bg-card border border-border/50 rounded-3xl p-8 space-y-6 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileCode2 size={16} className="text-primary" /> README.md Preview
                </h3>
                <div className="p-6 bg-slate-950 rounded-2xl max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed text-muted-foreground select-text">
                  <pre className="whitespace-pre-wrap">{intelligence?.overview?.readmePreview}</pre>
                </div>
              </div>
            </div>

            {/* Right sidebar Base Stats */}
            <div className="space-y-6">
              <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Original Repository</h4>
                <a 
                  href={intelligence?.overview?.repositoryUrl}
                  target="_blank" 
                  rel="noreferrer"
                  className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Github size={22} className="group-hover:text-primary" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{intelligence?.overview?.owner}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase">View Source</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground" />
                </a>

                {/* Languages list */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Languages Breakdown</p>
                  <div className="h-2 rounded-full overflow-hidden flex bg-muted">
                    {intelligence?.overview?.languagesBreakdown?.map((lang, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          width: `${(lang.size / intelligence.overview.languagesBreakdown.reduce((a,b)=>a+b.size, 0)) * 100}%`,
                          backgroundColor: lang.color || '#6366f1'
                        }}
                        className="h-full"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    {intelligence?.overview?.languagesBreakdown?.slice(0, 4).map((lang, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color || '#6366f1' }} />
                        <span className="text-muted-foreground">{lang.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: ANALYTICS & CHARTS */}
        {activeTab === "stats" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Stargazers", value: intelligence?.statistics?.stars, icon: Star, color: "text-yellow-500" },
                { label: "Forks Count", value: intelligence?.statistics?.forks, icon: GitFork, color: "text-indigo-500" },
                { label: "Open Issues", value: intelligence?.statistics?.openIssues, icon: AlertCircle, color: "text-red-500" },
                { label: "Watchers", value: intelligence?.statistics?.watchers, icon: Eye, color: "text-emerald-500" },
              ].map((m, idx) => (
                <div key={idx} className="bg-card p-5 border border-border/50 rounded-2xl flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border ${m.color}`}>
                    <m.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">{m.label}</p>
                    <p className="text-xl font-black">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Commits & Issues Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Commits Timeline lists */}
              <div className="lg:col-span-2 bg-card border border-border/50 p-6 rounded-3xl space-y-4 h-fit">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Activity Feed</h3>
                <div className="space-y-4 pt-2 divide-y divide-border/20">
                  {intelligence?.recentActivityFeed?.slice(0, 6).map((act, idx) => (
                    <div key={idx} className="flex gap-3 text-xs pt-4 first:pt-0 first:border-0 border-t border-border/20">
                      <div className="mt-0.5 shrink-0">
                        {act.type === "commit" ? (
                          <GitBranch className="text-primary" size={14} />
                        ) : act.type === "issue" ? (
                          <AlertCircle className="text-red-500" size={14} />
                        ) : (
                          <GitPullRequest className="text-emerald-500" size={14} />
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <p className="font-bold text-foreground truncate">{act.title}</p>
                        <p className="text-[10px] text-muted-foreground">{act.actor || "GitHub user"} • {new Date(act.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contributors Leaderboard */}
              <div className="bg-card border border-border/50 p-6 rounded-3xl space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Top Contributors</h3>
                <div className="space-y-4">
                  {intelligence?.commitAnalytics?.topContributors?.slice(0, 5).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                          <img src={c.avatarUrl} alt={c.username} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-foreground">@{c.username}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {c.commitCount} commits
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: MANAGEMENT (Project Owner Only) */}
        {activeTab === "management" && (project?.owner?._id === authUser?._id || project?.owner === authUser?._id) && (
          <motion.div
            key="management"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Submissions Management */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border/30 pb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ClipboardList size={18} className="text-primary" /> Submissions Management
                    </h3>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {activeSubmissions.length} Active
                      </span>
                      <span className="text-[10px] font-black bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
                        {submissionHistory.length} Total History
                      </span>
                    </div>
                  </div>

                  {projectSubmissions?.length > 0 ? (
                    <div className="space-y-8">
                      {/* Active Submissions Section */}
                      {activeSubmissions.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Contributions</h4>
                          {activeSubmissions.map((sub) => (
                            <div key={sub._id} className={`p-5 border transition-all rounded-2xl space-y-4 ${
                              selectedPR?._id === sub._id ? "bg-primary/5 border-primary/50" : "bg-muted/5 border-border/50"
                            }`}>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-10 h-10 rounded-full border border-border" />
                                  <div>
                                    <p className="text-sm font-bold text-foreground">@{sub.user?.username}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                        sub.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                      }`}>
                                        {sub.status}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-semibold">Branch: {sub.branchName}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {sub.prUrl && (
                                    <a 
                                      href={sub.prUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="p-2.5 bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl transition-all"
                                      title="View PR on GitHub"
                                    >
                                      <Github size={16} />
                                    </a>
                                  )}

                                  <button
                                    onClick={() => setSelectedPR(sub)}
                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                                      selectedPR?._id === sub._id
                                        ? "bg-primary text-white"
                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                    }`}
                                  >
                                    {selectedPR?._id === sub._id ? "Reviewing" : "Review"}
                                  </button>
                                  
                                  {sub.status === 'APPROVED' && (
                                    <button
                                      onClick={() => handleMerge(sub._id)}
                                      disabled={mergeMutation.isLoading}
                                      className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                    >
                                      {mergeMutation.isLoading ? (
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      ) : (
                                        <><GitPullRequest size={12} /> Merge</>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Rich Reviews for this submission */}
                              <div className="mt-4 pl-4 border-l-2 border-border/30 space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                  <ShieldCheck size={12} /> Peer Review Reports
                                </h4>
                                {sub.reviews?.length > 0 ? (
                                  <div className="space-y-3">
                                    {sub.reviews.map((review, ridx) => (
                                      <div key={ridx} className="bg-muted/10 p-3 rounded-xl border border-border/20 text-xs">
                                        <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <span className="font-bold text-foreground">@{review.reviewer?.username || 'Tester'}</span>
                                            <div className="flex items-center gap-1 mt-0.5">
                                              <div className="flex items-center gap-0.5 text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                  <Star key={i} size={8} fill={i < (review.rating || 5) ? "currentColor" : "none"} />
                                                ))}
                                              </div>
                                              {review.bugsFound?.length > 0 && (
                                                <span className="text-[8px] text-red-400 font-bold uppercase ml-2">{review.bugsFound.length} Bugs Found</span>
                                              )}
                                            </div>
                                          </div>
                                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                            review.outcome === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                            review.outcome === 'NEEDS_CHANGES' ? 'bg-orange-500/10 text-orange-500' :
                                            'bg-red-500/10 text-red-500'
                                          }`}>
                                            {review.outcome}
                                          </span>
                                        </div>
                                        <p className="text-muted-foreground italic leading-relaxed">"{review.feedback}"</p>
                                        {review.checklist?.some(c => c.checked) && (
                                          <div className="mt-2 flex gap-1 flex-wrap">
                                            {review.checklist.filter(c => c.checked).map((c, ci) => (
                                              <span key={ci} className="text-[8px] bg-emerald-500/5 text-emerald-500/70 border border-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle2 size={8} /> {c.item.substring(0, 20)}...
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground italic">No reviews submitted yet.</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Submission History Section */}
                      {submissionHistory.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submission History</h4>
                          {submissionHistory.map((sub) => (
                            <div key={sub._id} className="p-4 border border-border/30 bg-muted/5 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-8 h-8 rounded-full border border-border" />
                                <div>
                                  <p className="text-xs font-bold text-foreground">@{sub.user?.username}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">Branch: {sub.branchName}</p>
                                </div>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                sub.status === 'MERGED' ? 'bg-indigo-500 text-white' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground text-sm font-semibold italic">
                      No student submissions yet for this mission.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Quick Actions & Settings */}
              <div className="space-y-6">
                {(selectedPR && activeTab === 'management') ? (
                  <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6 shadow-xl sticky top-6">
                    <div className="flex items-center justify-between border-b border-border/30 pb-3">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="text-primary" size={18} />
                        <h3 className="font-bold text-sm">Submission Review</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedPR(null)}
                        className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground"
                      >
                        Close
                      </button>
                    </div>

                    {testError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle size={14} />
                        <p className="font-semibold leading-relaxed">{testError}</p>
                      </div>
                    )}

                    {testSuccess ? (
                      <div className="text-center py-6 space-y-4">
                        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                          <Sparkles size={26} />
                        </div>
                        <h3 className="font-bold text-emerald-500">Review Submitted!</h3>
                        <p className="text-xs text-muted-foreground font-semibold">The student has been notified of your decision.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleTestSubmit} className="space-y-5">
                        <div className="p-3.5 bg-muted/30 border border-border/50 rounded-xl space-y-1 text-xs">
                          <p className="text-muted-foreground text-[10px] uppercase">Reviewing Target</p>
                          <p className="font-bold text-foreground">
                            {selectedPR.number ? `PR #${selectedPR.number}: ${selectedPR.title}` : `Submission by @${selectedPR.user?.username}: ${selectedPR.branchName}`}
                          </p>
                        </div>

                        {/* Rating select */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quality Score (1-5)</label>
                          <select 
                            value={testRating}
                            onChange={(e)=>setTestRating(parseInt(e.target.value))}
                            className="w-full text-xs bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-foreground"
                          >
                            <option value="5">5 - Perfect Implementation</option>
                            <option value="4">4 - Good Work</option>
                            <option value="3">3 - Meets Requirements</option>
                            <option value="2">2 - Needs Improvement</option>
                            <option value="1">1 - Does not meet standards</option>
                          </select>
                        </div>

                        {/* Bugs found */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Issues & Bugs</label>
                          <textarea
                            rows={2}
                            placeholder="List any blockers or bugs..."
                            value={testBugs}
                            onChange={(e)=>setTestBugs(e.target.value)}
                            className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary resize-none font-semibold text-foreground"
                          />
                        </div>

                        {/* Checklist toggle buttons */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Owner Checklist</p>
                          {checklist.map((item, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => toggleChecklist(idx)}
                              className="w-full flex items-start gap-2 p-2 rounded-lg border border-border/40 text-left text-[11px] font-semibold"
                            >
                              <input 
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => {}}
                                className="mt-0.5 rounded text-primary"
                              />
                              <span className={item.checked ? "text-muted-foreground line-through" : "text-foreground"}>{item.item}</span>
                            </button>
                          ))}
                        </div>

                        {/* Feedback comments */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reviewer Feedback</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Provide detailed feedback for the student..."
                            value={testFeedback}
                            onChange={(e)=>setTestFeedback(e.target.value)}
                            className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary resize-none font-semibold text-foreground"
                          />
                        </div>

                        {/* Outcome select */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final Decision</label>
                          <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase">
                            {[
                              { val: "APPROVED", label: "Approve", color: "border-emerald-500/20 text-emerald-500 bg-emerald-500/5", sel: "bg-emerald-500 text-white" },
                              { val: "NEEDS_CHANGES", label: "Changes", color: "border-orange-500/20 text-orange-500 bg-orange-500/5", sel: "bg-orange-500 text-white" },
                              { val: "REJECTED", label: "Reject", color: "border-red-500/20 text-red-500 bg-red-500/5", sel: "bg-red-500 text-white" }
                            ].map((btn) => {
                              const isSel = testOutcome === btn.val;
                              return (
                                <button
                                  type="button"
                                  key={btn.val}
                                  onClick={()=>setTestOutcome(btn.val)}
                                  className={`py-2 rounded-lg border text-center transition-all ${isSel ? btn.sel : btn.color}`}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          disabled={submittingTest}
                          type="submit"
                          className="w-full btn-primary py-3.5 text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-1.5"
                        >
                          {submittingTest ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            "Submit Decision"
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Owner Controls</h4>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full p-4 bg-muted/20 border border-border/50 rounded-2xl text-left hover:border-primary/50 transition-all group"
                      >
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Edit Mission Briefing</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-1">Update title, description, and bounty</p>
                      </button>
                      
                      <button className="w-full p-4 bg-muted/20 border border-border/50 rounded-2xl text-left hover:border-primary/50 transition-all group">
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Manage Contributors</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-1">Add or remove direct collaborators</p>
                      </button>

                      <button 
                        onClick={handleDelete}
                        className="w-full p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-left hover:bg-red-500/10 transition-all group"
                      >
                        <p className="text-xs font-bold text-red-500">Archive Mission</p>
                        <p className="text-[10px] text-red-500/60 font-semibold mt-1">Permanently remove from marketplace</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mission Stats Recap */}
                <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mission Performance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/20 rounded-xl">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Accepted</p>
                      <p className="text-lg font-black">{project?.contributors?.length || 0}</p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-xl">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Tested</p>
                      <p className="text-lg font-black">{projectSubmissions?.filter(s=>s.status==='APPROVED'||s.status==='MERGED').length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: START DEVELOPING FLOW */}
        {activeTab === "dev_flow" && (
          <motion.div
            key="dev_flow"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Steps Left sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1 Fork Status */}
              <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-border/30 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</span> Auto-Fork Repository
                  </h3>
                  {forkStatus?.forkExists && (
                    <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Synchronized</span>
                  )}
                </div>

                {!isAccepted ? (
                  <div className="text-center py-4 space-y-3">
                    <Rocket className="text-muted-foreground/30 mx-auto" size={40} />
                    <p className="text-xs text-muted-foreground font-semibold">Accept the challenge to initialize your GitHub Fork repository.</p>
                    <button 
                      onClick={() => acceptMutation.mutate()}
                      disabled={acceptMutation.isLoading}
                      className="btn-primary py-2.5 px-6 text-xs shadow-lg shadow-primary/20"
                    >
                      {acceptMutation.isLoading ? "Initializing Fork..." : "Accept Mission & Fork"}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl space-y-2 text-xs font-bold leading-relaxed">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fork Owner</span>
                      <span className="text-foreground">@{authUser?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Default Branch</span>
                      <span className="text-foreground">{forkStatus?.defaultBranch || 'main'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upstream Branch</span>
                      <span className="text-foreground">{intelligence?.overview?.defaultBranch}</span>
                    </div>
                    {forkStatus?.forkUrl && (
                      <div className="flex justify-between pt-2 border-t border-border/20 mt-2">
                        <span className="text-muted-foreground">Fork Repository</span>
                        <a 
                          href={forkStatus.forkUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          View Fork <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* My Submissions Dashboard */}
              {mySubmissions.length > 0 && (
                <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                    <Trophy className="text-indigo-500" size={18} />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">My Active Contributions</h3>
                  </div>
                  <div className="space-y-3">
                    {mySubmissions.map((sub, idx) => (
                      <div key={idx} className="p-4 bg-muted/10 border border-border/50 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-foreground">PR #{sub.prNumber || 'Pending'}: Branch "{sub.branchName}"</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Submitted on {new Date(sub.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                          sub.status === 'MERGED' ? 'bg-indigo-500 text-white' :
                          sub.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          sub.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 & 3: Issue Dashboard */}
              <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-border/30 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">2</span> Select or Create Issue
                  </h3>
                  <button 
                    onClick={() => setShowIssueForm(!showIssueForm)}
                    className="text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded flex items-center gap-0.5"
                  >
                    <Plus size={10} /> Create GitHub Issue
                  </button>
                </div>

                {showIssueForm && (
                  <form onSubmit={handleCreateGitHubIssue} className="p-4 bg-muted/20 border border-border/50 rounded-2xl space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-muted-foreground uppercase">Issue Title</label>
                      <input 
                        required
                        type="text"
                        placeholder="Bug: broken links or documentation typos..."
                        value={newIssueTitle}
                        onChange={(e)=>setNewIssueTitle(e.target.value)}
                        className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary focus:outline-none font-semibold text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-muted-foreground uppercase">Description</label>
                      <textarea 
                        rows={3}
                        placeholder="Provide detailed reproduction steps or context..."
                        value={newIssueBody}
                        onChange={(e)=>setNewIssueBody(e.target.value)}
                        className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary focus:outline-none resize-none font-semibold text-foreground"
                      />
                    </div>
                    <button 
                      disabled={isCreatingIssue}
                      type="submit"
                      className="btn-primary py-2 px-4 text-xs font-black uppercase shadow"
                    >
                      {isCreatingIssue ? "Raising Issue..." : "Create Issue on GitHub"}
                    </button>
                  </form>
                )}

                {/* Selected Issue Panel */}
                {selectedIssue ? (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between text-xs font-bold leading-relaxed">
                    <div>
                      <p className="text-primary text-[9px] uppercase tracking-wider">Linked Issue</p>
                      <p className="text-foreground mt-0.5">#{selectedIssue.number}: {selectedIssue.title}</p>
                    </div>
                    <button 
                      onClick={()=>setSelectedIssue(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {intelligence?.recentActivityFeed?.filter(a => a.type === "issue").map((issue, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedIssue({
                          number: parseInt(issue.title.split("#")[1]),
                          title: issue.title.split(": ")[1]
                        })}
                        className="w-full p-3.5 bg-muted/10 hover:bg-muted/30 border border-border/50 rounded-xl text-left text-xs font-semibold leading-relaxed flex items-center justify-between group"
                      >
                        <span className="text-foreground group-hover:text-primary transition-colors truncate max-w-[280px]">{issue.title}</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar submit contribution widget */}
            <div className="space-y-6">
              <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                  <Layers className="text-primary" size={18} />
                  <h3 className="font-bold text-sm">Contribution Workspace</h3>
                </div>

                {devError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} />
                    <p className="font-semibold leading-relaxed">{devError}</p>
                  </div>
                )}

                {devSuccess ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle2 size={26} />
                    </div>
                    <h3 className="font-bold text-emerald-500">PR Raised Successfully!</h3>
                    <p className="text-xs text-muted-foreground font-semibold">Verification check passed. Head branch compared, commits verified, and upstream PR created!</p>
                    <button 
                      onClick={() => {
                        setDevSuccess(false);
                        setSelectedRepo(null);
                        setSelectedBranch("");
                        checkFork();
                      }}
                      className="text-xs font-black uppercase text-primary hover:underline"
                    >
                      Submit Another Branch
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDevSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Fork Source</label>
                      <RepoPicker onSelect={setSelectedRepo} selectedRepo={selectedRepo} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Branch</label>
                      <BranchPicker 
                        owner={selectedRepo?.owner?.login || authUser?.username}
                        repo={selectedRepo?.name}
                        onSelect={setSelectedBranch}
                        selectedBranch={selectedBranch}
                      />
                    </div>

                    <button
                      disabled={submittingDev || !selectedRepo || !selectedBranch}
                      type="submit"
                      className="w-full btn-primary py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {submittingDev ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Submit Contribution"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: START TESTING FLOW */}
        {activeTab === "test_flow" && (
          <motion.div
            key="test_flow"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* PR Workspace left sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Show live PRs for this project / codebase */}
              <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6">
                <div className="border-b border-border/30 pb-4 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <GitPullRequest size={18} className="text-primary" /> Codebase Pull Requests
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {intelligence?.prAnalytics?.openPRs} Pending
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {intelligence?.prAnalytics?.mergedPRs} Accepted
                    </span>
                  </div>
                </div>

                {intelligence?.prAnalytics?.recentPRActivity?.length > 0 ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {/* Categorize PRs: Open first, then Merged/Closed */}
                    {intelligence.prAnalytics.recentPRActivity
                      .sort((a, b) => (a.state === 'OPEN' ? -1 : 1))
                      .map((pr, idx) => (
                      <div
                        key={idx}
                        className={`p-5 border rounded-2xl transition-all ${
                          selectedPR?.number === pr.number 
                            ? "bg-primary/5 border-primary/50" 
                            : "bg-muted/10 border-border/50 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-3">
                            <img src={pr.authorAvatar} alt={pr.author} className="w-8 h-8 rounded-full border border-border" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-foreground">#{pr.number}: {pr.title}</p>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  pr.state === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                  pr.state === 'MERGED' ? 'bg-indigo-500 text-white' :
                                  'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                  {pr.state}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-semibold">by @{pr.author} • {new Date(pr.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {pr.state === 'OPEN' && (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                pr.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                pr.status === 'FAILURE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}>
                                CI: {pr.status}
                              </span>
                            )}
                            {pr.state === 'OPEN' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedPR(pr)}
                                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                                    selectedPR?.number === pr.number
                                      ? "bg-primary text-white"
                                      : "bg-primary/10 text-primary hover:bg-primary/20"
                                  }`}
                                >
                                  {selectedPR?.number === pr.number ? "Selected" : "Test PR"}
                                </button>
                                
                                {/* Owner Merge Action */}
                                {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) && (
                                  <button
                                    disabled={mergeMutation.isLoading}
                                    onClick={() => {
                                      // Find internal submission for this PR if exists
                                      const internalSub = projectSubmissions?.find(s => s.prNumber === pr.number);
                                      if (internalSub) {
                                        handleMerge(internalSub._id);
                                      } else {
                                        // Handle external PR merge if needed, but for now we focus on Innoworks-tracked ones
                                        alert("Can only merge submissions tracked on Innoworks. Submit a review first to sync.");
                                      }
                                    }}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                                  >
                                    {mergeMutation.isLoading ? "Merging..." : <><GitPullRequest size={12} /> Merge</>}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                {pr.state === 'MERGED' ? <CheckCircle2 size={12} className="text-indigo-500" /> : <AlertCircle size={12} className="text-red-500" />}
                                {pr.state === 'MERGED' ? "Accepted" : "Rejected"}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Checks list (only for open PRs) */}
                        {pr.state === 'OPEN' && pr.checks?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-2">
                            {pr.checks.slice(0, 3).map((check, cidx) => (
                              <div key={cidx} className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  check.conclusion === 'SUCCESS' ? 'bg-emerald-500' : 
                                  check.conclusion === 'FAILURE' ? 'bg-red-500' : 'bg-amber-500'
                                }`} />
                                {check.name}
                              </div>
                            ))}
                            {pr.checks.length > 3 && <span className="text-[9px] text-muted-foreground font-bold">+{pr.checks.length - 3} more</span>}
                          </div>
                        )}
                        
                        <div className="mt-4 flex gap-3">
                           <a 
                             href={pr.prUrl} 
                             target="_blank" 
                             rel="noreferrer" 
                             className="text-[10px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1"
                           >
                             <ExternalLink size={12} /> View on GitHub
                           </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-xs font-semibold">
                    No pending pull requests awaiting review.
                  </div>
                )}
              </div>

              {/* PR History Sub-section */}
              <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="border-b border-border/30 pb-3 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <History size={16} className="text-indigo-500" /> codebase Pull Request History
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {(intelligence?.prAnalytics?.mergedPRs || 0) + (intelligence?.prAnalytics?.rejectedPRs || 0)} Total
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {intelligence?.prAnalytics?.recentPRActivity
                    ?.filter(pr => pr.state !== 'OPEN')
                    ?.map((pr, idx) => (
                      <div key={idx} className="p-4 bg-muted/5 border border-border/30 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted border border-border/50 overflow-hidden">
                            <img src={pr.authorAvatar} alt={pr.author} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground truncate max-w-[200px]">PR #{pr.number}: {pr.title}</p>
                            <p className="text-[10px] text-muted-foreground">by @{pr.author} • {pr.state === 'MERGED' ? 'Accepted' : 'Closed'}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          pr.state === 'MERGED' ? 'bg-indigo-500 text-white' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {pr.state === 'MERGED' ? 'Accepted' : 'Rejected'}
                        </span>
                      </div>
                    ))}
                  {intelligence?.prAnalytics?.recentPRActivity?.filter(pr => pr.state !== 'OPEN').length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                      No PR history records found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test Review Report right sidebar */}
            <div className="space-y-6">
              <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                  <ClipboardList className="text-primary" size={18} />
                  <h3 className="font-bold text-sm">Tester Review Form</h3>
                </div>

                {testError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} />
                    <p className="font-semibold leading-relaxed">{testError}</p>
                  </div>
                )}

                {testSuccess ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <Sparkles size={26} />
                    </div>
                    <h3 className="font-bold text-emerald-500">Test Report Submitted!</h3>
                    <p className="text-xs text-muted-foreground font-semibold">Report registered. Unlocked review timeline logging & owner notification alert.</p>
                  </div>
                ) : selectedPR ? (
                  <form onSubmit={handleTestSubmit} className="space-y-5">
                    <div className="p-3.5 bg-muted/30 border border-border/50 rounded-xl space-y-1 text-xs">
                      <p className="text-muted-foreground text-[10px] uppercase">Testing Target</p>
                      <p className="font-bold text-foreground">
                        {selectedPR.number ? `PR #${selectedPR.number}: ${selectedPR.title}` : `Submission by @${selectedPR.user?.username}: ${selectedPR.branchName}`}
                      </p>
                    </div>

                    {/* Rating select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rating Score (1-5)</label>
                      <select 
                        value={testRating}
                        onChange={(e)=>setTestRating(parseInt(e.target.value))}
                        className="w-full text-xs bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-foreground"
                      >
                        <option value="5">5 - Excellent Quality</option>
                        <option value="4">4 - Good Features</option>
                        <option value="3">3 - Standard compliance</option>
                        <option value="2">2 - Minor bugs found</option>
                        <option value="1">1 - Severe compile issues</option>
                      </select>
                    </div>

                    {/* Bugs found */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bugs Discovered</label>
                      <textarea
                        rows={2}
                        placeholder="List any bugs or edge case crashes (one per line)..."
                        value={testBugs}
                        onChange={(e)=>setTestBugs(e.target.value)}
                        className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary resize-none font-semibold text-foreground"
                      />
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Suggestions</label>
                      <textarea
                        rows={2}
                        placeholder="List performance recommendations..."
                        value={testSuggestions}
                        onChange={(e)=>setTestSuggestions(e.target.value)}
                        className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary resize-none font-semibold text-foreground"
                      />
                    </div>

                    {/* Checklist toggle buttons */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Peer Checklist</p>
                      {checklist.map((item, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => toggleChecklist(idx)}
                          className="w-full flex items-start gap-2 p-2 rounded-lg border border-border/40 text-left text-[11px] font-semibold"
                        >
                          <input 
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-primary"
                          />
                          <span className={item.checked ? "text-muted-foreground line-through" : "text-foreground"}>{item.item}</span>
                        </button>
                      ))}
                    </div>

                    {/* Feedback comments */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overall Reviewer Notes</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Describe compile state and checklist tests report..."
                        value={testFeedback}
                        onChange={(e)=>setTestFeedback(e.target.value)}
                        className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary resize-none font-semibold text-foreground"
                      />
                    </div>

                    {/* Outcome select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Testing Decision</label>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase">
                        {[
                          { val: "APPROVED", label: "Approve", color: "border-emerald-500/20 text-emerald-500 bg-emerald-500/5", sel: "bg-emerald-500 text-white" },
                          { val: "NEEDS_CHANGES", label: "Request Changes", color: "border-orange-500/20 text-orange-500 bg-orange-500/5", sel: "bg-orange-500 text-white" },
                          { val: "REJECTED", label: "Reject", color: "border-red-500/20 text-red-500 bg-red-500/5", sel: "bg-red-500 text-white" }
                        ].map((btn) => {
                          const isSel = testOutcome === btn.val;
                          return (
                            <button
                              type="button"
                              key={btn.val}
                              onClick={()=>setTestOutcome(btn.val)}
                              className={`py-2 rounded-lg border text-center transition-all ${isSel ? btn.sel : btn.color}`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      disabled={submittingTest}
                      type="submit"
                      className="w-full btn-primary py-3.5 text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-1.5"
                    >
                      {submittingTest ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Submit Test Review"
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                    Select an open pull request from the list to start testing checks!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: ACTIVITY FEED */}
        {activeTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Commits Section */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Code2 size={18} className="text-primary" /> Commit History
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {intelligence?.statistics?.totalCommits} Total
                </span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {intelligence?.commitAnalytics?.recentCommits?.map((commit, idx) => (
                  <div key={idx} className="p-4 bg-muted/10 border border-border/30 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-foreground line-clamp-2">{commit.message}</p>
                      <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {commit.sha.substring(0, 7)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-primary font-bold">@{commit.author}</span>
                      <span className="text-muted-foreground">{new Date(commit.date).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues Section */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" /> Open Issues
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowIssueForm(!showIssueForm)}
                    className="text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded flex items-center gap-1 hover:bg-primary/20 transition-all"
                  >
                    <Plus size={10} /> Raise Issue
                  </button>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {intelligence?.statistics?.openIssues} Open
                  </span>
                </div>
              </div>

              {showIssueForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateGitHubIssue} 
                  className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-4 mb-4 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-muted-foreground uppercase">Issue Title</label>
                    <input 
                      required
                      type="text"
                      placeholder="Title of the bug or feature request..."
                      value={newIssueTitle}
                      onChange={(e)=>setNewIssueTitle(e.target.value)}
                      className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary focus:outline-none font-semibold text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-muted-foreground uppercase">Detailed Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Describe the issue, steps to reproduce, or expected behavior..."
                      value={newIssueBody}
                      onChange={(e)=>setNewIssueBody(e.target.value)}
                      className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary focus:outline-none resize-none font-semibold text-foreground"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      disabled={isCreatingIssue}
                      type="submit"
                      className="btn-primary py-2 px-4 text-[10px] font-black uppercase shadow-lg shadow-primary/20"
                    >
                      {isCreatingIssue ? "Creating..." : "Submit to GitHub"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowIssueForm(false)}
                      className="px-4 py-2 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {((intelligence?.issueAnalytics?.openIssuesList || intelligence?.recentActivityFeed?.filter(a => a.type === "issue")) || []).map((issue, idx) => (
                  <div key={idx} className="p-4 bg-muted/10 border border-border/30 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {issue.number ? `#${issue.number}: ` : ""}{issue.title}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {issue.labels?.map((label, lidx) => (
                            <span 
                              key={lidx} 
                              className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                              style={{ backgroundColor: `#${label.color}20`, color: `#${label.color}`, border: `1px solid #${label.color}40` }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded">
                        Open
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Reported on {new Date(issue.date || issue.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-3">
                        {authUser?._id === project?.owner?._id && (
                          <button
                            onClick={() => handleCloseIssue(issue.number || issue.title.split('#')[1]?.split(':')[0])}
                            disabled={closeIssueMutation.isLoading}
                            className="text-red-500 hover:text-red-600 font-bold uppercase tracking-widest disabled:opacity-50"
                          >
                            {closeIssueMutation.isLoading ? "Closing..." : "Close Issue"}
                          </button>
                        )}
                        <a
                          href={`${intelligence.overview.repositoryUrl}/issues/${issue.number || issue.title.split('#')[1]?.split(':')[0] || ""}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-bold"
                        >
                          View on GitHub
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                {(!intelligence?.issueAnalytics?.openIssuesList && intelligence?.recentActivityFeed?.filter(a => a.type === "issue").length === 0) && (
                  <div className="py-12 text-center text-muted-foreground text-xs font-semibold">
                    No open issues found in recent activity.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Edit Project Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border/50 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Edit Mission Briefing</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Refine your challenge parameters</p>
                </div>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProject} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Challenge Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full p-4 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description / Requirements</label>
                  <textarea
                    rows={6}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                    className="w-full p-4 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none font-medium text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">XP Bounty Allocation</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editBounty}
                      onChange={(e) => setEditBounty(parseInt(e.target.value))}
                      required
                      className="w-full p-4 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none font-black text-xl text-primary"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end">
                      <span className="text-[10px] font-black text-primary uppercase">XP Reward</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isUpdatingProject}
                    className="flex-1 btn-primary py-4 text-sm font-black uppercase shadow-xl shadow-primary/20"
                  >
                    {isUpdatingProject ? "Synchronizing Changes..." : "Save Briefing"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 btn-secondary py-4 text-sm font-black uppercase border border-border/50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProjectDetails;