import { Clock, DollarSign, Award, Edit3, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Course } from "@/types/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";

interface CourseCardProps {
  course: Course;
}

const skillColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const isOwner = user && (isAdmin || user._id === course.user);

  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Wait for auth to load
    if (authLoading) {
      console.log('[CourseCard] Auth still loading, waiting...');
      return;
    }
    
    // If user is not logged in, always go to course detail
    if (!user) {
      console.log('[CourseCard] No user logged in, going to course detail');
      navigate(`/courses/${course._id}`);
      return;
    }
    
    console.log('[CourseCard] User logged in:', user.email, 'User ID:', user._id);
    setIsChecking(true);
    try {
      console.log('[CourseCard] Fetching enrollment status for course:', course._id);
      const response = await ApiClient.getCourseEnrollmentStatus(course._id);
      console.log('[CourseCard] Enrollment status response:', JSON.stringify(response));
      
      const isEnrolled = response?.data?.enrolled === true;
      console.log('[CourseCard] Is enrolled?', isEnrolled);
      
      if (isEnrolled) {
        console.log('[CourseCard] ✅ User IS enrolled - navigating to PLAYER');
        navigate(`/courses/${course._id}/player`);
      } else {
        console.log('[CourseCard] ❌ User is NOT enrolled - navigating to DETAIL');
        navigate(`/courses/${course._id}`);
      }
    } catch (err: any) {
      console.error('[CourseCard] ❌ Error checking enrollment:', err.message);
      console.error('[CourseCard] Error details:', {
        status: err.status,
        message: err.message,
        responseData: err.response?.data
      });
      console.log('[CourseCard] Falling back to course detail');
      navigate(`/courses/${course._id}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Delete course "${course.title}"?`)) return;
    try {
      await ApiClient.deleteCourse(course._id);
      toast.success('Course deleted');
      navigate('/courses');
      setTimeout(() => window.location.reload(), 250);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete course');
    }
  };
  
  return (
    <div onClick={handleCardClick} className="cursor-pointer">
      <Card className="overflow-hidden hover:shadow-medium transition-all duration-300 group bg-gradient-card border-border/50"
            style={{ opacity: isChecking ? 0.7 : 1, pointerEvents: isChecking ? 'none' : 'auto' }}>
        <div className="aspect-video bg-gradient-to-br from-primary to-accent relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center backdrop-blur-sm bg-black/10">
            <Award className="h-16 w-16 text-primary-foreground/40" />
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {isOwner && (
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigate(`/courses/${course._id}/edit`);
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="p-2" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <h3 className="text-base sm:text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2 flex-1">
              {course.title}
            </h3>
            <Badge className={`${skillColors[course.minimumSkill]} text-xs flex-shrink-0`}>
              {course.minimumSkill}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">
            {course.description}
          </p>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-sm">
              <div className="flex items-center gap-3 sm:gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{course.weeks} weeks</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-foreground text-xs sm:text-sm">${course.membership}</span>
                </div>
              </div>
              
              {course.scholarshipsAvailable && (
                <Badge variant="secondary" className="text-xs">
                  Scholarship
                </Badge>
              )}
            </div>

            {typeof course.community !== 'string' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>By</span>
                <Badge variant="outline" className="text-xs">
                  {course.community.name}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
