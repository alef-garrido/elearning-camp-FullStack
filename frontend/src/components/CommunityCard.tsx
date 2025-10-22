import { Star, MapPin, Globe } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Community } from "@/types/api";
import { Link } from "react-router-dom";

interface CommunityCardProps {
  community: Community;
}

export const CommunityCard = ({ community }: CommunityCardProps) => {
  return (
    <Link to={`/communities/${community._id}`}>
      <Card className="overflow-hidden hover:shadow-medium transition-all duration-300 group cursor-pointer bg-gradient-card border-border/50">
        <div className="aspect-video bg-gradient-primary relative overflow-hidden">
          {community.photo ? (
            <img 
              src={community.photo} 
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
