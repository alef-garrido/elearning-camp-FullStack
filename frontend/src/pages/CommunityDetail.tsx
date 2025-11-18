import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, MapPin, Globe, Mail, Phone, ArrowLeft, Users, Calendar, CreditCard, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Community, Course, Review } from "@/types/api";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { CourseCard } from "@/components/CourseCard";
import { PhotoUploader } from "@/components/PhotoUploader";
import CommunityTimeline from "@/components/CommunityTimeline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnrolledUsersList } from "@/components/EnrolledUsersList";
import { CourseQuickEnroll } from "@/components/CourseQuickEnroll";

const CommunityDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const canCreateReview = useFeatureFlag('review-creation');
  const [community, setCommunity] = useState<Community | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coursesPage, setCoursesPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [coursesTotalPages, setCoursesPagination] = useState(1);
  const [reviewsTotalPages, setReviewsPagination] = useState(1);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState<number | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [enrollmentUpdated, setEnrollmentUpdated] = useState(0);
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseEnroll, setShowCourseEnroll] = useState(false);
  const [courseEnrollments, setCourseEnrollments] = useState<Record<string, boolean>>({});
  const coursesPerPage = 6;
  const reviewsPerPage = 5;
  const defaultTab = 'timeline'; // Set timeline as default

  useEffect(() => {
    loadCommunityData();
  }, [id, coursesPage, reviewsPage]);

  useEffect(() => {
    if (user && community) {
      setIsOwner(user.role === 'admin' || user._id === community.user);
    }
  }, [user, community]);

  const loadCommunityData = async () => {
    try {
      const [communityRes, coursesRes, reviewsRes] = await Promise.all([
        ApiClient.getCommunity(id!),
        ApiClient.getCommunityCourses(id!, { page: coursesPage, limit: coursesPerPage }),
        ApiClient.getReviews(id!, { page: reviewsPage, limit: reviewsPerPage }),
      ]);
      
      setCommunity(communityRes.data);
      // Populate enrollment count if provided by backend
      if (communityRes.data && (communityRes.data as any).enrollmentCount !== undefined) {
        setEnrollmentCount((communityRes.data as any).enrollmentCount as number);
      }
      
      // Handle pagination response
      if (coursesRes.pagination) {
        const totalPages = Math.ceil(coursesRes.pagination.total / coursesPerPage);
        setCoursesPagination(totalPages);
      }
      setCourses(coursesRes.data || []);
      
      if (reviewsRes.pagination) {
        const totalPages = Math.ceil(reviewsRes.pagination.total / reviewsPerPage);
        setReviewsPagination(totalPages);
      }
      setReviews(reviewsRes.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load community");
      setCommunity(null);
      setCourses([]);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check current user's enrollment status when community and user are available
  useEffect(() => {
    const checkStatus = async () => {
      if (!user || !community) return;
      try {
        const res = await ApiClient.getEnrollmentStatus(community._id);
        setEnrolled(res.data.enrolled);
      } catch (err) {
        // If unauthorized or other error, just assume not enrolled
        setEnrolled(false);
      }
    };
    checkStatus();
  }, [user, community]);

  // Load course enrollment statuses for current user
  useEffect(() => {
    const loadCourseEnrollments = async () => {
      if (!user || !courses || courses.length === 0) return;
      const enrollments: Record<string, boolean> = {};
      
      for (const course of courses) {
        try {
          const res = await ApiClient.getCourseEnrollmentStatus(course._id);
          enrollments[course._id] = res.data.enrolled;
        } catch {
          enrollments[course._id] = false;
        }
      }
      
      setCourseEnrollments(enrollments);
    };
    
    loadCourseEnrollments();
  }, [user, courses]);

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const text = formData.get('text') as string;
    const rating = parseInt(formData.get('rating') as string, 10);

    try {
      await ApiClient.createReview(id!, { title, text, rating });
      toast.success('Review submitted successfully');
      setShowReviewForm(false);
      loadCommunityData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
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

  if (!community) {
    return (
      <div className="min-h-screen bg-background">
         
        <div className="container py-12 px-4 text-center">
          <p className="text-muted-foreground">Community not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
       
      
      <div className="container py-6 sm:py-8 px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/communities">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Communities
            </Button>
          </Link>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Link to={`/communities/${id}/edit`}>
                <Button size="sm" variant="outline">Edit</Button>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  if (!confirm('Delete this community and all associated courses?')) return;
                  try {
                    await ApiClient.deleteCommunity(id!);
                    toast.success('Community deleted');
                    window.location.href = '/communities';
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to delete community');
                  }
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="aspect-[21/9] sm:aspect-[21/6] bg-gradient-primary relative overflow-hidden rounded-xl mb-6 sm:mb-8 group">
          {community.photoUrl ? (
            <img 
              src={community.photoUrl}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center backdrop-blur-sm bg-black/20">
              <span className="text-6xl sm:text-8xl font-bold text-primary-foreground/30">
                {community.name.charAt(0)}
              </span>
            </div>
          )}
          {isOwner && (
            <Button
              onClick={() => setShowPhotoUploader(true)}
              className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              size="sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Change Photo
            </Button>
          )}
        </div>

        <Dialog open={showPhotoUploader} onOpenChange={setShowPhotoUploader}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Community Photo</DialogTitle>
            </DialogHeader>
            <PhotoUploader
              communityId={id!}
              currentPhotoUrl={community.photoUrl}
              onUploadSuccess={(updatedCommunity) => {
                setCommunity(updatedCommunity);
                setShowPhotoUploader(false);
              }}
              onClose={() => setShowPhotoUploader(false)}
            />
          </DialogContent>
        </Dialog>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content with Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-6 sm:space-y-8">
                <CommunityTimeline communityId={community._id} communityOwnerId={community.user} />
              </TabsContent>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 sm:space-y-8">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                    <h1 className="text-3xl sm:text-4xl font-bold">{community.name}</h1>
                    {community.averageRating && (
                      <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-semibold text-base">{community.averageRating}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {community.description}
                  </p>
                </div>

                {community.topics && community.topics.length > 0 && (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Topics Covered</h2>
                    <div className="flex flex-wrap gap-2">
                      {community.topics.map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Courses Tab */}
              <TabsContent value="courses" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Available Courses</h2>
                  {courses.length === 0 ? (
                    <p className="text-muted-foreground">No courses available yet</p>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                        {courses.map((course) => (
                          <Card
                            key={course._id}
                            className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => {
                              // If enrolled, go to player; otherwise show enroll modal
                              if (courseEnrollments[course._id]) {
                                navigate(`/courses/${course._id}/player`);
                              } else {
                                setSelectedCourse(course);
                                setShowCourseEnroll(true);
                              }
                            }}
                          >
                            <CardHeader>
                              <CardTitle className="text-lg line-clamp-2">
                                {course.title}
                              </CardTitle>
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {course.weeks} weeks
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  ${course.membership}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course.description}
                              </p>
                            </CardContent>
                            <div className="px-6 py-4 border-t">
                              {courseEnrollments[course._id] ? (
                                <Badge className="w-full justify-center bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Enrolled ✓
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full bg-gradient-primary hover:opacity-90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCourse(course);
                                    setShowCourseEnroll(true);
                                  }}
                                >
                                  View & Enroll
                                </Button>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>

                      {coursesTotalPages > 1 && (
                        <Pagination className="mt-6">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setCoursesPage(p => Math.max(1, p - 1))}
                                className={coursesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            
                            {[...Array(coursesTotalPages)].map((_, i) => {
                              const pageNum = i + 1;
                              if (
                                pageNum === 1 ||
                                pageNum === coursesTotalPages ||
                                (pageNum >= coursesPage - 1 && pageNum <= coursesPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      onClick={() => setCoursesPage(pageNum)}
                                      isActive={coursesPage === pageNum}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              } else if (pageNum === coursesPage - 2 || pageNum === coursesPage + 2) {
                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                              return null;
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setCoursesPage(p => Math.min(coursesTotalPages, p + 1))}
                                className={coursesPage === coursesTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">Reviews</h2>
                    {canCreateReview && (
                      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                        <DialogTrigger asChild>
                          <Button>Write a Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Write a Review</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="review-title">Title</Label>
                              <Input id="review-title" name="title" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="review-text">Review</Label>
                              <Textarea id="review-text" name="text" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="review-rating">Rating</Label>
                              <Input id="review-rating" name="rating" type="number" min="1" max="5" required />
                            </div>
                            <Button type="submit">Submit Review</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground">No reviews yet</p>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <Card key={review._id}>
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base sm:text-lg">{review.title}</CardTitle>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-primary text-primary" />
                                  {review.rating}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm sm:text-base text-muted-foreground">{review.text}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {reviewsTotalPages > 1 && (
                        <Pagination className="mt-6">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setReviewsPage(p => Math.max(1, p - 1))}
                                className={reviewsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            
                            {[...Array(reviewsTotalPages)].map((_, i) => {
                              const pageNum = i + 1;
                              if (
                                pageNum === 1 ||
                                pageNum === reviewsTotalPages ||
                                (pageNum >= reviewsPage - 1 && pageNum <= reviewsPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      onClick={() => setReviewsPage(pageNum)}
                                      isActive={reviewsPage === pageNum}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              } else if (pageNum === reviewsPage - 2 || pageNum === reviewsPage + 2) {
                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                              return null;
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setReviewsPage(p => Math.min(reviewsTotalPages, p + 1))}
                                className={reviewsPage === reviewsTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Community Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {community.isPaid !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{community.isPaid ? "Paid Membership" : "Free"}</span>
                    </div>
                  )}
                  {community.hasMentorship && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>Mentorship Available</span>
                    </div>
                  )}
                  {community.hasLiveEvents && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>Live Events</span>
                    </div>
                  )}
                  {community.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>{community.address}</span>
                    </div>
                  )}
                  {community.website && (
                    <a 
                      href={community.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span>Visit Website</span>
                    </a>
                  )}
                  {community.email && (
                    <a 
                      href={`mailto:${community.email}`}
                      className="flex items-start gap-2 text-sm text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-all">{community.email}</span>
                    </a>
                  )}
                  {community.phone && (
                    <a 
                      href={`tel:${community.phone}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{community.phone}</span>
                    </a>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-muted-foreground mb-2">{enrollmentCount !== null ? `${enrollmentCount} member${enrollmentCount === 1 ? '' : 's'}` : ''}</div>
                  <Button
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={enrollLoading}
                    onClick={async () => {
                      if (!isAuthenticated) {
                        navigate('/auth');
                        return;
                      }

                      setEnrollLoading(true);
                      // Optimistic update
                      const prevEnrolled = enrolled;
                      const prevCount = enrollmentCount;

                      if (!enrolled) {
                        setEnrolled(true);
                        setEnrollmentCount((c) => (c ?? 0) + 1);
                        try {
                          const res = await ApiClient.enrollCommunity(id!);
                          // if backend returned count, sync
                          if ((res as any).enrollmentCount !== undefined) {
                            setEnrollmentCount((res as any).enrollmentCount as number);
                          }
                          toast.success('Enrolled in community');
                        } catch (err: any) {
                          // revert
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
                          const res = await ApiClient.unenrollCommunity(id!);
                          if ((res as any).enrollmentCount !== undefined) {
                            setEnrollmentCount((res as any).enrollmentCount as number);
                          }
                          toast.success('You have left the community');
                        } catch (err: any) {
                          // revert
                          setEnrolled(prevEnrolled);
                          setEnrollmentCount(prevCount);
                          toast.error(err.message || 'Failed to leave community');
                        } finally {
                          setEnrollLoading(false);
                        }
                      }
                    }}
                  >
                    {enrollLoading ? 'Processing...' : enrolled ? 'Leave Community' : 'Join Community'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enrolled Users Section - only show to owners/admins */}
            {isOwner && (
              <div className="mt-8">
                <EnrolledUsersList
                  communityId={id!}
                  isOwner={isOwner}
                  isAdmin={user?.role === 'admin'}
                  onUserRemoved={() => {
                    // Trigger a reload of enrollment count when a user is removed
                    setEnrollmentUpdated(prev => prev + 1);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Course Quick Enroll Modal */}
        {selectedCourse && (
          <CourseQuickEnroll
            course={selectedCourse}
            open={showCourseEnroll}
            onOpenChange={(open) => {
              setShowCourseEnroll(open);
              if (!open) setSelectedCourse(null);
            }}
            onEnrollSuccess={() => {
              // Reload course enrollments to update the UI
              if (selectedCourse) {
                setCourseEnrollments(prev => ({
                  ...prev,
                  [selectedCourse._id]: !prev[selectedCourse._id]
                }));
              }
            }}
            userEnrolled={courseEnrollments[selectedCourse._id] || false}
            communityMember={enrolled}
          />
        )}
      </div>
    </div>
  );
};

export default CommunityDetail;
