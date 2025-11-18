import { Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, User, Menu, Plus, GraduationCap, Users } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/use-auth";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, memo, useCallback } from "react";

const NavbarComponent = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const canCreateCommunity = useFeatureFlag('community-creation');
  const canCreateCourse = useFeatureFlag('course-creation');
  const canManageUsers = useFeatureFlag('user-management');

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth');
  }, [logout, navigate]);

  // When authenticated, show a locked left sidebar on medium+ screens
  if (isAuthenticated) {
    return (
      <>
        {/* Sidebar for authenticated users (desktop) */}
        <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 z-50 border-r border-border/40 bg-background p-6 flex-col">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg sm:text-xl mb-6">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="bg-gradient-primary bg-clip-text text-transparent">LearnHub</span>
          </Link>

          <nav className="flex-1 flex flex-col gap-3">
            <Link to="/communities" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2">
              Communities
            </Link>
            <Link to="/courses" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2">
              Courses
            </Link>
            <Link to="/dashboard" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2">
              Dashboard
            </Link>
            <Link to="/my-enrollments" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2">
              My Enrollments
            </Link>

            {canManageUsers && (
              <Link to="/admin/dashboard" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2">
                Admin Dashboard
              </Link>
            )}

            {(canCreateCommunity || canCreateCourse) && (
              <>
                <Link to="/my-communities" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2">
                  My Communities
                </Link>
                {canCreateCommunity && (
                  <Link to="/communities/create" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2">
                    Create Community
                  </Link>
                )}
                {canCreateCourse && (
                  <Link to="/courses/create" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2">
                    Create Course
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Profile preview placed above the logout button */}
          <div className="mt-6 mb-4 flex items-center gap-3">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user?.name || user?.email}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                {user?.name ? user.name.split(' ').map(n => n[0]).slice(0,2).join('') : (user?.email || '').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col">
              <span className="font-semibold text-sm">{user?.name || user?.email}</span>
              <span className="text-xs text-muted-foreground break-all">{user?.email}</span>
            </div>
          </div>

          <div className="mt-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Top bar for small screens when authenticated */}
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold text-lg sm:text-xl">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="bg-gradient-primary bg-clip-text text-transparent">LearnHub</span>
            </Link>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  {/* Profile preview for small screens */}
                  <div className="mb-2 flex items-center gap-3">
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt={user?.name || user?.email} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                        {user?.name ? user.name.split(' ').map(n => n[0]).slice(0,2).join('') : (user?.email || '').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{user?.name || user?.email}</span>
                      <span className="text-xs text-muted-foreground break-all">{user?.email}</span>
                    </div>
                  </div>
                  <Link to="/communities" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Communities</Link>
                  <Link to="/courses" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Courses</Link>
                  <Link to="/dashboard" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Dashboard</Link>
                  <Link to="/my-enrollments" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>My Enrollments</Link>
                  {(canCreateCommunity || canCreateCourse) && (
                    <>
                      <Link to="/my-communities" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>My Communities</Link>
                      {canCreateCommunity && <Link to="/communities/create" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Create Community</Link>}
                      {canCreateCourse && <Link to="/courses/create" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Create Course</Link>}
                    </>
                  )}

                  <Button variant="outline" className="justify-start" onClick={() => { handleLogout(); setOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </>
    );
  }

  // Default (unauthenticated) navbar
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg sm:text-xl">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="bg-gradient-primary bg-clip-text text-transparent">LearnHub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/communities" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Explore Communities
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-enrollments')}>
                  <Users className="mr-2 h-4 w-4" />
                  My Enrollments
                </DropdownMenuItem>
                {canManageUsers && (
                  <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                {(canCreateCommunity || canCreateCourse) && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/my-communities')}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      My Communities
                    </DropdownMenuItem>
                    {canCreateCommunity && (
                      <DropdownMenuItem onClick={() => navigate('/communities/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Community
                      </DropdownMenuItem>
                    )}
                    {canCreateCourse && (
                      <DropdownMenuItem onClick={() => navigate('/courses/create')}>
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Create Course
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/auth')} className="bg-gradient-primary hover:opacity-90">Sign In</Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="flex flex-col gap-4 mt-8">
              {isAuthenticated && (
                <div className="mb-2 flex items-center gap-3">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user?.name || user?.email} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                      {user?.name ? user.name.split(' ').map(n => n[0]).slice(0,2).join('') : (user?.email || '').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{user?.name || user?.email}</span>
                    <span className="text-xs text-muted-foreground break-all">{user?.email}</span>
                  </div>
                </div>
              )}

              <Link to="/communities" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Communities</Link>
              <Link to="/courses" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Courses</Link>

              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-enrollments"
                    className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    onClick={() => setOpen(false)}
                  >
                    My Enrollments
                  </Link>
                  {(canCreateCommunity || canCreateCourse) && (
                    <>
                      <Link to="/my-communities" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>My Communities</Link>
                      {canCreateCommunity && <Link to="/communities/create" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Create Community</Link>}
                      {canCreateCourse && <Link to="/courses/create" className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2" onClick={() => setOpen(false)}>Create Course</Link>}
                    </>
                  )}
                  <Button variant="outline" className="justify-start" onClick={() => { handleLogout(); setOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button onClick={() => { navigate('/auth'); setOpen(false); }} className="bg-gradient-primary hover:opacity-90 justify-start">Sign In</Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export const Navbar = memo(NavbarComponent);