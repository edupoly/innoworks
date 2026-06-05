import { useState, useMemo } from "react";
import { 
  AlertCircle, 
  MessageSquare, 
  Tag, 
  User, 
  Clock, 
  Plus, 
  X,
  Send,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Kanban
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetIssuesQuery, useCreateIssueMutation, useUpdateIssueMutation } from "../../store/api/issuesApiSlice";
import { useSelector } from "react-redux";

const ProjectIssues = ({ projectId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'open', 'closed'
  const { user } = useSelector((state) => state.auth);
  
  const { data: issues, isLoading } = useGetIssuesQuery(projectId);
  const [createIssue, { isLoading: isSubmitting }] = useCreateIssueMutation();

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    if (filter === 'all') return issues;
    if (filter === 'open') return issues.filter(i => i.status === 'Open' || i.status === 'In Progress');
    if (filter === 'closed') return issues.filter(i => i.status === 'Resolved' || i.status === 'Closed');
    return issues;
  }, [issues, filter]);

  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "Medium",
    severity: "Minor",
    template: "General"
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createIssue({ projectId, ...newIssue }).unwrap();
      setIsCreating(false);
      setNewIssue({ title: "", description: "", priority: "Medium", severity: "Minor", template: "General" });
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <h3 className="text-xl font-black tracking-tight">Active Transmissions</h3>
           <div className="flex gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/50">
              {['all', 'open', 'closed'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn-primary px-6 py-3 flex items-center gap-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          <Plus size={16} /> Signal Issue
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="bg-card border border-primary/30 rounded-[2.5rem] p-10 space-y-8 shadow-xl shadow-primary/5">
               <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black tracking-tight">New Signal Entry</h4>
                  <button type="button" onClick={() => setIsCreating(false)} className="p-2 hover:bg-muted rounded-xl transition-all"><X size={20} /></button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Transmission Title</label>
                       <input 
                        required
                        value={newIssue.title}
                        onChange={e => setNewIssue({...newIssue, title: e.target.value})}
                        className="w-full px-6 py-4 bg-muted/20 border border-border/50 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Brief summary of the anomaly..."
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Contextual Description</label>
                       <textarea 
                        required
                        rows={5}
                        value={newIssue.description}
                        onChange={e => setNewIssue({...newIssue, description: e.target.value})}
                        className="w-full px-6 py-4 bg-muted/20 border border-border/50 rounded-2xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        placeholder="Detailed intelligence report..."
                       />
                    </div>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Priority</label>
                           <select 
                            value={newIssue.priority}
                            onChange={e => setNewIssue({...newIssue, priority: e.target.value})}
                            className="w-full px-4 py-3.5 bg-muted/20 border border-border/50 rounded-xl text-xs font-black uppercase tracking-widest text-primary focus:outline-none"
                           >
                              {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Severity</label>
                           <select 
                            value={newIssue.severity}
                            onChange={e => setNewIssue({...newIssue, severity: e.target.value})}
                            className="w-full px-4 py-3.5 bg-muted/20 border border-border/50 rounded-xl text-xs font-black uppercase tracking-widest text-primary focus:outline-none"
                           >
                              {['Trivial', 'Minor', 'Major', 'Blocker'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Mission Template</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['Bug', 'Feature', 'Docs', 'Security'].map(t => (
                             <button
                              key={t}
                              type="button"
                              onClick={() => setNewIssue({...newIssue, template: t})}
                              className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${newIssue.template === t ? 'bg-primary text-white border-primary' : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-primary/30'}`}
                             >
                               {t}
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                        <p className="text-[10px] font-medium leading-relaxed opacity-70 italic">
                          Signals are reviewed by the Team and Project Owners. High priority anomalies are addressed first.
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex justify-end pt-4">
                  <button 
                    disabled={isSubmitting}
                    className="btn-primary px-12 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3"
                  >
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={18} /> Broadcast Signal</>}
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {isLoading ? (
           [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted/10 rounded-[2.5rem] animate-pulse"></div>)
        ) : filteredIssues?.length > 0 ? (
          filteredIssues.map(issue => (
            <div key={issue._id} className="bg-card border border-border/50 rounded-[2.5rem] p-8 hover:border-primary/30 transition-all group shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-start gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${issue.status === 'Closed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                     {issue.status === 'Closed' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                     <h4 className="text-lg font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{issue.title}</h4>
                     <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><User size={12} /> {issue.author?.username}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className={`px-2 py-0.5 rounded-md border font-black ${getPriorityColor(issue.priority)}`}>{issue.priority}</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-6 md:pt-0 border-border/30">
                  <div className="flex -space-x-3">
                     {issue.assignees?.map(a => (
                       <img key={a._id} src={a.avatarUrl} title={a.username} className="w-8 h-8 rounded-lg border-2 border-background object-cover" />
                     ))}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                     <MessageSquare size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">{issue.reactions?.length || 0}</span>
                  </div>
                  <button className="px-5 py-2.5 bg-muted/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                     View Thread
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5">
             <Kanban size={48} className="mx-auto text-muted-foreground/20 mb-6" />
             <p className="text-muted-foreground text-sm font-medium">No signals have been broadcast for this project.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectIssues;
