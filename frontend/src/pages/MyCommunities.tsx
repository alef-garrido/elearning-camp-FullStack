import { useEffect, useState } from "react";
import { Community, Course } from "../types/api";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "../lib/api";
import { useAuth } from "@/hooks/use-auth";

const MyCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [coursesByCommunity, setCoursesByCommunity] = useState<Record<string, Course[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    const fetchMyCommunities = async () => {
      try {
        if (!user) return;
        // Fetch communities created by the user
        const response = await ApiClient.getCommunities({ user: user._id });
        setCommunities(response.data);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Failed to fetch communities:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch communities');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCommunities();
  }, [user]);

  // Load courses for each community so publishers can manage their courses
  useEffect(() => {
    const loadCourses = async () => {
      if (!user || !communities || communities.length === 0) return;

      const results: Record<string, Course[]> = {};

      await Promise.all(communities.map(async (community) => {
        try {
          const res = await ApiClient.getCommunityCourses(community._id, { page: 1, limit: 50 });
          // Only include courses created by the current user (publisher owns them)
          const myCourses = (res.data || []).filter((c: Course) => c.user === user._id);
          results[community._id] = myCourses;
        } catch (err) {
          // If fetching courses fails for a community, continue without blocking
          console.warn(`Failed to load courses for community ${community._id}:`, err);
          results[community._id] = [];
        }
      }));

      setCoursesByCommunity(results);
    };

    loadCourses();
  }, [user, communities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Communities</h1>
        <Button onClick={() => navigate('/communities/new')}>
          Create New Community
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map((community) => (
          <Card key={community._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{community.name}</CardTitle>
                <div className="flex gap-1">
                  {community.topics?.map((topic, index) => (
                    <Badge key={index} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>
              <CardDescription>{community.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {community.averageCost ? `$${community.averageCost}/course` : 'Free'}
                  </Badge>
                  {community.averageRating && (
                    <Badge variant="outline">
                      ⭐ {community.averageRating.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/communities/${community._id}`)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/communities/${community._id}/edit`)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                </div>
                <Button 
                  variant="default"
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    // Route matches the CreateCourse path defined in App.tsx
                    navigate(`/courses/create?communityId=${community._id}`);
                  }}
                >
                  Add New Course
                </Button>
                {/* Courses list for this community (only courses owned by current user) */}
                <div className="mt-3">
                  {coursesByCommunity[community._id] && coursesByCommunity[community._id].length > 0 ? (
                    <div className="space-y-2">
                      {coursesByCommunity[community._id].map((course) => (
                        <div key={course._id} className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">{course.title}</div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/courses/${course._id}`)}>View</Button>
                            <Button size="sm" onClick={() => navigate(`/courses/${course._id}/edit`)}>Edit</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No courses yet</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {communities.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">Welcome to Community Management!</h2>
              <p className="text-muted-foreground mb-6">
                As a publisher, you can create and manage your own learning communities.
                Start by creating your first community and add courses to share your knowledge.
              </p>
              <div className="flex flex-col gap-4">
                <Button 
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/communities/new')}
                >
                  Create Your First Community
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/communities')}
                >
                  Browse Existing Communities
                </Button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default MyCommunities;