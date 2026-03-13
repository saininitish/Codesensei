import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthInput = ({ icon: Icon, type, placeholder, value, onChange, rightElement }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
      <Icon className="w-4 h-4" />
    </div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-800/60 border border-slate-700 text-slate-200 rounded-xl pl-11 pr-4 py-3 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
    />
    {rightElement && (
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {rightElement}
      </div>
    )}
  </div>
);

export default AuthInput;
