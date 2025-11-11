import { useState, useEffect } from "react";
import { Trash2, Users, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "./ui/pagination";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { User } from "@/types/api";

interface Enrollment {
  _id: string;
  user: User;
  community: string;
  status: 'active' | 'cancelled';
  enrolledAt: string;
}

interface EnrolledUsersListProps {
  communityId: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  onUserRemoved?: () => void;
}

export const EnrolledUsersList = ({
  communityId,
  isAdmin = false,
  isOwner = false,
  onUserRemoved
}: EnrolledUsersListProps) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const enrollmentsPerPage = 10;

  useEffect(() => {
    loadEnrolledUsers();
  }, [communityId, page]);

  const loadEnrolledUsers = async () => {
    try {
      setIsLoading(true);
      const res = await ApiClient.getCommunityEnrollments(communityId, {
        page,
        limit: enrollmentsPerPage
      });
      
      setEnrollments(res.data || []);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setTotalPages(Math.ceil(res.pagination.total / enrollmentsPerPage));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load enrolled users");
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenrollUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user from the community?")) {
      return;
    }

    try {
      setRemovingUserId(userId);
      await ApiClient.unenrollUserFromCommunity(communityId, userId);
      toast.success("User removed from community");
      
      // Reload the list
      loadEnrolledUsers();
      onUserRemoved?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove user");
    } finally {
      setRemovingUserId(null);
    }
  };

  if (isLoading && enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrolled Members
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrolled Members
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No enrolled members yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrolled Members
          </div>
          <Badge variant="secondary" className="text-sm">
            {total} {total === 1 ? "member" : "members"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment._id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {enrollment.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {enrollment.user.email}
                </p>
              </div>

              {(isAdmin || isOwner) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2 p-2 flex-shrink-0"
                  onClick={() => handleUnenrollUser(enrollment.user._id)}
                  disabled={removingUserId === enrollment.user._id}
                >
                  {removingUserId === enrollment.user._id ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (pageNum === page - 2 || pageNum === page + 2) {
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};
