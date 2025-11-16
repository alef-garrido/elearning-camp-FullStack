import { Star, MapPin, Globe, Edit3, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Community } from "@/types/api";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";

interface CommunityCardProps {
  community: Community;
}

export const CommunityCard = ({ community }: CommunityCardProps) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const isOwner = user && (isAdmin || user._id === community.user);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Delete community "${community.name}"? This will remove all associated courses.`)) return;
    try {
      await ApiClient.deleteCommunity(community._id);
      toast.success('Community deleted');
      navigate('/communities');
      // quick full refresh to update lists
      setTimeout(() => window.location.reload(), 250);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete community');
    }
  };
  return (
    <Link to={`/communities/${community._id}`}>
      <Card className="overflow-hidden hover:shadow-medium transition-all duration-300 group cursor-pointer bg-gradient-card border-border/50">
        <div className="aspect-video bg-gradient-primary relative overflow-hidden">
          {community.photoUrl ? (
            <img 
              src={community.photoUrl} 
              alt={community.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-foreground/20">
                {community.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4 sm:p-6">
          {isOwner && (
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <Link to={`/communities/${community._id}/edit`} onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="p-2">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="p-2" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <h3 className="text-lg sm:text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2 flex-1">
              {community.name}
            </h3>
            {community.averageRating && (
              <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-medium text-xs sm:text-sm">{community.averageRating}</span>
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">
            {community.description}
          </p>
          
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {community.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{community.address}</span>
              </div>
            )}
            {community.website && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 flex-shrink-0" />
                <span>Website</span>
              </div>
            )}
            {community.isPaid && (
              <Badge variant="outline" className="text-xs">Paid</Badge>
            )}
            {community.hasMentorship && (
              <Badge variant="secondary" className="text-xs">Mentorship</Badge>
            )}
            {community.hasLiveEvents && (
              <Badge variant="secondary" className="text-xs">Live Events</Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
