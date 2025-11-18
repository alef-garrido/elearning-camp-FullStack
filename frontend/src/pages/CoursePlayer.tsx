import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ApiClient } from '@/lib/api';
import { Course, Lesson } from '@/types/api';
import { useLessonProgress } from '@/hooks/use-lesson-progress';
import LessonContentRenderer from '@/components/LessonContentRenderer';
import MaterialsList from '@/components/MaterialsList';
import LessonNav from '@/components/LessonNav';
import ProgressBar from '@/components/ProgressBar';
import LessonNotes from '@/components/LessonNotes';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CoursePlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonNotes, setLessonNotes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize lessons array so we don't pass a new array reference to the hook every render
  const lessonsMemo = useMemo(() => course?.lessons || [], [course?.lessons?.length, course?._id]);

  // Use the lesson progress hook
  const { lessonStates, getState, markInProgress, markComplete, isLocked, loading: progressLoading } = useLessonProgress(
    courseId || '',
    lessonsMemo
  );

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await ApiClient.getCourseContent(courseId);
        setCourse(res.data);
        
        // Set the first lesson as active by default
        if (res.data.lessons && res.data.lessons.length > 0) {
          setActiveLesson(res.data.lessons[0]);
        }
      } catch (err) {
        setError('Failed to load course content. Please make sure you are enrolled in this course.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // When user clicks on a lesson, set it active and mark as in-progress
  const handleLessonAccess = async (lesson: Lesson) => {
    if (isLocked(lesson._id)) {
      toast.error('This lesson is locked. Complete previous lessons first.');
      return;
    }
    setActiveLesson(lesson);
    try {
      await markInProgress(lesson._id);
    } catch (err) {
      console.error('Failed to update lesson state:', err);
    }
  };

  // Explicit button to mark lesson as complete
  const handleMarkComplete = async () => {
    if (!activeLesson || !courseId) return;
    try {
      await markComplete(activeLesson._id);
      toast.success('Lesson completed! 🎉');
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
      toast.error('Failed to save progress');
    }
  };

  const handlePreviousLesson = () => {
    if (!course || !activeLesson) return;
    const currentIndex = course.lessons!.findIndex(l => l._id === activeLesson._id);
    if (currentIndex > 0) {
      const prevLesson = course.lessons![currentIndex - 1];
      handleLessonAccess(prevLesson);
    }
  };

  const handleNextLesson = () => {
    if (!course || !activeLesson) return;
    const currentIndex = course.lessons!.findIndex(l => l._id === activeLesson._id);
    if (currentIndex < course.lessons!.length - 1) {
      const nextLesson = course.lessons![currentIndex + 1];
      handleLessonAccess(nextLesson);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!activeLesson) return;
    setLessonNotes({
      ...lessonNotes,
      [activeLesson._id]: notes,
    });
  };

  const handleDeleteNotes = async () => {
    if (!activeLesson) return;
    setLessonNotes({
      ...lessonNotes,
      [activeLesson._id]: '',
    });
  };

  // Compute completedLessons for ProgressBar (backward compatibility)
  // Only include completed lessons that still exist on the course (prevent counting stale ids)
  const lessonIdsSet = new Set((course?.lessons || []).map(l => l._id));
  const completedLessons = Object.entries(lessonStates)
    .filter(([lessonId, state]) => state === 'completed' && lessonIdsSet.has(lessonId))
    .map(([lessonId]) => lessonId);

  const isCurrentLessonCompleted = activeLesson && getState(activeLesson._id) === 'completed';

  if (loading || progressLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!course) {
    return <div>Course not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
        
        {/* Progress Bar */}
        <ProgressBar 
          lessons={course.lessons || []} 
          completedLessonIds={completedLessons}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* Main Content Area */}
          <div className="md:col-span-2">
            {activeLesson && (
              <>
                <LessonContentRenderer
                  lesson={activeLesson}
                  courseId={course._id}
                  onEnded={() => {
                    // Optional: auto-advance on onEnded, but don't auto-complete
                    handleNextLesson();
                  }}
                />

                {/* Lesson Info & Mark Complete */}
                <div className="mt-4 p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{activeLesson.title}</h2>
                      <p className="text-gray-600 mt-2">{activeLesson.description}</p>
                    </div>
                    {isCurrentLessonCompleted && (
                      <div className="text-green-600 flex items-center gap-1 text-sm font-semibold">
                        <CheckCircle size={18} />
                        Completed
                      </div>
                    )}
                  </div>

                  {/* Mark Complete Button */}
                  {!isCurrentLessonCompleted && (
                    <Button
                      onClick={handleMarkComplete}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark as Complete
                    </Button>
                  )}
                  
                  {/* Attachments */}
                  {activeLesson.attachments && activeLesson.attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-semibold mb-2">Resources</h3>
                      <ul className="space-y-2">
                        {activeLesson.attachments.map((attachment, idx) => (
                          <li key={idx}>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              📎 {attachment.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Lesson Notes */}
                <div className="mt-6">
                  <LessonNotes
                    lessonId={activeLesson._id}
                    initialNotes={lessonNotes[activeLesson._id] || ''}
                    onSave={handleSaveNotes}
                    onDelete={handleDeleteNotes}
                  />
                </div>

                {/* Navigation */}
                <LessonNav
                  lessons={course.lessons || []}
                  currentLessonId={activeLesson._id}
                  onPrevious={handlePreviousLesson}
                  onNext={handleNextLesson}
                />
              </>
            )}
          </div>

          {/* Sidebar - Materials List */}
          <div>
            <MaterialsList
              lessons={course.lessons || []}
              activeLessonId={activeLesson?._id}
              onLessonClick={handleLessonAccess}
              lessonStates={lessonStates}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;

