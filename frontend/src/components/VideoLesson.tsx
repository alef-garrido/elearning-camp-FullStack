import { useEffect, useRef } from 'react';
import { Lesson } from '@/types/api';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';

interface VideoLessonProps {
  lesson: Lesson;
  courseId: string;
  onEnded?: () => void;
}

/**
 * Video lesson renderer with progress tracking
 * Handles: playing video from URL, tracking watch time, marking completion
 */
const VideoLesson = ({ lesson, courseId, onEnded }: VideoLessonProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastUpdateTime = useRef(0);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const pollInterval = useRef<number | null>(null);

  // Detect YouTube video id from URL
  const extractYouTubeId = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.slice(1);
      }
      if (u.hostname.includes('youtube.com')) {
        return u.searchParams.get('v');
      }
    } catch (e) {
      // fallback to regex
      const m = url.match(/(?:youtube(?:-nocookie)?\.com\/.*[?&]v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      return m ? m[1] : null;
    }
    return null;
  };

  const ytId = lesson.url ? extractYouTubeId(lesson.url) : null;
  const isYouTube = Boolean(ytId);

  // Function to save progress
  const saveProgress = async (completed = false) => {
    let currentTime = 0;

    // If native video available
    if (videoRef.current) {
      currentTime = videoRef.current.currentTime;
    } else if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        currentTime = playerRef.current.getCurrentTime();
      } catch (e) {
        // ignore
      }
    } else {
      // nothing to save
      return;
    }
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
        toast.success(`Lesson Completed: "${lesson.title}"`);
      }
    } catch (error) {
      console.error('Failed to save progress', error);
      toast.error('Failed to save your progress.');
    }
  };

  // Save progress on pause or when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => saveProgress();
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Native video pause handling
    const videoElement = videoRef.current;
    const handlePause = () => saveProgress();
    if (videoElement) videoElement.addEventListener('pause', handlePause);

    // If YouTube, set up polling to save progress periodically
    if (isYouTube && (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function')) {
      // player will be created in other effect; just ensure we poll if available
      pollInterval.current = window.setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') saveProgress();
      }, 5000) as unknown as number;
    }

    return () => {
      if (videoElement) videoElement.removeEventListener('pause', handlePause);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      // Save progress one last time on component unmount
      saveProgress();
      // Destroy YouTube player if exists
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch (e) {
        // ignore
      }
    };
  }, [lesson._id, courseId]);

  // Create YouTube player when needed
  useEffect(() => {
    if (!isYouTube || !ytId || !ytContainerRef.current) return;

    let mounted = true;

    const loadYT = () => new Promise<any>((resolve) => {
      if ((window as any).YT && (window as any).YT.Player) {
        resolve((window as any).YT);
        return;
      }

      // Attach global ready callback
      (window as any).onYouTubeIframeAPIReady = () => {
        resolve((window as any).YT);
      };

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    });

    let createdPlayer = false;

    loadYT().then((YT) => {
      if (!mounted) return;

      try {
        playerRef.current = new YT.Player(ytContainerRef.current, {
          videoId: ytId,
          playerVars: { enablejsapi: 1, rel: 0 },
          events: {
            onStateChange: (e: any) => {
              if (e.data === YT.PlayerState.ENDED) {
                saveProgress(true);
                onEnded?.();
              }
            },
          },
        });
        createdPlayer = true;

        // start polling for progress
        if (!pollInterval.current) {
          pollInterval.current = window.setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') saveProgress();
          }, 5000) as unknown as number;
        }
      } catch (err) {
        // ignore player creation errors
        console.error('YT Player error', err);
      }
    });

    return () => {
      mounted = false;
      if (createdPlayer && playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, [isYouTube, ytId, lesson._id, courseId]);

  // Handle video ending
  const handleEnded = () => {
    saveProgress(true);
    onEnded?.();
  };

  if (!lesson.url) {
    return (
      <div className="p-6 rounded-lg bg-red-50 border border-red-200">
        <p className="text-red-800 font-semibold">Video Not Available</p>
        <p className="text-sm text-red-700 mt-2">
          The video URL for this lesson is missing. Please contact the instructor.
        </p>
      </div>
    );
  }
  // If YouTube URL, render iframe via YT Player API to detect ended state and current time
  if (isYouTube && ytId) {
    return (
      <div className="w-full">
        <div ref={ytContainerRef} id={`yt-player-${lesson._id}`} />
        {lesson.durationSeconds && (
          <p className="text-xs text-muted-foreground mt-2">
            Duration: {Math.floor(lesson.durationSeconds / 60)} minutes
          </p>
        )}
      </div>
    );
  }

  // Fallback: native video element for direct file URLs
  return (
    <div className="w-full">
      <video
        ref={videoRef}
        key={lesson._id}
        className="w-full rounded-lg bg-black"
        controls
        autoPlay
        onEnded={handleEnded}
        onTimeUpdate={() => saveProgress()}
        src={lesson.url}
      >
        Your browser does not support the video tag.
      </video>
      {lesson.durationSeconds && (
        <p className="text-xs text-muted-foreground mt-2">
          Duration: {Math.floor(lesson.durationSeconds / 60)} minutes
        </p>
      )}
    </div>
  );
};

export default VideoLesson;
