import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Award, Star, TrendingUp, Image as ImageIcon } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showCommunityPhotos, setShowCommunityPhotos] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      navigate('/auth');
    }
  }, [navigate]);

  const stats = [
    { label: "Enrolled Courses", value: "5", icon: BookOpen, color: "text-primary" },
    { label: "Completed", value: "2", icon: Award, color: "text-accent" },
    { label: "Average Rating", value: "4.8", icon: Star, color: "text-yellow-500" },
    { label: "Learning Streak", value: "12 days", icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8 sm:py-12 px-4">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Here's your learning progress overview
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          {stats.map((stat) => (
            <Card key={stat.label} className="shadow-soft hover:shadow-medium transition-shadow bg-gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 md:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="shadow-soft border-border/50 bg-gradient-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Continue Learning</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base truncate">React Fundamentals</h3>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">60%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/50 bg-gradient-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Recommended for You</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base truncate">Advanced TypeScript</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">8 weeks • Intermediate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft border-border/50 bg-gradient-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              My Community Photos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't uploaded any community photos yet.</p>
              <p className="text-sm mt-2">Visit your communities to upload photos.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
