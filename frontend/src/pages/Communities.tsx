import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { CommunityCard } from "@/components/CommunityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Community } from "@/types/api";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const response: any = await ApiClient.getCommunities();
      setCommunities(response.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load communities");
      // Mock data for demo
      setCommunities([
        {
          _id: "1",
          name: "Web Development Bootcamp",
          description: "Learn full-stack web development with modern technologies and best practices.",
          averageRating: 4.8,
          isPaid: true,
          hasMentorship: true,
          hasLiveEvents: true,
          topics: ["React", "Node.js", "TypeScript"],
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          name: "Data Science Academy",
          description: "Master data analysis, machine learning, and AI with hands-on projects.",
          averageRating: 4.9,
          address: "San Francisco, CA",
          isPaid: true,
          hasMentorship: true,
          topics: ["Python", "ML", "AI"],
          createdAt: new Date().toISOString(),
        },
        {
          _id: "3",
          name: "Design Systems Pro",
          description: "Create beautiful and consistent user interfaces with modern design principles.",
          averageRating: 4.7,
          website: "https://example.com",
          hasLiveEvents: true,
          topics: ["UI/UX", "Figma", "Design"],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8 sm:py-12 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Learning Communities</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Discover and join communities that match your interests
            </p>
          </div>
          
          <Button className="bg-gradient-primary hover:opacity-90 w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Community
          </Button>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 sm:h-80 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground text-base sm:text-lg">No communities found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCommunities.map((community) => (
              <CommunityCard key={community._id} community={community} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;
