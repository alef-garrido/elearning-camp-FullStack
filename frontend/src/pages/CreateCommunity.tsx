import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { PhotoUploader } from "@/components/PhotoUploader";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

const TOPICS = [
  "Web Development",
  "Career Growth",
  "System Design",
  "Tech Interviews",
  "Career Advancement",
  "Leadership",
  "HTML/CSS",
  "JavaScript Basics",
  "Git & GitHub",
  "Learning How to Learn",
  "Creative Coding",
  "Generative Art",
  "UI Animation",
  "Portfolio Building"
];

const CreateCommunity = () => {
  const navigate = useNavigate();
  const canCreateCommunity = useFeatureFlag('community-creation');

  useEffect(() => {
    if (!canCreateCommunity) {
      toast.error("You are not authorized to create communities");
      navigate("/communities");
    }
  }, [canCreateCommunity, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    topics: [] as string[],
    hasMentorship: false,
    hasLiveEvents: false,
    isPaid: false
  });

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First create the community
      const response = await ApiClient.createCommunity(formData);
      
      // Show success message
      toast.success("Community created successfully!");
      
      // Redirect to the community details page
      navigate(`/communities/${response.data._id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create community");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 sm:py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create New Community</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Fill in the details below to create your learning community
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Community Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter community name"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your community..."
                  maxLength={500}
                  className="h-32"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+1 234 567 8900"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter your community's physical address"
                />
              </div>

              <div className="space-y-2">
                <Label>Topics *</Label>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {TOPICS.map((topic) => (
                    <div key={topic} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic}`}
                        checked={formData.topics.includes(topic)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleChange("topics", [...formData.topics, topic]);
                          } else {
                            handleChange(
                              "topics",
                              formData.topics.filter((t) => t !== topic)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`topic-${topic}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {topic}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasMentorship"
                    checked={formData.hasMentorship}
                    onCheckedChange={(checked) => 
                      handleChange("hasMentorship", Boolean(checked))
                    }
                  />
                  <Label htmlFor="hasMentorship">Offers Mentorship</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasLiveEvents"
                    checked={formData.hasLiveEvents}
                    onCheckedChange={(checked) => 
                      handleChange("hasLiveEvents", Boolean(checked))
                    }
                  />
                  <Label htmlFor="hasLiveEvents">Has Live Events</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPaid"
                    checked={formData.isPaid}
                    onCheckedChange={(checked) => 
                      handleChange("isPaid", Boolean(checked))
                    }
                  />
                  <Label htmlFor="isPaid">Paid Membership</Label>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Community"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCommunity;