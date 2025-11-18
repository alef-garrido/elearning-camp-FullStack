import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Award, Star, TrendingUp, Image as ImageIcon, Pencil, Trash2, Users, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClient } from "@/lib/api";
import { User, Community, Course } from "@/types/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { UserPhotoUploader } from "@/components/UserPhotoUploader";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, setUser } = useAuth() as any;
  const canManageUsers = useFeatureFlag('user-management');
  const canCreateCommunity = useFeatureFlag('community-creation');
  const canCreateCourse = useFeatureFlag('course-creation');

  const [users, setUsers] = useState<User[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      if (canManageUsers) {
        try {
          const usersResponse = await ApiClient.getUsers();
          setUsers(usersResponse.data);
        } catch (error: any) {
          toast.error(error.message || "Failed to load users");
        }
      }

      if (canCreateCommunity) {
        try {
          const communitiesResponse = await ApiClient.getCommunities({ user: user._id });
          setMyCommunities(communitiesResponse.data);
        } catch (error: any) {
          toast.error(error.message || "Failed to load communities");
        }
      }

      if (canCreateCourse) {
        try {
          const coursesResponse = await ApiClient.getCourses(); // This will get all courses, we need to filter by user
          setMyCourses(coursesResponse.data.filter(course => course.user === user._id));
        } catch (error: any) {
          toast.error(error.message || "Failed to load courses");
        }
      }

      setIsLoading(false);
    };

    if (!isAuthLoading) {
      if (!user) {
        navigate('/auth');
      } else {
        fetchData();
      }
    }
  }, [user, canManageUsers, canCreateCommunity, canCreateCourse, isAuthLoading, navigate]);

  const handleUserUpdate = async (userId: string, updates: { name?: string; email?: string; }) => {
    try {
      await ApiClient.updateUser(userId, updates);
      const usersResponse = await ApiClient.getUsers();
      setUsers(usersResponse.data);
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleUserDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await ApiClient.deleteUser(userId);
      const usersResponse = await ApiClient.getUsers();
      setUsers(usersResponse.data);
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container py-8 sm:py-12 px-4">
        {isLoading || isAuthLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        ) : user ? (
          <>
            <div className="mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Welcome Back, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Here's your account information
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {/* User Profile Card */}
              <Card className="shadow-soft border-border/50 bg-gradient-card">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="space-y-4">
                                      <div>
                      <p className="mb-4 text-sm text-muted-foreground">Profile Photo</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          {user.photoUrl ? (
                            <img
                              src={user.photoUrl}
                              alt="Profile"
                              className="w-36 h-36 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-36 h-36 rounded-full bg-muted flex items-center justify-center border">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}

                          <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm">Change Photo</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Update profile photo</DialogTitle>
                              </DialogHeader>
                              <UserPhotoUploader
                                currentPhotoUrl={user.photoUrl}
                                onUploadSuccess={(photo, photoUrl) => {
                                  setUser && setUser({ ...user, photo, photoUrl });
                                  toast.success("Profile photo updated!");
                                  setShowPhotoDialog(false);
                                }}
                                onClose={() => setShowPhotoDialog(false)}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="text-lg font-medium">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-lg font-medium">{user.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="text-lg font-medium capitalize">{user.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="text-lg font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Publisher: My Communities Section */}
              {canCreateCommunity && (
                <Card className="shadow-soft border-border/50">
                  <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      My Communities
                    </CardTitle>
                    <Link to="/communities/create">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Community
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    {myCommunities.length > 0 ? (
                      <ul className="divide-y divide-border">
                        {myCommunities.map(community => (
                          <li key={community._id} className="py-3 flex items-center justify-between">
                            <Link to={`/communities/${community._id}`} className="font-medium hover:underline">
                              {community.name}
                            </Link>
                            <span className="text-sm text-muted-foreground">{community.courses?.length || 0} Courses</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">You have not created any communities yet.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Publisher: My Courses Section */}
              {canCreateCourse && (
                <Card className="shadow-soft border-border/50">
                  <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      My Courses
                    </CardTitle>
                    <Link to="/courses/create">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    {myCourses.length > 0 ? (
                      <ul className="divide-y divide-border">
                        {myCourses.map(course => (
                          <li key={course._id} className="py-3 flex items-center justify-between">
                            <Link to={`/courses/${course._id}`} className="font-medium hover:underline">
                              {course.title}
                            </Link>
                            <span className="text-sm text-muted-foreground">{course.minimumSkill}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">You have not created any courses yet.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Admin: User Management Section */}
              {canManageUsers && (
                <Card className="shadow-soft border-border/50">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Management
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {users.length} users total
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u._id}>
                            <TableCell>{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell className="capitalize">{u.role}</TableCell>
                            <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog open={isEditDialogOpen && selectedUser?._id === u._id} onOpenChange={(open) => {
                                  setIsEditDialogOpen(open);
                                  if (!open) setSelectedUser(null);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setSelectedUser(u)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit User</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={(e) => {
                                      e.preventDefault();
                                      const formData = new FormData(e.currentTarget);
                                      handleUserUpdate(u._id, {
                                        name: formData.get('name') as string,
                                        email: formData.get('email') as string,
                                      });
                                    }}>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                          <Label htmlFor="name">Name</Label>
                                          <Input
                                            id="name"
                                            name="name"
                                            defaultValue={u.name}
                                            required
                                          />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label htmlFor="email">Email</Label>
                                          <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={u.email}
                                            required
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button type="submit">Save changes</Button>
                                      </DialogFooter>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleUserDelete(u._id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-lg text-muted-foreground">Please log in to view your dashboard</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
