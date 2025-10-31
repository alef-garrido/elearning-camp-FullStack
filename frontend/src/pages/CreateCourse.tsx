import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { Community, CreateCourseInput } from "@/types/api";

const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];

const CreateCourse = () => {
  const navigate = useNavigate();
  const { communityId } = useParams(); // Optional: If coming from a community page
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
      const role = user?.role;
      if (!(role === 'publisher' || role === 'admin')) {
        toast.error('You are not authorized to create courses');
        navigate('/courses');
      }
    } catch (e) {
      navigate('/auth');
    }
  }, [navigate]);
  const [isLoading, setIsLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [formData, setFormData] = useState<CreateCourseInput>({
    title: "",
    description: "",
    weeks: "",
    membership: 0,
    minimumSkill: "beginner",
    scholarshipsAvailable: false,
    communityId: communityId || "", // If not provided in URL, empty string
  });

  // Load communities for the select dropdown
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const response = await ApiClient.getCommunities();
        setCommunities(response.data || []);
      } catch (error: any) {
        toast.error(error.message || "Failed to load communities");
      }
    };

    loadCommunities();
  }, []);

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.communityId) {
      toast.error("Please select a community");
      return;
    }

    setIsLoading(true);

    try {
      // Create a payload that matches CreateCourseInput
      const payload = {
        title: formData.title,
        description: formData.description,
        weeks: formData.weeks,
        membership: formData.membership,
        minimumSkill: formData.minimumSkill,
        scholarshipsAvailable: formData.scholarshipsAvailable,
        communityId: formData.communityId,
      };

      const response = await ApiClient.createCourse(payload);
      toast.success("Course created successfully!");
      navigate(`/courses/${response.data._id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create course");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8 sm:py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create New Course</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Add a new course to your learning community
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Enter course title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="community">Community *</Label>
                  <Select
                    value={formData.communityId}
                    onValueChange={(value) => handleChange("communityId", value)}
                    disabled={!!communityId} // Disable if communityId is provided in URL
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((community) => (
                        <SelectItem key={community._id} value={community._id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your course..."
                  className="h-32"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="weeks">Duration (weeks) *</Label>
                  <Input
                    id="weeks"
                    required
                    type="text"
                    value={formData.weeks}
                    onChange={(e) => handleChange("weeks", e.target.value)}
                    placeholder="e.g., 8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membership">Membership Cost *</Label>
                  <Input
                    id="membership"
                    required
                    type="number"
                    min={0}
                    value={formData.membership}
                    onChange={(e) => handleChange("membership", Number(e.target.value))}
                    placeholder="Enter cost"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumSkill">Minimum Skill Level *</Label>
                  <Select
                    value={formData.minimumSkill}
                    onValueChange={(value) => handleChange("minimumSkill", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scholarshipsAvailable"
                  checked={formData.scholarshipsAvailable}
                  onCheckedChange={(checked) => 
                    handleChange("scholarshipsAvailable", Boolean(checked))
                  }
                />
                <Label htmlFor="scholarshipsAvailable">
                  Scholarship Available
                </Label>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCourse;