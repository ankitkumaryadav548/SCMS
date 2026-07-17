import React from 'react';
import { RefreshCw } from 'lucide-react';

export const LoadingScreen = ({ message = 'Synchronizing terminal state...' }) => {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-4 text-center select-none animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-brand-500/10 opacity-75"></div>
        {/* Rotating gear */}
        <div className="relative h-12 w-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-lg shadow-brand-500/10">
          <RefreshCw className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-white tracking-wide">{message}</p>
        <p className="text-xxs text-darkbg-textMuted uppercase tracking-widest font-semibold">Smart City Orchestrator</p>
      </div>
    </div>
  );
};

export const InlineLoader = ({ message = 'Syncing...' }) => (
  <div className="flex items-center gap-2 text-darkbg-textMuted text-xs justify-center py-4">
    <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-500" />
    <span className="font-semibold tracking-wider uppercase">{message}</span>
  </div>
);

export default LoadingScreen;
