import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Flame, 
  WifiOff, 
  ArrowRight, 
  BookOpen, 
  Cpu, 
  Layers,
  AlertCircle
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await onSignIn();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMsg(err?.message || 'Authentication was cancelled or failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-stone-50 text-stone-900">
      {/* Main Landing Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 w-full flex-1 flex flex-col justify-center">
        
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 border border-stone-300/80 text-xs font-medium text-stone-800 shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-stone-700" />
            <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-tight mb-4">
            Private reflections, elevated by deep conversational intelligence.
          </h1>
          <p className="text-lg sm:text-xl text-stone-600 font-normal leading-relaxed">
            A sacred space for your thoughts with multi-turn AI introspection, zero-knowledge encrypted mood logs, and habit streaks that persist securely.
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="text-xs text-rose-700 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Primary Call to Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            id="btn-google-login"
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-stone-50 font-semibold shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-100 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"
                />
              </svg>
            )}
            <span className="text-base">{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 text-stone-400" />}
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Feature 1 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-stone-900 text-base mb-1">Gemini 3.6 Reflections</h2>
              <p className="text-stone-600 text-xs leading-relaxed">
                Engage in multi-turn dialogues with Gemini to unpack emotions, discover blind spots, and extract structured action items.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-medium text-stone-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-600" />
              <span>Resilient Multi-Model Ladder</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-stone-900 text-base mb-1">Encrypted Mood Vault</h2>
              <p className="text-stone-600 text-xs leading-relaxed">
                Client-side Web Crypto AES-GCM 256-bit encryption safeguards your most intimate mood logs before they touch Firestore.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-medium text-stone-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Zero-Knowledge Privacy</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-800 flex items-center justify-center mb-3">
                <Flame className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-stone-900 text-base mb-1">Habit Streaks</h2>
              <p className="text-stone-600 text-xs leading-relaxed">
                Transform journal realizations into daily actionable habits with streak tracking, milestone rewards, and AI habit sparks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-medium text-stone-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Daily Consistency Boost</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center mb-3">
                <WifiOff className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-stone-900 text-base mb-1">Offline-Ready Sync</h2>
              <p className="text-stone-600 text-xs leading-relaxed">
                Draft freely during flights or offline moments. Changes are queued locally and automatically synced on reconnection.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-medium text-stone-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sky-700" />
              <span>Uninterrupted Writing</span>
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-100/60 py-6 text-center text-xs text-stone-700">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MindFlow &copy; {new Date().getFullYear()} — Multi-Model AI & Cloud Firestore Isolation</span>
          <span className="text-stone-600 font-mono text-[11px]">Strict Owner-Bound Rules (`request.auth.uid == userId`)</span>
        </div>
      </footer>
    </div>
  );
};
