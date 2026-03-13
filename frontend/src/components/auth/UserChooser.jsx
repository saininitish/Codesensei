import React from 'react';
import { Code, UserPlus, X } from 'lucide-react';
import { authStorage } from '../../api.js';

// ── Chrome-style User Chooser ─────────────────────────────────────────────────
// Shows saved user profiles as a grid. User clicks a profile to go to login (email pre-filled).
// "Add User" button goes to signup page.

const COLORS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-yellow-600',
  'from-violet-500 to-fuchsia-600',
  'from-lime-500 to-green-600',
];

const UserChooser = ({ onSelectUser, onAddUser, onLoginDirect }) => {
  const accounts = authStorage.getSavedAccounts();

  const removeUser = (e, email) => {
    e.stopPropagation();
    authStorage.removeAccount(email);
    // Force re-render
    window.dispatchEvent(new Event('storage'));
    // Simple trick: update state via parent or use key
    onSelectUser(null); // triggers re-render in parent
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Code className="w-7 h-7" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-1">Who's using CodeSensei?</h1>
        <p className="text-slate-500 text-sm text-center mb-8">Choose your account to continue</p>

        {/* User Grid */}
        <div className="flex flex-wrap justify-center gap-5 mb-8">
          {accounts.map((acc, idx) => {
            const initials = (acc.name || 'U').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
            const color = COLORS[idx % COLORS.length];
            return (
              <div key={acc.email} className="relative group">
                <button
                  onClick={() => onSelectUser(acc)}
                  className="flex flex-col items-center gap-3 p-4 w-28 rounded-2xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                    {initials}
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-sm font-medium text-slate-200 truncate">{acc.name}</p>
                    <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                  </div>
                </button>

                {/* Remove X */}
                <button
                  onClick={(e) => removeUser(e, acc.email)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:border-red-500/30"
                >
                  <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
                </button>
              </div>
            );
          })}

          {/* Add User Card */}
          <button
            onClick={onAddUser}
            className="flex flex-col items-center gap-3 p-4 w-28 rounded-2xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center hover:border-indigo-500/50 transition-colors">
              <UserPlus className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-400">Add User</p>
          </button>
        </div>

        {/* Already have account */}
        <div className="text-center">
          <button onClick={onLoginDirect} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
            Sign in with a different account →
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserChooser;
