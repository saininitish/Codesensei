import React, { useState } from 'react';
import { Github, Sparkles, FileCode2, Server, Search, CheckCircle, FolderOpen, File, ChevronRight, X, Loader2 } from 'lucide-react';
import { api } from '../api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const REVIEWABLE_EXTS = ['.js', '.jsx', '.mjs', '.ts', '.tsx', '.py', '.java', '.kt', '.kts', '.php', '.go', '.rs', '.cpp', '.cc', '.cxx', '.c', '.h', '.html', '.css', '.json', '.md'];

function detectLanguage(path) {
  const p = path.toLowerCase();
  if (p.endsWith('.py'))                             return 'python';
  if (p.endsWith('.ts') || p.endsWith('.tsx'))       return 'typescript';
  if (p.endsWith('.java'))                           return 'java';
  if (p.endsWith('.kt') || p.endsWith('.kts'))      return 'kotlin';
  if (p.endsWith('.php'))                            return 'php';
  if (p.endsWith('.go'))                             return 'go';
  if (p.endsWith('.rs'))                             return 'rust';
  if (p.endsWith('.cpp')||p.endsWith('.cc')||p.endsWith('.cxx')||p.endsWith('.c')||p.endsWith('.h')) return 'cpp';
  if (p.endsWith('.js')||p.endsWith('.jsx')||p.endsWith('.mjs')) return 'javascript';
  return 'javascript';
}

// ── Auto-detect language from code content ─────────────────────────────────────
function detectLanguageFromCode(code) {
  if (!code || code.trim().length < 10) return null;
  const c = code.trim();

  // Python — strong signals
  if (/^(import\s+\w+|from\s+\w+\s+import)/m.test(c) && /def\s+\w+\s*\(/m.test(c)) return 'python';
  if (/^\s*def\s+\w+.*:/m.test(c) && /:\s*$/m.test(c)) return 'python';
  if (/^\s*(class\s+\w+.*:|if\s+__name__\s*==)/m.test(c)) return 'python';
  if (/print\s*\(/m.test(c) && /def\s+/m.test(c)) return 'python';
  if (/^\s*import\s+\w+$/m.test(c) && !/[;{}]/m.test(c) && /:/m.test(c)) return 'python';

  // Java — strong signals
  if (/public\s+(static\s+)?class\s+\w+/m.test(c)) return 'java';
  if (/^\s*(import\s+java\.|package\s+\w+)/m.test(c)) return 'java';
  if (/System\.out\.println/m.test(c)) return 'java';
  if (/public\s+static\s+void\s+main/m.test(c)) return 'java';

  // Kotlin
  if (/^\s*fun\s+\w+/m.test(c) && /val\s+|var\s+/m.test(c)) return 'kotlin';
  if (/println\s*\(/m.test(c) && /fun\s+/m.test(c)) return 'kotlin';
  if (/data\s+class\s+/m.test(c)) return 'kotlin';

  // C++ — strong signals
  if (/#include\s*<\w+>/m.test(c)) return 'cpp';
  if (/std::/m.test(c) || /cout\s*<</m.test(c)) return 'cpp';
  if (/using\s+namespace\s+std/m.test(c)) return 'cpp';
  if (/int\s+main\s*\(/m.test(c) && /#include/m.test(c)) return 'cpp';

  // PHP
  if (/^\s*<\?php/m.test(c)) return 'php';
  if (/\$\w+\s*=/m.test(c) && /function\s+\w+/m.test(c) && /echo\s+/m.test(c)) return 'php';

  // Go
  if (/^package\s+\w+/m.test(c) && /func\s+/m.test(c)) return 'go';
  if (/fmt\.Println/m.test(c)) return 'go';

  // Rust
  if (/^\s*fn\s+\w+/m.test(c) && /let\s+(mut\s+)?\w+/m.test(c)) return 'rust';
  if (/println!\s*\(/m.test(c)) return 'rust';
  if (/use\s+std::/m.test(c)) return 'rust';

  // TypeScript — must check before JS
  if (/:\s*(string|number|boolean|any|void|never)\b/m.test(c)) return 'typescript';
  if (/interface\s+\w+\s*\{/m.test(c) && /:\s*\w+/m.test(c)) return 'typescript';
  if (/<\w+>/m.test(c) && /:\s*\w+/m.test(c)) return 'typescript';

  // JavaScript — fallback for common patterns
  if (/const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=/m.test(c)) return 'javascript';
  if (/function\s+\w+\s*\(/m.test(c)) return 'javascript';
  if (/=>/m.test(c) && /console\.log/m.test(c)) return 'javascript';
  if (/require\s*\(/m.test(c) || /import\s+.*from\s+'/m.test(c)) return 'javascript';

  return null;
}

const LANG_LABELS = {
  javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
  java: 'Java', kotlin: 'Kotlin', php: 'PHP', go: 'Go', rust: 'Rust', cpp: 'C++'
};

function parseRepoUrl(url) {
  if (!url) return null;
  const cleanUrl = url.trim();
  
  // Handle double-pasting or mangled prefixes by looking for the last "github.com/"
  const marker = 'github.com/';
  const markerIndex = cleanUrl.toLowerCase().lastIndexOf(marker);
  
  if (markerIndex === -1) return null;
  
  const pathPart = cleanUrl.slice(markerIndex + marker.length);
  const parts = pathPart.split('/').filter(Boolean);
  
  if (parts.length < 2) return null;
  
  const owner = parts[0];
  let repo = parts[1];
  
  // Clean repo name
  if (repo.toLowerCase().endsWith('.git')) {
    repo = repo.slice(0, -4);
  }
  
  const isBlob = parts[2] === 'blob';
  
  console.log('Robustly parsed GitHub URL:', { owner, repo, isBlob, original: url });
  return { owner, repo, isBlob };
}

function toRawUrl(owner, repo, branch, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

// Build a simple folder tree from flat file list
function buildTree(files) {
  const root = {};
  files.forEach(f => {
    const parts = f.path.split('/');
    let node = root;
    parts.forEach((part, i) => {
      if (!node[part]) node[part] = i === parts.length - 1 ? { __file: f } : {};
      node = node[part];
    });
  });
  return root;
}

// ── File Tree Component ───────────────────────────────────────────────────────

function TreeNode({ name, node, onSelect, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const isFile = !!node.__file;

  if (isFile) {
    const ext = '.' + name.split('.').pop();
    const reviewable = REVIEWABLE_EXTS.includes(ext);
    return (
      <div
        onClick={() => reviewable && onSelect(node.__file)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex items-center gap-2 py-1 px-2 rounded text-sm cursor-pointer transition-colors ${
          reviewable
            ? 'text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300'
            : 'text-slate-600 cursor-default'
        }`}
      >
        <File className="w-3.5 h-3.5 shrink-0 text-slate-500" />
        <span className="truncate">{name}</span>
      </div>
    );
  }

  const children = Object.entries(node);
  return (
    <div>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className="flex items-center gap-2 py-1 px-2 rounded text-sm cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
      >
        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        <FolderOpen className="w-3.5 h-3.5 shrink-0 text-yellow-500/70" />
        <span className="font-medium">{name}</span>
        <span className="text-slate-600 text-xs ml-auto">{children.length}</span>
      </div>
      {open && children.map(([k, v]) => (
        <TreeNode key={k} name={k} node={v} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Repo Browser Modal ────────────────────────────────────────────────────────

function RepoBrowser({ owner, repo, branch, files, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const reviewable = files.filter(f => REVIEWABLE_EXTS.some(ext => f.path.endsWith(ext)));
  const filtered = search ? reviewable.filter(f => f.path.toLowerCase().includes(search.toLowerCase())) : null;
  const tree = buildTree(reviewable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-indigo-400" />
              <span className="text-white font-semibold">{owner}/{repo}</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">{branch}</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">{reviewable.length} reviewable files — click a file to load it</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-800">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500"
            autoFocus
          />
        </div>

        {/* File list */}
        <div className="overflow-y-auto flex-1 py-2">
          {filtered ? (
            filtered.length === 0 ? (
              <p className="text-center text-slate-600 py-8 text-sm">No files match "{search}"</p>
            ) : (
              filtered.map(f => (
                <div
                  key={f.path}
                  onClick={() => onSelect(f)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-500/10 cursor-pointer transition-colors"
                >
                  <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-300 text-sm truncate">{f.path}</span>
                </div>
              ))
            )
          ) : (
            Object.entries(tree).map(([k, v]) => (
              <TreeNode key={k} name={k} node={v} onSelect={onSelect} depth={0} />
            ))
          )}
        </div>

        {/* Footer legend */}
        <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-600">
          Grayed out files are not reviewable (images, configs, etc.)
        </div>
      </div>
    </div>
  );
}

// ── Main SubmitView ───────────────────────────────────────────────────────────

const SubmitView = ({ setCurrentView, setReviewResult }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [autoDetected, setAutoDetected] = useState('');  // label shown when auto-detected
  const [githubUrl, setGithubUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Repo browser state
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoBrowser, setRepoBrowser] = useState(null); // { owner, repo, branch, files }
  const [selectedFile, setSelectedFile] = useState('');

  const loadingSteps = [
    { text: "Parsing code syntax...",                      icon: FileCode2 },
    { text: "Querying FAISS vector DB for RAG context...", icon: Server },
    { text: "Retrieving coding standards...",              icon: Search },
    { text: "Groq Llama 3.3 evaluating logic...",          icon: Sparkles },
    { text: "Generating final report...",                  icon: CheckCircle }
  ];

  // ── Load Repo File Tree ────────────────────────────────────────────────────
  const handleLoadRepo = async () => {
    const parsed = parseRepoUrl(githubUrl);
    if (!parsed) return;

    setRepoLoading(true);
    try {
      const { owner, repo } = parsed;

      // 1. Get default branch
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoRes.ok) throw new Error(`Repository "${owner}/${repo}" not found or private (HTTP ${repoRes.status})`);
      const repoData = await repoRes.json();
      const branch = repoData.default_branch;

      // 2. Get file tree (recursive)
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
      if (!treeRes.ok) throw new Error(`Could not fetch file tree for ${owner}/${repo}`);
      const treeData = await treeRes.json();

      const files = (treeData.tree || []).filter(f => f.type === 'blob');

      if (files.length === 0) throw new Error('Repository appears to be empty');

      setRepoBrowser({ owner, repo, branch, files });
    } catch (e) {
      alert(`GitHub Error: ${e.message}`);
    }
    setRepoLoading(false);
  };

  // ── Select a file from the browser ────────────────────────────────────────
  const handleFileSelect = async (file) => {
    const { owner, repo, branch } = repoBrowser;
    const rawUrl = toRawUrl(owner, repo, branch, file.path);
    try {
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setCode(text);
      setLanguage(detectLanguage(file.path));
      setSelectedFile(`${owner}/${repo}/${file.path}`);
      setRepoBrowser(null); // close browser
    } catch (e) {
      alert(`Could not load file: ${e.message}`);
    }
  };

  // ── Single-file URL fetch (when URL has /blob/ path) ─────────────────────
  const handleSingleFileFetch = async () => {
    let url = githubUrl.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
      const u = new URL(url);
      let rawUrl = url;
      if (u.hostname.includes('github.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        // pattern: /owner/repo/blob/branch/path...
        if (parts.length >= 4 && parts[2] === 'blob') {
          rawUrl = `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join('/')}`;
        }
      }
      
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} at ${rawUrl}`);
      const text = await res.text();
      if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
        alert('Got a webpage instead of code. Please ensure the URL points to a specific file.');
        return;
      }
      setCode(text);
      setLanguage(detectLanguage(rawUrl));
    } catch (e) {
      alert(`Could not fetch file: ${e.message}`);
    }
  };

  // Handle Enter / Blur on URL input
  const handleUrlAction = async () => {
    const urlText = githubUrl.trim();
    if (!urlText) return;
    
    const parsed = parseRepoUrl(urlText);
    if (parsed && !parsed.isBlob) {
      await handleLoadRepo();
    } else {
      await handleSingleFileFetch();
    }
  };

  // ── Analyze ────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!code) return;
    setIsAnalyzing(true);
    setLoadingStep(0);

    // Determine source metadata
    let sourceType = 'pasted';
    let sourceDisplay = 'Manual Paste';
    
    if (selectedFile) {
      sourceType = 'github';
      sourceDisplay = selectedFile;
    } else if (githubUrl.trim()) {
      sourceType = 'github';
      sourceDisplay = githubUrl.trim().split('/').pop() || 'GitHub File';
    }

    try {
      const { review_id } = await api.submitReview(code, language, sourceType, sourceDisplay);
      const interval = setInterval(() => {
        setLoadingStep(s => Math.min(s + 1, loadingSteps.length - 1));
      }, 2000);
      let finalResult = null;
      for (let i = 0; i < 40; i++) {
        const check = await api.getReview(review_id);
        if (check.status === 'completed') { finalResult = check; break; }
        if (check.status === 'failed')    throw new Error('Analysis failed on server.');
        await new Promise(r => setTimeout(r, 2000));
      }
      clearInterval(interval);
      if (!finalResult) throw new Error('Timed out. Please try again.');
      setReviewResult(finalResult);
      setIsAnalyzing(false);
      setCurrentView('result');
    } catch (e) {
      console.error(e);
      setIsAnalyzing(false);
      alert(`Failed to analyze code: ${e.message}`);
    }
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isAnalyzing) {
    const StepIcon = loadingSteps[Math.min(loadingStep, loadingSteps.length - 1)].icon;
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center animate-in fade-in">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
            <StepIcon className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing Codebase</h2>
        {selectedFile && <p className="text-slate-500 text-sm mb-2 font-mono">{selectedFile}</p>}
        <div className="h-8">
          <p className="text-slate-400 animate-pulse">{loadingSteps[Math.min(loadingStep, loadingSteps.length - 1)].text}</p>
        </div>
        <div className="flex gap-2 mt-8">
          {loadingSteps.map((_, idx) => (
            <div key={idx} className={`h-2 w-12 rounded-full transition-colors duration-500 ${idx <= loadingStep ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
      {/* Repo Browser Modal */}
      {repoBrowser && (
        <RepoBrowser
          {...repoBrowser}
          onSelect={handleFileSelect}
          onClose={() => setRepoBrowser(null)}
        />
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">New Review</h1>
        <p className="text-slate-400 mt-1">
          Paste code, or load from a GitHub file/repo URL.
        </p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="kotlin">Kotlin</option>
              <option value="php">PHP</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="cpp">C++</option>
            </select>

            <div className="flex items-center text-slate-500 text-sm">
              <Github className="w-4 h-4 mr-2" />
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUrlAction(); }}
                onBlur={handleUrlAction}
                placeholder="github.com/user/repo  or  /blob/main/file.js"
                className="bg-transparent border-none outline-none w-80 placeholder-slate-600 text-slate-300 focus:ring-0"
              />
              {repoLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400 mr-1" />}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!code}
            className={`px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              code ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Analyze Code
          </button>
        </div>

        {/* Auto-detected language badge */}
        {autoDetected && (
          <div className="px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center gap-2 animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-300/80">Language auto-detected: <strong>{autoDetected}</strong></span>
            <span className="text-xs text-slate-600 ml-auto">You can change it manually</span>
          </div>
        )}

        {/* Selected file badge */}
        {selectedFile && (
          <div className="px-4 py-2 bg-indigo-500/5 border-b border-indigo-500/20 flex items-center gap-2">
            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-indigo-300/80 font-mono">{selectedFile}</span>
            <button onClick={() => { setCode(''); setSelectedFile(''); }} className="ml-auto text-slate-600 hover:text-slate-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Code area */}
        <div className="relative group">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900 border-r border-slate-800 flex flex-col items-end py-4 pr-2 text-slate-600 text-sm font-mono select-none pointer-events-none">
            {[...Array(20)].map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onPaste={(e) => {
              // Auto-detect language after paste completes
              setTimeout(() => {
                const pasted = e.target.value;
                const detected = detectLanguageFromCode(pasted);
                if (detected) {
                  setLanguage(detected);
                  setAutoDetected(LANG_LABELS[detected] || detected);
                  setTimeout(() => setAutoDetected(''), 4000);
                }
              }, 0);
            }}
            placeholder="// Paste your code here, or load from a GitHub repo above..."
            className="w-full h-[500px] bg-slate-950 text-slate-300 font-mono p-4 pl-16 outline-none resize-none focus:bg-slate-900/80 transition-colors"
            spellCheck="false"
          />
        </div>
      </div>

      <p className="text-slate-600 text-xs mt-3 flex items-center gap-1">
        <Github className="w-3 h-3" />
        Repo URL → browse files &nbsp;|&nbsp; File URL (with <code>/blob/</code>) → load directly
      </p>
    </div>
  );
};

export default SubmitView;
