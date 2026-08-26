import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { Habit } from '../types';
import { saveHabitRecord, deleteHabitRecord, subscribeHabits } from '../lib/firebase';
import { 
  Flame, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Trophy, 
  Sparkles, 
  Calendar, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface HabitStreaksProps {
  user: User;
  isOnline: boolean;
}

const DEFAULT_SUGGESTIONS = [
  '5-Minute Morning Journaling',
  'Evening Gratitude Reflection',
  'Mindful Breathing (4-7-8 loop)',
  'Daily Outdoor Walk & Clarity Check',
  'Digital Sunset 30m Before Sleep',
];

// Helper to get formatted date YYYY-MM-DD
function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// Compute streak from completed dates array
function calculateStreak(completedDates: string[]): { current: number; longest: number } {
  if (!completedDates || completedDates.length === 0) return { current: 0, longest: 0 };
  
  const sorted = Array.from(new Set(completedDates)).sort();
  const today = getTodayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sorted) {
    const currDate = new Date(dateStr);
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = currDate;
  }

  // Check if current streak includes today or yesterday
  const hasToday = sorted.includes(today);
  const hasYesterday = sorted.includes(yesterday);

  if (hasToday || hasYesterday) {
    // Traverse backwards from last element
    let count = 0;
    let checkDate = hasToday ? new Date(today) : new Date(yesterday);

    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (sorted.includes(dateKey)) {
        count++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
    currentStreak = count;
  } else {
    currentStreak = 0;
  }

  return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
}

export const HabitStreaks: React.FC<HabitStreaksProps> = ({ user, isOnline }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = getTodayString();

  // Subscribe to user habits
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeHabits(user.uid, (data) => {
      setHabits(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleToggleHabit = async (habit: Habit) => {
    if (!user) return;
    try {
      const completed = habit.completedDates || [];
      const isCompletedToday = completed.includes(todayStr);

      let newCompleted: string[];
      if (isCompletedToday) {
        newCompleted = completed.filter((d) => d !== todayStr);
      } else {
        newCompleted = [...completed, todayStr];
        // Trigger celebratory confetti!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      const { current, longest } = calculateStreak(newCompleted);

      const updatedHabit: Habit = {
        ...habit,
        completedDates: newCompleted,
        streakCurrent: current,
        streakLongest: Math.max(habit.streakLongest || 0, longest),
        updatedAt: new Date().toISOString(),
      };

      await saveHabitRecord(user.uid, updatedHabit);
    } catch (err: any) {
      console.error('Failed to toggle habit:', err);
      setErrorMessage(err.message || 'Failed to update habit.');
    }
  };

  const handleAddHabit = async (titleToAdd?: string) => {
    const finalTitle = (titleToAdd || newHabitTitle).trim();
    if (!finalTitle || !user) return;

    setIsAdding(true);
    setErrorMessage(null);

    try {
      const newHabit: Habit = {
        id: `habit_${Date.now()}`,
        userId: user.uid,
        title: finalTitle,
        frequency: 'daily',
        streakCurrent: 0,
        streakLongest: 0,
        completedDates: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveHabitRecord(user.uid, newHabit);
      setNewHabitTitle('');
    } catch (err: any) {
      console.error('Failed to add habit:', err);
      setErrorMessage(err.message || 'Failed to create habit.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;
    try {
      await deleteHabitRecord(user.uid, habitId);
    } catch (err: any) {
      console.error('Failed to delete habit:', err);
    }
  };

  // Get total streak points
  const totalActiveStreaks = habits.reduce((acc, h) => acc + (h.streakCurrent || 0), 0);
  const completedTodayCount = habits.filter((h) => (h.completedDates || []).includes(todayStr)).length;

  // Render past 7 days for mini heatmap
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-stone-900">Habit Formation & Streaks</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold border border-orange-200 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-600" />
              <span>{totalActiveStreaks} Days Total</span>
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Anchor your journal reflections into micro-routines. Check in daily to build unbreakable consistency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-center min-w-[90px]">
            <span className="text-[10px] font-semibold text-stone-500 uppercase">Today's Goal</span>
            <p className="text-base font-extrabold text-stone-900 mt-0.5">
              {completedTodayCount} / {habits.length}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Add Habit Form */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddHabit();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-new-habit"
            type="text"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="Name a new reflection or wellness habit (e.g. 5m mindful reflection)..."
            className="flex-1 px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
          />
          <button
            id="btn-create-habit"
            type="submit"
            disabled={isAdding || !newHabitTitle.trim()}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Habit</span>
          </button>
        </form>

        {/* AI Suggested Routine Sparks */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Suggested Sparks:</span>
          </span>
          {DEFAULT_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddHabit(sug)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-stone-700 hover:text-orange-900 transition-colors"
            >
              + {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Habit Cards List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center text-stone-500 shadow-xs">
            <Flame className="w-10 h-10 text-orange-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-stone-800">No habits tracked yet</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Start by typing a habit above or click one of the suggested sparks to begin building your streak!
            </p>
          </div>
        ) : (
          habits.map((habit) => {
            const isCompletedToday = (habit.completedDates || []).includes(todayStr);
            const currentStreak = habit.streakCurrent || 0;
            const longestStreak = habit.streakLongest || 0;

            return (
              <div
                key={habit.id}
                className={`p-5 rounded-3xl border transition-all bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompletedToday ? 'border-emerald-300 bg-emerald-50/20' : 'border-stone-200'
                }`}
              >
                
                {/* Check-in button and Title */}
                <div className="flex items-center gap-3 flex-1">
                  <button
                    id={`btn-toggle-habit-${habit.id}`}
                    onClick={() => handleToggleHabit(habit)}
                    className={`p-2 rounded-2xl transition-transform active:scale-90 cursor-pointer ${
                      isCompletedToday
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-600 border border-stone-300'
                    }`}
                  >
                    {isCompletedToday ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>

                  <div>
                    <h3 className={`text-sm font-semibold ${isCompletedToday ? 'text-stone-900 line-through opacity-80' : 'text-stone-900'}`}>
                      {habit.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1 font-medium text-orange-600">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        <span>{currentStreak} day streak</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span>Best: {longestStreak} days</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7-Day Mini Heatmap */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {past7Days.map((dStr, idx) => {
                      const isDone = (habit.completedDates || []).includes(dStr);
                      const isTargetToday = dStr === todayStr;
                      return (
                        <div
                          key={idx}
                          title={`${dStr}: ${isDone ? 'Completed' : 'Missed'}`}
                          className={`w-5 h-5 rounded-md text-[9px] flex items-center justify-center font-mono ${
                            isDone
                              ? 'bg-emerald-500 text-white font-bold'
                              : isTargetToday
                              ? 'bg-stone-200 border border-stone-300 text-stone-600'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {new Date(dStr).toLocaleDateString([], { weekday: 'narrow' })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Delete button */}
                  <button
                    id={`btn-delete-habit-${habit.id}`}
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
