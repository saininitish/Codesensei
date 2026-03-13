import React, { useState } from 'react';
import {
  CheckCircle, Search, Sparkles, AlertTriangle, Check,
  ChevronRight, Copy, Github, Folder, Clipboard, ClipboardList
} from 'lucide-react';
import CircularProgress from '../components/ui/CircularProgress.jsx';
import DimensionIcon from '../components/ui/DimensionIcon.jsx';
import SeverityBadge from '../components/ui/SeverityBadge.jsx';
import ShareModal from '../components/ui/ShareModal.jsx';
import { api, authStorage } from '../api.js';
import { Mail, Loader2, CheckCircle as CheckCircleFull, AlertTriangle as AlertTriangleFull } from 'lucide-react';

const ResultView = ({ result }) => {
  const [activeTab, setActiveTab] = useState('findings');
  const [expandedFinding, setExpandedFinding] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score) => {
    if (score >= 8) return "bg-emerald-400";
    if (score >= 6) return "bg-yellow-400";
    return "bg-red-400";
  };

  const handleConfirmShare = async (email) => {
    const user = authStorage.getUser();
    setIsSharing(true);
    setShareStatus(null);
    try {
      await api.shareReview(result.id, email, user?.name || 'CodeSensei User');
      setShareStatus('success');
      setIsShareModalOpen(false);
      setTimeout(() => setShareStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setShareStatus('error');
      setTimeout(() => setShareStatus(null), 3000);
    }
    setIsSharing(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">

      {/* Header & Composite Score */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle className="text-emerald-500 w-6 h-6" /> Review Complete
            </h1>
            <p className="text-slate-400 text-sm mb-4 max-w-md">
              Evaluated against OWASP Top 10 and standard {result.language} style guides.
              Found {result.findings.length} issues to address.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-sm font-mono border border-slate-700">{result.language}</span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700 flex items-center gap-1.5 text-slate-300">
                {result.source_type === 'github' ? <Github className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span className="max-w-[200px] truncate">{result.source_display || 'Manual Paste'}</span>
              </span>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm border border-indigo-500/20 flex items-center gap-1.5">
                <Search className="w-3 h-3" /> RAG Enhanced
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <CircularProgress value={result.scores.composite} label="COMPOSITE" colorClass={getScoreColor(result.scores.composite)} />
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
            >
              <Mail className="w-3.5 h-3.5" /> Share Report
            </button>
          </div>
        </div>
      </div>

      {shareStatus && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${
          shareStatus === 'success' ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400' : 'bg-red-950 border-red-500/50 text-red-400'
        }`}>
          {shareStatus === 'success' ? <CheckCircleFull className="w-5 h-5" /> : <AlertTriangleFull className="w-5 h-5" />}
          <span className="font-semibold">{shareStatus === 'success' ? 'Report shared successfully!' : 'Failed to share report'}</span>
        </div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleConfirmShare}
        isSharing={isSharing}
        defaultEmail={authStorage.getUser()?.email}
      />

      {/* Dimensions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(result.scores).map(([key, value]) => {
          if (key === 'composite') return null;
          return (
            <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center text-slate-400 text-sm mb-3 uppercase tracking-wider font-semibold">
                <DimensionIcon dimension={key} className="w-4 h-4 mr-2" />
                {key.replace('_', ' ')}
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-2xl font-bold ${getScoreColor(value)}`}>{value.toFixed(1)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1 mt-3">
                <div className={`${getScoreBg(value)} h-1 rounded-full`} style={{ width: `${(value / 10) * 100}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation Box */}
      <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-6 mb-8 flex gap-4">
        <div className="shrink-0 mt-1 text-indigo-400"><Sparkles className="w-6 h-6" /></div>
        <div>
          <h3 className="text-white font-bold mb-1">CodeSensei Explanation</h3>
          <p className="text-indigo-200/80 leading-relaxed text-sm">{result.explanation}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'findings' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
        >
          Detailed Findings ({result.findings.length})
        </button>
        <button
          onClick={() => setActiveTab('fix')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fix' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
        >
          <Sparkles className="w-4 h-4" /> Apply Fix Mode
        </button>
      </div>

      {/* Findings Tab */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {result.findings.map((finding) => {
            const isExpanded = expandedFinding === finding.id;
            return (
              <div key={finding.id} className={`border rounded-xl transition-all duration-200 overflow-hidden ${isExpanded ? 'bg-slate-900 border-slate-700 shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>
                <div className="p-4 flex items-center gap-4 cursor-pointer select-none" onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}>
                  <DimensionIcon dimension={finding.dimension} className="w-5 h-5 text-slate-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-white font-medium">{finding.title}</h4>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    <div className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                      <span className="font-mono">Line {finding.line_start}{finding.line_end ? `-${finding.line_end}` : ''}</span>
                      <span>•</span>
                      <span className="text-indigo-400/80">{finding.standard_ref}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="p-6 pt-2 border-t border-slate-800 bg-slate-950/50">
                    <div className="mb-4">
                      <h5 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Issue Description</h5>
                      <p className="text-slate-300 text-sm leading-relaxed">{finding.description}</p>
                    </div>
                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4">
                      <h5 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Check className="w-3 h-3" /> Recommended Fix
                      </h5>
                      <p className="text-emerald-100/70 text-sm">{finding.suggestion}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fix Mode Tab */}
      {activeTab === 'fix' && (() => {
        const errorLines = {};
        result.findings.forEach(f => {
          const end = f.line_end || f.line_start;
          for (let l = f.line_start; l <= end; l++) {
            if (!errorLines[l]) errorLines[l] = [];
            errorLines[l].push({ severity: f.severity, title: f.title });
          }
        });

        const origLines  = (result.original_code || '').split('\n');
        const fixedLines = (result.fixed_code   || '').split('\n');

        const severityBorder = (sev) => {
          if (sev === 'critical' || sev === 'high') return 'border-red-500';
          if (sev === 'medium') return 'border-orange-400';
          return 'border-yellow-400';
        };
        const severityBg = (sev) => {
          if (sev === 'critical' || sev === 'high') return 'bg-red-500/10';
          if (sev === 'medium') return 'bg-orange-400/8';
          return 'bg-yellow-400/8';
        };
        const wavyColor = (sev) => {
          if (sev === 'critical' || sev === 'high') return '#ef4444';
          if (sev === 'medium') return '#fb923c';
          return '#facc15';
        };

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> AI-Generated Fix
                </h3>
                <div className="flex items-center gap-3 ml-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/60 inline-block" />High / Critical</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-400/20 border border-orange-400/60 inline-block" />Medium</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400/20 border border-yellow-400/60 inline-block" />Low</span>
                </div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(result.fixed_code || '').catch(() => {})}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
              >
                <Copy className="w-4 h-4" /> Copy Fixed
              </button>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-800">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border-b border-slate-800">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400 font-bold uppercase tracking-widest">Original — with issues</span>
                <span className="ml-auto text-xs text-slate-600 font-mono">{origLines.length} lines</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border-b border-slate-800">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Fixed Output</span>
                <span className="ml-auto text-xs text-slate-600 font-mono">{fixedLines.length} lines</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-800 overflow-auto max-h-[520px]">
              <div className="bg-slate-950 overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse">
                  <tbody>
                    {origLines.map((line, idx) => {
                      const lineNum = idx + 1;
                      const errors  = errorLines[lineNum];
                      const hasError = !!errors;
                      const topSev = hasError ? errors[0].severity : null;
                      const title = hasError ? errors.map(e => e.title).join(' · ') : '';
                      return (
                        <tr key={idx} title={title} className={`group transition-colors ${hasError ? severityBg(topSev) : 'hover:bg-slate-800/30'}`}>
                          <td className={`select-none text-right pr-3 pl-2 py-0.5 w-10 border-r text-slate-600 ${hasError ? `border-l-2 ${severityBorder(topSev)} border-r-slate-800 bg-red-900/20 text-slate-400` : 'border-slate-800'}`}>
                            {lineNum}
                          </td>
                          <td className="pl-4 pr-4 py-0.5 whitespace-pre">
                            {hasError ? (
                              <span style={{ textDecoration: 'underline wavy', textDecorationColor: wavyColor(topSev), textUnderlineOffset: '3px' }}>
                                <span className="text-red-300/90">{line || ' '}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">{line || ' '}</span>
                            )}
                          </td>
                          {hasError && (
                            <td className="pr-2 py-0.5 text-right align-middle">
                              <span className={`opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${
                                topSev === 'critical' || topSev === 'high' ? 'bg-red-500/20 text-red-400' : topSev === 'medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>{topSev}</span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#020f08] overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse">
                  <tbody>
                    {fixedLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-emerald-900/10 transition-colors">
                        <td className="select-none text-right pr-3 pl-2 py-0.5 w-10 text-slate-700 border-r border-slate-800/50">{idx + 1}</td>
                        <td className="pl-4 pr-4 py-0.5 whitespace-pre"><span className="text-emerald-300/80">{line || ' '}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400 font-semibold">{result.findings.filter(f => f.severity === 'high' || f.severity === 'critical').length}</span> high/critical</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-orange-400" /><span className="text-orange-400 font-semibold">{result.findings.filter(f => f.severity === 'medium').length}</span> medium</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /><span className="text-yellow-400 font-semibold">{result.findings.filter(f => f.severity === 'low').length}</span> low</span>
              <span className="ml-auto text-slate-600">Hover red lines to see issue name</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ResultView;
