import { Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, User, Menu } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";

export const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('auth_token');
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/auth');
  };

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
            Communities
          </Link>
          <Link to="/courses" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Courses
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
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/auth')} className="bg-gradient-primary hover:opacity-90">
              Sign In
            </Button>
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
              <Link 
                to="/communities" 
                className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                onClick={() => setOpen(false)}
              >
                Communities
              </Link>
              <Link 
                to="/courses" 
                className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                onClick={() => setOpen(false)}
              >
                Courses
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Button 
                    variant="outline" 
                    className="justify-start" 
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    navigate('/auth');
                    setOpen(false);
                  }} 
                  className="bg-gradient-primary hover:opacity-90 justify-start"
                >
                  Sign In
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
