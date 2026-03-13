import React from 'react';
import { Activity, Shield, Zap, BookOpen, CheckCircle, Code } from 'lucide-react';

const DimensionIcon = ({ dimension, className = "w-5 h-5" }) => {
  switch (dimension) {
    case 'bugs':          return <Activity    className={className} />;
    case 'security':      return <Shield      className={className} />;
    case 'performance':   return <Zap         className={className} />;
    case 'readability':   return <BookOpen    className={className} />;
    case 'best_practices':return <CheckCircle className={className} />;
    default:              return <Code        className={className} />;
  }
};

export default DimensionIcon;
