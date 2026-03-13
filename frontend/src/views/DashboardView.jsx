import React, { useState, useEffect } from 'react';
import { Activity, Shield, Zap, BookOpen, CheckCircle, FileCode2, Sparkles, Play, ChevronRight, Mail, Loader2, CheckCircle as CheckCircleFull, AlertTriangle as AlertTriangleFull } from 'lucide-react';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { api, authStorage } from '../api.js';
import ShareModal from '../components/ui/ShareModal.jsx';

const DashboardView = ({ setCurrentView, setReviewResult }) => {
  const [loading, setLoading] = useState(true);
  const [apiStats, setApiStats] = useState({
    totalReviews: 0,
    avgScore: 0,
    improvement: '0%',
    scores: { bugs: 0, security: 0, performance: 0, readability: 0, best_practices: 0 }
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getStats(),
      api.getHistory()
    ]).then(([statsData, historyData]) => {
      setApiStats({
        totalReviews: statsData.total_reviews || 0,
        avgScore: statsData.avg_composite_score || 0,
        improvement: statsData.total_reviews > 0 ? '+12%' : '0%',
        scores: statsData.avg_scores_by_dimension || { bugs: 0, security: 0, performance: 0, readability: 0, best_practices: 0 }
      });
      setRecentReviews((historyData.reviews || []).slice(0, 3));
    }).catch(err => {
      console.error('Failed to fetch dashboard data:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleResend = (review) => {
    setSelectedReview(review);
    setIsShareModalOpen(true);
  };

  const handleConfirmShare = async (email) => {
    if (!selectedReview) return;
    const user = authStorage.getUser();
    setIsSharing(true);
    setShareStatus(null);
    try {
      await api.shareReview(selectedReview.id, email, user?.name || 'CodeSensei User');
      setShareStatus('success');
      setIsShareModalOpen(false);
      setTimeout(() => setShareStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setShareStatus('error');
      setTimeout(() => setShareStatus(null), 3000);
    }
    setIsSharing(false);
    setSelectedReview(null);
  };

  const handleOpenReview = (review) => {
    setReviewResult(review);
    setCurrentView('result');
  };

  const stats = apiStats;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Track your code quality improvements over time.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Reviews</p>
              <h3 className="text-3xl font-bold text-white mt-2">{stats.totalReviews}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <FileCode2 className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Average Score</p>
              <h3 className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
                {stats.avgScore} <span className="text-sm text-slate-500 font-normal">/10</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Recent Improvement</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-2">{stats.improvement}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Average by Dimension</h3>
          <div className="space-y-6">
            <ProgressBar label="Bugs & Logic"   value={stats.scores.bugs}           icon={Activity}     colorClass="bg-red-400" />
            <ProgressBar label="Security"        value={stats.scores.security}        icon={Shield}       colorClass="bg-orange-400" />
            <ProgressBar label="Performance"     value={stats.scores.performance}     icon={Zap}          colorClass="bg-yellow-400" />
            <ProgressBar label="Readability"     value={stats.scores.readability}     icon={BookOpen}     colorClass="bg-blue-400" />
            <ProgressBar label="Best Practices"  value={stats.scores.best_practices}  icon={CheckCircle}  colorClass="bg-emerald-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Play className="w-8 h-8 ml-1" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Ready for your next review?</h3>
          <p className="text-slate-400 mb-6 max-w-sm">Submit your latest code to get instant feedback grounded in industry standards.</p>
          <button
            onClick={() => setCurrentView('submit')}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            Submit Code <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      {recentReviews.length > 0 && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Recent Activities
            </h3>
            <button 
              onClick={() => setCurrentView('history')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-800/50">
            {recentReviews.map((review) => (
              <div 
                key={review.id} 
                onClick={() => handleOpenReview(review)}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-slate-800 text-xs font-bold uppercase tracking-tighter ${
                    (review.scores?.composite || 0) >= 8 ? 'text-emerald-400' : 
                    (review.scores?.composite || 0) >= 6 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {review.scores?.composite?.toFixed(1) || '0.0'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">{review.name || 'Untitled Review'}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {review.language} • {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResend(review);
                  }}
                  title="Resend Report"
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sharing Status & Modal */}
      {shareStatus && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${
          shareStatus === 'success' ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400' : 'bg-red-950 border-red-500/50 text-red-400'
        }`}>
          {shareStatus === 'success' ? <CheckCircleFull className="w-5 h-5" /> : <AlertTriangleFull className="w-5 h-5" />}
          <span className="font-semibold">{shareStatus === 'success' ? 'Report resent successfully!' : 'Failed to resend report'}</span>
        </div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleConfirmShare}
        isSharing={isSharing}
        defaultEmail={authStorage.getUser()?.email}
      />
    </div>
  );
};

export default DashboardView;
