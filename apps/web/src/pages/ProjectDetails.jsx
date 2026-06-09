import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetProjectQuery, 
  useGetProjectIntelligenceQuery, 
  useGetProjectForkStatusQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAcceptProjectMutation
} from "../store/api/projectsApiSlice";
import { 
  useGetProjectSubmissionsQuery, 
  useCreateSubmissionMutation,
  useSubmitReviewMutation,
  useMergeSubmissionMutation,
  useRejectSubmissionMutation
} from "../store/api/submissionsApiSlice";
import { 
  Github, 
  ExternalLink, 
  Clock, 
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Rocket,
  ShieldCheck,
  Trophy,
  History,
  Activity,
  GitBranch,
  Star,
  Eye,
  GitFork,
  BookOpen,
  Book,
  GitPullRequest,
  ClipboardList,
  FileCode2,
  Trash2,
  X,
  Target,
  Terminal,
  Cpu,
  Layers,
  RefreshCcw,
  Zap,
  Check,
  Lock,
  Globe,
  Monitor,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RepoPicker from "../components/RepoPicker";
import BranchPicker from "../components/BranchPicker";
import ProjectAssets from "../components/project/ProjectAssets";
import ProjectIssues from "../components/project/ProjectIssues";
import { setCredentials } from "../store/slices/authSlice";
import { useMe } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const ProjectDetails = () => {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const { user: authUser } = useMe();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 1. Fetch live repository intelligence
  const { data: intelligence, isLoading: loadingIntel } = useGetProjectIntelligenceQuery(id, {
    pollingInterval: 300000 // 5 minutes
  });

  // 2. Fetch basic project details
  const { data: project, isLoading: loadingProject } = useGetProjectQuery(id);

  // 3. Fetch submissions for this project
  const { data: projectSubmissions } = useGetProjectSubmissionsQuery(id);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'stats', 'dev_flow', 'test_flow'
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  
  // Start Developing states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
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

  const lastActive = useMemo(() => {
    if (!intelligence?.commitAnalytics?.recentCommits?.length) return "Inactive";
    const date = new Date(intelligence.commitAnalytics.recentCommits[0].date);
    return date.toLocaleDateString();
  }, [intelligence]);

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

  const [updateProject] = useUpdateProjectMutation();

  const handleUpdateProject = useCallback(async (e) => {
    e.preventDefault();
    setIsUpdatingProject(true);
    try {
      await updateProject({
        id,
        title: editTitle,
        description: editDescription,
        bounty: editBounty
      }).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingProject(false);
    }
  }, [updateProject, id, editTitle, editDescription, editBounty]);

  const isAccepted = useMemo(() => 
    (authUser?.acceptedProjects || []).some(p => (p._id || p) === id),
  [authUser?.acceptedProjects, id]);

  const activeSubmissions = useMemo(() => 
    projectSubmissions?.filter(s => s.status !== 'MERGED' && s.status !== 'REJECTED') || [],
  [projectSubmissions]);

  const mySubmissions = useMemo(() => 
    projectSubmissions?.filter(s => s.user?._id === authUser?._id || s.user === authUser?._id) || [],
  [projectSubmissions, authUser?._id]);

  const [deleteProject] = useDeleteProjectMutation();

  const handleDelete = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        await deleteProject(id).unwrap();
        navigate("/projects");
      } catch (err) {
        console.error(err);
      }
    }
  }, [deleteProject, id, navigate]);

  const [acceptProject, { isLoading: isAccepting }] = useAcceptProjectMutation();

  const acceptProjectHandler = useCallback(async () => {
    try {
      const response = await acceptProject(id).unwrap();
      if (response?.user) {
        dispatch(setCredentials({ 
          user: response.user, 
          token: localStorage.getItem("token") 
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [acceptProject, id, dispatch]);

  const { data: forkStatus, refetch: checkFork } = useGetProjectForkStatusQuery(id, {
    skip: !isAccepted
  });

  const [createSubmission] = useCreateSubmissionMutation();
  const [submitReview] = useSubmitReviewMutation();
  const [mergeSubmission, { isLoading: isMerging }] = useMergeSubmissionMutation();
  const [rejectSubmission, { isLoading: isRejecting }] = useRejectSubmissionMutation();


  const handleDevSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedRepo || !selectedBranch) return;
    setSubmittingDev(true);
    try {
      await createSubmission({
        projectId: id,
        forkUrl: selectedRepo.html_url,
        branchName: selectedBranch,
        linkedIssue: selectedIssue?.number
      }).unwrap();
      setDevSuccess(true);
    } catch (err) {
      setDevError(err.data?.message || "Failed to submit contribution.");
    } finally {
      setSubmittingDev(false);
    }
  }, [id, selectedRepo, selectedBranch, selectedIssue, createSubmission]);


  const handleTestSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedPR || !testFeedback) return;
    setSubmittingTest(true);
    try {
      const reviewTarget = selectedPR._id || selectedPR.number;
      await submitReview({
        id: reviewTarget,
        projectId: id,
        feedback: testFeedback,
        outcome: testOutcome,
        checklist,
        rating: testRating,
        bugsFound: testBugs.split("\n").filter(b => b.trim() !== ""),
        suggestions: testSuggestions
      }).unwrap();
      setTestSuccess(true);
      setTimeout(() => {
        setTestSuccess(false);
        setSelectedPR(null);
      }, 3000);
    } catch (err) {
      setTestError("Failed to submit review.");
    } finally {
      setSubmittingTest(false);
    }
  }, [id, selectedPR, testFeedback, testOutcome, checklist, testRating, testBugs, testSuggestions, submitReview]);

  const toggleChecklist = useCallback((index) => {
    setChecklist(prev => prev.map((item, idx) => 
      idx === index ? { ...item, checked: !item.checked } : item
    ));
  }, []);

  const handleMerge = useCallback(async (submissionId) => {
    if (window.confirm("Are you sure you want to merge this?")) {
      try {
        await mergeSubmission({ id: submissionId, projectId: id }).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  }, [mergeSubmission, id]);

  const handleReject = useCallback(async (submissionId) => {
    if (window.confirm("Are you sure you want to reject this submission? This will close the PR.")) {
      try {
        await rejectSubmission({ id: submissionId, projectId: id }).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  }, [rejectSubmission, id]);

  if (loadingProject || loadingIntel) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-8">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 w-20 h-20 border-t-2 border-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap size={24} className="text-primary animate-pulse" />
        </div>
      </div>
      <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Mission Intelligence...</p>
    </div>
  );

  const stats = [
    { label: "Activity", value: lastActive, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Forks", value: intelligence?.statistics?.forks, icon: GitFork, color: "text-primary", bg: "bg-primary/10" },
    { label: "Issues", value: intelligence?.statistics?.openIssues, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Watchers", value: intelligence?.statistics?.watchers, icon: Eye, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="py-4 max-w-7xl mx-auto px-6 lg:px-8 selection:bg-primary/20">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-4"
      >
        <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black text-[8px] uppercase tracking-widest group">
          <div className="p-1 rounded-lg bg-secondary/50 group-hover:bg-primary/10 transition-colors">
            <ChevronLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Back to Projects
        </Link>
      </motion.div>

      {/* High-Fidelity Hero Module */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-6 glass-card rounded-xl p-6 overflow-hidden border border-border/50"
      >
        <div className="absolute top-0 right-0 w-[45%] h-full bg-gradient-to-l from-primary/10 to-transparent blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <motion.div 
              whileHover={{ rotate: -3, scale: 1.02 }}
              className="w-16 h-16 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0 shadow-xl shadow-black/20 border-2 border-background/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Github size={30} strokeWidth={1.5} className="relative z-10" />
            </motion.div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <h1 
                    className={`text-lg font-black tracking-tighter text-gradient leading-none truncate ${isTitleExpanded ? 'whitespace-normal overflow-visible' : 'truncate'}`}
                  >
                    {project?.title}
                  </h1>
                  {project?.title?.length > 40 && (
                    <button 
                      onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                      className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-widest text-primary/70 hover:text-primary mt-1 transition-colors"
                    >
                      {isTitleExpanded ? <><ChevronDown size={8} className="rotate-180" /> Show Less</> : <><ChevronDown size={8} /> Expand Title</>}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={project?.difficulty === 'Hard' ? 'destructive' : project?.difficulty === 'Medium' ? 'default' : 'success'} className="px-1.5 py-0 border-none text-[7px] h-4">
                    {project?.difficulty === 'Hard' ? 'Elite' : project?.difficulty}
                  </Badge>
                  <Badge variant="default" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5 py-0 gap-1 border-none text-[7px] h-4">
                    <Trophy size={8} className="fill-amber-500/20" /> {project?.bounty} XP
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <div className="flex items-center gap-1">
                  <Lock size={9} className="text-primary/60" />
                  <span>{intelligence?.overview?.license || 'MIT'}</span>
                </div>
                <div className="w-0.5 h-0.5 rounded-full bg-border" />
                <div className="flex items-center gap-1">
                  <GitBranch size={9} className="text-primary/60" />
                  <span>{intelligence?.overview?.defaultBranch || 'main'}</span>
                </div>
                <div className="w-0.5 h-0.5 rounded-full bg-border" />
                <div className="flex items-center gap-1">
                  <Globe size={9} className="text-emerald-500/60" />
                  <span className="text-emerald-500/80">LIVE_LINK</span>
                </div>
              </div>
            </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
            {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) ? (
              <div className="flex items-center gap-1.5">
                <Link to={`/projects/${id}/wiki`}>
                  <Button variant="secondary" size="icon" className="w-8 h-8" title="Documentation">
                    <Book size={14} />
                  </Button>
                </Link>
                <Button variant="destructive" size="icon" onClick={handleDelete} className="w-8 h-8">
                  <Trash2 size={14} />
                </Button>
                <Button
                  variant={activeTab === "management" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setActiveTab("management")}
                  className="h-8 px-3 text-[8px] uppercase tracking-widest gap-2"
                >
                  <Layers size={12} /> Hub
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                <Link to={`/projects/${id}/wiki`}>
                  <Button variant="secondary" size="icon" className="w-8 h-8">
                    <BookOpen size={14} />
                  </Button>
                </Link>
                <Button
                  variant={activeTab === "engineering" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => { if (!isAccepted) acceptProjectHandler(); setActiveTab("engineering"); }}
                  className="h-8 px-3 text-[8px] uppercase tracking-widest gap-2"
                >
                  <Terminal size={12} /> Deploy
                </Button>
                <Button 
                  variant={activeTab === "engineering" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setActiveTab("engineering")}
                  className={`h-8 px-3 text-[8px] uppercase tracking-widest gap-2 ${activeTab === "engineering" ? "bg-emerald-600 border-emerald-600 hover:bg-emerald-700" : "text-emerald-600 bg-emerald-600/10 border-emerald-600/20 hover:bg-emerald-600/20"}`}
                >
                  <ShieldCheck size={12} /> QA Mode
                </Button>
              </div>
            )}
            </div>
            </div>
            </motion.div>

            {/* Premium Tab Navigation */}
            <div className="flex border-b border-border/30 mb-6 text-[9px] font-black uppercase tracking-[0.2em] overflow-x-auto no-scrollbar relative">
            {[
            { id: "overview", label: "Project", icon: Target },
            { id: "intelligence", label: "Stats", icon: Activity },
            { id: "assets", label: "Assets", icon: Layers },
            ...((project?.owner?._id === authUser?._id || project?.owner === authUser?._id) ? 
            [{ id: "management", label: "Directives", icon: ClipboardList }] : 
            [{ id: "engineering", label: "Engineering", icon: Terminal }]
            ),
            { id: "activity", label: "Activity", icon: History }
            ].map(tab => (
            <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`pb-2 border-b-2 flex items-center gap-2 mr-4 transition-all relative shrink-0 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground opacity-60"}`}
            >
            <tab.icon size={12} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="active-project-tab" className="absolute bottom-[-2px] inset-x-0 h-0.5 bg-primary" />
            )}
            </button>
            ))}
            </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div 
            key="overview" 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }} 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="card-premium p-6 lg:p-8 space-y-4 bg-gradient-to-br from-card to-secondary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                    <BookOpen size={16} />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gradient">Technical Protocol</h3>
                </div>
                <p className="text-base text-foreground/80 leading-relaxed font-medium tracking-tight">{project?.description}</p>
              </div>
              
              <div className="card-premium p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                      <FileCode2 size={16} />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gradient">Documentation_Stream</h3>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05, rotate: 180 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["projectIntelligence", id] })}
                    className="p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-primary transition-all border border-border/50 shadow-sm"
                  >
                    <RefreshCcw size={14} />
                  </motion.button>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl max-h-[500px] overflow-y-auto font-mono text-[11px] lg:text-[12px] leading-relaxed text-slate-400 border border-white/10 selection:bg-primary/30 shadow-2xl relative custom-scrollbar">
                  <div className="absolute top-4 left-6 flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/40" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/20 border border-amber-500/40" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                  </div>
                  <pre className="whitespace-pre-wrap mt-6 pt-3 border-t border-white/5">{intelligence?.overview?.readmePreview || "// Awaiting data transmission..."}</pre>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-premium p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    <GitBranch size={14} className="text-primary" /> Global Upstream
                  </h4>
                  <motion.a 
                    whileHover={{ y: -3 }}
                    href={intelligence?.overview?.repositoryUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-4 bg-secondary/40 border border-border/50 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border/50 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-xl shadow-black/5">
                        <Github size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-foreground">@{intelligence?.overview?.owner}</p>
                        <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.1em]">Source Core</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.a>
                </div>

                <div className="pt-2 space-y-3">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Project Parameters</h4>
                  <div className="space-y-3">
                    {[
                      { label: "State", value: project?.status, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
                      { label: "Matrix", value: project?.techStack?.join(", ") || "Unknown", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
                      { label: "Award", value: `${project?.bounty} Verified XP`, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" }
                    ].map((l, i) => (
                      <div key={i} className="space-y-1">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.1em] ml-1 opacity-60">{l.label}</span>
                        <div className={`px-3 py-2 rounded-lg border font-black text-[9px] uppercase tracking-widest ${l.bg} ${l.color}`}>
                          {l.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!isAccepted && !(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="bg-primary p-6 rounded-2xl text-primary-foreground shadow-2xl shadow-primary/30 space-y-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-xl font-black tracking-tight leading-none uppercase tracking-tighter">Engage Protocol</h4>
                    <p className="text-primary-foreground/70 text-xs font-medium leading-relaxed tracking-tight">Initializing will fork the repository and establish a high-bandwidth link to your profile.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => acceptProjectHandler()}
                    disabled={isAccepting}
                    className="w-full py-4 bg-white text-primary rounded-xl font-black uppercase tracking-[0.2em] text-[9px] shadow-2xl shadow-black/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isAccepting ? <RefreshCcw size={16} className="animate-spin" /> : <><Rocket size={16} /> Initialize Sync</>}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "intelligence" && (
          <motion.div key="intelligence" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((m, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -8 }}
                  className="card-premium p-5 flex flex-col items-center text-center gap-6 group"
                >
                  <div className={`w-16 h-16 rounded-[1.5rem] ${m.bg} flex items-center justify-center shrink-0 ${m.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-black/5`}>
                    <m.icon size={32} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 leading-none">{m.label}</p>
                    <p className="text-4xl font-black tracking-tighter tabular-nums text-gradient">{m.value || 0}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <ProjectIssues projectId={id} />
          </motion.div>
        )}

        {activeTab === "assets" && (
          <motion.div key="assets" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <ProjectAssets projectId={id} project={project} />
          </motion.div>
        )}

        {activeTab === "management" && (
          <motion.div key="management" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <div className="card-premium p-5 lg:p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48" />
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                   <Layers size={24} />
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gradient">Cluster Submissions</h3>
               </div>
               
               <div className="space-y-8">
                 {projectSubmissions && projectSubmissions.length > 0 ? (
                   projectSubmissions.map(sub => (
                     <motion.div 
                       key={sub._id}
                       whileHover={{ x: 5 }}
                       className="p-5 bg-secondary/20 border border-border/50 rounded-2xl space-y-5 transition-all shadow-xl shadow-black/5"
                     >
                       <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-5 border-b border-border/30">
                         <div className="flex items-center gap-6">
                           <div className="relative">
                             <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-16 h-16 rounded-[1.5rem] border-2 border-background shadow-2xl" />
                             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-lg border-2 border-background">
                               <Zap size={10} fill="currentColor" />
                             </div>
                           </div>
                           <div className="space-y-1">
                             <p className="text-lg font-black tracking-tight text-foreground uppercase tracking-tighter">@{sub.user?.username}</p>
                             <div className="flex items-center gap-2 px-3 py-1 bg-background/50 border border-border/50 rounded-lg w-fit">
                               <GitBranch size={12} className="text-primary" />
                               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{sub.branchName}</span>
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex flex-wrap items-center gap-4">
                           <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${sub.status === 'MERGED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : sub.status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                             {sub.status.replace('_', ' ')}
                           </span>
                           
                           {sub.prNumber && (
                             <motion.a 
                               whileHover={{ scale: 1.02 }}
                               whileTap={{ scale: 0.98 }}
                               href={sub.prUrl} target="_blank" rel="noreferrer" 
                               className="px-6 py-3 bg-secondary/80 border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary hover:text-primary transition-all flex items-center gap-3 shadow-sm"
                             >
                               <Github size={16} /> PR #{sub.prNumber}
                             </motion.a>
                           )}
                           
                           {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUESTED'].includes(sub.status) && sub.prNumber && (
                             <div className="flex items-center gap-3">
                               <motion.button 
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 onClick={() => handleMerge(sub._id)} 
                                 disabled={isMerging} 
                                 className="px-8 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
                               >
                                 {isMerging ? 'TRANSMITTING...' : 'Commit Merge'}
                               </motion.button>
                               <motion.button 
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 onClick={() => handleReject(sub._id)} 
                                 disabled={isRejecting} 
                                 className="px-8 py-3 bg-destructive text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-destructive/20 hover:brightness-110 active:scale-95 transition-all"
                               >
                                 {isRejecting ? 'TERMINATING...' : 'Reject Link'}
                               </motion.button>
                             </div>
                           )}
                         </div>
                       </div>

                       {/* High-Fidelity Review Intelligence */}
                       {sub.reviews && sub.reviews.length > 0 && (
                         <div className="space-y-6">
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-2">Peer Review Intelligence</p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {sub.reviews.map((review, rIdx) => (
                               <motion.div 
                                 key={rIdx} 
                                 whileHover={{ scale: 1.02 }}
                                 className="p-8 bg-background/60 border border-border/50 rounded-xl space-y-6 shadow-2xl shadow-black/5"
                               >
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                     <img src={review.reviewer?.avatarUrl} className="w-8 h-8 rounded-xl border border-border/50 shadow-sm" alt="Reviewer" />
                                     <span className="text-[11px] font-black uppercase tracking-widest text-primary">@{review.reviewer?.username}</span>
                                   </div>
                                   <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${review.outcome === 'APPROVED' ? 'text-emerald-500' : 'text-amber-500'}`}>{review.outcome}</span>
                                 </div>
                                 <p className="text-sm font-medium text-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-4">"{review.feedback}"</p>
                                 <div className="flex items-center gap-1.5 pt-2">
                                   {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={14} className={i < review.rating ? "text-amber-500 fill-amber-500/20" : "text-muted-foreground opacity-20"} />
                                   ))}
                                 </div>
                               </motion.div>
                             ))}
                           </div>
                         </div>
                       )}

                       {/* Activity Log Grid */}
                       <div className="p-8 lg:p-5 bg-background/40 border border-border/40 rounded-xl shadow-inner">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-10">Historical Transmission Log</p>
                          <div className="space-y-5">
                             {sub.timeline?.slice().reverse().map((event, tIdx) => (
                               <div key={tIdx} className="flex gap-6 relative group">
                                 {tIdx < sub.timeline.length - 1 && <div className="absolute left-[19px] top-12 bottom-[-40px] w-px bg-border/40 group-hover:bg-primary/20 transition-all duration-700" />}
                                 <div className="w-10 h-10 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center shrink-0 relative z-10 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                                   <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-sm shadow-primary/40" />
                                 </div>
                                 <div className="space-y-1 flex-1 pb-2">
                                   <div className="flex items-center justify-between">
                                     <p className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground tracking-tighter">{event.action}</p>
                                     <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">{new Date(event.createdAt).toLocaleDateString()} • {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                   </div>
                                   <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-2xl">{event.description}</p>
                                 </div>
                               </div>
                             ))}
                          </div>
                       </div>
                     </motion.div>
                   ))
                 ) : (
                   <div className="py-32 text-center border-2 border-dashed border-border/30 rounded-2xl bg-secondary/5 space-y-6">
                     <ShieldCheck size={56} className="mx-auto text-muted-foreground opacity-10" />
                     <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">No Submissions Detected</p>
                   </div>
                 )}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === "engineering" && (
          <div className="space-y-16">
            {/* Dev Flow Section */}
            <motion.div key="engineering_dev" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="lg:col-span-2 space-y-5">
                  <div className="card-premium p-5 lg:p-6 relative overflow-hidden bg-gradient-to-br from-card to-secondary/30">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                        <GitFork size={24} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gradient">Phase 1: Environment Sync</h3>
                    </div>
                    
                    {!isAccepted ? (
                      <div className="space-y-5 max-w-2xl">
                        <p className="text-xl font-medium text-foreground/70 leading-relaxed tracking-tight">
                          Initializing this protocol will generate a high-bandwidth fork of the upstream repository, establishing a secure telemetry link to your workspace.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => acceptProjectHandler()}
                          disabled={isAccepting}
                          className="btn-primary py-6 px-16 rounded-lg text-[11px] uppercase tracking-[0.3em] gap-4 shadow-[0_30px_60px_-12px_rgba(99,102,241,0.5)]"
                        >
                          {isAccepting ? (
                            <RefreshCcw size={20} className="animate-spin" />
                          ) : (
                            <><Rocket size={20} /> Execute Fork Sequence</>
                          )}
                        </motion.button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-8 p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-xl shadow-sm"
                        >
                          <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 shadow-lg shadow-emerald-500/5">
                            <CheckCircle2 size={36} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">Telemetry Link Established</p>
                            <p className="text-sm font-medium text-muted-foreground leading-relaxed">System identity verified. The mission workspace is now synchronized with your engineering node.</p>
                          </div>
                        </motion.div>
                        
                        {forkStatus?.forkExists ? (
                          <div className="space-y-8">
                            {mySubmissions.length > 0 && (
                              <div className="p-8 bg-primary/5 border border-primary/20 rounded-xl space-y-6 shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                                 <div className="flex items-center justify-between relative z-10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Live Mission Intelligence</h4>
                                    <span className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">{mySubmissions[0].status.replace('_', ' ')}</span>
                                 </div>
                                 <div className="flex items-center gap-5 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-background border border-border/50 flex items-center justify-center text-primary shadow-xl shadow-black/5">
                                       <GitPullRequest size={28} strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-sm font-black text-foreground uppercase tracking-widest">TRANSMISSION PR #{mySubmissions[0].prNumber || 'SYNC_PENDING'}</p>
                                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                         <GitBranch size={12} className="text-primary/60" /> NODE_TARGET: {mySubmissions[0].branchName}
                                       </p>
                                    </div>
                                 </div>
                                 {mySubmissions[0].linkedIssue && (
                                   <div className="p-4 bg-background/60 border border-border/50 rounded-2xl flex items-center gap-4 relative z-10 shadow-inner">
                                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 font-black text-[11px] shadow-sm">#{mySubmissions[0].linkedIssue}</div>
                                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Resolving Target Issue</p>
                                   </div>
                                 )}
                              </div>
                            )}

                            <div className="p-5 bg-secondary/30 border border-border/50 rounded-xl space-y-8 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Personal Fork</span>
                                <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> CLUSTER_NODE_LIVE
                                </span>
                              </div>
                              <div className="p-6 bg-background/80 border border-border/50 rounded-[1.5rem] font-mono text-xs lg:text-[14px] text-foreground/90 break-all select-all hover:border-primary/50 transition-all shadow-inner leading-relaxed">
                                {forkStatus.forkFullName}
                              </div>
                              <div className="flex flex-wrap gap-4 pt-2">
                                <motion.a 
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  href={forkStatus.forkUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="px-8 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-3 shadow-2xl shadow-black/20"
                                >
                                  <Github size={18} /> Open Repository
                                </motion.a>
                                <motion.button 
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(`git clone ${forkStatus.forkUrl}`);
                                  }}
                                  className="px-8 py-4 bg-background text-foreground border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-3 shadow-xl hover:bg-secondary transition-all"
                                >
                                  <Terminal size={18} /> Copy Clone Protocol
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-16 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col items-center text-center gap-8 shadow-inner">
                             <div className="relative">
                               <div className="w-24 h-24 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                 <RefreshCcw size={48} className="animate-spin" style={{ animationDuration: '4s' }} />
                               </div>
                               <div className="absolute inset-0 flex items-center justify-center">
                                 <GitFork size={24} className="text-amber-500 animate-pulse" />
                               </div>
                             </div>
                             <div className="space-y-3">
                               <p className="text-2xl font-black text-amber-500 uppercase tracking-widest tracking-tighter">Propagation in Progress</p>
                               <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">GitHub is finalizing your mission environment. This typically resolves within 15 seconds. Maintain position.</p>
                             </div>
                             <motion.button 
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                               onClick={checkFork} 
                               className="px-10 py-3.5 bg-amber-500/10 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 hover:bg-amber-500/20 transition-all shadow-sm"
                             >
                               Manual Ping
                             </motion.button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="card-premium p-5 space-y-5 lg:p-6">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                         <ShieldCheck size={20} />
                       </div>
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gradient">Engineering Standards Matrix</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[
                          { title: "Branching_Logic", desc: "Pushing to 'main' is forbidden. Initialize a unique feature branch for every protocol solution." },
                          { title: "Validation_Suites", desc: "Local test matrices must return 100% compliance before initializing deployment sequence." },
                          { title: "Symmetry_Check", desc: "Adhere to established Prettier and ESLint configurations across the entire cluster." },
                          { title: "Documentation_Sync", desc: "Update README stream if architectural changes introduce new technical debt." }
                        ].map((s, i) => (
                          <div key={i} className="flex gap-6 group">
                            <div className="w-8 h-8 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center text-primary text-[11px] font-black shrink-0 shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500">{i+1}</div>
                            <div className="space-y-2">
                              <p className="text-[11px] font-black uppercase tracking-widest text-foreground tracking-tighter">{s.title}</p>
                              <p className="text-xs font-medium text-muted-foreground leading-relaxed tracking-tight">{s.desc}</p>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="space-y-5">
                  <div className="card-premium p-5 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                        <Send size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gradient">Phase 2: Deployment</h3>
                    </div>
                    
                    {devSuccess ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-16 text-center space-y-8"
                      >
                        <div className="w-24 h-24 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 border border-emerald-500/20 shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
                          <CheckCircle2 size={56} />
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-2xl font-black tracking-tighter uppercase tracking-widest">Deployment Locked</h4>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[240px] mx-auto opacity-60">
                            Solution deployed to validation queue. Monitoring live status feed.
                          </p>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate("/dashboard")}
                          className="btn-primary w-full py-5 rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20"
                        >
                          Return to Dashboard
                        </motion.button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleDevSubmit} className="space-y-5">
                        {devError && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-6 bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-black uppercase tracking-widest rounded-[1.5rem] flex items-center gap-4"
                          >
                            <AlertCircle size={20} className="shrink-0" />
                            {devError}
                          </motion.div>
                        )}
                        
                        <div className="space-y-5">
                          {selectedIssue && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-6 bg-primary/10 border border-primary/20 rounded-[1.5rem] flex items-center justify-between shadow-sm"
                            >
                               <div className="flex items-center gap-5">
                                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-[12px] shadow-lg shadow-primary/30">#{selectedIssue.number}</div>
                                  <div className="min-w-0 space-y-0.5">
                                     <p className="text-sm font-black text-foreground truncate uppercase tracking-tighter">{selectedIssue.title}</p>
                                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Resolving Issue</p>
                                  </div>
                               </div>
                               <button onClick={() => setSelectedIssue(null)} className="p-2.5 hover:bg-secondary rounded-xl text-muted-foreground transition-all"><X size={16} /></button>
                            </motion.div>
                          )}

                          {!selectedIssue && intelligence?.issueAnalytics?.openIssuesList?.length > 0 && (
                            <div className="space-y-4">
                              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Target Anomaly (Optional)</label>
                              <div className="relative group">
                                <select 
                                  onChange={(e) => setSelectedIssue(intelligence.issueAnalytics.openIssuesList.find(i => i.number === parseInt(e.target.value)))}
                                  className="w-full px-6 py-5 bg-background/50 border border-border/50 rounded-[1.5rem] font-bold text-[12px] text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none shadow-inner cursor-pointer transition-all group-hover:border-primary/30"
                                >
                                  <option value="">Identify an issue to resolve...</option>
                                  {intelligence.issueAnalytics.openIssuesList.map(issue => (
                                    <option key={issue.number} value={issue.number}>ISSUE #{issue.number}: {issue.title}</option>
                                  ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                  <ChevronDown size={18} />
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Local Workspace Node</label>
                            <RepoPicker onSelect={setSelectedRepo} selectedRepo={selectedRepo} />
                          </div>
                          
                          <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Target Branch</label>
                            <BranchPicker 
                              owner={selectedRepo?.owner?.login || authUser?.username} 
                              repo={selectedRepo?.name} 
                              onSelect={setSelectedBranch} 
                              selectedBranch={selectedBranch} 
                            />
                          </div>
                        </div>

                        <div className="pt-6">
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={!selectedRepo || !selectedBranch || submittingDev || !isAccepted} 
                            className="w-full btn-primary py-6 text-[11px] uppercase tracking-[0.4em] rounded-lg shadow-[0_25px_50px_-12px_rgba(99,102,241,0.5)] flex items-center justify-center gap-4 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all"
                          >
                            {submittingDev ? (
                              <RefreshCcw size={20} className="animate-spin" />
                            ) : (
                              <><Rocket size={20} /> Commit to Validation</>
                            )}
                          </motion.button>
                          {!isAccepted && (
                            <p className="mt-6 text-[9px] text-center text-red-500/70 font-black uppercase tracking-[0.3em]">Initialize Environment protocol first.</p>
                          )}
                        </div>
                        
                        <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40 leading-relaxed px-4">
                          Executing this sequence will create an automated Pull Request on the upstream master cluster.
                        </p>
                      </form>
                    )}
                  </div>
               </div>
            </motion.div>

            {/* QA Flow / Audit Queue Section */}
            <motion.div key="engineering_test" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="lg:col-span-1 space-y-8">
                 <div className="card-premium p-8 lg:p-5 space-y-5 h-fit">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                       <ClipboardList size={20} />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gradient">Audit Queue</h3>
                   </div>

                   {activeSubmissions.filter(s => s.user?._id !== authUser?._id && s.user !== authUser?._id).length > 0 ? (
                     <div className="space-y-5">
                       {activeSubmissions.filter(s => s.user?._id !== authUser?._id && s.user !== authUser?._id).map(sub => (
                         <motion.div 
                           key={sub._id} 
                           whileHover={{ scale: 1.02 }}
                           onClick={() => { setSelectedPR(sub); setTestSuccess(false); setTestError(""); }}
                           className={`p-6 border rounded-xl cursor-pointer transition-all flex flex-col gap-6 relative overflow-hidden group shadow-sm ${selectedPR?._id === sub._id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/50 bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50'}`}
                         >
                           {selectedPR?._id === sub._id && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] pointer-events-none" />}
                           <div className="flex items-center gap-4 relative z-10">
                             <div className="relative">
                               <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-12 h-12 rounded-[1.2rem] border border-border/50 shadow-lg" />
                               <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-lg border border-border/50 flex items-center justify-center shadow-sm">
                                 <Github size={12} className="text-muted-foreground" />
                               </div>
                             </div>
                             <div className="min-w-0 flex-1 space-y-1">
                               <p className="text-sm font-black tracking-tight text-foreground uppercase truncate tracking-tighter">@{sub.user?.username}</p>
                               <div className="flex items-center gap-1.5 opacity-60">
                                 <GitBranch size={10} className="text-primary" />
                                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">{sub.branchName}</p>
                               </div>
                             </div>
                           </div>
                           <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.25em] relative z-10">
                             <span className={`px-3 py-1.5 rounded-lg border ${sub.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                               {sub.status}
                             </span>
                             <motion.span whileHover={{ x: 3 }} className="text-primary flex items-center gap-1.5">INITIATE AUDIT <ChevronRight size={14} /></motion.span>
                           </div>
                         </motion.div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-24 bg-secondary/10 border-2 border-dashed border-border/40 rounded-2xl space-y-6">
                       <ShieldCheck size={56} className="mx-auto text-muted-foreground opacity-10" />
                       <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 max-w-[180px] mx-auto leading-relaxed">No pending reviews found in local grid sector.</p>
                     </div>
                   )}
                 </div>
               </div>

               <div className="lg:col-span-2">
                 <div className="card-premium p-5 lg:p-6 h-full relative overflow-hidden bg-gradient-to-br from-card via-card to-emerald-500/5">
                   {selectedPR ? (
                     <AnimatePresence mode="wait">
                       <motion.div 
                         key={selectedPR._id}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="space-y-6"
                       >
                         <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-5 border-b border-border/30 relative z-10">
                           <div className="flex items-center gap-6">
                             <div className="relative">
                               <img src={selectedPR.user?.avatarUrl} alt={selectedPR.user?.username} className="w-20 h-20 rounded-lg border-2 border-background shadow-2xl" />
                               <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-background">
                                 <Check size={14} strokeWidth={3} />
                               </div>
                             </div>
                             <div className="space-y-2">
                               <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">Audit Node: @{selectedPR.user?.username}</h3>
                               <div className="flex items-center gap-4">
                                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Source Link:</p>
                                 <motion.a 
                                   whileHover={{ scale: 1.05 }}
                                   href={selectedPR.forkUrl} target="_blank" rel="noreferrer" 
                                   className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                                 >
                                   <Monitor size={12} /> Inspect Code
                                 </motion.a>
                               </div>
                           </div>
                         </div>
                         <motion.button 
                           whileHover={{ scale: 1.1, rotate: 90 }}
                           whileTap={{ scale: 0.9 }}
                           onClick={() => setSelectedPR(null)} 
                           className="p-3 bg-secondary/80 text-muted-foreground hover:text-foreground rounded-2xl border border-border/50 shadow-sm transition-all"
                         >
                           <X size={20} />
                         </motion.button>
                       </div>
                       
                       {testSuccess ? (
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className="flex flex-col items-center justify-center py-12 text-center space-y-8"
                         >
                            <div className="w-24 h-24 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 border border-emerald-500/20 shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
                              <CheckCircle2 size={56} />
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-2xl font-black tracking-tighter uppercase tracking-widest">Audit Completed</h4>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto opacity-60">
                                Your validation signature has been appended to this protocol. The contributor has been notified.
                              </p>
                            </div>
                         </motion.div>
                       ) : (
                         <form onSubmit={handleTestSubmit} className="space-y-6 relative z-10">
                           {testError && (
                             <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center gap-4">
                               <AlertCircle size={22} />
                               {testError}
                             </div>
                           )}

                           <div className="space-y-8">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/60 ml-2">Compliance Matrix</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                               {checklist.map((item, idx) => (
                                 <motion.label 
                                   key={idx} 
                                   whileHover={{ scale: 1.02 }}
                                   className={`flex items-center gap-5 p-6 rounded-xl border transition-all cursor-pointer shadow-sm group ${item.checked ? 'bg-primary/5 border-primary/40' : 'bg-secondary/40 border-border/50 hover:border-primary/20'}`}
                                 >
                                   <div className="relative">
                                     <input 
                                       type="checkbox" 
                                       checked={item.checked} 
                                       onChange={() => toggleChecklist(idx)}
                                       className="w-7 h-7 rounded-xl border-2 border-border bg-background checked:bg-primary checked:border-primary transition-all appearance-none cursor-pointer shadow-inner"
                                     />
                                     <Check size={18} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white transition-opacity pointer-events-none ${item.checked ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
                                   </div>
                                   <span className={`text-[12px] font-bold leading-tight group-hover:text-foreground transition-colors ${item.checked ? 'text-foreground' : 'text-muted-foreground'}`}>{item.item}</span>
                                 </motion.label>
                               ))}
                             </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-10 border-t border-border/30">
                             <div className="space-y-4">
                               <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Audit Outcome</label>
                               <div className="relative group">
                                 <select 
                                   value={testOutcome} 
                                   onChange={(e) => setTestOutcome(e.target.value)}
                                   className="w-full px-6 py-5 bg-background/50 border border-border/50 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none shadow-inner cursor-pointer transition-all group-hover:border-primary/30"
                                 >
                                   <option value="APPROVED">✓ VERIFY SUBMISSION</option>
                                   <option value="NEEDS_CHANGES">⚠ REQUEST REFACTOR</option>
                                   <option value="REJECTED">✗ TERMINATE LINK</option>
                                 </select>
                                 <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                   <ChevronDown size={18} />
                                 </div>
                               </div>
                             </div>
                             <div className="space-y-4">
                               <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Engineering Magnitude (1-5)</label>
                               <div className="flex gap-2.5">
                                 {[1, 2, 3, 4, 5].map(n => (
                                   <motion.button
                                     key={n}
                                     type="button"
                                     whileHover={{ y: -3 }}
                                     whileTap={{ scale: 0.9 }}
                                     onClick={() => setTestRating(n)}
                                     className={`flex-1 py-4 rounded-[1.25rem] font-black text-xs transition-all border shadow-sm ${testRating >= n ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-secondary/40 text-muted-foreground border-border/50 hover:border-primary/30'}`}
                                   >
                                     {n}
                                   </motion.button>
                                 ))}
                               </div>
                             </div>
                           </div>

                           <div className="space-y-4 pt-10 border-t border-border/30">
                             <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">High-Level Log Output</label>
                             <textarea 
                               required 
                               rows={5} 
                               placeholder="Analyze technical matrix, architectural logic, and deployment readiness..."
                               value={testFeedback}
                               onChange={(e) => setTestFeedback(e.target.value)}
                               className="w-full px-8 py-6 bg-background/50 border border-border/50 rounded-xl font-medium text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none shadow-inner placeholder:text-muted-foreground/30 custom-scrollbar"
                             />
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-10 border-t border-border/30">
                             <div className="space-y-4">
                               <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Logic Discrepancies</label>
                               <textarea 
                                 rows={4} 
                                 placeholder="Identify critical failures..."
                                 value={testBugs}
                                 onChange={(e) => setTestBugs(e.target.value)}
                                 className="w-full px-6 py-5 bg-background/50 border border-border/50 rounded-[1.5rem] font-medium text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-inner custom-scrollbar"
                               />
                             </div>
                             <div className="space-y-4">
                               <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Strategic Vectors</label>
                               <textarea 
                                 rows={4} 
                                 placeholder="Recommend architectural growth..."
                                 value={testSuggestions}
                                 onChange={(e) => setTestSuggestions(e.target.value)}
                                 className="w-full px-6 py-5 bg-background/50 border border-border/50 rounded-[1.5rem] font-medium text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-inner custom-scrollbar"
                               />
                             </div>
                           </div>

                           <motion.button 
                             whileHover={{ scale: 1.01 }}
                             whileTap={{ scale: 0.99 }}
                             type="submit" 
                             disabled={submittingTest || !testFeedback}
                             className="w-full btn-primary py-7 font-black uppercase tracking-[0.5em] text-[11px] rounded-xl shadow-[0_35px_70px_-15px_rgba(99,102,241,0.5)] flex items-center justify-center gap-4 transition-all"
                           >
                             {submittingTest ? <RefreshCcw size={22} className="animate-spin" /> : <><Send size={20} /> Commit Audit Protocol</>}
                           </motion.button>
                         </form>
                       )}
                     </motion.div>
                   </AnimatePresence>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full py-32 text-center space-y-8 opacity-40">
                      <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                        <Cpu size={48} className="text-muted-foreground" />
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xl font-black uppercase tracking-widest">Awaiting Selection</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">
                          Select a submission from the queue to begin peer validation.
                        </p>
                      </div>
                   </div>
                 )}
               </div>
             </div>
            </motion.div>
          </div>
        )}

        {activeTab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                  {/* Activity Feed */}
                  <div className="card-premium p-5 lg:p-6 relative overflow-hidden bg-gradient-to-br from-card to-secondary/30">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                          <Terminal size={20} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gradient">Activity Feed</h3>
                      </div>
                      <span className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> GRID_SYNC_ACTIVE
                      </span>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                      {intelligence?.overview?.recentActivityFeed?.length > 0 ? (
                        intelligence.overview.recentActivityFeed.map((event, idx) => (
                          <div key={idx} className="flex gap-8 relative group">
                            {idx < intelligence.overview.recentActivityFeed.length - 1 && (
                              <div className="absolute left-[19px] top-[40px] bottom-[-40px] w-px bg-border/40 group-hover:bg-primary/30 transition-all duration-700" />
                            )}
                            <div className="w-10 h-10 rounded-2xl bg-background border border-border/50 flex items-center justify-center shrink-0 relative z-10 shadow-xl shadow-black/5 group-hover:border-primary/40 transition-colors">
                              <div className={`w-2.5 h-2.5 rounded-full ${event.type === 'commit' ? 'bg-primary' : event.type === 'pull_request' ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
                            </div>
                            <div className="space-y-2.5 flex-1 pb-4">
                              <p className="text-[14px] font-bold leading-relaxed text-foreground tracking-tight">
                                <span className="text-primary mr-2 font-black uppercase tracking-widest text-[11px]">@{event.actor || "GRID_USER"}</span> 
                                <span className="opacity-80">
                                  {event.type === "commit" && `injected commit: ${event.title}`}
                                  {event.type === "pull_request" && `initialized pull sequence: ${event.title}`}
                                  {event.type === "issue" && `opened issue: ${event.title}`}
                                </span>
                              </p>
                              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-2">
                                <Clock size={10} /> {new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-24 text-center space-y-6">
                          <Activity size={64} className="mx-auto text-muted-foreground opacity-10" />
                          <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Loading Activity...</p>
                            <p className="text-[10px] font-medium text-muted-foreground/30 max-w-xs mx-auto leading-relaxed px-6">No recent events detected in this mission cluster. Commits and reviews will appear here in real-time.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Commit History */}
                  <div className="card-premium p-5 lg:p-6 relative overflow-hidden bg-gradient-to-br from-card via-card to-indigo-500/5">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                         <History size={20} />
                       </div>
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gradient">Commit History</h3>
                    </div>
                    <div className="space-y-6 relative z-10">
                      {intelligence?.commitAnalytics?.recentCommits?.length > 0 ? intelligence.commitAnalytics.recentCommits.slice(0, 10).map((commit, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ x: 5 }}
                          className="flex items-start gap-6 p-6 bg-background/60 border border-border/40 rounded-3xl hover:border-primary/30 transition-all group shadow-xl shadow-black/5"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-secondary/80 flex items-center justify-center font-mono text-[11px] font-black text-primary border border-border/50 shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            {commit.sha.substring(0, 7)}
                          </div>
                          <div className="min-w-0 space-y-1.5 pt-1">
                            <p className="text-sm font-bold text-foreground truncate tracking-tight">{commit.message}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">@{commit.author} • {new Date(commit.date).toLocaleDateString()}</p>
                          </div>
                        </motion.div>
                      )) : (
                        <p className="text-[11px] font-black text-muted-foreground/30 text-center py-16 uppercase tracking-[0.4em]">Scanning commit history...</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Elite Contributors Node */}
                  <div className="card-premium p-5 space-y-6 relative overflow-hidden bg-gradient-to-br from-card to-amber-500/5">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[60px] rounded-full" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                        <Trophy size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gradient">Elite Contributor Node</h3>
                    </div>
                    <div className="space-y-5 relative z-10">
                       {intelligence?.commitAnalytics?.topContributors?.slice(0, 5).map((contributor, i) => (
                         <motion.div 
                           key={i} 
                           whileHover={{ scale: 1.02 }}
                           className="flex items-center justify-between p-5 bg-background/60 border border-border/50 rounded-[1.5rem] shadow-sm hover:border-amber-500/30 transition-all"
                         >
                            <div className="flex items-center gap-4">
                               <img src={contributor.avatarUrl} className="w-10 h-10 rounded-[1rem] border border-border/50 shadow-lg" alt={contributor.username} />
                               <span className="text-[11px] font-black tracking-widest text-foreground uppercase tracking-tighter">@{contributor.username}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[12px] font-black text-primary tabular-nums">{contributor.commitCount}</span>
                              <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">COMMITS</span>
                            </div>
                         </motion.div>
                       ))}
                    </div>
                  </div>

                  {/* System Directive Notice */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-8 shadow-inner relative overflow-hidden"
                  >
                     <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Intelligence_Directive</h4>
                     <p className="text-xs font-bold leading-relaxed text-foreground/70 tracking-tight">Activity logs are aggregated via global GitHub Webhooks. Pull sequences and commits are synchronized across the cluster in real-time. Unauthorized tampering will trigger a link reset.</p>
                  </motion.div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-background/90 backdrop-blur-2xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-2xl glass-card rounded-[3.5rem] p-12 lg:p-16 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] -mr-40 -mt-40 pointer-events-none" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-3xl font-black tracking-tighter uppercase tracking-widest text-gradient">Modify Protocol</h2>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditing(false)} 
                  className="p-3 bg-secondary/80 text-muted-foreground hover:text-foreground rounded-2xl border border-border/50 transition-all shadow-sm"
                >
                  <X size={24} />
                </motion.button>
              </div>
              <form onSubmit={handleUpdateProject} className="space-y-5 relative z-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Mission Designation</label>
                  <input type="text" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full px-8 py-5 bg-background/50 border border-border/50 rounded-[1.5rem] font-bold text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" placeholder="Protocol Title" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Verified Bounty (XP)</label>
                  <div className="relative group">
                    <input type="number" value={editBounty} onChange={(e)=>setEditBounty(Number(e.target.value))} className="w-full px-8 py-5 bg-background/50 border border-border/50 rounded-[1.5rem] font-black text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner group-hover:border-primary/30" placeholder="0" />
                    <Trophy size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Operational Directive</label>
                  <textarea rows={6} value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} className="w-full px-8 py-6 bg-background/50 border border-border/50 rounded-xl font-medium text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none shadow-inner custom-scrollbar" placeholder="Define the mission objective..." />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isUpdatingProject}
                  className="w-full btn-primary py-6 rounded-lg text-[11px] uppercase tracking-[0.4em] shadow-[0_25px_50px_-12px_rgba(99,102,241,0.5)] gap-3"
                >
                  {isUpdatingProject ? <RefreshCcw size={20} className="animate-spin" /> : <><Check size={20} strokeWidth={3} /> Synchronize Matrix</>}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetails;
