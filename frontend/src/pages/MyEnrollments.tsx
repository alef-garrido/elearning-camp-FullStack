import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Community, Course } from "@/types/api";

interface EnrolledCommunity extends Community {
  courses: Course[];
}

const MyEnrollments = () => {
  const [enrolledCommunities, setEnrolledCommunities] = useState<EnrolledCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        if (!user) return;
        const res = await ApiClient.getMyEnrollments({ page: 1, limit: 100 });
        
        const enrollments = res.data || [];
        
        const communityMap: { [key: string]: EnrolledCommunity } = {};

        enrollments.forEach((enrollment: any) => {
          if (enrollment.community) {
            const communityId = enrollment.community._id;
            if (!communityMap[communityId]) {
              communityMap[communityId] = {
                ...enrollment.community,
                courses: [],
              };
            }
            if (enrollment.course) {
              communityMap[communityId].courses.push(enrollment.course);
            }
          }
        });

        setEnrolledCommunities(Object.values(communityMap));
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch enrollments', err);
        setError(err?.message || 'Failed to fetch enrollments');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Enrollments</h1>
      </div>

      {enrolledCommunities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">You have no enrollments yet.</p>
          <div className="mt-6">
            <Button onClick={() => navigate('/communities')}>Browse Communities</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {enrolledCommunities.map((community) => (
            <Card key={community._id} className="overflow-hidden">
              <CardHeader className="bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{community.name}</CardTitle>
                  <Button variant="outline" onClick={() => navigate(`/communities/${community._id}`)}>
                    Visit Community
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground pt-2">{community.description}</p>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Enrolled Courses</h3>
                {community.courses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {community.courses.map((course) => (
                      <Card key={course._id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                          <Button size="sm" onClick={() => navigate(`/courses/${course._id}`)}>
                            Go to Course
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No courses enrolled in this community yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEnrollments;
