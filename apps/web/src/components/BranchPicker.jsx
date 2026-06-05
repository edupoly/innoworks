import { useEffect, memo } from "react";
import { GitBranch, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useGetRepoBranchesQuery } from "../store/api/authApiSlice";

const BranchPicker = memo(({ owner, repo, onSelect, selectedBranch }) => {
  const skip = !owner || !repo;
  const { data: branches = [], isLoading, isFetching, error, refetch } = useGetRepoBranchesQuery(
    { owner, repo },
    { skip }
  );

  useEffect(() => {
    if (!skip && branches.length > 0) {
      const isCurrentBranchValid = branches.some(b => b.name === selectedBranch);
      if (!isCurrentBranchValid) {
        const defaultBranch = branches.find(b => b.name === 'main' || b.name === 'master') || branches[0];
        onSelect(defaultBranch.name);
      }
    }
  }, [branches, selectedBranch, onSelect, skip]);


  if (!owner || !repo) {
    return (
      <div className="p-8 border border-dashed border-border/50 rounded-2xl text-center bg-muted/5">
        <GitBranch size={24} className="mx-auto text-muted-foreground opacity-20 mb-3" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Awaiting Target Selection</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-4 bg-destructive/5 border border-destructive/20 text-destructive rounded-2xl flex items-center gap-3 text-xs font-bold">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isLoading ? (
          <div className="col-span-full py-10 text-center space-y-3">
            <RefreshCcw size={20} className="mx-auto text-primary animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Scanning Branches...</p>
          </div>
        ) : branches.length > 0 ? (
          branches.map((branch) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={branch.name}
              onClick={() => onSelect(branch.name)}
              className={`p-4 flex items-center justify-between cursor-pointer rounded-2xl border transition-all ${
                selectedBranch === branch.name 
                  ? "bg-primary/10 border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20" 
                  : "bg-background border-border/50 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <GitBranch size={14} className={selectedBranch === branch.name ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-[11px] font-black truncate uppercase tracking-widest ${selectedBranch === branch.name ? "text-foreground" : "text-muted-foreground"}`}>
                  {branch.name}
                </span>
              </div>
              {selectedBranch === branch.name && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 size={12} className="text-primary" />
                </motion.div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-10 text-center bg-muted/10 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Empty Branch Stack</p>
          </div>
        )}
      </div>
    </div>
  );
});

BranchPicker.displayName = "BranchPicker";

export default BranchPicker;
