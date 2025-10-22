import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container relative py-16 sm:py-24 md:py-32 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Learn Together, Grow Together
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed px-4">
              Join thriving learning communities and discover courses that transform your future.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link to="/communities" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 text-base sm:text-lg px-6 sm:px-8">
                  Explore Communities
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link to="/courses" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 border-border/50">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-secondary/30">
        <div className="container px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-shadow">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Vibrant Communities</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Connect with learners and experts in diverse educational communities.
              </p>
            </div>

            <div className="text-center p-6 sm:p-8 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-shadow">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Quality Courses</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Access carefully curated courses from beginner to advanced levels.
              </p>
            </div>

            <div className="text-center p-6 sm:p-8 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-shadow sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Award className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Real Progress</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Track your learning journey and earn recognized certifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-primary rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-12 shadow-strong">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-3 sm:mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 mb-6 sm:mb-8 px-4">
              Join thousands of learners already transforming their careers.
            </p>
            <Link to="/auth" className="inline-block">
              <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
