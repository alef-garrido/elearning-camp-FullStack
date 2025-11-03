import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, MapPin, Globe, Mail, Phone, ArrowLeft, Users, Calendar, CreditCard, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Community, Course, Review } from "@/types/api";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { CourseCard } from "@/components/CourseCard";
import { PhotoUploader } from "@/components/PhotoUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CommunityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const coursesPerPage = 6;
  const reviewsPerPage = 5;

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
        <Navbar />
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
        <Navbar />
        <div className="container py-12 px-4 text-center">
          <p className="text-muted-foreground">Community not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
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
          {community.photo ? (
            <img 
              src={community.photo}
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
              currentPhoto={community.photo}
              onUploadSuccess={(updatedCommunity) => {
                setCommunity(updatedCommunity);
                setShowPhotoUploader(false);
              }}
              onClose={() => setShowPhotoUploader(false)}
            />
          </DialogContent>
        </Dialog>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
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

            <Separator />

            {/* Courses */}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Available Courses</h2>
              {courses.length === 0 ? (
                <p className="text-muted-foreground">No courses available yet</p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    {courses.map((course) => (
                      <CourseCard key={course._id} course={course} />
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

            <Separator />

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold">Reviews</h2>
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

                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Join Community
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
