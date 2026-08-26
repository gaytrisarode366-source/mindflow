import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { JournalEntry } from '../types';
import { subscribeJournalEntries, deleteJournalEntry } from '../lib/firebase';
import { 
  History, 
  Search, 
  Tag, 
  Smile, 
  Calendar, 
  Edit3, 
  Trash2, 
  Download, 
  Sparkles, 
  BookOpen, 
  Clock, 
  MessageSquare,
  ChevronRight,
  X
} from 'lucide-react';

interface EntryHistoryProps {
  user: User;
  onSelectEntryToEdit: (entry: JournalEntry) => void;
  isOnline: boolean;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  user,
  onSelectEntryToEdit,
  isOnline,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [activePreviewEntry, setActivePreviewEntry] = useState<JournalEntry | null>(null);

  // Subscribe to user entries
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeJournalEntries(user.uid, (data) => {
      setEntries(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []).filter(Boolean))
  );

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      (entry.summary && entry.summary.toLowerCase().includes(query));

    const matchesMood =
      selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;

    const matchesTag =
      selectedTagFilter === 'all' || (entry.tags && entry.tags.includes(selectedTagFilter));

    return matchesSearch && matchesMood && matchesTag;
  });

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm('Are you sure you want to delete this reflection?')) {
      await deleteJournalEntry(user.uid, entryId);
      if (activePreviewEntry?.id === entryId) {
        setActivePreviewEntry(null);
      }
    }
  };

  const handleExportMarkdown = (entry: JournalEntry) => {
    let md = `# ${entry.title}\n\n`;
    md += `**Date:** ${new Date(entry.createdAt).toLocaleString()}\n`;
    if (entry.mood) md += `**Mood:** ${entry.mood}\n`;
    if (entry.tags && entry.tags.length > 0) md += `**Tags:** ${entry.tags.join(', ')}\n`;
    md += `\n---\n\n## Content\n\n${entry.content}\n\n`;

    if (entry.summary) {
      md += `## AI Summary\n\n${entry.summary}\n\n`;
    }

    if (entry.keyTakeaways && entry.keyTakeaways.length > 0) {
      md += `## Key Takeaways\n\n${entry.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n\n`;
    }

    if (entry.actionItems && entry.actionItems.length > 0) {
      md += `## Action Items\n\n${entry.actionItems.map((a) => `- [ ] ${a}`).join('\n')}\n\n`;
    }

    if (entry.conversation && entry.conversation.length > 0) {
      md += `## Reflection Dialogue\n\n`;
      for (const msg of entry.conversation) {
        const role = msg.role === 'user' ? 'User' : 'Gemini AI';
        md += `### ${role} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n${msg.text}\n\n`;
      }
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_reflection.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner & Filters */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-stone-900">Archive & Reflection History</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold border border-stone-200">
                {entries.length} Entries
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Browse, search, and export your personal journey and conversational dialogues.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-stone-100">
          
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <input
              id="input-search-entries"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, insights, or takeaways..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>

          {/* Mood Filter */}
          <div className="sm:col-span-3">
            <select
              id="select-filter-mood"
              value={selectedMoodFilter}
              onChange={(e) => setSelectedMoodFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Moods</option>
              <option value="Radiant">✨ Radiant</option>
              <option value="Peaceful">🌿 Peaceful</option>
              <option value="Grateful">🙏 Grateful</option>
              <option value="Reflective">🌊 Reflective</option>
              <option value="Anxious">⚡ Anxious</option>
              <option value="Fatigued">🌙 Fatigued</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div className="sm:col-span-3">
            <select
              id="select-filter-tag"
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-500 shadow-xs">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-70" />
          <h4 className="text-sm font-semibold text-stone-800">No reflections found</h4>
          <p className="text-xs text-stone-500 mt-1">
            {searchQuery || selectedMoodFilter !== 'all' || selectedTagFilter !== 'all'
              ? 'Try adjusting your search criteria.'
              : 'Write your first journal reflection in the Reflect tab to populate your archive.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const hasConversation = entry.conversation && entry.conversation.length > 0;
            return (
              <div
                key={entry.id}
                onClick={() => setActivePreviewEntry(entry)}
                className="bg-white border border-stone-200 hover:border-stone-400 rounded-3xl p-5 shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Card Top Meta */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </span>

                    {entry.mood && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 font-medium text-stone-700 border border-stone-200">
                        {entry.mood}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1 mb-2">
                    {entry.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-3">
                    {entry.content}
                  </p>

                  {/* AI Summary Quote if any */}
                  {entry.summary && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 italic line-clamp-2 mb-3">
                      ✨ "{entry.summary}"
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-3">
                      {entry.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom Controls */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-stone-500">
                    <span>{entry.wordCount || entry.content.split(/\s+/).length} words</span>
                    {hasConversation && (
                      <span className="flex items-center gap-1 text-stone-700 font-medium">
                        <MessageSquare className="w-3 h-3 text-stone-500" />
                        <span>{entry.conversation?.length} AI turns</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      title="Load into Editor"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntryToEdit(entry);
                      }}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      title="Export as Markdown"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportMarkdown(entry);
                      }}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      title="Delete Entry"
                      onClick={(e) => handleDelete(e, entry.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Entry Full Preview Modal */}
      {activePreviewEntry && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative space-y-5">
            
            {/* Close */}
            <button
              onClick={() => setActivePreviewEntry(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-stone-500">
                  {new Date(activePreviewEntry.createdAt).toLocaleString()}
                </span>
                {activePreviewEntry.mood && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 font-medium">
                    {activePreviewEntry.mood}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-stone-900">{activePreviewEntry.title}</h2>
            </div>

            {/* Content Body */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
              {activePreviewEntry.content}
            </div>

            {/* AI Summary Block */}
            {activePreviewEntry.summary && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>AI Synthesized Summary</span>
                </div>
                <p className="italic leading-relaxed">{activePreviewEntry.summary}</p>

                {activePreviewEntry.keyTakeaways && activePreviewEntry.keyTakeaways.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/70">
                    <span className="font-semibold text-amber-900">Key Takeaways:</span>
                    <ul className="mt-1 space-y-1">
                      {activePreviewEntry.keyTakeaways.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* AI Multi-Turn Dialogue */}
            {activePreviewEntry.conversation && activePreviewEntry.conversation.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Gemini Reflection Dialogue ({activePreviewEntry.conversation.length} turns)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-stone-50 rounded-2xl border border-stone-200">
                  {activePreviewEntry.conversation.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-stone-900 text-white ml-6'
                          : 'bg-white border border-stone-200 text-stone-800 mr-6'
                      }`}
                    >
                      <span className="text-[10px] opacity-70 block mb-0.5">
                        {msg.role === 'user' ? 'User' : 'Gemini AI'}
                      </span>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => handleExportMarkdown(activePreviewEntry)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Markdown</span>
              </button>

              <button
                onClick={() => {
                  onSelectEntryToEdit(activePreviewEntry);
                  setActivePreviewEntry(null);
                }}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Open in Canvas</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
