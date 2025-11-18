import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiClient } from '@/lib/api';
import { EnrolledCommunity } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const MyEnrollments = () => {
  const [enrolledCommunities, setEnrolledCommunities] = useState<EnrolledCommunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [communityToLeave, setCommunityToLeave] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await ApiClient.getMyEnrollments({ page, limit: 10 });
        // The API returns both community and course enrollments. This view lists community memberships only.
        const data = response.data || [];
        const communityOnly = data.filter((e: any) => e.community);
        setEnrolledCommunities(communityOnly);
        // Use client-side counts for community-only view. Server pagination currently returns all enrollments (both types),
        // so we compute pages locally from the filtered list.
        setTotalCount(communityOnly.length);
        setTotalPages(Math.max(1, Math.ceil(communityOnly.length / 10)));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch enrollments.');
        toast.error('Failed to load enrollments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollments();
  }, [page]);

  const handleLeaveCommunity = async (communityId: string) => {
    setLeavingId(communityId);
    try {
      await ApiClient.unenrollCommunity(communityId);
      const communityName = enrolledCommunities.find(e => e.community._id === communityId)?.community.name || 'Community';
      setEnrolledCommunities(prev => prev.filter(enrollment => enrollment.community._id !== communityId));
      setTotalCount(prev => prev - 1);
      toast.success(`Left "${communityName}" successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to leave community');
    } finally {
      setLeavingId(null);
      setCommunityToLeave(null);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">My Community Memberships</h1>
        <p className="text-muted-foreground">
          You are a member of {totalCount} {totalCount === 1 ? 'community' : 'communities'}.
        </p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">You haven't joined any communities yet.</h2>
          <p className="text-muted-foreground mb-4">Explore communities and join the ones that interest you!</p>
          <Button asChild>
            <Link to="/communities">Browse Communities</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCommunities.map(enrollment => (
              <Card key={enrollment._id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{enrollment.community.name}</CardTitle>
                  <Badge variant="secondary">Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</Badge>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground line-clamp-3">{enrollment.community.description}</p>
                  <div className="mt-4">
                    <Badge>{enrollment.community.enrollmentCount} Members</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button asChild className="flex-1">
                    <Link to={`/communities/${enrollment.community._id}`}>View Community</Link>
                  </Button>
                  <AlertDialog open={communityToLeave === enrollment.community._id} onOpenChange={(open) => {
                    if (!open) setCommunityToLeave(null);
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={() => setCommunityToLeave(enrollment.community._id)}
                        disabled={leavingId === enrollment.community._id}
                      >
                        {leavingId === enrollment.community._id ? 'Leaving...' : 'Leave'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Leave Community</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to leave "{enrollment.community.name}"? You can rejoin anytime.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleLeaveCommunity(enrollment.community._id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Leave
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                Previous
              </Button>
              <span className="mx-4 self-center">
                Page {page} of {totalPages}
              </span>
              <Button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyEnrollments;
