import { useState, useEffect, useCallback, memo } from "react";
import { Search, Globe, Lock, Code2, CheckCircle2, Github, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import api from "../lib/api";

const RepoPicker = memo(({ onSelect, selectedRepo }) => {
  const [repos, setRepos] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRepos = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/auth/repos");
      setRepos(response.data);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
      setRepos([]);
      setError(error.response?.data?.message || "Could not load repositories from GitHub.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search repositories..."
            className="w-full pl-12 pr-4 py-4 bg-muted/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          type="button"
          onClick={fetchRepos}
          disabled={isLoading}
          className="p-4 bg-muted/20 border border-border/50 rounded-2xl hover:bg-muted/40 transition-all text-muted-foreground hover:text-primary"
          title="Refresh Repositories"
          aria-label="Refresh repositories"
        >
          <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="max-h-[440px] overflow-y-auto border border-border/50 rounded-[2rem] divide-y divide-border/30 bg-background shadow-sm custom-scrollbar">
        {isLoading ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Accessing GitHub Nodes...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center space-y-5">
            <div className="w-16 h-16 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto border border-destructive/20">
              <Github size={28} className="text-destructive" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase tracking-[0.2em]">Repository Sync Failed</h4>
              <p className="text-xs font-medium text-muted-foreground">{error}</p>
            </div>
            <button type="button" onClick={fetchRepos} className="text-[10px] font-black uppercase tracking-[0.25em] text-primary hover:underline">Retry Sync</button>
          </div>
        ) : filteredRepos.length > 0 ? (
          <div className="p-2 space-y-1">
            {filteredRepos.map((repo) => (
              <motion.div
                layout
                key={repo.id}
                onClick={() => onSelect(repo)}
                className={`p-5 flex items-center justify-between cursor-pointer rounded-2xl transition-all ${
                  selectedRepo?.id === repo.id 
                    ? "bg-primary/5 border border-primary/20 shadow-inner" 
                    : "hover:bg-muted/30 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-all ${
                    repo.private 
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/20" 
                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }`}>
                    {repo.private ? <Lock size={20} /> : <Globe size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm flex items-center gap-2 tracking-tight truncate">
                      {repo.full_name.split('/')[1]}
                      {selectedRepo?.id === repo.id && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary bg-primary/10 p-0.5 rounded-full">
                          <CheckCircle2 size={12} />
                        </motion.span>
                      )}
                    </h4>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        @{repo.full_name.split('/')[0]}
                      </span>
                      {repo.language && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                          <Code2 size={10} />
                          {repo.language}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                  selectedRepo?.id === repo.id
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-background border-border/50 text-muted-foreground group-hover:border-primary/50"
                }`}>
                  {selectedRepo?.id === repo.id ? "Targeted" : "Select"}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center space-y-6">
            <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto border border-border/50">
              <Github size={32} className="text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase tracking-[0.2em]">No Nodes Found</h4>
              <p className="text-xs font-medium text-muted-foreground">We couldn't locate any matching repositories.</p>
            </div>
            <button type="button" onClick={() => setSearch("")} className="text-[10px] font-black uppercase tracking-[0.25em] text-primary hover:underline">Reset Search Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoPicker;
