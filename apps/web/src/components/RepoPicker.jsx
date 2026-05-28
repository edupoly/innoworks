import { useState, useEffect } from "react";
import { Search, Globe, Lock, Code2, CheckCircle2 } from "lucide-react";
import api from "../lib/api";

const RepoPicker = ({ onSelect, selectedRepo }) => {
  const [repos, setRepos] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await api.get("/auth/repos");
        setRepos(response.data);
      } catch (error) {
        console.error("Failed to fetch repositories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Search repositories..."
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto border border-border rounded-2xl divide-y divide-border bg-card shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">
            Loading your repositories...
          </div>
        ) : filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => onSelect(repo)}
              className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedRepo?.id === repo.id ? "bg-primary/5 border-primary/20" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${repo.private ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10" : "bg-blue-100 text-blue-600 dark:bg-blue-500/10"}`}>
                  {repo.private ? <Lock size={18} /> : <Globe size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    {repo.full_name}
                    {selectedRepo?.id === repo.id && <CheckCircle2 size={14} className="text-primary" />}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      {repo.private ? "Private" : "Public"}
                    </span>
                    {repo.language && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Code2 size={10} />
                        {repo.language}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  selectedRepo?.id === repo.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                {selectedRepo?.id === repo.id ? "Selected" : "Select"}
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No repositories found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoPicker;
