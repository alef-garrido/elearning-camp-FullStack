import { Lesson } from '@/types/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LessonNavProps {
  lessons: Lesson[];
  currentLessonId?: string;
  onPrevious: () => void;
  onNext: () => void;
  isPreviousDisabled?: boolean;
  isNextDisabled?: boolean;
}

const LessonNav = ({
  lessons,
  currentLessonId,
  onPrevious,
  onNext,
  isPreviousDisabled = false,
  isNextDisabled = false,
}: LessonNavProps) => {
  const currentIndex = lessons.findIndex((l) => l._id === currentLessonId);

  return (
    <div className="flex items-center justify-between gap-4 p-4 border-t mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={isPreviousDisabled || currentIndex <= 0}
        className="flex items-center gap-2"
      >
        <ChevronLeft size={16} />
        Previous
      </Button>

      <div className="text-sm text-gray-600">
        Lesson {currentIndex + 1} of {lessons.length}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={isNextDisabled || currentIndex >= lessons.length - 1}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};

export default LessonNav;
