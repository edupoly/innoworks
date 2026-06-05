import { useState } from "react";
import { 
  Box, 
  Terminal, 
  FileCode2, 
  Youtube, 
  Plus, 
  Download, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetDockerAssetsQuery, useUploadDockerAssetMutation } from "../../store/api/dockerApiSlice";
import { useSelector } from "react-redux";

const ProjectAssets = ({ projectId, project }) => {
  const [activeSubTab, setActiveSubTab] = useState("docker"); // 'docker', 'youtube'
  const { user } = useSelector((state) => state.auth);
  
  const { data: dockerAssets, isLoading: loadingDocker } = useGetDockerAssetsQuery(projectId);
  const [uploadDocker, { isLoading: isUploading }] = useUploadDockerAssetMutation();

  const isTeamMember = user && (user.role === 'Admin' || user.role === 'Project Owner' || user.role === 'Team');

  const handleUpload = async () => {
    const filename = prompt("Enter asset filename (e.g., docker-compose.yml):");
    const url = prompt("Enter asset URL (e.g., Gist or S3 link):");
    const assetType = prompt("Enter asset type (Dockerfile, docker-compose, k8s, script):");

    if (filename && url && assetType) {
       try {
         await uploadDocker({ projectId, filename, url, assetType }).unwrap();
         alert("Asset uploaded and pending review.");
       } catch (err) {
         console.error(err);
       }
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex gap-4 p-1.5 bg-muted/30 rounded-2xl border border-border/50 w-fit">
        {[
          { id: "docker", label: "Environment & Docker", icon: Box },
          { id: "youtube", label: "Visual Intelligence", icon: Youtube },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              activeSubTab === tab.id 
                ? "bg-background text-primary shadow-sm border border-border/50" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === "docker" && (
          <motion.div
            key="docker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-xl font-black tracking-tight mb-2">Technical Assets</h3>
                 <p className="text-muted-foreground text-sm font-medium">Approved configuration protocols for environment replication.</p>
               </div>
               {isTeamMember && (
                 <button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="btn-primary px-6 py-3 flex items-center gap-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                 >
                   <Plus size={16} /> Upload Asset
                 </button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dockerAssets?.length > 0 ? (
                dockerAssets.map((asset, i) => (
                  <div key={i} className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                          <FileCode2 size={24} />
                       </div>
                       <div>
                          <p className="font-black text-sm tracking-tight">{asset.filename}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{asset.assetType}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-border/30">
                       <div className="flex items-center gap-2 text-emerald-500">
                          <ShieldCheck size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                       </div>
                       <a 
                        href={asset.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary transition-all border border-transparent hover:border-primary/20"
                       >
                          <Download size={18} />
                       </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5">
                  <Box size={40} className="mx-auto text-muted-foreground/20 mb-6" />
                  <p className="text-muted-foreground text-sm font-medium">No technical assets have been verified yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSubTab === "youtube" && (
           <motion.div
            key="youtube"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
           >
              <div className="bg-muted/20 border border-border/50 rounded-[2.5rem] p-12 text-center">
                 <Youtube size={48} className="mx-auto text-primary/20 mb-6" />
                 <h3 className="text-xl font-black tracking-tight mb-2">Intelligence Library</h3>
                 <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto">Visual walkthroughs and technical deep-dives provided by the engineering team.</p>
              </div>
              
              {/* YouTube list from project or wikis would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Placeholder for visual fidelity */}
                 <div className="aspect-video rounded-[2rem] overflow-hidden bg-muted border border-border/50 flex items-center justify-center group relative cursor-pointer">
                    <Play size={48} className="text-muted-foreground/30 group-hover:text-primary transition-colors z-10" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Coming Soon</p>
                       <p className="text-sm font-black text-white">Project Architecture Overview</p>
                    </div>
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectAssets;
