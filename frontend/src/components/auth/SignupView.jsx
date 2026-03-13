import React, { useState } from 'react';
import { Code, AlertTriangle, Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import AuthInput from './AuthInput.jsx';
import { api } from '../../api.js';

const SignupView = ({ onSignupSuccess, onGoToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.signup(name, email, password);
      onSignupSuccess(data.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Code className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CodeSensei
          </span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-6">Start improving your code quality today.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput icon={User} type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
            <AuthInput
              icon={Lock}
              type={showPass ? 'text' : 'password'}
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              rightElement={
                <button type="button" onClick={() => setShowPass(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <AuthInput icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= i * 3
                        ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-yellow-500' : i <= 3 ? 'bg-blue-500' : 'bg-emerald-500'
                        : 'bg-slate-700'
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {password.length < 4 ? 'Weak' : password.length < 7 ? 'Fair' : password.length < 10 ? 'Good' : 'Strong'} password
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name || !email || !password || !confirmPassword}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {loading
                ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>)
                : (<><UserPlus className="w-4 h-4" /> Create Account</>)
              }
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{' '}
              <button onClick={onGoToLogin} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupView;
