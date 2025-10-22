import { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Course } from "@/types/api";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response: any = await ApiClient.getCourses();
      setCourses(response.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load courses");
      // Mock data for demo
      setCourses([
        {
          _id: "1",
          title: "React & TypeScript Masterclass",
          description: "Build modern web applications with React 18, TypeScript, and best practices.",
          weeks: "12",
          membership: 499,
          minimumSkill: "intermediate",
          scholarshipsAvailable: true,
          community: "1",
          user: "user1",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          title: "Python for Data Science",
          description: "Learn Python fundamentals and dive into data analysis with pandas and numpy.",
          weeks: "8",
          membership: 399,
          minimumSkill: "beginner",
          scholarshipsAvailable: true,
          community: "2",
          user: "user2",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "3",
          title: "Advanced UI/UX Design",
          description: "Master user interface design with Figma and learn to create stunning experiences.",
          weeks: "10",
          membership: 449,
          minimumSkill: "advanced",
          scholarshipsAvailable: false,
          community: "3",
          user: "user3",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = skillFilter === "all" || course.minimumSkill === skillFilter;
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8 sm:py-12 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Available Courses</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Find the perfect course to advance your skills
            </p>
          </div>
          
          <Button className="bg-gradient-primary hover:opacity-90 w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10"
            />
          </div>
          
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Skill Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 sm:h-80 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground text-base sm:text-lg">No courses found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
