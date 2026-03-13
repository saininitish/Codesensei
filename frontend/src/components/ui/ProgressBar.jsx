import React from 'react';

const ProgressBar = ({ label, value, max = 10, icon: Icon, colorClass = "bg-indigo-500" }) => (
  <div className="mb-4">
    <div className="flex justify-between items-end mb-1">
      <div className="flex items-center text-sm font-medium text-slate-300">
        {Icon && <Icon className="w-4 h-4 mr-2 text-slate-400" />}
        {label}
      </div>
      <span className="text-sm font-bold text-white">{value.toFixed(1)}<span className="text-slate-500 font-normal">/10</span></span>
    </div>
    <div className="w-full bg-slate-800 rounded-full h-2">
      <div className={`${colorClass} h-2 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${(value / max) * 100}%` }}></div>
    </div>
  </div>
);

export default ProgressBar;
