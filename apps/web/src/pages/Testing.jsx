import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import api from "../lib/api";
import { 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Github, 
  Layers, 
  ChevronRight, 
  ArrowLeft,
  XCircle,
  FileCode2,
  Clock,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Testing = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useSelector((state) => state.auth);
  const [selectedSub, setSelectedSub] = useState(null);
  
  // Review form states
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState("APPROVED");
  const [checklist, setChecklist] = useState([
    { item: "Code compiles successfully and has no build errors", checked: false },
    { item: "Features correctly solve the challenge requirements", checked: false },
    { item: "Tests added or modified correctly cover features", checked: false },
    { item: "Code style matches guidelines (no hardcoded secrets)", checked: false },
    { item: "Documentation or README has been updated accordingly", checked: false },
  ]);

  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all open peer submissions requiring reviews
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ["openTestingSubmissions"],
    queryFn: async () => {
      const response = await api.get("/submissions/testing/open");
      return response.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ submissionId, reviewData }) => {
      const response = await api.post(`/submissions/${submissionId}/reviews`, reviewData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["openTestingSubmissions"]);
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewSuccess(false);
        setSelectedSub(null);
        setFeedback("");
        setOutcome("APPROVED");
        setChecklist(checklist.map(c => ({ ...c, checked: false })));
      }, 3000);
    },
    onError: (err) => {
      setReviewError(err.response?.data?.message || "Failed to submit review");
    }
  });

  const toggleChecklist = (index) => {
    setChecklist(prev => prev.map((item, idx) => 
      idx === index ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setReviewError("Please provide constructive review comments.");
      return;
    }
    
    setIsSubmitting(true);
    setReviewError("");

    reviewMutation.mutate({
      submissionId: selectedSub._id,
      reviewData: {
        feedback,
        outcome,
        checklist
      }
    });
    setIsSubmitting(false);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold">Discovering peer solutions requiring validation...</p>
    </div>
  );

  if (error) return (
    <div className="py-20 text-center">
      <ShieldAlert size={48} className="mx-auto text-destructive mb-4 animate-bounce" />
      <h2 className="text-2xl font-bold mb-2">Error loading peer solutions</h2>
      <p className="text-muted-foreground">Please try reloading the page.</p>
    </div>
  );

  return (
    <div className="py-12 max-w-7xl mx-auto px-4">
      <AnimatePresence mode="wait">
        {!selectedSub ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-10"
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Peer Testing Arena</h1>
              <p className="text-muted-foreground text-lg">Review and test code written by fellow students. Uncover bugs, confirm compliance, and earn +30 XP tester rewards.</p>
            </div>

            {submissions?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {submissions.map((sub) => (
                  <div key={sub._id} className="bg-card border border-border/50 rounded-3xl p-6 flex flex-col justify-between hover:border-primary/30 transition-all group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                            <img src={sub.user?.avatarUrl} alt={sub.user?.username} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-bold text-slate-300">@{sub.user?.username}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded border border-orange-500/20">
                          {sub.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg leading-relaxed group-hover:text-primary transition-colors">{sub.project?.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {sub.project?.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] font-semibold text-muted-foreground bg-muted/30 p-3 rounded-xl">
                        <span className="flex items-center gap-1"><Layers size={13} /> {sub.branchName}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-border" />
                        <span className="flex items-center gap-1"><Clock size={13} /> {new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                      <span className="text-xs font-bold text-primary font-black uppercase tracking-wider bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">+30 XP Review</span>
                      <button 
                        onClick={() => setSelectedSub(sub)}
                        className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1"
                      >
                        Start Review <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-card rounded-3xl border border-dashed border-border/50 max-w-xl mx-auto">
                <CheckCircle2 size={48} className="mx-auto text-primary opacity-30 mb-4" />
                <h3 className="text-lg font-bold mb-1">Testing Arena is Clear!</h3>
                <p className="text-sm text-muted-foreground">All recent student contributions have been validated. Check back shortly for new pull requests!</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setSelectedSub(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Testing Arena
            </button>

            {reviewSuccess ? (
              <div className="bg-card border border-emerald-500/20 p-12 text-center rounded-3xl max-w-xl mx-auto shadow-2xl shadow-emerald-500/5 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Sparkles size={28} />
                </div>
                <h2 className="text-2xl font-black text-emerald-500">Review Submitted!</h2>
                <p className="text-sm text-muted-foreground font-semibold">Peer checking complete. Awarded +30 XP points to your profile!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Submission Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-card border border-border/50 rounded-3xl p-8 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-6">
                      <div>
                        <h2 className="text-2xl font-black">{selectedSub.project?.title}</h2>
                        <p className="text-xs text-muted-foreground mt-1">Submitted by <span className="font-bold">@{selectedSub.user?.username}</span> on {new Date(selectedSub.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <a 
                          href={selectedSub.forkUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold hover:text-primary hover:border-primary/40 rounded-xl transition-all flex items-center gap-2"
                        >
                          <Github size={14} /> Explore Source Code
                        </a>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Solution Details</h4>
                      <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex flex-wrap gap-6 text-xs font-bold">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-[10px] uppercase">Fork Repository</p>
                          <p className="truncate max-w-[250px]">{selectedSub.forkUrl.replace("https://github.com/", "")}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-[10px] uppercase">Working Branch</p>
                          <p className="text-primary flex items-center gap-1"><Layers size={12} /> {selectedSub.branchName}</p>
                        </div>
                        {selectedSub.prNumber && (
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-[10px] uppercase">Pull Request</p>
                            <a href={selectedSub.prUrl} target="_blank" rel="noreferrer" className="hover:underline text-indigo-500">PR #{selectedSub.prNumber}</a>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedSub.testOutput && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Automated Testing Logs</h4>
                        <pre className="p-5 bg-slate-950 border border-slate-850 rounded-2xl font-mono text-[10px] leading-relaxed text-emerald-400 overflow-x-auto max-h-[200px]">
                          {selectedSub.testOutput}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Tester Checklist & Review Outcomes */}
                <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-xl h-fit">
                  <div className="flex items-center gap-2 mb-6">
                    <ClipboardList className="text-primary" size={20} />
                    <h3 className="font-bold text-lg">Tester Review Report</h3>
                  </div>

                  {reviewError && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2">
                      <XCircle size={14} />
                      {reviewError}
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit} className="space-y-6">
                    {/* Checklist */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Review Checklist</p>
                      {checklist.map((item, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => toggleChecklist(idx)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-left text-xs font-semibold leading-relaxed"
                        >
                          <input 
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => {}} // Controlled by button onClick
                            className="mt-0.5 border-border rounded focus:ring-0 text-primary"
                          />
                          <span className={item.checked ? "text-slate-300 line-through opacity-60" : "text-slate-200"}>{item.item}</span>
                        </button>
                      ))}
                    </div>

                    {/* Feedback comment */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reviewer Feedback</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Provide constructive checking notes. Explain any issues or improvements required..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full text-xs p-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 resize-none font-semibold leading-relaxed"
                      />
                    </div>

                    {/* Outcome picker */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Review Outcome</label>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-black tracking-wider uppercase">
                        {[
                          { value: "APPROVED", label: "Approve", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500", selectedColor: "bg-emerald-500 text-white" },
                          { value: "NEEDS_CHANGES", label: "Request Changes", color: "border-orange-500/20 bg-orange-500/5 text-orange-500", selectedColor: "bg-orange-500 text-white" },
                          { value: "REJECTED", label: "Reject", color: "border-red-500/20 bg-red-500/5 text-red-500", selectedColor: "bg-red-500 text-white" }
                        ].map((btn) => {
                          const isSel = outcome === btn.value;
                          return (
                            <button
                              type="button"
                              key={btn.value}
                              onClick={() => setOutcome(btn.value)}
                              className={`py-3 rounded-xl border text-center transition-all ${
                                isSel ? btn.selectedColor : btn.color
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full btn-primary py-4 font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle2 size={14} /> Submit Review Report
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Testing;
