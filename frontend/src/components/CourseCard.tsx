import { Clock, DollarSign, Award } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Course } from "@/types/api";
import { Link } from "react-router-dom";

interface CourseCardProps {
  course: Course;
}

const skillColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Link to={`/courses/${course._id}`}>
      <Card className="overflow-hidden hover:shadow-medium transition-all duration-300 group cursor-pointer bg-gradient-card border-border/50">
        <div className="aspect-video bg-gradient-to-br from-primary to-accent relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center backdrop-blur-sm bg-black/10">
            <Award className="h-16 w-16 text-primary-foreground/40" />
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
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
    </Link>
  );
};
