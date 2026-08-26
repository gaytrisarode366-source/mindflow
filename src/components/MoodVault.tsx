import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { MoodLog } from '../types';
import { saveEncryptedMoodLog, subscribeMoodLogs } from '../lib/firebase';
import { 
  encryptData, 
  decryptData, 
  getStoredVaultKey, 
  getOrCreateVaultSalt 
} from '../lib/crypto';
import { 
  Smile, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Zap, 
  Heart, 
  Plus, 
  Clock, 
  Calendar, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface MoodVaultProps {
  user: User;
  isVaultUnlocked: boolean;
  onOpenVaultModal: () => void;
  isOnline: boolean;
}

const VALENCE_LEVELS = [
  { score: 1, label: 'Heavy / Distressed', emoji: '🌧️' },
  { score: 2, label: 'Low / Depleted', emoji: '☁️' },
  { score: 3, label: 'Balanced / Neutral', emoji: '⛅' },
  { score: 4, label: 'Content / Good', emoji: '🌤️' },
  { score: 5, label: 'Radiant / Thriving', emoji: '☀️' },
];

const ENERGY_LEVELS = [
  { score: 1, label: 'Exhausted' },
  { score: 2, label: 'Low Energy' },
  { score: 3, label: 'Moderate' },
  { score: 4, label: 'High Focus' },
  { score: 5, label: 'Electrified' },
];

export const MoodVault: React.FC<MoodVaultProps> = ({
  user,
  isVaultUnlocked,
  onOpenVaultModal,
  isOnline,
}) => {
  const [moodScore, setMoodScore] = useState<number>(4);
  const [energyScore, setEnergyScore] = useState<number>(3);
  const [privateNote, setPrivateNote] = useState<string>('');
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [decryptedLogs, setDecryptedLogs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Subscribe to mood logs from Firestore
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeMoodLogs(user.uid, (logs) => {
      setMoodLogs(logs);
    });
    return () => unsubscribe();
  }, [user]);

  // Decrypt logs when vault unlocked
  useEffect(() => {
    const key = getStoredVaultKey();
    if (!isVaultUnlocked || !key || moodLogs.length === 0) {
      setDecryptedLogs({});
      return;
    }

    const salt = getOrCreateVaultSalt();
    const newDecrypted: Record<string, string> = {};

    const runDecryption = async () => {
      for (const log of moodLogs) {
        if (log.encryptedData && log.iv) {
          try {
            const text = await decryptData(log.encryptedData, log.iv, salt, key);
            newDecrypted[log.id] = text;
          } catch (e) {
            newDecrypted[log.id] = '[Decryption Failed: Key Mismatch]';
          }
        }
      }
      setDecryptedLogs(newDecrypted);
    };

    runDecryption();
  }, [isVaultUnlocked, moodLogs]);

  const handleSaveMood = async () => {
    if (!user) return;
    const key = getStoredVaultKey();
    if (!isVaultUnlocked || !key) {
      onOpenVaultModal();
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const salt = getOrCreateVaultSalt();
      const encrypted = await encryptData(privateNote.trim() || 'No sensitive note attached.', key, salt);

      const moodRecord: MoodLog = {
        id: `mood_${Date.now()}`,
        userId: user.uid,
        encryptedData: encrypted.ciphertext,
        iv: encrypted.iv,
        moodScore,
        energyScore,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await saveEncryptedMoodLog(user.uid, moodRecord);
      setPrivateNote('');
      setSuccessMessage('Encrypted mood check-in saved to Firestore!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to save encrypted mood log:', err);
      setErrorMessage(err.message || 'Failed to encrypt or save mood log.');
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics
  const avgMood = moodLogs.length > 0
    ? (moodLogs.reduce((acc, curr) => acc + curr.moodScore, 0) / moodLogs.length).toFixed(1)
    : 'N/A';
  const avgEnergy = moodLogs.length > 0
    ? (moodLogs.reduce((acc, curr) => acc + curr.energyScore, 0) / moodLogs.length).toFixed(1)
    : 'N/A';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-stone-900">Encrypted Mood Vault</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              AES-GCM 256
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Log subtle emotional shifts with zero-knowledge encryption. Data is unreadable without your passphrase.
          </p>
        </div>

        {/* Vault Unlock / Lock Button */}
        <button
          id="btn-mood-vault-auth"
          onClick={onOpenVaultModal}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
            isVaultUnlocked
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              : 'bg-stone-900 text-white hover:bg-stone-800'
          }`}
        >
          {isVaultUnlocked ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
          <span>{isVaultUnlocked ? 'Vault Unlocked' : 'Unlock Vault to Log'}</span>
        </button>
      </div>

      {/* Grid: Check-in Form + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Check-in Form */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-500" />
              <span>Log Mood & Energy</span>
            </h3>
            <span className="text-xs text-stone-500">{new Date().toLocaleDateString()}</span>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Valence / Emotional State */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              How are you feeling emotionally?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {VALENCE_LEVELS.map((item) => (
                <button
                  key={item.score}
                  id={`btn-valence-${item.score}`}
                  type="button"
                  onClick={() => setMoodScore(item.score)}
                  className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    moodScore === item.score
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold scale-105 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-[10px] leading-tight line-clamp-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Energy Level */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              What is your current energy level?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ENERGY_LEVELS.map((item) => (
                <button
                  key={item.score}
                  id={`btn-energy-${item.score}`}
                  type="button"
                  onClick={() => setEnergyScore(item.score)}
                  className={`p-2 rounded-xl border text-center text-xs transition-all flex flex-col items-center gap-0.5 ${
                    energyScore === item.score
                      ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold scale-105 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${energyScore === item.score ? 'text-sky-600' : 'text-stone-400'}`} />
                  <span className="text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Encrypted Private Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Encrypted Private Note</span>
              </label>
              <span className="text-[10px] text-stone-500">Encrypted on device</span>
            </div>
            <textarea
              id="textarea-private-note"
              value={privateNote}
              onChange={(e) => setPrivateNote(e.target.value)}
              placeholder={
                isVaultUnlocked
                  ? 'Write your unfiltered, vulnerable feelings here. Encrypted via AES-256 before upload...'
                  : 'Unlock your vault above to write encrypted private notes...'
              }
              disabled={!isVaultUnlocked}
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Save Button */}
          <button
            id="btn-save-mood-entry"
            onClick={handleSaveMood}
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-stone-300 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>{isSaving ? 'Encrypting & Saving...' : 'Save Encrypted Mood Check-in'}</span>
          </button>
        </div>

        {/* Right Column: Analytics & Quick Stats */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Stats Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Emotional Metrics</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
                <span className="text-[10px] font-semibold text-stone-500 uppercase">Avg Mood</span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">{avgMood} / 5</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
                <span className="text-[10px] font-semibold text-stone-500 uppercase">Avg Energy</span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">{avgEnergy} / 5</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
                <span className="text-[10px] font-semibold text-stone-500 uppercase">Logs</span>
                <p className="text-xl font-extrabold text-stone-900 mt-0.5">{moodLogs.length}</p>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Knowledge Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Every note is transformed into an encrypted cipher before cloud transit. Neither Firestore database operators nor unauthorized sessions can decrypt your logs without your client passphrase.
            </p>
          </div>

        </div>

      </div>

      {/* Mood History Log Feed */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-stone-500" />
          <span>Recent Mood Check-ins</span>
        </h3>

        {moodLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            No mood logs recorded yet. Complete your first check-in above!
          </div>
        ) : (
          <div className="space-y-3">
            {moodLogs.map((log) => {
              const valenceObj = VALENCE_LEVELS.find((v) => v.score === log.moodScore) || VALENCE_LEVELS[2];
              const energyObj = ENERGY_LEVELS.find((e) => e.score === log.energyScore) || ENERGY_LEVELS[2];
              const note = decryptedLogs[log.id];

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{valenceObj.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-stone-900">{valenceObj.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                          ⚡ {energyObj.label}
                        </span>
                      </div>
                      
                      <div className="mt-1 text-xs text-stone-700">
                        {isVaultUnlocked ? (
                          note ? (
                            <p className="italic text-stone-800 font-sans">"{note}"</p>
                          ) : (
                            <span className="text-stone-400 font-mono text-[11px]">No note attached</span>
                          )
                        ) : (
                          <span className="text-stone-400 font-mono text-[11px] flex items-center gap-1">
                            <Lock className="w-3 h-3 text-stone-400" />
                            [Encrypted Ciphertext: {log.encryptedData.slice(0, 16)}...]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-stone-600 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
