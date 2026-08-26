import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { JournalEntry, ChatMessage, SummaryExtraction, Habit } from '../types';
import { GeminiReflectionPanel } from './GeminiReflectionPanel';
import { saveJournalEntry, saveHabitRecord } from '../lib/firebase';
import { queueOfflineEntry, saveLocalDraft, getLocalDraft, clearLocalDraft } from '../lib/offlineStore';
import { fetchWritingSparks } from '../lib/api';
import { 
  Save, 
  Sparkles, 
  Tag, 
  Smile, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Layers, 
  Plus, 
  X,
  FileText,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface JournalEditorProps {
  user: User;
  initialEntry?: JournalEntry | null;
  onEntrySaved: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  isOnline: boolean;
}

const MOOD_OPTIONS = [
  { label: 'Radiant', emoji: '✨', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { label: 'Peaceful', emoji: '🌿', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { label: 'Grateful', emoji: '🙏', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { label: 'Reflective', emoji: '🌊', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { label: 'Anxious', emoji: '⚡', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { label: 'Fatigued', emoji: '🌙', color: 'bg-purple-100 text-purple-800 border-purple-300' },
];

const SPARK_CATEGORIES = [
  'Gratitude & Joy',
  'Emotional Clarity',
  'Stoic Reflection',
  'Habit & Focus',
  'Evening Decompression',
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  user,
  initialEntry,
  onEntrySaved,
  onNewEntry,
  isOnline,
}) => {
  const [entryId, setEntryId] = useState<string>(initialEntry?.id || `entry_${Date.now()}`);
  const [title, setTitle] = useState<string>(initialEntry?.title || '');
  const [content, setContent] = useState<string>(initialEntry?.content || '');
  const [mood, setMood] = useState<string>(initialEntry?.mood || 'Reflective');
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || ['Reflection']);
  const [tagInput, setTagInput] = useState<string>('');
  const [summary, setSummary] = useState<string>(initialEntry?.summary || '');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(initialEntry?.keyTakeaways || []);
  const [actionItems, setActionItems] = useState<string[]>(initialEntry?.actionItems || []);
  const [conversation, setConversation] = useState<ChatMessage[]>(initialEntry?.conversation || []);
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Spark Prompts State
  const [selectedSparkCategory, setSelectedSparkCategory] = useState<string>('Gratitude & Joy');
  const [sparksList, setSparksList] = useState<string[]>([]);
  const [isLoadingSparks, setIsLoadingSparks] = useState<boolean>(false);
  const [suggestedHabit, setSuggestedHabit] = useState<string | null>(null);
  const [habitAdopted, setHabitAdopted] = useState<boolean>(false);

  // Sync state if initialEntry changes
  useEffect(() => {
    if (initialEntry) {
      setEntryId(initialEntry.id);
      setTitle(initialEntry.title);
      setContent(initialEntry.content);
      setMood(initialEntry.mood || 'Reflective');
      setTags(initialEntry.tags || ['Reflection']);
      setSummary(initialEntry.summary || '');
      setKeyTakeaways(initialEntry.keyTakeaways || []);
      setActionItems(initialEntry.actionItems || []);
      setConversation(initialEntry.conversation || []);
      setSaveSuccess(false);
      setErrorMessage(null);
    } else {
      // Check local draft
      const draft = getLocalDraft();
      if (draft && draft.content) {
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setMood(draft.mood || 'Reflective');
        setTags(draft.tags || ['Reflection']);
      }
    }
  }, [initialEntry]);

  // Auto-save local draft on edits
  useEffect(() => {
    if (!initialEntry && (title || content)) {
      saveLocalDraft({ title, content, mood, tags });
    }
  }, [title, content, mood, tags, initialEntry]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFetchSparks = async () => {
    setIsLoadingSparks(true);
    try {
      const sparks = await fetchWritingSparks(selectedSparkCategory, mood);
      setSparksList(sparks);
    } catch (e) {
      setSparksList([
        'What was the most meaningful moment of your day and why?',
        'What is something challenging you are navigating right now?',
        'What is one small victory you are grateful for today?',
      ]);
    } finally {
      setIsLoadingSparks(false);
    }
  };

  const handleApplySpark = (sparkPrompt: string) => {
    if (content) {
      setContent(content + '\n\n**Prompt:** ' + sparkPrompt + '\n');
    } else {
      setContent('**Prompt:** ' + sparkPrompt + '\n\n');
      if (!title) {
        setTitle(sparkPrompt.slice(0, 45) + '...');
      }
    }
  };

  const handleApplySummary = (summaryData: SummaryExtraction) => {
    setSummary(summaryData.summary);
    if (summaryData.keyTakeaways) setKeyTakeaways(summaryData.keyTakeaways);
    if (summaryData.actionItems) setActionItems(summaryData.actionItems);
    if (summaryData.detectedMood) setMood(summaryData.detectedMood);
    if (summaryData.suggestedTags) {
      const merged = Array.from(new Set([...tags, ...summaryData.suggestedTags]));
      setTags(merged);
    }
    if (summaryData.suggestedHabit) {
      setSuggestedHabit(summaryData.suggestedHabit);
      setHabitAdopted(false);
    }
  };

  const handleAdoptHabit = async () => {
    if (!suggestedHabit || !user) return;
    try {
      const newHabit: Habit = {
        id: `habit_${Date.now()}`,
        userId: user.uid,
        title: suggestedHabit,
        frequency: 'daily',
        streakCurrent: 0,
        streakLongest: 0,
        completedDates: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveHabitRecord(user.uid, newHabit);
      setHabitAdopted(true);
    } catch (e) {
      console.error('Failed to adopt habit', e);
    }
  };

  const handleSaveEntry = async () => {
    const finalTitle = title.trim() || 'Reflection on ' + new Date().toLocaleDateString();
    if (!content.trim()) {
      setErrorMessage('Please write some reflection content before saving.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    const now = new Date().toISOString();
    const entryPayload: JournalEntry = {
      id: entryId,
      userId: user.uid,
      title: finalTitle,
      content,
      mood,
      tags,
      summary: summary || undefined,
      keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : undefined,
      actionItems: actionItems.length > 0 ? actionItems : undefined,
      conversation: conversation.length > 0 ? conversation : undefined,
      wordCount,
      isOfflineDraft: !isOnline,
      createdAt: initialEntry?.createdAt || now,
      updatedAt: now,
    };

    try {
      if (isOnline) {
        await saveJournalEntry(user.uid, entryPayload);
      } else {
        // Queue for background sync
        queueOfflineEntry(user.uid, entryPayload);
      }

      clearLocalDraft();
      setSaveSuccess(true);
      onEntrySaved(entryPayload);

      // Auto-hide success state after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMessage(err.message || 'Failed to save entry to Cloud Firestore. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Rich Journal Editor Canvas */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Editor Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          
          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Reflection Canvas</span>
              {initialEntry && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono">Editing Archive</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-new-reflection"
                onClick={onNewEntry}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Blank</span>
              </button>

              <button
                id="btn-save-reflection"
                onClick={handleSaveEntry}
                disabled={isSaving}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-98'
                } disabled:opacity-50`}
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved to Vault!' : 'Save Entry'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Save Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Title Input */}
          <div>
            <input
              id="input-entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title your reflection or theme..."
              className="w-full text-xl sm:text-2xl font-bold text-stone-900 placeholder:text-stone-400 border-0 focus:outline-hidden focus:ring-0 p-0"
            />
          </div>

          {/* Mood Selection Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-stone-600 flex items-center gap-1 mr-1">
              <Smile className="w-3.5 h-3.5 text-stone-600" />
              <span>Mood:</span>
            </span>
            {MOOD_OPTIONS.map((item) => {
              const isSelected = mood === item.label;
              return (
                <button
                  key={item.label}
                  id={`btn-mood-${item.label.toLowerCase()}`}
                  onClick={() => setMood(item.label)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                    isSelected
                      ? `${item.color} shadow-xs scale-105 font-semibold`
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Spark Prompts Expander */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-stone-800">Introspective Prompt Sparks</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  id="select-spark-category"
                  value={selectedSparkCategory}
                  onChange={(e) => setSelectedSparkCategory(e.target.value)}
                  className="text-xs bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-700 focus:outline-hidden"
                >
                  {SPARK_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  id="btn-fetch-sparks"
                  onClick={handleFetchSparks}
                  disabled={isLoadingSparks}
                  className="text-xs px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {isLoadingSparks ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-300" />}
                  <span>Generate</span>
                </button>
              </div>
            </div>

            {sparksList.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {sparksList.map((spark, idx) => (
                  <button
                    key={idx}
                    id={`btn-spark-item-${idx}`}
                    onClick={() => handleApplySpark(spark)}
                    className="text-left text-xs p-2 rounded-lg bg-white border border-stone-200/80 hover:border-amber-400 hover:bg-amber-50/50 text-stone-800 transition-colors flex items-start gap-2"
                  >
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>{spark}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Journal Content Area */}
          <div>
            <textarea
              id="textarea-entry-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Pour out your reflections, thoughts, challenges, or insights here. Take your time..."
              rows={12}
              className="w-full text-stone-800 text-sm leading-relaxed p-3.5 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:border-stone-400 bg-stone-50/50 focus:bg-white resize-y"
            />
          </div>

          {/* Tags Manager & Word Count Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
            
            {/* Tags Area */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-600" />
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1">
                <input
                  id="input-tag"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag..."
                  className="text-xs px-2 py-0.5 bg-stone-50 border border-stone-200 rounded-md w-20 focus:w-28 transition-all focus:outline-hidden focus:bg-white"
                />
                <button
                  id="btn-add-tag"
                  onClick={handleAddTag}
                  className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Read Time & Word Count */}
            <div className="flex items-center gap-3 text-xs text-stone-700 font-mono">
              <span>{wordCount} words</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{readTimeMin} min read</span>
              </span>
            </div>

          </div>

        </div>

        {/* AI Synthesis Card (Appears if summary or action items generated) */}
        {(summary || keyTakeaways.length > 0 || actionItems.length > 0 || suggestedHabit) && (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>AI Synthesis & Cognitive Takeaways</span>
            </div>

            {summary && (
              <p className="text-xs text-stone-800 leading-relaxed italic bg-white/70 p-3 rounded-xl border border-amber-200/60">
                "{summary}"
              </p>
            )}

            {keyTakeaways.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">Key Insights:</span>
                <ul className="mt-1 space-y-1">
                  {keyTakeaways.map((item, idx) => (
                    <li key={idx} className="text-xs text-stone-800 flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {actionItems.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">Action Items:</span>
                <ul className="mt-1 space-y-1">
                  {actionItems.map((item, idx) => (
                    <li key={idx} className="text-xs text-stone-800 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {suggestedHabit && (
              <div className="mt-2 pt-3 border-t border-amber-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-stone-800 font-medium">Recommended Micro-Habit: <strong>{suggestedHabit}</strong></span>
                </div>
                <button
                  id="btn-adopt-habit"
                  onClick={handleAdoptHabit}
                  disabled={habitAdopted}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium shadow-xs transition-colors flex items-center gap-1 ${
                    habitAdopted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {habitAdopted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
                  <span>{habitAdopted ? 'Habit Added' : 'Track This Habit'}</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Right Column: Multi-turn Gemini AI Reflection Panel */}
      <div className="lg:col-span-5 h-[620px] sticky top-20">
        <GeminiReflectionPanel
          entryTitle={title}
          entryContent={content}
          entryMood={mood}
          conversation={conversation}
          onUpdateConversation={setConversation}
          onApplySummary={handleApplySummary}
          isOffline={!isOnline}
        />
      </div>

    </div>
  );
};
