import { useState } from "react";
import { 
  Box, 
  FileCode2, 
  Youtube, 
  Plus, 
  Download, 
  ShieldCheck,
  Play,
  X,
  Send,
  Book,
  Github,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useGetDockerAssetsQuery, useUploadDockerAssetMutation } from "../../store/api/dockerApiSlice";
import { useGetProjectIntelligenceQuery } from "../../store/api/projectsApiSlice";
import { useSelector } from "react-redux";
import { DOCKER_ASSET_TYPES } from "../../lib/constants";

const ProjectAssets = ({ projectId }) => {
  const [activeSubTab, setActiveSubTab] = useState("docker"); // 'docker', 'youtube', 'docs'
  const { user } = useSelector((state) => state.auth);
  const [isUploadingModal, setIsUploadingModal] = useState(false);
  const [assetForm, setAssetForm] = useState({ filename: "", url: "", assetType: "Dockerfile" });
  
  const { data: dockerAssets, isLoading: loadingDocker } = useGetDockerAssetsQuery(projectId);
  const { data: intelligence } = useGetProjectIntelligenceQuery(projectId);
  const [uploadDocker, { isLoading: isUploading }] = useUploadDockerAssetMutation();

  const isTeamMember = user && (user.role === 'Admin' || user.role === 'Project Owner' || user.role === 'Team');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (assetForm.filename && assetForm.url && assetForm.assetType) {
       try {
         await uploadDocker({ projectId, ...assetForm }).unwrap();
         setIsUploadingModal(false);
         setAssetForm({ filename: "", url: "", assetType: "Dockerfile" });
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
          { id: "docs", label: "Documentation Archives", icon: Book },
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
            className="space-y-8 relative"
          >
            <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-xl font-black tracking-tight mb-2">Technical Assets</h3>
                 <p className="text-muted-foreground text-sm font-medium">Approved configuration protocols for environment replication.</p>
               </div>
               {isTeamMember && (
                 <button 
                  onClick={() => setIsUploadingModal(true)}
                  className="btn-primary px-6 py-3 flex items-center gap-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                 >
                   <Plus size={16} /> Upload Asset
                 </button>
               )}
            </div>

            <AnimatePresence>
              {isUploadingModal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleUpload} className="bg-card border border-primary/30 rounded-[2.5rem] p-10 space-y-8 shadow-xl shadow-primary/5">
                     <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black tracking-tight">Register New Asset</h4>
                        <button type="button" onClick={() => setIsUploadingModal(false)} className="p-2 hover:bg-muted rounded-xl transition-all"><X size={20} /></button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Filename</label>
                           <input 
                            required
                            value={assetForm.filename}
                            onChange={e => setAssetForm({...assetForm, filename: e.target.value})}
                            className="w-full px-6 py-4 bg-muted/20 border border-border/50 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="e.g., docker-compose.yml"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Asset URL</label>
                           <input 
                            required
                            value={assetForm.url}
                            onChange={e => setAssetForm({...assetForm, url: e.target.value})}
                            className="w-full px-6 py-4 bg-muted/20 border border-border/50 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="https://gist.github.com/..."
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Asset Type</label>
                           <select 
                            value={assetForm.assetType}
                            onChange={e => setAssetForm({...assetForm, assetType: e.target.value})}
                            className="w-full px-4 py-4 bg-muted/20 border border-border/50 rounded-2xl text-xs font-black uppercase tracking-widest text-primary focus:outline-none"
                           >
                              {DOCKER_ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="flex justify-end">
                        <button 
                          type="submit"
                          disabled={isUploading}
                          className="btn-primary px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3"
                        >
                          {isUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={18} /> Register Asset</>}
                        </button>
                     </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingDocker ? (
                 [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted/10 rounded-[2.5rem] animate-pulse"></div>)
              ) : dockerAssets?.length > 0 ? (
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

        {activeSubTab === "docs" && (
           <motion.div
            key="docs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
           >
              <div className="flex items-center justify-between border-b border-border/30 pb-6">
                 <div>
                   <h3 className="text-xl font-black tracking-tight mb-2">Documentation Archives</h3>
                   <p className="text-muted-foreground text-sm font-medium">Global technical knowledge base synchronized from GitHub.</p>
                 </div>
                 <a 
                   href={`${intelligence?.overview?.repositoryUrl}/wiki`} 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center gap-2.5 px-6 py-3 bg-secondary/80 border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all"
                 >
                   <Github size={16} /> Open GitHub Wiki
                 </a>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Synchronized Wiki Volumes</h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       {intelligence?.documentation?.length > 0 ? (
                         intelligence.documentation.map((file, idx) => (
                           <a 
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-6 bg-card border border-border/50 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                           >
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                    <Book size={18} />
                                 </div>
                                 <div>
                                    <p className="font-black text-sm uppercase tracking-tight">{file.name.replace('.md', '').replace(/-/g, ' ')}</p>
                                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{file.path} • GitHub Source</p>
                                 </div>
                              </div>
                              <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-all" />
                           </a>
                         ))
                       ) : (
                         <div className="p-10 border-2 border-dashed border-border rounded-2xl text-center">
                            <Book size={32} className="mx-auto text-muted-foreground/20 mb-4" />
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">No documentation volumes detected in /wiki or /docs.</p>
                         </div>
                       )}

                       {/* Local Wiki link placeholder for visual fidelity */}
                       <Link 
                        to={`/projects/${projectId}/wiki`}
                        className="p-6 bg-secondary/30 border border-border/50 border-dashed rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center border border-border/50">
                                <Plus size={18} />
                             </div>
                             <div>
                                <p className="font-black text-sm uppercase tracking-tight">Technical Wiki Hub</p>
                                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Innoworks Platform Documentation • Open Hub</p>
                             </div>
                          </div>
                          <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-all" />
                       </Link>
                    </div>
                 </div>

                 <div className="card-premium p-8 lg:p-10 space-y-8 bg-slate-950 border-white/5 relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                             <ShieldCheck size={14} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Source_Verified</span>
                       </div>
                       <ExternalLink size={14} className="text-white/20" />
                    </div>
                    
                    <div className="prose prose-invert prose-sm max-w-none font-mono text-slate-400">
                       <p className="text-slate-500 italic mb-6">{"// Analyzing GitHub Documentation State..."}</p>
                       <h2 className="text-white text-lg font-black tracking-tight mb-4 uppercase">Project Intelligence</h2>
                       <p className="leading-relaxed mb-6">High-fidelity synchronization grid detected. Documentation is automatically archived and indexed for engineering efficiency.</p>
                       
                       <h3 className="text-white/80 text-sm font-black mb-4 uppercase">Directives</h3>
                       <ul className="space-y-3 list-none p-0">
                          <li className="flex items-start gap-3">
                             <span className="text-primary mt-1">▹</span>
                             <span>Approved local wikis are replicated to GitHub /wiki folder.</span>
                          </li>
                          <li className="flex items-start gap-3">
                             <span className="text-primary mt-1">▹</span>
                             <span>GitHub Wiki updates are mirrored in Documentation Archives.</span>
                          </li>
                       </ul>
                    </div>

                    <div className="pt-8 flex justify-center">
                       <Link to={`/projects/${projectId}/wiki`} className="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-white transition-all flex items-center gap-2 group">
                          Enter Platform Documentation Hub
                          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                       </Link>
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
