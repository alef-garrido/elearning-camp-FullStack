import { Lesson } from '@/types/api';
import VideoLesson from './VideoLesson';
import PDFLesson from './PDFLesson';
import ArticleLesson from './ArticleLesson';

interface LessonContentRendererProps {
  lesson: Lesson;
  courseId: string;
  onEnded?: () => void;
}

/**
 * Renders lesson content based on lesson.type
 * - 'video': HTML video player with progress tracking
 * - 'pdf': PDF viewer with download support
 * - 'article': Markdown renderer with navigation
 */
const LessonContentRenderer = ({
  lesson,
  courseId,
  onEnded,
}: LessonContentRendererProps) => {
  switch (lesson.type) {
    case 'video':
      return (
        <VideoLesson lesson={lesson} courseId={courseId} onEnded={onEnded} />
      );
    case 'pdf':
      return <PDFLesson lesson={lesson} courseId={courseId} />;
    case 'article':
      return <ArticleLesson lesson={lesson} courseId={courseId} />;
    default:
      return (
        <div className="p-6 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-amber-800">
            Unknown lesson type: <strong>{lesson.type}</strong>
          </p>
          <p className="text-sm text-amber-700 mt-2">
            Contact support if this problem persists.
          </p>
        </div>
      );
  }
};

export default LessonContentRenderer;
