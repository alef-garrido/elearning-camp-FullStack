import { Lesson } from '@/types/api';

interface ProgressBarProps {
  lessons: Lesson[];
  completedLessonIds: string[];
}

const ProgressBar = ({ lessons, completedLessonIds }: ProgressBarProps) => {
  const totalLessons = lessons.length;
  const completedCount = completedLessonIds.length;
  const percentComplete = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <div className="w-full p-4 bg-gray-100 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700">Course Progress</h3>
        <span className="text-sm font-medium text-gray-600">
          {completedCount} of {totalLessons} lessons
        </span>
      </div>
      <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-500 ease-out"
          style={{ width: `${percentComplete}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-2">
        {percentComplete.toFixed(0)}% complete
      </p>
    </div>
  );
};

export default ProgressBar;
