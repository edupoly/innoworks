import { useState } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useGetModerationListQuery,
  useVerifyItemMutation
} from "../../store/api/adminApiSlice";
import VerifiedBadge from "../../components/ui/VerifiedBadge";

const ModerationDashboard = () => {
  const [type, setType] = useState("projects"); // projects, issues, submissions, wiki
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [verifiedFilter, setVerifiedFilter] = useState(undefined);

  const { data, isLoading } = useGetModerationListQuery({ 
    type, 
    page, 
    search, 
    verified: verifiedFilter 
  });

  const [verifyItem, { isLoading: isVerifying }] = useVerifyItemMutation();

  const handleVerify = async (id, verify) => {
    const reason = window.prompt(`Enter verification reason for ${verify ? 'verifying' : 'unverifying'}:`, 
      verify ? "Verified by Platform Administrator" : "Unverified due to policy violation");
    
    if (reason !== null) {
      try {
        await verifyItem({ type, id, verify, reason }).unwrap();
      } catch (err) {
        alert(err.data?.message || "Action failed");
      }
    }
  };

  const tabs = [
    { id: "projects", label: "Projects" },
    { id: "issues", label: "Issues" },
    { id: "submissions", label: "Pull Requests" },
    { id: "wiki", label: "Documentation" },
  ];

  return (
    <div className="space-y-8">
      {/* Type Selector */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-2xl border border-border/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setType(tab.id); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              type === tab.id 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder={`Search ${type}...`}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <select 
            value={verifiedFilter === undefined ? "" : verifiedFilter.toString()}
            onChange={(e) => setVerifiedFilter(e.target.value === "" ? undefined : e.target.value === "true")}
            className="bg-card border border-border/50 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none"
           >
             <option value="">All Content</option>
             <option value="true">Verified Only</option>
             <option value="false">Unverified Only</option>
           </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title / Entity</th>
                {type !== 'projects' && (
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Project Context</th>
                )}
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Author / Contributor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 bg-muted/5"></td>
                  </tr>
                ))
              ) : (
                data?.items?.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate max-w-[200px]">{item.title || item.branchName || 'Untitled'}</span>
                        {item.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{item._id}</p>
                    </td>
                    {type !== 'projects' && (
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{item.project?.title || 'System'}</span>
                      </td>
                    )}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <img src={(item.author || item.owner || item.user)?.avatarUrl} alt="" className="w-6 h-6 rounded-full border" />
                        <span className="text-xs font-medium">{(item.author || item.owner || item.user)?.username || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        item.isVerified 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                          : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                      }`}>
                        {item.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerify(item._id, !item.isVerified)}
                          disabled={isVerifying}
                          className={`p-2 rounded-lg transition-all ${
                            item.isVerified 
                              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                              : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                          }`}
                          title={item.isVerified ? "Unverify" : "Verify"}
                        >
                          {item.isVerified ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <a 
                          href={item.repoUrl || item.prUrl || '#'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border/50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">
            Page {data?.currentPage} of {data?.totalPages}
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-border/50 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={page >= data?.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-border/50 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;
