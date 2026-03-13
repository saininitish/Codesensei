import React from 'react';

const SeverityBadge = ({ severity }) => {
  const styles = {
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${styles[severity] || styles.low}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
