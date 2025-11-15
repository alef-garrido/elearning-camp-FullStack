import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiClient } from '@/lib/api';
import { Course, Lesson } from '@/types/api';
import LessonContentRenderer from '@/components/LessonContentRenderer';
import MaterialsList from '@/components/MaterialsList';
import LessonNav from '@/components/LessonNav';
import ProgressBar from '@/components/ProgressBar';
import LessonNotes from '@/components/LessonNotes';

const CoursePlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [lessonNotes, setLessonNotes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await ApiClient.getCourseContent(courseId);
        setCourse(res.data);
        
        // Fetch progress to determine completed lessons
        try {
          const progressRes = await ApiClient.getCourseProgress(courseId);
          const completedIds = progressRes.data
            .filter((p: any) => p.completed)
            .map((p: any) => p.lesson);
          setCompletedLessons(completedIds);
        } catch (err) {
          console.warn('Could not fetch progress:', err);
        }
        
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

  const handleLessonComplete = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  const handlePreviousLesson = () => {
    if (!course || !activeLesson) return;
    const currentIndex = course.lessons!.findIndex(l => l._id === activeLesson._id);
    if (currentIndex > 0) {
      setActiveLesson(course.lessons![currentIndex - 1]);
    }
  };

  const handleNextLesson = () => {
    if (!course || !activeLesson) return;
    const currentIndex = course.lessons!.findIndex(l => l._id === activeLesson._id);
    if (currentIndex < course.lessons!.length - 1) {
      setActiveLesson(course.lessons![currentIndex + 1]);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!activeLesson) return;
    setLessonNotes({
      ...lessonNotes,
      [activeLesson._id]: notes,
    });
    // In a real app, you'd save these to the backend
  };

  const handleDeleteNotes = async () => {
    if (!activeLesson) return;
    setLessonNotes({
      ...lessonNotes,
      [activeLesson._id]: '',
    });
  };

  if (loading) {
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
                    handleLessonComplete(activeLesson._id);
                    handleNextLesson();
                  }}
                />
                <div className="mt-4 p-4 border rounded-lg bg-white">
                  <h2 className="text-2xl font-bold">{activeLesson.title}</h2>
                  <p className="text-gray-600 mt-2">{activeLesson.description}</p>
                  
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
              onLessonClick={(lesson) => setActiveLesson(lesson)}
              completedLessons={completedLessons}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;