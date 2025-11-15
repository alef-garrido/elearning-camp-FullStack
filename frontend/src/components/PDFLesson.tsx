import { Lesson } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface PDFLessonProps {
  lesson: Lesson;
  courseId: string;
}

/**
 * PDF lesson renderer
 * Handles: embedding PDF viewer, download link, opens in new tab option
 * Note: Uses iframe embed for simplicity; can be upgraded to react-pdf for more control
 */
const PDFLesson = ({ lesson }: PDFLessonProps) => {
  if (!lesson.url) {
    return (
      <div className="p-6 rounded-lg bg-red-50 border border-red-200">
        <p className="text-red-800 font-semibold">PDF Not Available</p>
        <p className="text-sm text-red-700 mt-2">
          The PDF URL for this lesson is missing. Please contact the instructor.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* PDF Viewer */}
      <div className="rounded-lg overflow-hidden border border-border bg-background">
        <iframe
          src={`${lesson.url}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-[600px] rounded-lg"
          title={lesson.title}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(lesson.url, '_blank')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open in New Tab
        </Button>
        <a
          href={lesson.url}
          download
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </a>
      </div>

      {lesson.durationSeconds && (
        <p className="text-xs text-muted-foreground">
          Estimated reading time: {Math.ceil(lesson.durationSeconds / 60)} minutes
        </p>
      )}
    </div>
  );
};

export default PDFLesson;
