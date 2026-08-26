import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './lib/firebase';
import { getStoredVaultKey } from './lib/crypto';
import { getPendingSyncQueue, flushPendingSyncQueue } from './lib/offlineStore';
import { ViewTab, JournalEntry } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { JournalEditor } from './components/JournalEditor';
import { EntryHistory } from './components/EntryHistory';
import { MoodVault } from './components/MoodVault';
import { HabitStreaks } from './components/HabitStreaks';
import { VaultModal } from './components/VaultModal';
import { OfflineBanner } from './components/OfflineBanner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ViewTab>('journal');
  const [activeEditEntry, setActiveEditEntry] = useState<JournalEntry | null>(null);

  // Network & Offline Status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Encryption Vault State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(Boolean(getStoredVaultKey()));
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);

  // Sync Queue Update
  const updatePendingCount = useCallback(() => {
    const queue = getPendingSyncQueue();
    setPendingSyncCount(queue.length);
  }, []);

  // Auto-sync flush on reconnect
  const handleTriggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await flushPendingSyncQueue();
      updatePendingCount();
    } catch (e) {
      console.error('Sync flush failed', e);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updatePendingCount]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Network State & Sync Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleTriggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleQueueEvent = () => {
      updatePendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mindflow:sync-status-changed', handleQueueEvent);

    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mindflow:sync-status-changed', handleQueueEvent);
    };
  }, [handleTriggerSync, updatePendingCount]);

  // Handle Entry Selection from History to edit
  const handleSelectEntryToEdit = (entry: JournalEntry) => {
    setActiveEditEntry(entry);
    setActiveTab('journal');
  };

  const handleNewBlankEntry = () => {
    setActiveEditEntry(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-600 tracking-wide">Initializing MindFlow...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased text-stone-900 selection:bg-stone-200">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onManualSync={handleTriggerSync}
        isSyncing={isSyncing}
        isVaultUnlocked={isVaultUnlocked}
        onToggleVaultModal={() => setIsVaultModalOpen(true)}
        onSignOut={logOut}
      />

      {/* Offline Alert Banner */}
      <OfflineBanner
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onSyncNow={handleTriggerSync}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          <LandingPage onSignIn={async () => { await signInWithGoogle(); }} />
        ) : (
          <div>
            {activeTab === 'journal' && (
              <JournalEditor
                user={user}
                initialEntry={activeEditEntry}
                onEntrySaved={(saved) => {
                  setActiveEditEntry(saved);
                  updatePendingCount();
                }}
                onNewEntry={handleNewBlankEntry}
                isOnline={isOnline}
              />
            )}

            {activeTab === 'history' && (
              <EntryHistory
                user={user}
                onSelectEntryToEdit={handleSelectEntryToEdit}
                isOnline={isOnline}
              />
            )}

            {activeTab === 'mood' && (
              <MoodVault
                user={user}
                isVaultUnlocked={isVaultUnlocked}
                onOpenVaultModal={() => setIsVaultModalOpen(true)}
                isOnline={isOnline}
              />
            )}

            {activeTab === 'habits' && (
              <HabitStreaks
                user={user}
                isOnline={isOnline}
              />
            )}
          </div>
        )}
      </main>

      {/* Vault Password Modal */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        isUnlocked={isVaultUnlocked}
        onUnlockStateChanged={(unlocked) => setIsVaultUnlocked(unlocked)}
      />

    </div>
  );
}
