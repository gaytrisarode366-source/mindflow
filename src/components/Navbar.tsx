import React from 'react';
import { User } from 'firebase/auth';
import { ViewTab } from '../types';
import { 
  BookOpen, 
  History, 
  Smile, 
  Flame, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Lock, 
  Unlock, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onManualSync: () => void;
  isSyncing: boolean;
  isVaultUnlocked: boolean;
  onToggleVaultModal: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  isOnline,
  pendingSyncCount,
  onManualSync,
  isSyncing,
  isVaultUnlocked,
  onToggleVaultModal,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-stone-50/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-stone-100 shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-stone-900 tracking-tight">MindFlow</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-medium">Gemini 3.6</span>
            </div>
            <p className="text-xs text-stone-700 hidden sm:block">Introspective AI Journal & Vault</p>
          </div>
        </div>

        {/* Navigation Tabs (Only when authenticated) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl border border-stone-300/50">
            <button
              id="nav-tab-journal"
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'journal'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Reflect</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Archive</span>
            </button>

            <button
              id="nav-tab-mood"
              onClick={() => setActiveTab('mood')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'mood'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
              }`}
            >
              <Smile className="w-4 h-4" />
              <span>Mood Vault</span>
              {isVaultUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
              )}
            </button>

            <button
              id="nav-tab-habits"
              onClick={() => setActiveTab('habits')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'habits'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Habits</span>
            </button>
          </nav>
        )}

        {/* Right Status & Profile Controls */}
        <div className="flex items-center gap-3">
          {/* Network / Offline & Sync Indicator */}
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full animate-pulse">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline Mode</span>
              </span>
            )}

            {/* Pending Sync Button if items queued */}
            {pendingSyncCount > 0 && (
              <button
                id="btn-sync-pending"
                onClick={onManualSync}
                disabled={isSyncing || !isOnline}
                title="Sync offline saved entries with Firestore"
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-full shadow-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount} Pending</span>
              </button>
            )}
          </div>

          {/* User Profile & Sign Out */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
              {/* Vault Quick Lock/Unlock */}
              <button
                id="btn-toggle-vault"
                onClick={onToggleVaultModal}
                title={isVaultUnlocked ? 'Encryption Vault Unlocked' : 'Vault Locked - Click to Unlock'}
                className={`p-2 rounded-lg border transition-colors ${
                  isVaultUnlocked
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {isVaultUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>

              {/* User Avatar */}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-100 flex items-center justify-center font-medium text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}

              {/* Sign Out Button */}
              <button
                id="btn-sign-out"
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      {user && (
        <div className="md:hidden flex items-center justify-around border-t border-stone-200 bg-white py-2 px-3">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex flex-col items-center gap-1 text-xs ${
              activeTab === 'journal' ? 'text-stone-900 font-semibold' : 'text-stone-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Reflect</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 text-xs ${
              activeTab === 'history' ? 'text-stone-900 font-semibold' : 'text-stone-500'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Archive</span>
          </button>
          <button
            onClick={() => setActiveTab('mood')}
            className={`flex flex-col items-center gap-1 text-xs ${
              activeTab === 'mood' ? 'text-stone-900 font-semibold' : 'text-stone-500'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Mood</span>
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex flex-col items-center gap-1 text-xs ${
              activeTab === 'habits' ? 'text-stone-900 font-semibold' : 'text-stone-500'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Habits</span>
          </button>
        </div>
      )}
    </header>
  );
};
