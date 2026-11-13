import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="no-print fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-4 left-3 sm:left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-lg border border-amber-400/50">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Mode Offline — Menggunakan data cache lokal</span>
    </div>
  );
};
