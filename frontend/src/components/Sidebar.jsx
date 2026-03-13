import React, { useState, useRef, useEffect } from 'react';
import { 
  Code, 
  LayoutDashboard, 
  History, 
  Settings as SettingsIcon, 
  User, 
  LogOut, 
  ChevronUp, 
  UserCircle, 
  Bell, 
  Save, 
  Shield, 
  X, 
  Mail, 
  Lock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import PlusIcon from './ui/PlusIcon.jsx';
import { api } from '../api.js';

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }) {
  const initials = (name || 'U').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-xl' }[size];
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
}

// ── Consolidated Profile & Settings Modal ──────────────────────────────────────
function ProfileModal({ user, onClose, onLogout }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [notifications, setNotifications] = useState({ emailOnComplete: false, weeklyDigest: false });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(d => {
        setName(d.displayName || user?.name || '');
        setEmail(d.email || user?.email || '');
        setNotifications(d.notifications || { emailOnComplete: false, weeklyDigest: false });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await api.updateSettings({ 
        displayName: name.trim(), 
        email: email.trim(), 
        password: password || undefined,
        notifications 
      });
      setMsg('✅ Profile updated! You will be logged out to apply changes...');
      setPassword('');
      
      // Delay logout to show the message
      setTimeout(() => {
        onLogout();
      }, 3000);
    } catch {
      setMsg('❌ Failed to update profile.');
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      onLogout(); // This will clear state and redirect
    } catch {
      alert('Failed to delete account.');
    }
  };

  const updateNotif = (f, v) => setNotifications(p => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-20">
          <div className="flex items-center gap-2 text-white font-semibold"><UserCircle className="w-5 h-5 text-indigo-400" /> Account Settings</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Floating Notification Toast */}
        {msg && (
          <div className="sticky top-[72px] left-0 right-0 z-30 px-6 animate-in slide-in-from-top-4 duration-300">
            <div className={`p-4 rounded-xl flex items-center gap-3 shadow-2xl border ${
              msg.includes('❌') 
                ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            }`}>
              {msg.includes('❌') ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 font-bold text-[10px] shrink-0">✓</div>}
              <p className="text-sm font-semibold">{msg}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading settings...</div>
        ) : (
          <div className="px-6 py-6 space-y-8">
            {/* Profile Section */}
            <section className="space-y-4">
              <div className="flex flex-col items-center gap-3 pb-2">
                <Avatar name={name} size="lg" />
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Public Profile</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium" />
                  </div>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Security</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest text-indigo-400/80">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Notifications</h3>
              <div className="space-y-3">
                {[{ key: 'emailOnComplete', label: 'Email when review completes' }, { key: 'weeklyDigest', label: 'Weekly progress digest' }].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => updateNotif(key, !notifications[key])}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${notifications[key] ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Danger Zone */}
            <section className="pt-6 border-t border-slate-800/50">
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest mb-1">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone
                </div>
                <p className="text-[11px] text-slate-500 mb-4">Deleting your account is permanent and will remove all your reviews and settings data. There is no undo.</p>
                
                {confirmDelete ? (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <button onClick={handleDeleteAccount} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/20">
                      Yes, Delete Everything
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="w-full py-2 border border-red-500/30 hover:bg-red-500/10 text-red-500 text-xs font-bold rounded-xl transition-all">
                    Delete My Account
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        <div className="px-6 pb-6 pt-2 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving || loading}
            className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20">
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 text-slate-400 hover:text-white rounded-xl border border-slate-800 text-sm transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ currentView, setCurrentView, onLogout, currentUser }) => {
  const [dropOpen, setDropOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'submit',    label: 'New Review', icon: PlusIcon },
    { id: 'history',   label: 'History',    icon: History },
  ];

  return (
    <>
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shrink-0">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Code className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CodeSensei
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (currentView === 'result' && item.id === 'submit');
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom user section with dropdown */}
        <div className="p-4 border-t border-slate-800 relative" ref={dropRef}>
          {dropOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => { setDropOpen(false); setShowProfile(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors text-left"
              >
                <UserCircle className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-200">Account Settings</span>
              </button>
              <div className="border-t border-slate-700" />
              <button
                onClick={() => { setDropOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">Logout</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setDropOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            <Avatar name={currentUser?.name} />
            <div className="text-sm flex-1 min-w-0 text-left">
              <div className="font-medium text-slate-200 truncate">{currentUser?.name || 'Dev User'}</div>
              <div className="text-slate-500 text-xs truncate">{currentUser?.email || ''}</div>
            </div>
            <ChevronUp className={`w-4 h-4 text-slate-500 transition-transform ${dropOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {showProfile && (
        <ProfileModal 
          user={currentUser} 
          onClose={() => setShowProfile(false)} 
          onLogout={onLogout}
        />
      )}
    </>
  );
};

export default Sidebar;
