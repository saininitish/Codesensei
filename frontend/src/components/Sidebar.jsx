import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className={`${sz} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-bold text-white shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-primary-400/50`}>
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
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-md" 
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-dark-card border border-dark-border/60 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" 
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-dark-border/50 bg-dark-card/90 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-lg font-semibold tracking-wide text-white font-display">
              <UserCircle className="w-5 h-5 text-primary-400" /> Account Settings
            </div>
            <button onClick={onClose} className="transition-colors text-dark-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
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
            <div className="py-12 text-sm font-medium text-center text-dark-muted animate-pulse">Loading settings...</div>
          ) : (
            <div className="px-6 py-6 space-y-8">
              {/* Profile Section */}
              <section className="space-y-4">
                <div className="flex flex-col items-center gap-3 pb-2">
                  <Avatar name={name} size="lg" />
                  <p className="text-xs font-bold tracking-widest uppercase text-dark-muted">Public Profile</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-dark-muted mb-1.5 uppercase tracking-wide">Display Name</label>
                    <div className="relative">
                      <User className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-dark-muted" />
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="pl-10 input-field h-11" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-dark-muted mb-1.5 uppercase tracking-wide">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-dark-muted" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="pl-10 input-field h-11" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Security Section */}
              <section className="pt-2 space-y-4">
                <h3 className="pl-2 text-xs font-bold tracking-widest uppercase border-l-2 text-dark-muted border-primary-500">Security</h3>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest text-primary-400/80">New Password</label>
                  <div className="relative">
                    <Lock className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-dark-muted" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current"
                      className="pl-10 input-field h-11" />
                  </div>
                </div>
              </section>

              {/* Notifications Section */}
              <section className="pt-2 space-y-3">
                <h3 className="pl-2 text-xs font-bold tracking-widest uppercase border-l-2 text-dark-muted border-primary-500">Notifications</h3>
                <div className="space-y-3">
                  {[{ key: 'emailOnComplete', label: 'Email when review completes' }, { key: 'weeklyDigest', label: 'Weekly progress digest' }].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <div onClick={() => updateNotif(key, !notifications[key])}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${notifications[key] ? 'bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-dark-border'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className="text-xs transition-colors text-slate-300 group-hover:text-white">{label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Danger Zone */}
              <section className="pt-6 border-t border-dark-border/50">
                <div className="p-4 border bg-red-500/5 border-red-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1 text-xs font-bold tracking-widest text-red-400 uppercase">
                    <AlertTriangle className="w-4 h-4" /> Danger Zone
                  </div>
                  <p className="text-[11px] text-dark-muted mb-4">Deleting your account is permanent and will remove all your reviews and settings data. There is no undo.</p>
                  
                  {confirmDelete ? (
                    <div className="flex items-center gap-3 duration-200 animate-in fade-in slide-in-from-top-1">
                      <button onClick={handleDeleteAccount} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all hover:-translate-y-0.5">
                        Yes, Delete Everything
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 bg-dark-bg hover:bg-dark-border text-slate-300 text-xs font-bold rounded-xl transition-all">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="w-full py-2.5 border border-red-500/30 hover:bg-red-500/10 text-red-500 text-xs font-bold rounded-xl transition-all hover:-translate-y-0.5">
                      Delete My Account
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}

          <div className="flex items-center gap-3 px-6 pt-2 pb-6">
            <button onClick={handleSave} disabled={saving || loading}
              className="flex items-center justify-center flex-1 gap-2 btn-primary">
              {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 text-dark-muted hover:text-white rounded-xl border border-dark-border text-sm transition-colors hover:bg-dark-border/30">Close</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
      <div className="relative z-40 flex flex-col w-64 h-screen border-r bg-dark-bg/95 backdrop-blur-md border-dark-border/40 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 mt-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30 flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden group">
            <div className="absolute inset-0 transition-transform duration-300 translate-y-full bg-primary-400/20 group-hover:translate-y-0"></div>
            <Code className="relative z-10 w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-transparent font-display bg-gradient-to-r from-white via-slate-200 to-primary-200 bg-clip-text">
            CodeSensei
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 mt-2 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (currentView === 'result' && item.id === 'submit');
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-400 font-semibold shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-primary-500/30'
                    : 'text-dark-muted hover:text-white hover:bg-dark-card/50 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse-glow rounded-full' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom user section with dropdown */}
        <div className="relative p-4 border-t border-dark-border/40" ref={dropRef}>
          <AnimatePresence>
            {dropOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 mb-2 overflow-hidden border shadow-2xl bottom-full left-3 right-3 bg-dark-card border-dark-border shadow-black/50 rounded-xl"
              >
                <button
                  onClick={() => { setDropOpen(false); setShowProfile(true); }}
                  className="flex items-center w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-dark-border/50"
                >
                  <UserCircle className="w-4 h-4 text-primary-400" />
                  <span className="text-sm font-medium text-slate-200">Account Settings</span>
                </button>
                <div className="border-t border-dark-border/50" />
                <button
                  onClick={() => { setDropOpen(false); onLogout(); }}
                  className="flex items-center w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-400">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setDropOpen(v => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-dark-card/60 active:scale-[0.98] border ${dropOpen ? 'border-dark-border/80 bg-dark-card/40' : 'border-transparent'}`}
          >
            <Avatar name={currentUser?.name} />
            <div className="flex-1 min-w-0 text-sm text-left">
              <div className="font-semibold truncate text-slate-200">{currentUser?.name || 'Dev User'}</div>
              <div className="text-dark-muted text-[11px] truncate">{currentUser?.email || ''}</div>
            </div>
            <ChevronUp className={`w-4 h-4 text-dark-muted transition-transform duration-300 ${dropOpen ? '' : 'rotate-180'}`} />
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
