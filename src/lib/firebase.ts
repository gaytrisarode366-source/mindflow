import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, Habit, MoodLog, UserProfile } from '../types';

// Helper to remove undefined values before Firestore writes to prevent crashes
export function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = sanitizePayload(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Enable Firestore Offline Persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not supported in this browser.');
    }
  });
} catch (e) {
  // Persistence already initialized or unhandled
}

// Configure Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Auth Functions
export async function signInWithGoogle(): Promise<User> {
  await setPersistence(auth, browserLocalPersistence);
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Sync user profile record
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const now = new Date().toISOString();

  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'MindFlow User',
      photoURL: user.photoURL,
      createdAt: now,
      lastLoginAt: now,
    };
    await setDoc(userRef, sanitizePayload(profile));
  } else {
    await setDoc(userRef, { lastLoginAt: now }, { merge: true });
  }

  return user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// ----------------- Journal Entries -----------------

export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('User ID is required to save an entry.');
  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  const sanitized = sanitizePayload({
    ...entry,
    userId,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(entryRef, sanitized, { merge: true });
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

export function subscribeJournalEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) return () => {};
  const entriesCol = collection(db, 'users', userId, 'entries');
  const q = query(entriesCol, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      onUpdate(entries);
    },
    (err) => {
      console.error('Firestore entries subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------- Habits & Streaks -----------------

export async function saveHabitRecord(userId: string, habit: Habit): Promise<void> {
  if (!userId) throw new Error('User ID is required to save habit.');
  const habitRef = doc(db, 'users', userId, 'habits', habit.id);
  const sanitized = sanitizePayload({
    ...habit,
    userId,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(habitRef, sanitized, { merge: true });
}

export async function deleteHabitRecord(userId: string, habitId: string): Promise<void> {
  if (!userId || !habitId) return;
  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  await deleteDoc(habitRef);
}

export function subscribeHabits(
  userId: string,
  onUpdate: (habits: Habit[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) return () => {};
  const habitsCol = collection(db, 'users', userId, 'habits');
  const q = query(habitsCol, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const habits: Habit[] = [];
      snapshot.forEach((docSnap) => {
        habits.push(docSnap.data() as Habit);
      });
      onUpdate(habits);
    },
    (err) => {
      console.error('Firestore habits subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------- Encrypted Mood Logs -----------------

export async function saveEncryptedMoodLog(userId: string, moodLog: MoodLog): Promise<void> {
  if (!userId) throw new Error('User ID is required to save mood log.');
  const moodRef = doc(db, 'users', userId, 'moodLogs', moodLog.id);
  const sanitized = sanitizePayload({
    ...moodLog,
    userId,
  });
  await setDoc(moodRef, sanitized, { merge: true });
}

export function subscribeMoodLogs(
  userId: string,
  onUpdate: (logs: MoodLog[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) return () => {};
  const moodCol = collection(db, 'users', userId, 'moodLogs');
  const q = query(moodCol, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: MoodLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as MoodLog);
      });
      onUpdate(logs);
    },
    (err) => {
      console.error('Firestore moodLogs subscription error:', err);
      if (onError) onError(err);
    }
  );
}
