import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Award, Star, TrendingUp, Image as ImageIcon, Pencil, Trash2, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClient } from "@/lib/api";
import { User } from "@/types/api";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!localStorage.getItem('auth_token')) {
          navigate('/auth');
          return;
        }

        const response = await ApiClient.getCurrentUser();
        setUser(response.data);
        
        // If user is admin, fetch all users
        if (response.data.role === 'admin') {
          const usersResponse = await ApiClient.getUsers();
          setUsers(usersResponse.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load user data");
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

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
      <Navbar />
      
      <div className="container py-8 sm:py-12 px-4">
        {isLoading ? (
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

              {/* Admin: User Management Section */}
              {user.role === 'admin' && (
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
