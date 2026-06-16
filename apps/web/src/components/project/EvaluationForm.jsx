import { useState } from 'react';
import { Star, Send, MessageSquare, ShieldCheck } from 'lucide-react';
import { useSubmitEvaluationMutation } from '../../store/api/evaluationsApiSlice';

const EvaluationForm = ({ contributor, project, submissionId, onSuccess }) => {
  const [categories, setCategories] = useState({
    codeQuality: 5,
    refactoring: 5,
    performance: 5,
    collaboration: 5,
    innovation: 5,
    consistency: 5,
    perfection: 5
  });
  const [feedback, setFeedback] = useState('');
  const [submitEvaluation, { isLoading }] = useSubmitEvaluationMutation();

  const handleRatingChange = (category, value) => {
    setCategories(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitEvaluation({
        contributorId: contributor._id,
        projectId: project._id,
        submissionId,
        categories,
        feedback
      }).unwrap();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.data?.message || 'Failed to submit evaluation');
    }
  };

  const labels = {
    codeQuality: 'Code Quality',
    refactoring: 'Refactoring',
    performance: 'Performance',
    collaboration: 'Collaboration',
    innovation: 'Innovation',
    consistency: 'Consistency',
    perfection: 'Perfection'
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-3xl p-8 space-y-8 shadow-sm">
      <div className="flex items-center gap-4 border-b border-border/30 pb-6">
        <img src={contributor.avatarUrl} alt="" className="w-12 h-12 rounded-xl border-2 border-primary/20" />
        <div>
          <h3 className="text-lg font-black tracking-tight">Evaluate @{contributor.username}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Project: {project.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.keys(categories).map((cat) => (
          <div key={cat} className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{labels[cat]}</label>
              <span className="text-sm font-black text-primary">{categories[cat]}/10</span>
            </div>
            <div className="flex gap-1.5">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleRatingChange(cat, i + 1)}
                  className={`w-full h-2 rounded-full transition-all ${
                    i < categories[cat] ? 'bg-primary' : 'bg-muted hover:bg-primary/30'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <MessageSquare size={14} /> Comprehensive Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Detailed observations on technical implementation, communication, and impact..."
          className="w-full bg-muted/30 border border-border/50 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <ShieldCheck size={18} /> Publish Evaluation
          </>
        )}
      </button>
    </form>
  );
};

export default EvaluationForm;
