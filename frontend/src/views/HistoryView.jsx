import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Filter, 
  Download, 
  FileJson, 
  FileText,
  Calendar,
  Star,
  Github,
  Clipboard,
  Mail,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { api, authStorage } from '../api.js';
import ShareModal from '../components/ui/ShareModal.jsx';

const HistoryView = ({ setCurrentView, setReviewResult }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLang, setFilterLang] = useState('all');
  const [filterScore, setFilterScore] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [sharingId, setSharingId] = useState(null);
  const [shareStatus, setShareStatus] = useState(null); // 'success' | 'error' | null
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedItemForShare, setSelectedItemForShare] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    loadHistory();
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...history];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.name || 'Untitled').toLowerCase().includes(q) || 
        (item.language || '').toLowerCase().includes(q) ||
        (item.source_display && item.source_display.toLowerCase().includes(q)) ||
        (item.original_code && item.original_code.toLowerCase().includes(q))
      );
    }

    // Source Filter
    if (filterSource !== 'all') {
      result = result.filter(item => item.source_type === filterSource);
    }

    // Language Filter
    if (filterLang !== 'all') {
      result = result.filter(item => item.language === filterLang);
    }

    // Score Filter
    if (filterScore !== 'all') {
      result = result.filter(item => {
        const score = item.scores?.composite || 0;
        if (filterScore === 'excellent') return score >= 8;
        if (filterScore === 'good') return score >= 6 && score < 8;
        if (filterScore === 'poor') return score < 6;
        return true;
      });
    }

    // Date Filter
    if (filterDate !== 'all') {
      const now = new Date();
      result = result.filter(item => {
        const itemDate = new Date(item.created_at);
        if (filterDate === 'today') {
          return itemDate.toDateString() === now.toDateString();
        }
        if (filterDate === 'week') {
          const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
          return itemDate >= sevenDaysAgo;
        }
        if (filterDate === 'month') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    setFilteredHistory(result);
  }, [history, searchQuery, filterLang, filterScore, filterDate, filterSource]);

  const loadHistory = () => {
    setLoading(true);
    api.getHistory()
      .then(data => { 
        const reviews = data.reviews || [];
        setHistory(reviews); 
        setLoading(false); 
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const handleShare = (item) => {
    setSelectedItemForShare(item);
    setIsShareModalOpen(true);
  };

  const handleConfirmShare = async (email) => {
    if (!selectedItemForShare) return;
    const user = authStorage.getUser();

    setSharingId(selectedItemForShare.id);
    setShareStatus(null);
    try {
      await api.shareReview(selectedItemForShare.id, email, user?.name || 'CodeSensei User');
      setShareStatus('success');
      setIsShareModalOpen(false);
      setTimeout(() => setShareStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setShareStatus('error');
      setTimeout(() => setShareStatus(null), 3000);
    }
    setSharingId(null);
    setSelectedItemForShare(null);
  };

  const handleOpenReview = async (id) => {
    try {
      const review = await api.getReview(id);
      setReviewResult(review);
      setCurrentView('result');
    } catch (e) {
      alert('Failed to load review details');
    }
  };

  const handleRename = async (id) => {
    try {
      await api.renameReview(id, editName);
      setEditingId(null);
      loadHistory();
    } catch (e) {
      alert('Failed to rename review');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.deleteReview(id);
      loadHistory();
      setActiveMenu(null);
    } catch (e) {
      alert('Failed to delete review');
    }
  };

  // Download Helpers
  const downloadJSON = (item) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `codesensei_review_${item.id.slice(0,8)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setActiveMenu(null);
  };

  const downloadTextReport = (item) => {
    const report = `
CodeSensei Review Report
------------------------
Name: ${item.name || 'Untitled'}
Date: ${new Date(item.created_at).toLocaleString()}
Language: ${item.language}
Result Score: ${item.scores?.composite?.toFixed(1) || 'N/A'}/10

Summary:
${item.explanation || 'No summary provided.'}

Findings:
${item.findings?.map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join('\n') || 'No findings reported.'}

------------------------
Generated by CodeSensei
    `;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(report);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `codesensei_report_${item.id.slice(0,8)}.txt`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setActiveMenu(null);
  };

  const getScoreColor = (score) => {
    if (!score) return "text-slate-400";
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const languages = Array.from(new Set(history.map(item => item.language).filter(Boolean)));

  return (
    <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Review History</h1>
          <p className="text-slate-400 mt-1">Search, filter, and manage your past code analyzes.</p>
        </div>
      </header>

      {/* Search & Filters Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search reviews by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Language Filter */}
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-8 text-xs text-slate-400 outline-none hover:border-slate-700 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{(lang || 'Unknown').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Score Filter */}
          <div className="relative group">
            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-8 text-xs text-slate-400 outline-none hover:border-slate-700 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Scores</option>
              <option value="excellent">Excellent (8+)</option>
              <option value="good">Good (6-8)</option>
              <option value="poor">Poor (&lt;6)</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-8 text-xs text-slate-400 outline-none hover:border-slate-700 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="github">GitHub</option>
              <option value="pasted">Manual</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-8 text-xs text-slate-400 outline-none hover:border-slate-700 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Any Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
        
        {/* Share Status Notification */}
        {shareStatus && (
          <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${
            shareStatus === 'success' ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400' : 'bg-red-950 border-red-500/50 text-red-400'
          }`}>
            {shareStatus === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-semibold">{shareStatus === 'success' ? 'Report shared successfully!' : 'Failed to share report'}</span>
          </div>
        )}

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShare={handleConfirmShare}
          isSharing={sharingId !== null}
          defaultEmail={authStorage.getUser()?.email}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-visible shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {history.length === 0 
              ? "No reviews found. Submit code to get started!" 
              : "No reviews match your filters."}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950/50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Path</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Language</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(item.id)}
                          className="bg-slate-800 border border-indigo-500/50 rounded px-2 py-1 text-slate-200 outline-none w-40"
                        />
                        <button onClick={() => handleRename(item.id)} className="text-emerald-400 hover:text-emerald-300">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`font-medium ${item.name ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                        {item.name || 'Untitled'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                       {item.source_type === 'github' ? <Github className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                       <span className="truncate max-w-[150px]">{item.source_display || 'Manual Paste'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] border border-slate-700/50 font-mono uppercase tracking-wider">
                      {item.language}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-bold ${getScoreColor(item.scores?.composite)}`}>
                    {item.scores?.composite ? item.scores.composite.toFixed(1) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3 text-right relative">
                      <button
                        onClick={() => handleOpenReview(item.id)}
                        disabled={item.status !== 'completed'}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-semibold uppercase tracking-wider disabled:opacity-30 flex items-center gap-1"
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleShare(item)}
                        disabled={item.status !== 'completed' || sharingId === item.id}
                        title="Share Report via Email"
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400 transition-all disabled:opacity-30"
                      >
                        {sharingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === item.id ? null : item.id);
                          }}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMenu === item.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                          >
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditName(item.name || '');
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Rename
                            </button>
                            
                            <div className="h-px bg-slate-800 my-1" />
                            
                            <button
                              onClick={() => downloadJSON(item)}
                              className="w-full px-4 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <FileJson className="w-3.5 h-3.5 text-yellow-500/70" /> Export as JSON
                            </button>
                            
                            <button
                              onClick={() => downloadTextReport(item)}
                              className="w-full px-4 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-500/70" /> Export as Report
                            </button>

                            <div className="h-px bg-slate-800 my-1" />
                            
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Review
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
