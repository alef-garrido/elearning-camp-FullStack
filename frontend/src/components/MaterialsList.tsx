import { Lesson } from '@/types/api';
import { CheckCircle, Lock, PlayCircle } from 'lucide-react';

interface MaterialsListProps {
  lessons: Lesson[];
  activeLessonId?: string;
  onLessonClick: (lesson: Lesson) => void;
  completedLessons?: string[]; // Assuming an array of completed lesson IDs
}

const MaterialsList = ({
  lessons,
  activeLessonId,
  onLessonClick,
  completedLessons = [],
}: MaterialsListProps) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold mb-4">Course Content</h2>
      <ul className="space-y-2">
        {lessons.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson._id);
          const isActive = lesson._id === activeLessonId;

          // Determine unlocking: allow access up to the next lesson after the last completed one.
          // If no lessons completed, only the first lesson (index 0) is unlocked.
          const lastCompletedIndex = lessons.reduce((acc, l, i) => (completedLessons.includes(l._id) ? i : acc), -1);
          const unlockedUpTo = Math.max(0, lastCompletedIndex + 1);
          const isLocked = index > unlockedUpTo && !isCompleted && !isActive;

          return (
            <li
              key={lesson._id}
              className={`p-3 rounded-md ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'} flex items-center justify-between transition-colors ${
                isActive
                  ? 'bg-blue-100 border-l-4 border-blue-500'
                  : ''
              }`}
              onClick={() => !isLocked && onLessonClick(lesson)}
              title={isLocked ? 'Locked — complete previous lessons to unlock' : undefined}
            >
              <div className="flex items-center">
                <div className="mr-3 text-gray-500">
                  {isCompleted ? (
                    <CheckCircle className="text-green-500" />
                  ) : isActive ? (
                    <PlayCircle className="text-blue-500" />
                  ) : isLocked ? (
                    <Lock size={18} />
                  ) : (
                    <PlayCircle className="text-gray-500" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${isActive ? 'text-blue-700' : ''}`}>
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-sm text-gray-500">{lesson.durationSeconds ? `${Math.ceil(lesson.durationSeconds / 60)} mins` : ''}</p>
                </div>
              </div>
              {isCompleted && <span className="text-xs text-green-600">Done</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MaterialsList;