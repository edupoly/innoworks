import { useState, useEffect } from "react";
import { GitBranch, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../lib/api";

const BranchPicker = ({ owner, repo, onSelect, selectedBranch }) => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!owner || !repo) return;

    const fetchBranches = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get(`/auth/repos/${owner}/${repo}/branches`);
        const fetchedBranches = response.data;
        setBranches(fetchedBranches);
        
        // If current selected branch is not in the list, or no branch selected, pick a default
        const isCurrentBranchValid = fetchedBranches.some(b => b.name === selectedBranch);
        
        if (!isCurrentBranchValid && fetchedBranches.length > 0) {
          const defaultBranch = fetchedBranches.find(b => b.name === 'main' || b.name === 'master') || fetchedBranches[0];
          onSelect(defaultBranch.name);
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        setError("Could not load branches for this repository.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [owner, repo]);

  if (!owner || !repo) {
    return (
      <div className="p-4 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
        Select a repository first to see available branches.
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2 text-xs font-medium">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {isLoading ? (
          <div className="col-span-full py-4 text-center text-muted-foreground animate-pulse text-xs">
            Fetching branches...
          </div>
        ) : branches.length > 0 ? (
          branches.map((branch) => (
            <div
              key={branch.name}
              onClick={() => onSelect(branch.name)}
              className={`p-3 flex items-center justify-between cursor-pointer rounded-xl border transition-all ${
                selectedBranch === branch.name 
                  ? "bg-primary/5 border-primary shadow-sm" 
                  : "bg-background border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <GitBranch size={16} className={selectedBranch === branch.name ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-xs font-bold truncate ${selectedBranch === branch.name ? "text-foreground" : "text-muted-foreground"}`}>
                  {branch.name}
                </span>
              </div>
              {selectedBranch === branch.name && <CheckCircle2 size={14} className="text-primary flex-shrink-0" />}
            </div>
          ))
        ) : (
          <div className="col-span-full py-4 text-center text-muted-foreground text-xs">
            No branches found.
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchPicker;