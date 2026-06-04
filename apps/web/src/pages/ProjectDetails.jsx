import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
  useGetProjectQuery, 
  useGetProjectIntelligenceQuery, 
  useGetProjectForkStatusQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAcceptProjectMutation,
  useCloseProjectIssueMutation,
  useCreateProjectIssueMutation
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
  BadgeDollarSign, 
  Layers, 
  Users,
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
import RepoPicker from "../components/RepoPicker";
import BranchPicker from "../components/BranchPicker";
import { setCredentials } from "../store/slices/authSlice";
import { useMe } from "../hooks/useAuth";

const ProjectDetails = () => {
  const { id } = useParams();
  const { user: authUser } = useMe();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 1. Fetch live repository intelligence
  const { data: intelligence, isLoading: loadingIntel, error: intelError } = useGetProjectIntelligenceQuery(id, {
    pollingInterval: 300000 // 5 minutes
  });

  // 2. Fetch basic project details
  const { data: project, isLoading: loadingProject } = useGetProjectQuery(id);

  // 3. Fetch submissions for this project
  const { data: projectSubmissions } = useGetProjectSubmissionsQuery(id);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'stats', 'dev_flow', 'test_flow'
  
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

  const submissionHistory = useMemo(() => 
    projectSubmissions?.filter(s => s.status === 'MERGED' || s.status === 'REJECTED') || [],
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

  const [createSubmission, { isLoading: isSubmittingDevMutation }] = useCreateSubmissionMutation();
  const [submitReview, { isLoading: isSubmittingTestMutation }] = useSubmitReviewMutation();
  const [mergeSubmission, { isLoading: isMerging }] = useMergeSubmissionMutation();
  const [rejectSubmission, { isLoading: isRejecting }] = useRejectSubmissionMutation();
  const [closeIssue, { isLoading: isClosingIssue }] = useCloseProjectIssueMutation();
  const [createIssue, { isLoading: isCreatingIssue }] = useCreateProjectIssueMutation();


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

  const handleCloseIssue = useCallback(async (issueNumber) => {
    if (window.confirm(`Are you sure you want to close issue #${issueNumber}?`)) {
      try {
        await closeIssue({ id, issueNumber }).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  }, [closeIssue, id]);

  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueBody, setIssueBody] = useState("");

  const handleAddIssue = useCallback(async (e) => {
    e.preventDefault();
    try {
      await createIssue({
        id,
        title: issueTitle,
        body: issueBody
      }).unwrap();
      setIsAddingIssue(false);
      setIssueTitle("");
      setIssueBody("");
    } catch (err) {
      console.error(err);
    }
  }, [createIssue, id, issueTitle, issueBody]);

  const handleCreateIssue = (e) => {
    e.preventDefault();
    createIssueMutation.mutate({ title: issueTitle, body: issueBody });
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
                  onClick={() => { if (!isAccepted) acceptProjectHandler(); setActiveTab("dev_flow"); }}
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
          { id: "issues", label: "Issues", icon: AlertCircle },
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
                  <button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["projectIntelligence", id] })}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
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
                    onClick={() => acceptProjectHandler()}
                    disabled={isAccepting}
                    className="w-full py-4 bg-white text-primary rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isAccepting ? <RefreshCcw size={16} className="animate-spin" /> : <><Rocket size={16} /> Initialize Protocol</>}
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

        {activeTab === "issues" && (
          <motion.div key="issues" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-2 space-y-8">
                <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm">
                   <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20"><AlertCircle size={20} /></div>
                       <h3 className="text-sm font-black uppercase tracking-[0.3em]">Open Issues</h3>
                     </div>
                     <button 
                       onClick={() => setIsAddingIssue(!isAddingIssue)}
                       className="px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                     >
                       {isAddingIssue ? <X size={14} /> : <Plus size={14} />} New Issue
                     </button>
                   </div>

                   <AnimatePresence>
                     {isAddingIssue && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-10 overflow-hidden">
                         <form onSubmit={handleCreateIssue} className="p-8 bg-muted/20 border border-border/50 rounded-[2rem] space-y-6">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Issue Title</label>
                              <input required type="text" value={issueTitle} onChange={(e)=>setIssueTitle(e.target.value)} className="w-full p-4 bg-background border border-border/50 rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Brief summary of the issue" />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Description</label>
                              <textarea required rows={4} value={issueBody} onChange={(e)=>setIssueBody(e.target.value)} className="w-full p-5 bg-background border border-border/50 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="Provide details, logs, or reproduction steps..." />
                            </div>
                            <button type="submit" disabled={isCreatingIssue} className="w-full btn-primary py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl">
                              {isCreatingIssue ? <RefreshCcw size={16} className="animate-spin" /> : 'Create GitHub Issue'}
                            </button>
                         </form>
                       </motion.div>
                     )}
                   </AnimatePresence>
                   
                   <div className="space-y-6">
                     {intelligence?.issueAnalytics?.openIssuesList?.length > 0 ? (
                       intelligence.issueAnalytics.openIssuesList.map(issue => (
                         <div key={issue.number} className="p-6 bg-muted/20 border border-border/50 rounded-[1.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-red-500/30 transition-all group">
                           <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-black text-xs text-muted-foreground border border-border/50 shrink-0">
                               #{issue.number}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-foreground leading-tight mb-2">{issue.title}</p>
                               <div className="flex flex-wrap gap-2">
                                 {issue.labels.map((label, idx) => (
                                   <span key={idx} className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-border" style={{ backgroundColor: `#${label.color}20`, color: `#${label.color}` }}>
                                     {label.name}
                                   </span>
                                 ))}
                                 <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Opened {new Date(issue.createdAt).toLocaleDateString()}</span>
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-3">
                             {!(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) && (
                               <button 
                                 onClick={() => { setSelectedIssue(issue); setActiveTab("dev_flow"); }}
                                 className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all opacity-0 group-hover:opacity-100"
                               >
                                 Work on this
                               </button>
                             )}

                             {(project?.owner?._id === authUser?._id || project?.owner === authUser?._id) && (
                               <button 
                                 onClick={() => handleCloseIssue(issue.number)}
                                 disabled={isClosingIssue}
                                 className="px-4 py-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"
                               >
                                 Close Issue
                               </button>
                             )}
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="py-20 text-center bg-muted/5 border border-dashed border-border/50 rounded-[2rem] space-y-4">
                         <CheckCircle2 size={48} className="mx-auto text-emerald-500 opacity-20" />
                         <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Zero known discrepancies. Master node stable.</p>
                       </div>
                     )}
                   </div>
                </div>
             </div>
             
             <div className="space-y-8">
                <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Issue Statistics</h4>
                   <div className="space-y-4">
                     {[
                       { label: "Bug Reports", value: intelligence?.issueAnalytics?.bugIssues, color: "text-red-500" },
                       { label: "Feature Requests", value: intelligence?.issueAnalytics?.featureRequests, color: "text-primary" },
                       { label: "Good First Issues", value: intelligence?.issueAnalytics?.goodFirstIssues, color: "text-emerald-500" },
                       { label: "Documentation", value: intelligence?.issueAnalytics?.documentationIssues, color: "text-indigo-500" }
                     ].map((s, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-2xl transition-all hover:border-primary/20">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</span>
                         <span className={`text-sm font-black ${s.color}`}>{s.value || 0}</span>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === "management" && (
          <motion.div key="management" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
            <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
               <div className="flex items-center gap-3 mb-10">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><Layers size={20} /></div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em]">Protocol Submissions</h3>
               </div>
               
               <div className="space-y-8">
                 {projectSubmissions && projectSubmissions.length > 0 ? (
                   projectSubmissions.map(sub => (
                     <div key={sub._id} className="p-8 bg-muted/20 border border-border/50 rounded-[2rem] space-y-6 hover:border-primary/30 transition-all">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/30">
                         <div className="flex items-center gap-4">
                           <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-14 h-14 rounded-2xl border border-border/50" />
                           <div>
                             <p className="text-sm font-black tracking-tight">@{sub.user?.username}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                               <GitBranch size={10} /> {sub.branchName}
                             </p>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-4 flex-wrap">
                           <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${sub.status === 'MERGED' ? 'bg-emerald-500/10 text-emerald-500' : sub.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-500'}`}>
                             {sub.status}
                           </span>
                           
                           {sub.prNumber && (
                             <a href={sub.prUrl} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all flex items-center gap-2">
                               <Github size={14} /> PR #{sub.prNumber}
                             </a>
                           )}
                           
                           {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUESTED'].includes(sub.status) && sub.prNumber && (
                             <>
                               <button onClick={() => handleMerge(sub._id)} disabled={isMerging} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                                 {isMerging ? 'Merging...' : 'Merge PR'}
                               </button>
                               <button onClick={() => handleReject(sub._id)} disabled={isRejecting} className="px-6 py-2.5 bg-destructive text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20 hover:scale-105 active:scale-95 transition-all">
                                 {isRejecting ? 'Rejecting...' : 'Reject PR'}
                               </button>
                             </>
                           )}
                         </div>
                       </div>

                       {/* Review Summary */}
                       {sub.reviews && sub.reviews.length > 0 && (
                         <div className="space-y-4">
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Peer Review Intelligence</p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {sub.reviews.map((review, rIdx) => (
                               <div key={rIdx} className="p-5 bg-background border border-border/50 rounded-2xl space-y-3">
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                     <img src={review.reviewer?.avatarUrl} className="w-5 h-5 rounded-full" alt="Reviewer" />
                                     <span className="text-[10px] font-black uppercase tracking-widest text-primary">@{review.reviewer?.username}</span>
                                   </div>
                                   <span className={`text-[9px] font-black uppercase tracking-widest ${review.outcome === 'APPROVED' ? 'text-emerald-500' : 'text-orange-500'}`}>{review.outcome}</span>
                                 </div>
                                 <p className="text-xs font-medium text-foreground/70 leading-relaxed italic">"{review.feedback}"</p>
                                 <div className="flex items-center gap-1">
                                   {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={10} className={i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground"} />
                                   ))}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       {/* Timeline History */}
                       <div className="p-6 bg-background/50 border border-border/30 rounded-2xl">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Transmission Log</p>
                          <div className="space-y-6">
                             {sub.timeline?.slice().reverse().map((event, tIdx) => (
                               <div key={tIdx} className="flex gap-4 relative group">
                                 {tIdx < sub.timeline.length - 1 && <div className="absolute left-[7px] top-[14px] bottom-[-24px] w-px bg-border/50 group-hover:bg-primary/20 transition-colors"></div>}
                                 <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 relative z-10 mt-0.5">
                                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                 </div>
                                 <div>
                                   <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{event.action}</p>
                                   <p className="text-xs font-medium text-muted-foreground leading-relaxed">{event.description}</p>
                                   <p className="text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase">{new Date(event.createdAt).toLocaleString()}</p>
                                 </div>
                               </div>
                             ))}
                          </div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="py-20 text-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-2 border-dashed border-border rounded-3xl opacity-30">
                     No_Submissions_Yet
                   </div>
                 )}
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
                        onClick={() => acceptProjectHandler()}
                        disabled={isAccepting}
                        className="btn-primary py-5 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-4 transition-all hover:scale-105 active:scale-95"
                      >
                        {isAccepting ? (
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
                        <div className="space-y-6">
                          {mySubmissions.length > 0 && (
                            <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2rem] space-y-4">
                               <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Active Mission Status</h4>
                                  <span className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-[8px] font-black uppercase tracking-widest">{mySubmissions[0].status}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-primary"><GitPullRequest size={20} /></div>
                                  <div>
                                     <p className="text-xs font-bold text-foreground">PR #{mySubmissions[0].prNumber || 'Pending'}</p>
                                     <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Linked to Branch: {mySubmissions[0].branchName}</p>
                                  </div>
                               </div>
                               {mySubmissions[0].linkedIssue && (
                                 <div className="p-3 bg-background/50 border border-border/30 rounded-xl flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-black text-[9px]">#{mySubmissions[0].linkedIssue}</div>
                                    <p className="text-[10px] font-bold text-muted-foreground">Resolves Linked Issue</p>
                                 </div>
                               )}
                            </div>
                          )}

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
                        {selectedIssue && (
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">#{selectedIssue.number}</div>
                                <div className="min-w-0">
                                   <p className="text-xs font-bold text-foreground truncate">{selectedIssue.title}</p>
                                   <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Target Issue Linked</p>
                                </div>
                             </div>
                             <button onClick={() => setSelectedIssue(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-all"><X size={14} /></button>
                          </div>
                        )}

                        {!selectedIssue && intelligence?.issueAnalytics?.openIssuesList?.length > 0 && (
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Link to Issue (Optional)</label>
                            <div className="relative">
                              <select 
                                onChange={(e) => setSelectedIssue(intelligence.issueAnalytics.openIssuesList.find(i => i.number === parseInt(e.target.value)))}
                                className="w-full px-5 py-4 bg-background border border-border/50 rounded-2xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-sm cursor-pointer"
                              >
                                <option value="">Select an issue to resolve...</option>
                                {intelligence.issueAnalytics.openIssuesList.map(issue => (
                                  <option key={issue.number} value={issue.number}>#{issue.number} {issue.title}</option>
                                ))}
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <ChevronRight size={14} className="rotate-90" />
                              </div>
                            </div>
                          </div>
                        )}

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
          <motion.div key="activity" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-12">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  {/* Unified Live Feed */}
                  <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><Terminal size={20} /></div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em]">Live Feed</h3>
                      </div>
                      <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Real-time Sync
                      </span>
                    </div>
                    
                    <div className="space-y-10">
                      {intelligence?.overview?.recentActivityFeed?.length > 0 ? (
                        intelligence.overview.recentActivityFeed.map((event, idx) => (
                          <div key={idx} className="flex gap-6 relative group">
                            {idx < intelligence.overview.recentActivityFeed.length - 1 && (
                              <div className="absolute left-[15px] top-[40px] bottom-[-40px] w-px bg-border/50 group-hover:bg-primary/30 transition-colors"></div>
                            )}
                            <div className="w-8 h-8 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0 relative z-10">
                              <div className={`w-2 h-2 rounded-full ${event.type === 'commit' ? 'bg-primary' : event.type === 'pull_request' ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`}></div>
                            </div>
                            <div className="space-y-2 flex-1">
                              <p className="text-sm font-bold leading-relaxed text-foreground">
                                <span className="text-primary mr-1">@{event.actor || "GitHub User"}</span> 
                                {event.type === "commit" && `pushed commit: ${event.title}`}
                                {event.type === "pull_request" && `opened ${event.title}`}
                                {event.type === "issue" && `opened ${event.title}`}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center">
                          <Activity size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Aggregating Global Activity...</p>
                            <p className="text-[10px] font-medium text-muted-foreground/60 max-w-xs mx-auto">No recent events detected for this mission. New commits and reviews will appear here in real-time.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Master Commit History */}
                  <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="flex items-center gap-3 mb-10">
                       <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><History size={18} /></div>
                       <h3 className="text-sm font-black uppercase tracking-[0.3em]">Master Commit History</h3>
                    </div>
                    <div className="space-y-6">
                      {intelligence?.commitAnalytics?.recentCommits?.length > 0 ? intelligence.commitAnalytics.recentCommits.slice(0, 10).map((commit, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-muted/20 border border-border/50 rounded-2xl hover:border-primary/20 transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-mono text-[10px] font-bold text-primary border border-border/50 shrink-0 group-hover:scale-110 transition-transform">
                            {commit.sha.substring(0, 7)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{commit.message}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">@{commit.author} • {new Date(commit.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs font-bold text-muted-foreground text-center py-10 uppercase tracking-widest opacity-40">Scanning for commit records...</p>
                      )}
                    </div>
                  </div>

                  {/* PR Activity History */}
                  <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-3 mb-10">
                       <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><GitPullRequest size={18} /></div>
                       <h3 className="text-sm font-black uppercase tracking-[0.3em]">Pull Request History</h3>
                    </div>
                    <div className="space-y-6">
                      {intelligence?.prAnalytics?.recentPRActivity?.length > 0 ? intelligence.prAnalytics.recentPRActivity.slice(0, 10).map((pr, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 p-5 bg-muted/20 border border-border/50 rounded-2xl hover:border-primary/20 transition-all">
                          <div className="flex items-start gap-4 min-w-0">
                            <img src={pr.authorAvatar} alt={pr.author} className="w-10 h-10 rounded-xl border border-border/50 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">#{pr.number}: {pr.title}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">@{pr.author} • {pr.state}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${pr.state === 'MERGED' ? 'bg-emerald-500/10 text-emerald-500' : pr.state === 'OPEN' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                            {pr.state}
                          </span>
                        </div>
                      )) : (
                        <p className="text-xs font-bold text-muted-foreground text-center py-10 uppercase tracking-widest opacity-40">No PR activity detected.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* Top Contributors */}
                  <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Trophy size={16} /></div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em]">Top Contributors</h3>
                    </div>
                    <div className="space-y-4">
                       {intelligence?.commitAnalytics?.topContributors?.slice(0, 5).map((contributor, i) => (
                         <div key={i} className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                               <img src={contributor.avatarUrl} className="w-8 h-8 rounded-lg border border-border/50" alt={contributor.username} />
                               <span className="text-xs font-black tracking-tight">@{contributor.username}</span>
                            </div>
                            <span className="text-[10px] font-black text-primary">{contributor.commitCount}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* System Notice */}
                  <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence Notice</h4>
                     <p className="text-xs font-bold leading-relaxed text-foreground/70">Activity logs are aggregated from GitHub Webhooks. External PRs and commits are synced in real-time across the cluster.</p>
                  </div>
                </div>
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
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Bounty (XP)</label>
                  <input type="number" value={editBounty} onChange={(e)=>setEditBounty(Number(e.target.value))} className="w-full p-5 bg-muted/20 border border-border/50 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Bounty" />
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
