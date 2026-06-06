import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Send,
  HelpCircle,
  Code,
  AlertTriangle
} from "lucide-react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { 
  useGetWikiPageQuery, 
  useCreateWikiPageMutation, 
  useUpdateWikiPageMutation,
  useSubmitWikiForApprovalMutation
} from "../../store/api/wikiApiSlice";

const EditWiki = () => {
  const { projectId, slug } = useParams();
  const navigate = useNavigate();
  const isNew = !slug;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  const { data: page, isLoading: loadingPage } = useGetWikiPageQuery(
    { projectId, slug }, 
    { skip: isNew }
  );

  const [createPage, { isLoading: isCreating }] = useCreateWikiPageMutation();
  const [updatePage, { isLoading: isUpdating }] = useUpdateWikiPageMutation();
  const [submitApproval, { isLoading: isSubmitting }] = useSubmitWikiForApprovalMutation();

  useEffect(() => {
    if (page && !isNew) {
      setTitle(page.title);
      setContent(page.content);
    }
  }, [page, isNew]);

  const mdeOptions = useMemo(() => ({
    autofocus: true,
    spellChecker: false,
    placeholder: "Begin your technical transmission...",
    status: false,
    minHeight: "400px",
    renderingConfig: {
      singleLineBreaks: false,
      codeSyntaxHighlighting: true,
    },
  }), []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        const newPage = await createPage({ projectId, title, content }).unwrap();
        navigate(`/projects/${projectId}/wiki/${newPage.slug}/edit`);
      } else {
        await updatePage({ projectId, pageId: page._id, content, changeSummary }).unwrap();
      }
      alert("Draft saved successfully.");
    } catch (err) {
      console.error("Failed to save:", err);
      alert(err.data?.message || "Failed to save document.");
    }
  };

  const handleSubmitApproval = async () => {
    if (!changeSummary && !isNew) {
      alert("Please provide a summary of your changes.");
      return;
    }
    try {
      await submitApproval({ projectId, pageId: page._id, changeSummary }).unwrap();
      alert("Sent for approval. A Project Owner will review your transmission.");
      navigate(`/projects/${projectId}/wiki/${page.slug}`);
    } catch (err) {
      console.error("Failed to submit:", err);
      alert(err.data?.message || "Failed to submit for approval.");
    }
  };

  if (loadingPage) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Loading Editor Interface...</p>
    </div>
  );

  return (
    <div className="py-20 max-w-6xl mx-auto px-4 sm:px-6 selection:bg-primary/30">
      <header className="mb-12">
        <Link 
          to={isNew ? `/projects/${projectId}/wiki` : `/projects/${projectId}/wiki/${slug}`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group mb-8"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Cancel Transmission
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <h1 className="text-4xl font-black tracking-tight">
            {isNew ? "Create New Archive Entry" : `Editing: ${page?.title}`}
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={isCreating || isUpdating}
              className="btn-secondary px-6 py-3 flex items-center gap-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              <Save size={16} /> Save Draft
            </button>
            {!isNew && (
              <button 
                onClick={handleSubmitApproval}
                disabled={isSubmitting}
                className="btn-primary px-8 py-3 flex items-center gap-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                <Send size={16} /> Request Approval
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm">
            <div className="space-y-6">
              {isNew && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Document Title</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Environment Setup Protocol"
                    className="w-full px-6 py-4 bg-muted/20 border border-border/50 rounded-2xl text-lg font-black tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between ml-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Technical Content (Markdown)</label>
                  <button className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1">
                    <HelpCircle size={12} /> Markdown Help
                  </button>
                </div>
                <div className="prose-editor">
                  <SimpleMDE 
                    value={content} 
                    onChange={setContent} 
                    options={mdeOptions} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-6">Revision_Control</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Change Summary</label>
                <textarea 
                  rows={4}
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Describe what was updated in this revision..."
                  className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex gap-4">
                <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
                <p className="text-[11px] font-medium text-yellow-800 leading-relaxed">
                  Submitting for approval will notify the Project Owners. Ensure all code blocks and links are verified.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/20 border border-dashed border-border/50 rounded-[2rem] p-8 text-center">
             <div className="w-12 h-12 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                <Code size={20} className="text-muted-foreground" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Version Tracked</p>
             <p className="text-[9px] font-bold text-muted-foreground opacity-50 mt-1 uppercase">Transmission v{page?.currentVersion || 0}.{isNew ? '0' : '1'} (Draft)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditWiki;
