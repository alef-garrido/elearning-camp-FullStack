import { useState, useCallback, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { LessonProgressState, CourseLessonStates, Lesson } from '@/types/api';

interface UseLessonProgressReturn {
  lessonStates: CourseLessonStates;
  getState: (lessonId: string) => LessonProgressState;
  markInProgress: (lessonId: string) => Promise<void>;
  markComplete: (lessonId: string) => Promise<void>;
  isLocked: (lessonId: string) => boolean;
  canAccess: (lessonId: string) => boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Simplified lesson progress hook with explicit user control.
 * 
 * States:
 * - pending: lesson not started (unlocked)
 * - in-progress: lesson started by user
 * - completed: user marked as complete (unlocks next lesson)
 * - blocked: cannot access (prerequisite not met)
 * 
 * Users explicitly call markInProgress() and markComplete().
 * First lesson is always pending (unlocked).
 * Lessons unlock after previous is completed.
 */
export const useLessonProgress = (courseId: string, lessons: Lesson[] = []): UseLessonProgressReturn => {
  const [lessonStates, setLessonStates] = useState<CourseLessonStates>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const STORAGE_KEY = `course_progress_${courseId}`;

  // Initialize states from API and localStorage
  useEffect(() => {
    const initializeStates = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load from localStorage first and use it as a base so we don't
        // inadvertently reset user-completed lessons when the API response is
        // missing entries (intermittent syncs or race conditions).
        const cached = localStorage.getItem(STORAGE_KEY);
        let baseStates: CourseLessonStates = {};
        if (cached) {
          try {
            baseStates = JSON.parse(cached) as CourseLessonStates;
            setLessonStates(baseStates);
          } catch (e) {
            baseStates = {};
          }
        }

        // Fetch fresh data from API and merge with cached/base states
        if (courseId && lessons.length > 0) {
          try {
            const progressRes = await ApiClient.getCourseProgress(courseId);
            const newStates: CourseLessonStates = { ...baseStates };

            // Ensure every lesson has a sensible default if not present in base
            lessons.forEach((lesson, idx) => {
              if (!newStates[lesson._id]) {
                newStates[lesson._id] = idx === 0 ? 'pending' : 'blocked';
              }
            });

            // Update states based on API progress (API is the source of truth when present)
            progressRes.data?.forEach((prog: any) => {
              const lessonKey = String(prog.lesson);
              if (prog.completed) {
                newStates[lessonKey] = 'completed';
              } else if (prog.lastPositionSeconds && prog.lastPositionSeconds > 0) {
                newStates[lessonKey] = 'in-progress';
              }
            });

            // Unlock lessons sequentially (after each completion)
            lessons.forEach((lesson, idx) => {
              if (idx > 0) {
                const prevLesson = lessons[idx - 1];
                if (newStates[prevLesson._id] === 'completed') {
                  if (newStates[lesson._id] === 'blocked') {
                    newStates[lesson._id] = 'pending';
                  }
                }
              }
            });

            setLessonStates(newStates);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newStates));
          } catch (err) {
            console.warn('Could not fetch progress from API, using cached state:', err);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initializeStates();
  }, [courseId, lessons]);

  // Get current state of a lesson
  const getState = useCallback((lessonId: string): LessonProgressState => {
    return lessonStates[lessonId] || 'pending';
  }, [lessonStates]);

  // Check if a lesson is locked (blocked state only)
  const isLocked = useCallback((lessonId: string): boolean => {
    const state = getState(lessonId);
    return state === 'blocked';
  }, [getState]);

  // Check if a lesson can be accessed (not blocked)
  const canAccess = useCallback((lessonId: string): boolean => {
    return !isLocked(lessonId);
  }, [isLocked]);

  // Mark lesson as in-progress (user starts viewing)
  const markInProgress = useCallback(
    async (lessonId: string) => {
      try {
        setError(null);
        const currentState = getState(lessonId);

        // Only transition from pending to in-progress
        if (currentState === 'pending') {
          const updated = { ...lessonStates };
          updated[lessonId] = 'in-progress';
          setLessonStates(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

          // Sync with backend (optional position will be set by lesson component)
          if (courseId) {
            try {
              await ApiClient.updateLessonProgress(courseId, lessonId, {
                completed: false,
                lastPositionSeconds: 0,
              });
            } catch (err) {
              console.warn('Failed to sync progress with backend:', err);
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update progress';
        setError(message);
        throw err;
      }
    },
    [courseId, lessonStates, getState]
  );

  // Mark lesson as completed (user explicitly marks complete)
  const markComplete = useCallback(
    async (lessonId: string) => {
      try {
        setError(null);
        const updated = { ...lessonStates };
        updated[lessonId] = 'completed';

        // Unlock next lesson if this was the last unlocked lesson
        const lessonIndex = lessons.findIndex(l => l._id === lessonId);
        if (lessonIndex >= 0 && lessonIndex + 1 < lessons.length) {
          const nextLessonId = lessons[lessonIndex + 1]._id;
          if (updated[nextLessonId] === 'blocked') {
            updated[nextLessonId] = 'pending';
          }
        }

        setLessonStates(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Sync with backend
        if (courseId) {
          try {
            await ApiClient.updateLessonProgress(courseId, lessonId, {
              completed: true,
              lastPositionSeconds: 0,
            });
          } catch (err) {
            console.warn('Failed to sync completion with backend:', err);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark complete';
        setError(message);
        throw err;
      }
    },
    [courseId, lessons, lessonStates]
  );

  return {
    lessonStates,
    getState,
    markInProgress,
    markComplete,
    isLocked,
    canAccess,
    loading,
    error,
  };
};

export default useLessonProgress;

