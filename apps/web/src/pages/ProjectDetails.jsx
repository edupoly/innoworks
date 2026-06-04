import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
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
  X,
  Target,
  Terminal,
  Cpu,
  RefreshCcw,
  Zap,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import RepoPicker from "../components/RepoPicker";
import BranchPicker from "../components/BranchPicker";
import { setCredentials } from "../store/slices/authSlice";
import { useMe } from "../hooks/useAuth";

const ProjectDetails = () => {
  const { id } = useParams();
  const { user: authUser } = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

  const isAccepted = (authUser?.acceptedProjects || []).some(p => (p._id || p) === id);

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
    onSuccess: (response) => {
      if (response.data?.user) {
        dispatch(setCredentials({ 
          user: response.data.user, 
          token: localStorage.getItem("token") 
        }));
      }
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
    if (isAccepted) {
      checkFork();
    }
  }, [isAccepted, id]);

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

  const toggleChecklist = (index) => {
    setChecklist(prev => prev.map((item, idx) => 
      idx === index ? { ...item, checked: !item.checked } : item
    ));
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

  if (loadingProject || loadingIntel) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Synchronizing Intelligence...</p>
    </div>
  );

  const stats = [
    { label: "Stars", value: intelligence?.statistics?.stars, icon: Star, color: "text-yellow-500" },
    { label: "Forks", value: intelligence?.statistics?.forks, icon: GitFork, color: "text-indigo-500" },
    { label: "Issues", value: intelligence?.statistics?.openIssues, icon: AlertCircle, color: "text-red-500" },
    { label: "Watchers", value: intelligence?.statistics?.watchers, icon: Eye, color: "text-emerald-500" },
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 selection:bg-primary/20">
      <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest mb-10 group">
        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Return to Command Center
      </Link>

      {/* Hero Module */}
      <div className="relative mb-12 bg-card border border-border/50 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl shadow-black/5">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/5 to-transparent blur-3xl -z-0"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-start gap-8">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-lg shadow-primary/5">
              <Github size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight">{project?.title}</h1>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  project?.difficulty === 'Hard' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  project?.difficulty === 'Medium' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                  {project?.difficulty} Mode
                </span>
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <BadgeDollarSign size={12} /> {project?.bounty} XP
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                {intelligence?.overview?.license || 'MIT'} License • Branch: {intelligence?.overview?.defaultBranch || 'main'}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDelete}
                  className="p-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50 rounded-2xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={() => setActiveTab("management")}
                  className={`px-8 py-4 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl flex items-center gap-2.5 transition-all shadow-xl ${activeTab === "management" ? "bg-primary text-primary-foreground shadow-primary/30" : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"}`}
                >
                  <Layers size={16} /> Manage Protocol
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => { if (!isAccepted) acceptMutation.mutate(); setActiveTab("dev_flow"); }}
                  className={`px-8 py-4 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl flex items-center gap-2.5 transition-all shadow-xl ${activeTab === "dev_flow" ? "bg-indigo-600 text-white shadow-indigo-600/30" : "bg-indigo-600/10 text-indigo-600 border border-indigo-600/20 hover:bg-indigo-600/20"}`}
                >
                  <Rocket size={16} /> Start Dev_Flow
                </button>
                <button 
                  onClick={() => setActiveTab("test_flow")}
                  className={`px-8 py-4 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl flex items-center gap-2.5 transition-all shadow-xl ${activeTab === "test_flow" ? "bg-emerald-600 text-white shadow-emerald-600/30" : "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 hover:bg-emerald-600/20"}`}
                >
                  <ShieldCheck size={16} /> Start Test_Flow
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unified Tab Navigation */}
      <div className="flex border-b border-border/50 mb-10 gap-10 text-[11px] font-black uppercase tracking-[0.3em] overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Overview", icon: Target },
          { id: "stats", label: "Analytics", icon: Activity },
          ...((project?.owner?._id === authUser?._id || project?.owner === authUser?._id) ? 
            [{ id: "management", label: "Submissions", icon: Layers }] : 
            [{ id: "dev_flow", label: "Develop", icon: Terminal }, { id: "test_flow", label: "QA & Test", icon: Cpu }]
          ),
          { id: "activity", label: "Activity", icon: History }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`pb-5 border-b-2 flex items-center gap-2.5 transition-all relative ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-[-2px] inset-x-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card border border-border/50 rounded-[2rem] p-10 space-y-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><BookOpen size={16} /></div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em]">Technical Briefing</h3>
                </div>
                <p className="text-lg text-foreground/80 leading-relaxed font-medium">{project?.description}</p>
              </div>
              
              <div className="bg-card border border-border/50 rounded-[2rem] p-10 space-y-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><FileCode2 size={16} /></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em]">README.md Protocol</h3>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <RefreshCcw size={12} /> Refetch
                  </button>
                </div>
                <div className="p-8 bg-slate-950/80 rounded-[1.5rem] max-h-[500px] overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-400 border border-white/5 selection:bg-primary/30 shadow-inner custom-scrollbar">
                  <pre className="whitespace-pre-wrap">{intelligence?.overview?.readmePreview || "No documentation provided."}</pre>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-card border border-border/50 rounded-[2rem] p-8 space-y-8 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                  <GitBranch size={14} className="text-primary" /> Upstream Workspace
                </h4>
                <a 
                  href={intelligence?.overview?.repositoryUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-5 bg-muted/30 border border-border/50 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border/50 group-hover:scale-110 transition-transform">
                      <Github size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">@{intelligence?.overview?.owner}</p>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Repository Source</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Mission Logistics</h4>
                  <div className="space-y-3">
                    {[
                      { label: "Status", value: project?.status, color: "text-emerald-500" },
                      { label: "Stack", value: project?.techStack?.join(", ") || "Unknown", color: "text-primary" },
                      { label: "XP Award", value: `${project?.bounty} Verified`, color: "text-indigo-500" }
                    ].map((l, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{l.label}</span>
                        <span className={`text-xs font-black uppercase tracking-widest ${l.color}`}>{l.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions (Contextual) */}
              {!isAccepted && !(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary p-8 rounded-[2rem] text-primary-foreground shadow-2xl shadow-primary/20 space-y-6">
                  <h4 className="text-xl font-black tracking-tight leading-tight">Secure This <br />Mission Now.</h4>
                  <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">Accepting will fork the repository and initialize your personal development workspace.</p>
                  <button 
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isLoading}
                    className="w-full py-4 bg-white text-primary rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {acceptMutation.isLoading ? <RefreshCcw size={16} className="animate-spin" /> : <><Rocket size={16} /> Initialize Protocol</>}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "stats" && (
          <motion.div key="stats" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((m, idx) => (
                <div key={idx} className="bg-card p-8 border border-border/50 rounded-[2rem] flex flex-col items-center text-center gap-4 shadow-sm hover:border-primary/30 transition-all group">
                  <div className={`w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 ${m.color} group-hover:scale-110 transition-transform`}><m.icon size={28} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">{m.label}</p>
                    <p className="text-3xl font-black tracking-tighter">{m.value || 0}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full"></div>
               <div className="flex items-center gap-3 mb-10">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Activity size={18} /></div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em]">Repository Velocity</h3>
               </div>
               <div className="h-64 w-full flex items-end justify-between gap-2 pt-10 px-4">
                  {/* Mock Chart for Visual Depth */}
                  {[40, 70, 45, 90, 65, 80, 55, 75, 95, 60, 85, 100].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, duration: 1 }}
                      className="flex-1 bg-gradient-to-t from-primary/40 to-primary rounded-t-lg relative group"
                    >
                      <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-popover px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">{h}%</div>
                    </motion.div>
                  ))}
               </div>
               <div className="flex justify-between mt-6 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                 <span>May 2026</span>
                 <span>June 2026</span>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === "dev_flow" && (
          <motion.div key="dev_flow" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-2 space-y-8">
                <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20"><GitFork size={20} /></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em]">1. Intelligence Sync</h3>
                  </div>
                  
                  {!isAccepted ? (
                    <div className="space-y-8 max-w-2xl">
                      <p className="text-lg font-medium text-foreground/70 leading-relaxed">
                        To begin this mission, initialize the secure protocol. We will automatically fork the target repository and establish a high-bandwidth link to your profile.
                      </p>
                      <button 
                        onClick={() => acceptMutation.mutate()} 
                        disabled={acceptMutation.isLoading}
                        className="btn-primary py-5 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-4 transition-all hover:scale-105 active:scale-95"
                      >
                        {acceptMutation.isLoading ? (
                          <RefreshCcw size={18} className="animate-spin" />
                        ) : (
                          <><Rocket size={18} /> Initialize Fork Sequence</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="flex items-center gap-6 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem]">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                          <CheckCircle2 size={32} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Protocol Active</p>
                          <p className="text-sm font-medium text-muted-foreground">Encryption keys generated. The repository is now synchronized with your engineering profile.</p>
                        </div>
                      </div>
                      
                      {forkStatus?.forkExists ? (
                        <div className="p-8 bg-muted/20 border border-border/50 rounded-[2rem] space-y-6">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Personal_Workspace</span>
                            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 animate-pulse">
                              <Zap size={10} fill="currentColor" /> Live Node
                            </span>
                          </div>
                          <div className="p-5 bg-background border border-border/50 rounded-2xl font-mono text-xs text-foreground/80 break-all select-all hover:border-primary/50 transition-colors">
                            {forkStatus.forkFullName}
                          </div>
                          <div className="flex flex-wrap gap-4 pt-2">
                            <a 
                              href={forkStatus.forkUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-6 py-3.5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all hover:scale-105"
                            >
                              <Github size={16} /> Open on GitHub
                            </a>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`git clone ${forkStatus.forkUrl}`);
                              }}
                              className="px-6 py-3.5 bg-muted text-foreground border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all hover:bg-muted/80"
                            >
                              <Terminal size={16} /> Copy Clone CLI
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-10 bg-orange-500/5 border border-orange-500/20 rounded-[2rem] flex flex-col items-center text-center gap-6">
                           <div className="w-16 h-16 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500 animate-spin" style={{ animationDuration: '3s' }}>
                             <RefreshCcw size={32} />
                           </div>
                           <div className="space-y-2">
                             <p className="text-lg font-black text-orange-500 uppercase tracking-widest">Awaiting Propagation</p>
                             <p className="text-sm font-medium text-muted-foreground max-w-sm">GitHub is finalizing your fork creation. This typically resolves within 15 seconds. Hold position.</p>
                           </div>
                           <button onClick={checkFork} className="px-6 py-2.5 bg-orange-500/10 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-500/20 hover:bg-orange-500/20 transition-all">Manual Ping</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm">
                   <div className="flex items-center gap-3 mb-8">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><ShieldCheck size={20} /></div>
                     <h3 className="text-sm font-black uppercase tracking-[0.3em]">Engineering Standards</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { title: "Branching", desc: "Never push to 'main'. Create a feature branch for every solution." },
                        { title: "Testing", desc: "Local test suites must pass 100% before initializing deployment." },
                        { title: "Code Style", desc: "Adhere to the project's Prettier and ESLint configurations." },
                        { title: "Documentation", desc: "Update README if your changes introduce new technical debt." }
                      ].map((s, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shrink-0 mt-1">{i+1}</div>
                          <div className="space-y-1">
                            <p className="text-sm font-black uppercase tracking-wider">{s.title}</p>
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><Send size={20} /></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em]">2. Deploy Solution</h3>
                  </div>
                  
                  {devSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center space-y-6"
                    >
                      <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 border border-emerald-500/20 shadow-lg">
                        <CheckCircle2 size={48} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black tracking-tight">Transmission Locked</h4>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
                          Deployed to verification queue. Monitoring live status.
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Navigate to Dashboard
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleDevSubmit} className="space-y-8">
                      {devError && (
                        <div className="p-5 bg-destructive/5 border border-destructive/20 text-destructive text-xs font-bold rounded-2xl flex items-center gap-4 animate-shake">
                          <AlertCircle size={20} className="shrink-0" />
                          {devError}
                        </div>
                      )}
                      
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Source Workspace</label>
                          <RepoPicker onSelect={setSelectedRepo} selectedRepo={selectedRepo} />
                        </div>
                        
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Feature Branch</label>
                          <BranchPicker 
                            owner={selectedRepo?.owner?.login || authUser?.username} 
                            repo={selectedRepo?.name} 
                            onSelect={setSelectedBranch} 
                            selectedBranch={selectedBranch} 
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={!selectedRepo || !selectedBranch || submittingDev || !isAccepted} 
                          className="w-full btn-primary py-5 font-black uppercase tracking-[0.2em] text-[11px] rounded-[1.5rem] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                          {submittingDev ? (
                            <RefreshCcw size={18} className="animate-spin" />
                          ) : (
                            <><Rocket size={18} /> Deploy to Validation</>
                          )}
                        </button>
                        {!isAccepted && (
                          <p className="mt-4 text-[9px] text-center text-red-400 font-black uppercase tracking-[0.2em]">Initialize Protocol first to enable deployment.</p>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-[0.25em] opacity-40 leading-relaxed">
                        Initializing this sequence will create an automated Pull Request on the upstream master node.
                      </p>
                    </form>
                  )}
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === "test_flow" && (
          <motion.div key="test_flow" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-1 bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-8 h-fit shadow-sm">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ClipboardList size={16} /></div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em]">QA Queue</h3>
               </div>

               {activeSubmissions.filter(s => s.user?._id !== authUser?._id && s.user !== authUser?._id).length > 0 ? (
                 <div className="space-y-4">
                   {activeSubmissions.filter(s => s.user?._id !== authUser?._id && s.user !== authUser?._id).map(sub => (
                     <div 
                       key={sub._id} 
                       onClick={() => { setSelectedPR(sub); setTestSuccess(false); setTestError(""); }}
                       className={`p-5 border rounded-[1.5rem] cursor-pointer transition-all flex flex-col gap-4 relative overflow-hidden ${selectedPR?._id === sub._id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
                     >
                       {selectedPR?._id === sub._id && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-xl"></div>}
                       <div className="flex items-center gap-4">
                         <div className="relative">
                           <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-12 h-12 rounded-2xl border border-border/50" />
                           <div className="absolute bottom-[-4px] right-[-4px] w-5 h-5 bg-background rounded-lg border border-border/50 flex items-center justify-center">
                             <Github size={12} className="text-muted-foreground" />
                           </div>
                         </div>
                         <div className="min-w-0 flex-1">
                           <p className="text-sm font-black tracking-tight truncate">@{sub.user?.username}</p>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <GitBranch size={10} /> {sub.branchName}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em]">
                         <span className={`px-2 py-1 rounded-md ${sub.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'}`}>
                           {sub.status}
                         </span>
                         <span className="text-primary flex items-center gap-1 group">Review <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /></span>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-20 bg-muted/20 border border-border/50 border-dashed rounded-[2rem] space-y-4">
                   <ShieldCheck size={48} className="mx-auto text-muted-foreground opacity-20" />
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground max-w-[150px] mx-auto">All systems nominal. No pending submissions.</p>
                 </div>
               )}
             </div>

             <div className="lg:col-span-2 bg-card border border-border/50 rounded-[2.5rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
               {selectedPR ? (
                 <>
                   <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                   <div className="flex items-center justify-between pb-8 border-b border-border/50">
                     <div className="flex items-center gap-6">
                       <img src={selectedPR.user?.avatarUrl} alt={selectedPR.user?.username} className="w-16 h-16 rounded-[1.5rem] border border-border/50 shadow-lg" />
                       <div className="space-y-1">
                         <h3 className="text-2xl font-black tracking-tight">Reviewing Protocol: @{selectedPR.user?.username}</h3>
                         <div className="flex items-center gap-4">
                           <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Target Fork:</p>
                           <a href={selectedPR.forkUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary hover:underline uppercase tracking-[0.2em] flex items-center gap-1.5">
                             <ExternalLink size={10} /> View Code
                           </a>
                         </div>
                       </div>
                     </div>
                     <button onClick={() => setSelectedPR(null)} className="p-3 hover:bg-muted/50 rounded-xl text-muted-foreground transition-all"><X size={20} /></button>
                   </div>

                   {testSuccess ? (
                     <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                       <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 animate-bounce">
                         <Check size={48} />
                       </div>
                       <div className="space-y-2">
                         <h4 className="text-3xl font-black tracking-tight">Protocol Verified</h4>
                         <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-sm mx-auto">Review report submitted and synced with GitHub master branch. Rewards distribution initialized.</p>
                       </div>
                     </div>
                   ) : (
                     <form onSubmit={handleTestSubmit} className="space-y-10">
                       {testError && (
                         <div className="p-6 bg-destructive/5 border border-destructive/20 text-destructive text-sm font-bold rounded-2xl flex items-center gap-4">
                           <AlertCircle size={20} />
                           {testError}
                         </div>
                       )}

                       <div className="space-y-6">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-2">
                           <CheckCircle2 size={14} className="text-emerald-500" /> QA Compliance Checklist
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {checklist.map((item, idx) => (
                             <label key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${item.checked ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 border-border/50 hover:border-primary/20'}`}>
                               <input 
                                 type="checkbox" 
                                 checked={item.checked} 
                                 onChange={() => toggleChecklist(idx)}
                                 className="rounded border-border text-primary focus:ring-primary/20 w-5 h-5 bg-background"
                               />
                               <span className="text-xs font-bold leading-tight text-foreground/80">{item.item}</span>
                             </label>
                           ))}
                         </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/30">
                         <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Protocol Decision</label>
                           <div className="relative">
                             <select 
                               value={testOutcome} 
                               onChange={(e) => setTestOutcome(e.target.value)}
                               className="w-full px-5 py-4 bg-background border border-border/50 rounded-2xl font-black text-[11px] uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-sm cursor-pointer"
                             >
                               <option value="APPROVED">✓ Approve Submission</option>
                               <option value="NEEDS_CHANGES">⚠ Request Changes</option>
                               <option value="REJECTED">✗ Reject Submission</option>
                             </select>
                             <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                               <Plus size={16} className="rotate-45" />
                             </div>
                           </div>
                         </div>
                         <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Engineering Grade (1-5)</label>
                           <div className="flex gap-2">
                             {[1, 2, 3, 4, 5].map(n => (
                               <button
                                 key={n}
                                 type="button"
                                 onClick={() => setTestRating(n)}
                                 className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border ${testRating >= n ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted/20 text-muted-foreground border-border/50 hover:border-primary/30'}`}
                               >
                                 {n}
                               </button>
                             ))}
                           </div>
                         </div>
                       </div>

                       <div className="space-y-4 pt-8 border-t border-border/30">
                         <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Detailed Log Output</label>
                         <textarea 
                           required 
                           rows={5} 
                           placeholder="Analyze technical execution, performance metrics, and architectural decisions..."
                           value={testFeedback}
                           onChange={(e) => setTestFeedback(e.target.value)}
                           className="w-full px-6 py-5 bg-background border border-border/50 rounded-[1.5rem] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none shadow-sm placeholder:text-muted-foreground/40"
                         />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/30">
                         <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Bugs / Structural Flaws</label>
                           <textarea 
                             rows={4} 
                             placeholder="List critical errors..."
                             value={testBugs}
                             onChange={(e) => setTestBugs(e.target.value)}
                             className="w-full px-5 py-4 bg-background border border-border/50 rounded-2xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none shadow-sm"
                           />
                         </div>
                         <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Strategic Suggestions</label>
                           <textarea 
                             rows={4} 
                             placeholder="Recommended vectors for growth..."
                             value={testSuggestions}
                             onChange={(e) => setTestSuggestions(e.target.value)}
                             className="w-full px-5 py-4 bg-background border border-border/50 rounded-2xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none shadow-sm"
                           />
                         </div>
                       </div>

                       <button 
                         type="submit" 
                         disabled={submittingTest || !testFeedback}
                         className="w-full btn-primary py-6 font-black uppercase tracking-[0.4em] text-[11px] rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(99,102,241,0.5)] flex items-center justify-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
                       >
                         {submittingTest ? <RefreshCcw size={20} className="animate-spin" /> : <><Send size={18} /> Commit Review Protocol</>}
                       </button>
                     </form>
                   )}
                 </>
               ) : (
                 <div className="text-center py-40 bg-muted/5 rounded-[3rem] border-2 border-dashed border-border/50 space-y-8">
                   <div className="relative inline-block">
                     <ShieldCheck size={100} className="mx-auto text-primary opacity-10 animate-pulse" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <Cpu size={40} className="text-primary opacity-20" />
                     </div>
                   </div>
                   <div className="space-y-3">
                     <h4 className="text-2xl font-black tracking-tight opacity-40 uppercase tracking-[0.1em]">Verification Hub Idle</h4>
                     <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">Select a submission from the QA Queue to begin engineering audit.</p>
                   </div>
                 </div>
               )}
             </div>
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-2 bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm space-y-8">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Terminal size={16} /></div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em]">Live Feed</h3>
               </div>
               
               <div className="space-y-10 py-4">
                 {[1, 2, 3].map((_, i) => (
                   <div key={i} className="flex gap-6 relative">
                     {i < 2 && <div className="absolute left-[15px] top-[40px] bottom-[-40px] w-px bg-border/50"></div>}
                     <div className="w-8 h-8 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0 relative z-10">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                     </div>
                     <div className="space-y-2 flex-1">
                        <p className="text-sm font-bold leading-relaxed">System process initialized for mission <span className="text-primary">#{project?._id.slice(-6)}</span>.</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">T-minus {i*4}h ago • Log_Entry_{i+100}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Notice</h4>
                <p className="text-xs font-bold leading-relaxed text-foreground/70">Activity logs are currently being aggregated from GitHub Webhooks. Some high-latency events may take up to 300s to propagate.</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-card border border-border/50 rounded-[3rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black tracking-tight">Modify Protocol</h2>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-muted rounded-xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleUpdateProject} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Mission Title</label>
                  <input type="text" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full p-5 bg-muted/20 border border-border/50 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Title" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Operational Description</label>
                  <textarea rows={6} value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} className="w-full p-6 bg-muted/20 border border-border/50 rounded-[2rem] font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="Description" />
                </div>
                <button type="submit" className="w-full btn-primary py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  {isUpdatingProject ? <RefreshCcw size={18} className="animate-spin" /> : <><Check size={18} /> Apply Changes</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetails;
