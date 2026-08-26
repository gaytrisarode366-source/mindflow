import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { setStoredVaultKey, clearStoredVaultKey } from '../lib/crypto';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlockStateChanged: (unlocked: boolean) => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlockStateChanged,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isSettingNew, setIsSettingNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = () => {
    const trimmed = passphrase.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your encryption passphrase.');
      return;
    }
    if (trimmed.length < 6) {
      setErrorMsg('Passphrase should be at least 6 characters for strong AES-256 derivation.');
      return;
    }

    setStoredVaultKey(trimmed);
    onUnlockStateChanged(true);
    setErrorMsg(null);
    onClose();
  };

  const handleLockVault = () => {
    clearStoredVaultKey();
    onUnlockStateChanged(false);
    setPassphrase('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">Encrypted Mood Vault</h3>
            <p className="text-xs text-stone-500">Zero-Knowledge AES-GCM 256-bit Protection</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-stone-600 leading-relaxed mb-5">
          Your private mood notes and sensitive emotional logs are encrypted in your browser before being transmitted to Cloud Firestore. Only your master passphrase can derive the decryption key.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isUnlocked ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">Vault is currently Unlocked</p>
                <p className="text-[11px] text-emerald-700">Decryption key active in tab memory.</p>
              </div>
            </div>

            <button
              id="btn-lock-vault-now"
              onClick={handleLockVault}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Lock Vault & Purge Session Key
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlock();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Master Passphrase
              </label>
              <div className="relative">
                <input
                  id="input-vault-passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter secret passphrase (min 6 chars)..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <Key className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              id="btn-submit-unlock-vault"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Unlock Vault
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
