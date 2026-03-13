import React, { useState, useEffect, useRef } from 'react';
import {
  User, Settings, LogOut, ChevronDown, X, Bell,
  Save, Shield, Eye, EyeOff, Lock, Mail, UserCircle
} from 'lucide-react';
import { api } from '../api.js';

// ── Initials Avatar ───────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const initials = (name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-xl' }[size];

  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose }) {
  const [name, setName]       = useState(user?.name || '');
  const [email, setEmail]     = useState(user?.email || '');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.updateSettings({ displayName: name, email });
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Failed to update profile.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold">
            <UserCircle className="w-5 h-5 text-indigo-400" />
            My Profile
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 py-4">
            <Avatar name={name} size="lg" />
            <p className="text-slate-400 text-sm">Your initials are auto-generated from your name</p>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:border-slate-600 transition-colors text-sm">Cancel</button>
        </div>
        {msg && (
          <div className={`mx-6 mb-5 text-sm text-center px-3 py-2 rounded-lg ${msg.includes('Failed') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [settings, setSettings] = useState({
    displayName: '',
    email: '',
    notifications: { emailOnComplete: false, weeklyDigest: false }
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  useEffect(() => {
    api.getSettings().then(d => { setSettings(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const update = (field, val) => setSettings(p => ({ ...p, [field]: val }));
  const updateNotif = (field, val) => setSettings(p => ({ ...p, notifications: { ...p.notifications, [field]: val } }));

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.updateSettings(settings);
      setMsg('Settings saved!');
      setTimeout(() => setMsg(''), 2500);
    } catch { setMsg('Failed to save.'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Settings className="w-5 h-5 text-indigo-400" />
            Account Settings
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading settings...</div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {/* Profile Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Profile
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Display Name</label>
                  <input type="text" value={settings.displayName} onChange={e => update('displayName', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Email</label>
                  <input type="email" value={settings.email} onChange={e => update('email', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" /> Notifications
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'emailOnComplete', label: 'Email when review is complete' },
                  { key: 'weeklyDigest',    label: 'Weekly progress digest' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => updateNotif(key, !settings.notifications[key])}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${settings.notifications[key] ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notifications[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">Your password can be changed by contacting support. Sessions are stored locally in your browser.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving || loading}
            className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save All Changes</>}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:border-slate-600 transition-colors text-sm">Close</button>
        </div>
        {msg && (
          <div className={`mx-6 mb-5 text-sm text-center px-3 py-2 rounded-lg ${msg.includes('Failed') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main TopBar ───────────────────────────────────────────────────────────────
const TopBar = ({ currentUser, onLogout, viewTitle }) => {
  const [dropOpen, setDropOpen]         = useState(false);
  const [showProfile, setShowProfile]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const menuItems = [
    {
      icon: UserCircle,
      label: 'Profile',
      desc: 'Edit your name & email',
      action: () => { setDropOpen(false); setShowProfile(true); }
    },
    {
      icon: Settings,
      label: 'Settings',
      desc: 'Notifications & preferences',
      action: () => { setDropOpen(false); setShowSettings(true); }
    },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
        <h2 className="text-sm font-semibold text-slate-400 capitalize">{viewTitle}</h2>

        {/* User pill */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all group"
          >
            <Avatar name={currentUser?.name} size="sm" />
            <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors hidden sm:block">
              {currentUser?.name || 'User'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
              {/* User header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
                <Avatar name={currentUser?.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{currentUser?.name || 'User'}</p>
                  <p className="text-slate-500 text-xs truncate">{currentUser?.email || ''}</p>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                {menuItems.map(({ icon: Icon, label, desc, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </button>
                ))}

                {/* Divider */}
                <div className="my-1.5 border-t border-slate-800" />

                {/* Logout */}
                <button
                  onClick={() => { setDropOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                    <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-red-400 font-medium">Logout</p>
                    <p className="text-xs text-slate-500">Clear session &amp; return to login</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showProfile  && <ProfileModal  user={currentUser} onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};

export default TopBar;
