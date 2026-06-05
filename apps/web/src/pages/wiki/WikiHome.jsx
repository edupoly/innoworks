import { useParams, Link } from "react-router-dom";
import { 
  Book, 
  Plus, 
  ChevronRight, 
  Clock, 
  User, 
  FileText, 
  Search,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { useGetWikiPagesQuery } from "../../store/api/wikiApiSlice";
import { useGetProjectQuery } from "../../store/api/projectsApiSlice";
import { useSelector } from "react-redux";

const WikiHome = () => {
  const { projectId } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  const { data: project, isLoading: loadingProject } = useGetProjectQuery(projectId);
  const { data: pages, isLoading: loadingPages } = useGetWikiPagesQuery(projectId);

  const isTeamMember = user && (user.role === 'Admin' || user.role === 'Project Owner' || user.role === 'Team');

  if (loadingProject || loadingPages) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Accessing Project Archives...</p>
    </div>
  );

  return (
    <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 selection:bg-primary/30">
      <div className="mb-12">
        <Link 
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group mb-8"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Briefing
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 text-primary">
              <Book size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Documentation_Archives</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{project?.title} Wiki</h1>
          </div>
          {isTeamMember && (
            <Link 
              to={`/projects/${projectId}/wiki/new`}
              className="btn-primary px-8 py-4 flex items-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              <Plus size={18} /> New Document
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar / Categories (Simplified for now) */}
        <div className="lg:col-span-1 space-y-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search archives..."
              className="w-full pl-12 pr-4 py-3.5 bg-muted/20 border border-border/50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <nav className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 px-4">Navigation</h3>
            <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 text-primary border border-primary/10 font-black text-xs uppercase tracking-widest">
              <FileText size={16} /> All Pages
            </Link>
            <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground font-black text-xs uppercase tracking-widest transition-all">
              <Clock size={16} /> Recent Activity
            </Link>
          </nav>
        </div>

        {/* Page List */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pages?.length > 0 ? (
              pages.map((page) => (
                <motion.div
                  key={page._id}
                  whileHover={{ y: -5 }}
                  className="bg-card border border-border/50 rounded-[2.5rem] p-8 hover:border-primary/30 transition-all group shadow-sm hover:shadow-xl hover:shadow-primary/5"
                >
                  <Link to={`/projects/${projectId}/wiki/${page.slug}`} className="block h-full flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black mb-4 tracking-tight group-hover:text-primary transition-colors">{page.title}</h3>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-8">
                        <span className="flex items-center gap-1.5"><User size={12} /> {page.author?.username}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(page.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-border/30">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary group-hover:underline">Read Entry</span>
                       <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5">
                <Book size={48} className="mx-auto text-muted-foreground/20 mb-6" />
                <h3 className="text-xl font-black mb-2 tracking-tight">Archives Empty</h3>
                <p className="text-muted-foreground text-sm font-medium max-w-xs mx-auto leading-relaxed">
                  No documentation has been published for this project yet.
                </p>
                {isTeamMember && (
                  <Link to={`/projects/${projectId}/wiki/new`} className="btn-primary mt-8 px-8 py-3 rounded-xl inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <Plus size={16} /> Create First Page
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikiHome;
