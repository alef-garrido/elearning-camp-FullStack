import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { CommunityCard } from "@/components/CommunityCard";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Community } from "@/types/api";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const Communities = () => {
  const navigate = useNavigate();
  const { isPublisher, isAdmin } = useAuth();
  const canCreate = isPublisher || isAdmin;
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [maxCost, setMaxCost] = useState<number | undefined>(undefined);
  const [zipcode, setZipcode] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);

  // Debounce search input to avoid excessive requests
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      loadCommunities();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    // Reload when filters or pagination change
    loadCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedTopics, sortBy, minRating, maxCost, zipcode, distanceKm]);

  const loadCommunities = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 9,
      };

      if (selectedTopics.length > 0) params.topics = selectedTopics.join(',');
      if (sortBy) params.sort = sortBy; // backend supports sort param
      if (minRating) params.averageRating = minRating;
      if (maxCost) params.averageCost = maxCost;
      if (zipcode) params.location = zipcode;
      if (distanceKm) params.distance = distanceKm;

      const response = await ApiClient.getCommunities(params);
      setCommunities(response.data || []);
      if (response.pagination) {
        setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load communities");
      setCommunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (community.topics || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container py-8 sm:py-12 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Learning Communities</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Discover and join communities that match your interests
            </p>
          </div>
          
          {canCreate ? (
            <Button 
              className="bg-gradient-primary hover:opacity-90 w-full md:w-auto"
              onClick={() => navigate('/communities/create')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">Sign in as a publisher to create communities</div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:items-center">
            <Select
              value={selectedTopics.length === 0 ? "all" : selectedTopics[0]}
              onValueChange={(value) => setSelectedTopics(value === "all" ? [] : [value])}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="programming">Programming</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy || "relevance"} onValueChange={(v) => setSortBy(v === "relevance" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="-averageRating">Rating (high → low)</SelectItem>
                <SelectItem value="averageCost">Cost (low → high)</SelectItem>
                <SelectItem value="-createdAt">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="w-full sm:w-40">
            <Input
              placeholder="Min rating (e.g. 4)"
              type="number"
              min={1}
              max={5}
              value={minRating ? String(minRating) : ''}
              onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="w-full sm:w-40">
            <Input
              placeholder="Max cost"
              type="number"
              min={0}
              value={maxCost ? String(maxCost) : ''}
              onChange={(e) => setMaxCost(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="w-full sm:w-40 flex gap-2">
            <Input
              placeholder="Zipcode"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
            />
            <Input
              placeholder="Distance km"
              type="number"
              min={1}
              value={distanceKm ? String(distanceKm) : ''}
              onChange={(e) => setDistanceKm(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedTopics([]);
                setSortBy('');
                setMinRating(undefined);
                setMaxCost(undefined);
                setZipcode('');
                setDistanceKm(undefined);
                setCurrentPage(1);
                loadCommunities();
              }}
            >
              Clear filters
            </Button>
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
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredCommunities.map((community) => (
                <CommunityCard key={community._id} community={community} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        disabled={isLoading}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Communities;
