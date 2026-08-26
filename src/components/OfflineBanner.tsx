import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onSyncNow: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  pendingSyncCount,
  isSyncing,
  onSyncNow,
}) => {
  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-950">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          )}
          <span>
            {!isOnline
              ? 'You are currently working offline. All journal entries and edits will be stored locally.'
              : `${pendingSyncCount} offline changes pending synchronization.`}
          </span>
        </div>

        {isOnline && pendingSyncCount > 0 && (
          <button
            id="btn-banner-sync-now"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
