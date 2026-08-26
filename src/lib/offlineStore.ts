import { JournalEntry } from '../types';
import { saveJournalEntry } from './firebase';

const OFFLINE_DRAFTS_KEY = 'mindflow_offline_drafts';
const OFFLINE_PENDING_QUEUE_KEY = 'mindflow_offline_pending_sync';

export interface PendingSyncItem {
  id: string;
  userId: string;
  type: 'save_entry';
  payload: JournalEntry;
  timestamp: string;
}

// ---------------- Draft Storage ----------------

export function saveLocalDraft(entry: Partial<JournalEntry>): void {
  try {
    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(entry));
  } catch (e) {
    console.error('Failed to save local draft', e);
  }
}

export function getLocalDraft(): Partial<JournalEntry> | null {
  try {
    const raw = localStorage.getItem(OFFLINE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearLocalDraft(): void {
  localStorage.removeItem(OFFLINE_DRAFTS_KEY);
}

// ---------------- Offline Sync Queue ----------------

export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function queueOfflineEntry(userId: string, entry: JournalEntry): void {
  const queue = getPendingSyncQueue();
  // Replace if existing or append
  const existingIdx = queue.findIndex((item) => item.payload.id === entry.id);
  const newItem: PendingSyncItem = {
    id: entry.id,
    userId,
    type: 'save_entry',
    payload: entry,
    timestamp: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = newItem;
  } else {
    queue.push(newItem);
  }

  localStorage.setItem(OFFLINE_PENDING_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('mindflow:sync-status-changed'));
}

export async function flushPendingSyncQueue(): Promise<{ syncedCount: number; errors: number }> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) return { syncedCount: 0, errors: 0 };

  let syncedCount = 0;
  let errors = 0;
  const remainingQueue: PendingSyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'save_entry') {
        await saveJournalEntry(item.userId, {
          ...item.payload,
          isOfflineDraft: false,
        });
        syncedCount++;
      }
    } catch (err) {
      console.error('Failed to sync offline item:', item.id, err);
      errors++;
      remainingQueue.push(item);
    }
  }

  localStorage.setItem(OFFLINE_PENDING_QUEUE_KEY, JSON.stringify(remainingQueue));
  window.dispatchEvent(new CustomEvent('mindflow:sync-status-changed'));

  return { syncedCount, errors };
}
