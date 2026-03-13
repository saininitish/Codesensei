import React from 'react';

const CircularProgress = ({ value, max = 10, size = 120, strokeWidth = 10, label, colorClass = "text-indigo-500" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-white">{value.toFixed(1)}</span>
        {label && <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">{label}</span>}
      </div>
    </div>
  );
};

export default CircularProgress;
