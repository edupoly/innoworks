import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit3, 
  Clock, 
  User, 
  Share2,
  MoreVertical,
  History,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useGetWikiPageQuery } from "../../store/api/wikiApiSlice";
import { useSelector } from "react-redux";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const WikiPage = () => {
  const { projectId, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const { data: page, isLoading, error } = useGetWikiPageQuery({ projectId, slug });

  const isTeamMember = user && (user.role === 'Admin' || user.role === 'Project Owner' || user.role === 'Team');

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Retrieving Document...</p>
    </div>
  );

  if (error || !page) return (
    <div className="py-32 text-center">
      <AlertCircle size={48} className="mx-auto text-destructive mb-6 opacity-20" />
      <h2 className="text-2xl font-black mb-4">Document Not Found</h2>
      <p className="text-muted-foreground mb-8">The requested transmission could not be located in the archives.</p>
      <Link to={`/projects/${projectId}/wiki`} className="btn-primary px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest">
        Return to Archives
      </Link>
    </div>
  );

  return (
    <div className="py-20 max-w-5xl mx-auto px-4 sm:px-6 selection:bg-primary/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <Link 
          to={`/projects/${projectId}/wiki`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Archives Index
        </Link>
        
        <div className="flex items-center gap-3">
          <button className="p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary transition-all">
            <Share2 size={18} />
          </button>
          <button className="p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary transition-all">
            <History size={18} />
          </button>
          {isTeamMember && (
            <Link 
              to={`/projects/${projectId}/wiki/${slug}/edit`}
              className="btn-primary px-6 py-3 flex items-center gap-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              <Edit3 size={16} /> Edit Entry
            </Link>
          )}
        </div>
      </div>

      <article className="bg-card border border-border/50 rounded-[3rem] p-10 md:p-16 shadow-sm relative overflow-hidden">
        <header className="mb-12 border-b border-border/30 pb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 leading-tight">{page.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden border border-border/50">
                <img src={page.author?.avatarUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <span>{page.author?.username}</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/20"></span>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary" />
              <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/20"></span>
            <div className="px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-lg">
              v{page.currentVersion}.0
            </div>
          </div>
        </header>

        <div className="prose prose-invert prose-primary max-w-none 
          prose-headings:font-black prose-headings:tracking-tight
          prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
          prose-p:text-lg prose-p:leading-relaxed prose-p:text-foreground/80
          prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-2xl
          prose-img:rounded-3xl prose-img:border prose-img:border-border/50
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {page.content}
          </ReactMarkdown>
        </div>

        {page.youtubeVideos?.length > 0 && (
          <div className="mt-20 pt-20 border-t border-border/30">
            <h3 className="text-xl font-black mb-8 tracking-tight">Supplementary Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {page.youtubeVideos.map((video, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-video rounded-2xl overflow-hidden border border-border/50 bg-muted">
                    <iframe
                      width="100%"
                      height="100%"
                      src={video.url.replace('watch?v=', 'embed/')}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-sm font-bold text-foreground/80">{video.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default WikiPage;
