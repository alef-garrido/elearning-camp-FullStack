import { useEffect, useRef } from 'react';
import { Lesson } from '@/types/api';
import { ApiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface VideoPlayerProps {
  lesson: Lesson;
  courseId: string;
  onEnded: () => void;
}

const VideoPlayer = ({ lesson, courseId, onEnded }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const lastUpdateTime = useRef(0);

  // Function to save progress
  const saveProgress = async (completed = false) => {
    if (!videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    // Throttle updates to every 5 seconds
    if (!completed && Date.now() - lastUpdateTime.current < 5000) {
        return;
    }

    try {
      await ApiClient.updateLessonProgress(courseId, lesson._id, {
        lastPositionSeconds: currentTime,
        completed,
      });
      lastUpdateTime.current = Date.now();
      if (completed) {
        toast({
            title: "Lesson Completed!",
            description: `You've completed "${lesson.title}".`,
        });
      }
    } catch (error) {
      console.error('Failed to save progress', error);
      toast({
        title: "Error",
        description: "Failed to save your progress.",
        variant: "destructive",
      });
    }
  };

  // Save progress on pause or when navigating away
  useEffect(() => {
    const videoElement = videoRef.current;

    const handlePause = () => saveProgress();
    const handleBeforeUnload = () => saveProgress();

    videoElement?.addEventListener('pause', handlePause);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      videoElement?.removeEventListener('pause', handlePause);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save progress one last time on component unmount
      saveProgress();
    };
  }, [lesson._id, courseId]);


  // Handle video ending
  const handleEnded = () => {
    saveProgress(true);
    onEnded();
  };

  return (
    <div>
      <video
        ref={videoRef}
        key={lesson._id} // Re-render video element when lesson changes
        className="w-full rounded-lg"
        controls
        autoPlay
        onEnded={handleEnded}
        onTimeUpdate={() => saveProgress()}
        src={lesson.url} // Assuming the URL is directly playable
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;