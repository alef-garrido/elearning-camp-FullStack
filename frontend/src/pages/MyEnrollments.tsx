import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

const MyEnrollments = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        if (!user) return;
        const res = await ApiClient.getMyEnrollments({ page: 1, limit: 50 });
        setEnrollments(res.data || []);
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

      <div className="grid grid-cols-1 gap-6">
        {enrollments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">You have no enrollments yet.</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
            </div>
          </div>
        )}

        {enrollments.map((enrollment) => (
          <Card key={enrollment._id || enrollment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">
                {enrollment.course?.title || enrollment.course?.name || enrollment.title || 'Enrollment'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">
                {enrollment.course?.description || enrollment.community?.name || ''}
              </div>
              <div className="flex gap-2">
                {enrollment.course?._id && (
                  <Button onClick={() => navigate(`/courses/${enrollment.course._id}/player`)}>
                    Open Course
                  </Button>
                )}
                {enrollment.community?._id && (
                  <Button variant="outline" onClick={() => navigate(`/communities/${enrollment.community._id}`)}>
                    Open Community
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyEnrollments;
