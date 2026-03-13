import React, { useState } from 'react';
import { Mail, X, Loader2 } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, onShare, isSharing, defaultEmail }) => {
  const [useDefault, setUseDefault] = useState(true);
  const [anotherEmail, setAnotherEmail] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const recipient = useDefault ? defaultEmail : anotherEmail;
    if (recipient) onShare(recipient);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" /> Share Report
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-slate-400 text-sm mb-6">
            Choose where to send this audit report.
          </p>
          
          <div className="space-y-4 mb-8">
            {/* Default Email Option */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
              useDefault ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}>
              <div className="mt-1">
                <input 
                  type="radio" 
                  checked={useDefault} 
                  onChange={() => setUseDefault(true)}
                  className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
              </div>
              <div className="flex-1">
                <span className="block text-sm font-semibold text-white">Default Email</span>
                <span className="block text-xs text-slate-500 mt-0.5">{defaultEmail || 'No default email set'}</span>
              </div>
            </label>

            {/* Another Email Option */}
            <div className={`p-4 rounded-xl border transition-all ${
              !useDefault ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-950/50 border-slate-800'
            }`}>
              <label className="flex items-start gap-3 cursor-pointer mb-3">
                <div className="mt-1">
                  <input 
                    type="radio" 
                    checked={!useDefault} 
                    onChange={() => setUseDefault(false)}
                    className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-white">Add Another Email</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Send to a different recipient</span>
                </div>
              </label>

              {!useDefault && (
                <div className="relative animate-in slide-in-from-top-2 duration-300">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    autoFocus
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    value={anotherEmail}
                    onChange={(e) => setAnotherEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing || (!useDefault && !anotherEmail)}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-indigo-300/50 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {isSharing ? 'Sending...' : 'Send Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
