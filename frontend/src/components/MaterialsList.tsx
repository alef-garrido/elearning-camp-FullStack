import { Lesson, LessonProgressState } from '@/types/api';
import { CheckCircle, Lock, PlayCircle } from 'lucide-react';

interface MaterialsListProps {
  lessons: Lesson[];
  activeLessonId?: string;
  onLessonClick: (lesson: Lesson) => void;
  completedLessons?: string[]; // Deprecated: use lessonStates instead
  lessonStates?: { [lessonId: string]: LessonProgressState };
}

const MaterialsList = ({
  lessons,
  activeLessonId,
  onLessonClick,
  completedLessons = [],
  lessonStates = {},
}: MaterialsListProps) => {
  // Helper to get lesson state (prefer lessonStates, fall back to completedLessons)
  const getLessonState = (lessonId: string, index: number): LessonProgressState => {
    if (lessonStates[lessonId]) {
      return lessonStates[lessonId];
    }
    // Fallback to computed state from completedLessons
    if (completedLessons.includes(lessonId)) {
      return 'completed';
    }
    const lastCompletedIndex = lessons.reduce(
      (acc, l, i) => (completedLessons.includes(l._id) ? i : acc),
      -1
    );
    const unlockedUpTo = Math.max(0, lastCompletedIndex + 1);
    if (index > unlockedUpTo) {
      return 'blocked';
    }
    return index === 0 || index === unlockedUpTo ? 'pending' : 'blocked';
  };

  const getIcon = (state: LessonProgressState, isActive: boolean) => {
    if (state === 'completed') {
      return <CheckCircle className="text-green-500" size={20} />;
    }
    if (isActive) {
      return <PlayCircle className="text-blue-500" size={20} />;
    }
    if (state === 'blocked') {
      return <Lock className="text-gray-400" size={20} />;
    }
    if (state === 'in-progress') {
      return <PlayCircle className="text-amber-500" size={20} />;
    }
    // pending
    return <PlayCircle className="text-gray-400" size={20} />;
  };

  const getStateLabel = (state: LessonProgressState): string => {
    switch (state) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'blocked':
        return 'Locked';
      case 'pending':
      default:
        return 'Not Started';
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold mb-4">Course Content</h2>
      <ul className="space-y-2">
        {lessons.map((lesson, index) => {
          const state = getLessonState(lesson._id, index);
          const isActive = lesson._id === activeLessonId;
          const isLocked = state === 'blocked';

          return (
            <li
              key={lesson._id}
              className={`p-3 rounded-md transition-colors ${
                isLocked
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-gray-100'
              } flex items-center justify-between ${
                isActive ? 'bg-blue-100 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => !isLocked && onLessonClick(lesson)}
              title={isLocked ? 'Locked — complete previous lessons to unlock' : undefined}
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-500">{getIcon(state, isActive)}</div>
                <div>
                  <p className={`font-semibold ${isActive ? 'text-blue-700' : ''}`}>
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lesson.durationSeconds ? `${Math.ceil(lesson.durationSeconds / 60)} mins` : ''}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  state === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : state === 'in-progress'
                      ? 'bg-amber-100 text-amber-700'
                      : state === 'blocked'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-50 text-blue-600'
                }`}
              >
                {getStateLabel(state)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MaterialsList;
