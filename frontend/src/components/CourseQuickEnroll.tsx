import { useState } from 'react';
import { Course } from '@/types/api';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Clock, DollarSign, Award } from 'lucide-react';

interface CourseQuickEnrollProps {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrollSuccess?: () => void;
  userEnrolled?: boolean;
  communityMember?: boolean;
}

const skillColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export const CourseQuickEnroll = ({
  course,
  open,
  onOpenChange,
  onEnrollSuccess,
  userEnrolled = false,
  communityMember = true,
}: CourseQuickEnrollProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      await ApiClient.enrollCourse(course._id);
      toast.success('Successfully enrolled in course');
      onEnrollSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll in course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm('Leave this course?')) return;
    setIsLoading(true);
    try {
      await ApiClient.unenrollCourse(course._id);
      toast.success('Successfully left course');
      onEnrollSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
          <DialogDescription>{course.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Duration</span>
              </div>
              <span className="font-medium">{course.weeks} weeks</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Membership</span>
              </div>
              <span className="font-semibold">${course.membership}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>Skill Level</span>
              </div>
              <Badge className={skillColors[course.minimumSkill]}>
                {course.minimumSkill}
              </Badge>
            </div>
          </div>

          <Separator />

          {!communityMember ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Join the community to enroll in courses.
            </p>
          ) : (
            <div className="flex gap-2">
              {userEnrolled ? (
                <Button
                  variant="destructive"
                  onClick={handleUnenroll}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Leave Course'}
                </Button>
              ) : (
                <Button
                  onClick={handleEnroll}
                  disabled={isLoading}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {isLoading ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
