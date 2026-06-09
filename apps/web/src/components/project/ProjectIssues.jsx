import { useState, useMemo } from "react";
import { 
  AlertCircle, 
  MessageSquare, 
  User, 
  Clock, 
  Plus, 
  X,
  Send,
  CheckCircle2,
  Kanban
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetIssuesQuery, useCreateIssueMutation } from "../../store/api/issuesApiSlice";

const ProjectIssues = ({ projectId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState("all"); 
  
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
           <h3 className="text-lg font-black tracking-tight uppercase tracking-widest">Active Issues</h3>
           <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border border-border/50">
              {['all', 'open', 'closed'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn-primary px-5 py-2.5 flex items-center gap-2 rounded-lg text-[9px] font-black uppercase tracking-widest"
        >
          <Plus size={14} /> Report Issue
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
            <form onSubmit={handleCreate} className="bg-card border border-primary/30 rounded-2xl p-6 space-y-6 shadow-lg shadow-primary/5">
               <div className="flex items-center justify-between">
                  <h4 className="text-base font-black tracking-tight uppercase tracking-widest">New Issue Entry</h4>
                  <button type="button" onClick={() => setIsCreating(false)} className="p-1.5 hover:bg-muted rounded-lg transition-all"><X size={18} /></button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1.5">Issue Title</label>
                       <input 
                        required
                        value={newIssue.title}
                        onChange={e => setNewIssue({...newIssue, title: e.target.value})}
                        className="w-full px-5 py-3 bg-muted/20 border border-border/50 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Summary of the issue..."
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1.5">Description</label>
                       <textarea 
                        required
                        rows={4}
                        value={newIssue.description}
                        onChange={e => setNewIssue({...newIssue, description: e.target.value})}
                        className="w-full px-5 py-3 bg-muted/20 border border-border/50 rounded-xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        placeholder="Detailed report..."
                       />
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1.5">Priority</label>
                           <select 
                            value={newIssue.priority}
                            onChange={e => setNewIssue({...newIssue, priority: e.target.value})}
                            className="w-full px-3 py-2.5 bg-muted/20 border border-border/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary focus:outline-none"
                           >
                              {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1.5">Severity</label>
                           <select 
                            value={newIssue.severity}
                            onChange={e => setNewIssue({...newIssue, severity: e.target.value})}
                            className="w-full px-3 py-2.5 bg-muted/20 border border-border/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary focus:outline-none"
                           >
                              {['Trivial', 'Minor', 'Major', 'Blocker'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1.5">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['Bug', 'Feature', 'Docs', 'Security'].map(t => (
                             <button
                              key={t}
                              type="button"
                              onClick={() => setNewIssue({...newIssue, template: t})}
                              className={`px-3 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${newIssue.template === t ? 'bg-primary text-white border-primary' : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-primary/30'}`}
                             >
                               {t}
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                        <p className="text-[9px] font-medium leading-relaxed opacity-70 italic">
                          Issues are reviewed by project owners. High priority items are addressed first.
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex justify-end pt-2">
                  <button 
                    disabled={isSubmitting}
                    className="btn-primary px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={16} /> Submit Issue</>}
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {isLoading ? (
           [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted/10 rounded-2xl animate-pulse"></div>)
        ) : filteredIssues?.length > 0 ? (
          filteredIssues.map(issue => (
            <div key={issue._id} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-all group shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
               <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${issue.status === 'Closed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                     {issue.status === 'Closed' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                     <h4 className="text-base font-black tracking-tight mb-1 group-hover:text-primary transition-colors">{issue.title}</h4>
                     <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><User size={10} /> {issue.author?.username}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="flex items-center gap-1.5"><Clock size={10} /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className={`px-1.5 py-0.5 rounded-md border font-black ${getPriorityColor(issue.priority)}`}>{issue.priority}</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-5 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border/30">
                  <div className="flex -space-x-2">
                     {issue.assignees?.map(a => (
                       <img key={a._id} src={a.avatarUrl} title={a.username} className="w-7 h-7 rounded-lg border-2 border-background object-cover" />
                     ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                     <MessageSquare size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">{issue.reactions?.length || 0}</span>
                  </div>
                  <button className="px-4 py-2 bg-muted/50 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                     View
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
             <Kanban size={36} className="mx-auto text-muted-foreground/20 mb-4" />
             <p className="text-muted-foreground text-xs font-medium">No active issues detected.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectIssues;
