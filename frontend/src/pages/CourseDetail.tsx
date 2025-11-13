import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, DollarSign, Award, ArrowLeft, BookOpen, GraduationCap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Course, Community } from "@/types/api";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { EnrolledUsersList } from "@/components/EnrolledUsersList";

const skillColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const CourseDetail = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState<number | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [communityMember, setCommunityMember] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourseData();
  }, [id]);

  useEffect(() => {
    if (user && course) {
      setIsOwner(isAdmin || user._id === course.user);
    }
  }, [user, course, isAdmin]);

  const loadCourseData = async () => {
    try {
      const courseRes = await ApiClient.getCourse(id!);
      const courseData = courseRes.data;
      setCourse(courseData);
      
      if (typeof courseData.community === 'string') {
        const communityRes = await ApiClient.getCommunity(courseData.community);
        setCommunity(communityRes.data);
      } else {
        setCommunity(courseData.community);
      }
      // If user is authenticated, check enrollment status for this course
      try {
        const statusRes = await ApiClient.getCourseEnrollmentStatus(id!);
        setEnrolled(statusRes.data.enrolled);
      } catch (e) {
        // ignore - assume not enrolled
        setEnrolled(false);
      }
      // If user is authenticated, check membership in the community that owns this course
      try {
        if (user) {
          const commId = typeof courseData.community === 'string' ? courseData.community : courseData.community._id;
          const commStatus = await ApiClient.getEnrollmentStatus(commId);
          setCommunityMember(!!commStatus.data.enrolled);
        } else {
          setCommunityMember(false);
        }
      } catch (e) {
        setCommunityMember(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load course");
      setCourse(null);
      setCommunity(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
         
        <div className="container py-8 px-4">
          <div className="h-64 rounded-xl bg-muted animate-pulse mb-6" />
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
         
        <div className="container py-12 px-4 text-center">
          <p className="text-muted-foreground">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
       
      
      <div className="container py-6 sm:py-8 px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/courses">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Link to={`/courses/${id}/edit`}>
                <Button size="sm" variant="outline">Edit</Button>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  if (!confirm('Delete this course?')) return;
                  try {
                    await ApiClient.deleteCourse(id!);
                    toast.success('Course deleted');
                    navigate('/courses');
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to delete course');
                  }
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Hero */}
            <div className="aspect-video bg-gradient-to-br from-primary to-accent relative overflow-hidden rounded-xl">
              <div className="w-full h-full flex items-center justify-center backdrop-blur-sm bg-black/10">
                <Award className="h-20 w-20 sm:h-32 sm:w-32 text-primary-foreground/40" />
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <h1 className="text-3xl sm:text-4xl font-bold">{course.title}</h1>
                <Badge className={`${skillColors[course.minimumSkill]} text-sm w-fit`}>
                  {course.minimumSkill}
                </Badge>
              </div>

              {community && (
                <Link to={`/communities/${typeof course.community === 'string' ? course.community : course.community._id}`}>
                  <Badge variant="outline" className="mb-4 hover:bg-accent cursor-pointer">
                    <GraduationCap className="mr-1 h-3 w-3" />
                    {typeof course.community === 'string' ? community.name : course.community.name}
                  </Badge>
                </Link>
              )}

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">What You'll Learn</h2>
              <Card>
                <CardContent className="pt-6">
                  <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Comprehensive understanding of modern web development</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Build real-world projects from scratch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Master industry-standard tools and practices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Deploy applications to production environments</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5 flex-shrink-0" />
                      <span>Duration</span>
                    </div>
                    <span className="font-medium">{course.weeks} weeks</span>
                  </div>

                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-5 w-5 flex-shrink-0" />
                      <span>Membership</span>
                    </div>
                    <span className="font-semibold text-lg">${course.membership}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-5 w-5 flex-shrink-0" />
                      <span>Skill Level</span>
                    </div>
                    <span className="font-medium capitalize">{course.minimumSkill}</span>
                  </div>
                </div>

                {course.scholarshipsAvailable && (
                  <>
                    <Separator />
                    <Badge variant="secondary" className="w-full justify-center py-2 text-sm">
                      Scholarships Available
                    </Badge>
                  </>
                )}

                <Separator />

                {/* If user is not a member of the community, prompt them to join first */}
                {!isOwner && !isAdmin && community && !communityMember ? (
                  <Button
                    className="w-full bg-muted/80 text-muted-foreground"
                    onClick={() => navigate(`/communities/${typeof course.community === 'string' ? course.community : course.community._id}`)}
                  >
                    Join community to enroll
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={enrollLoading}
                    onClick={async () => {
                      // If not logged in, redirect to auth
                      if (!user) {
                        navigate('/auth');
                        return;
                      }

                      setEnrollLoading(true);
                      const prevEnrolled = enrolled;
                      const prevCount = enrollmentCount;

                      if (!enrolled) {
                        // optimistic
                        setEnrolled(true);
                        setEnrollmentCount((c) => (c ?? 0) + 1);
                        try {
                          const res = await ApiClient.enrollCourse(id!);
                          if ((res as any).enrollmentCount !== undefined) {
                            setEnrollmentCount((res as any).enrollmentCount as number);
                          }
                          toast.success('Enrolled in course');
                        } catch (err: any) {
                          setEnrolled(prevEnrolled);
                          setEnrollmentCount(prevCount);
                          toast.error(err.message || 'Failed to enroll');
                        } finally {
                          setEnrollLoading(false);
                        }
                      } else {
                        // Unenroll
                        setEnrolled(false);
                        setEnrollmentCount((c) => (c ?? 1) - 1);
                        try {
                          const res = await ApiClient.unenrollCourse(id!);
                          if ((res as any).enrollmentCount !== undefined) {
                            setEnrollmentCount((res as any).enrollmentCount as number);
                          }
                          toast.success('You have left the course');
                        } catch (err: any) {
                          setEnrolled(prevEnrolled);
                          setEnrollmentCount(prevCount);
                          toast.error(err.message || 'Failed to leave course');
                        } finally {
                          setEnrollLoading(false);
                        }
                      }
                    }}
                  >
                    {enrollLoading ? 'Processing...' : enrolled ? 'Leave Course' : 'Enroll Now'}
                  </Button>
                )}
                
                <p className="text-xs text-center text-muted-foreground">
                  30-day money-back guarantee
                </p>
              </CardContent>
            </Card>

            {/* Enrolled Users Section - only show to owners/admins */}
            {isOwner && (
              <div className="mt-8">
                {/* EnrolledUsersList supports courseId prop now */}
                {/* @ts-ignore */}
                <EnrolledUsersList
                  courseId={id!}
                  isOwner={isOwner}
                  isAdmin={user?.role === 'admin'}
                  onUserRemoved={() => {
                    // Refresh enrollment count when a user is removed
                    // trigger a reload of course data
                    loadCourseData();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
