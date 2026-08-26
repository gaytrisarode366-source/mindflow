export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  summary?: string;
  keyTakeaways?: string[];
  actionItems?: string[];
  conversation?: ChatMessage[];
  wordCount?: number;
  isOfflineDraft?: boolean;
  encryptedMoodPayload?: {
    ciphertext: string;
    iv: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streakCurrent: number;
  streakLongest: number;
  completedDates: string[]; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface MoodLog {
  id: string;
  userId: string;
  encryptedData: string;
  iv: string;
  moodScore: number; // 1 to 5 (Terrible, Down, Neutral, Good, Radiant)
  energyScore: number; // 1 to 5 (Drained to Highly Energized)
  timestamp: string;
  createdAt: string;
  decryptedNote?: string; // client-side transient only
}

export interface SummaryExtraction {
  summary: string;
  keyTakeaways: string[];
  actionItems: string[];
  detectedMood?: string;
  suggestedTags?: string[];
  suggestedHabit?: string;
}

export type ViewTab = 'journal' | 'history' | 'mood' | 'habits' | 'settings';
