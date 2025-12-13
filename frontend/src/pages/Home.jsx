import React, { useState, useEffect } from "react";
import api from "../api"; 
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Clock,
  Leaf,
  Package,
  User,
  Calendar,
  MessageCircle,
  Send,
  Loader2,
  Pencil,
  RefreshCw,
  Users,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { SimpleAvatar } from "../components/ui/SimpleAvatar";
import { SimpleSelect, SimpleSelectItem } from "../components/ui/SimpleSelect";
import { SimpleDialog, SimpleDialogHeader, SimpleDialogTitle, SimpleDialogDescription } from "../components/ui/SimpleDialog";
import { SimpleTabs, SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent } from "../components/ui/SimpleTabs";
import { useAuth } from "../App";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("offers");
  const [visiblePostCount, setVisiblePostCount] = useState(8);

  // Reset visiblePostCount when tab changes
  useEffect(() => {
    setVisiblePostCount(8);
  }, [activeTab]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (selectedType) params.append('post_type', selectedType);
        // Note: Tag filtering is done client-side, not via API params
        if (selectedLocation) params.append('location', selectedLocation);
        if (searchTerm) params.append('search', searchTerm); 
        
        // Limit to first page only (PAGE_SIZE=20) to avoid loading all posts
        // If pagination is needed in the future, implement "Load More" button
        params.append('page', '1');
        params.append('page_size', '20');

        const response = await api.get('/posts/', { params });
        
        // Check if response.data is an array, if not, handle pagination or errors
        let postsData = [];
        if (Array.isArray(response.data)) {
          postsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Backend returns paginated response with 'results' array
          postsData = response.data.results || [];
          // Note: response.data.next contains URL for next page if available
          // For now, we only load the first page (20 posts) for performance
        }
        
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          title: post.title,
          tags: post.tags, 
          location: post.location,
          type: post.post_type, 
          description: post.description,
          duration: post.duration,
          frequency: post.frequency,
          participantCount: post.participant_count,
          date: post.date,
          time: post.time,
          postedBy: post.postedBy,
          avatar: post.avatar,
          image: post.image,
          postedDate: formatDistanceToNow(new Date(post.postedDate), {
            addSuffix: true,
            locale: tr,
          }),
          latitude: post.latitude,
          longitude: post.longitude,
        }));
        
        setPosts(formattedPosts);
      } catch (err) {
        console.error("Data fetching error:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        setError("An error occurred while loading posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    
  }, [selectedType, selectedLocation, searchTerm]); 


  const filteredPosts = React.useMemo(() => {
    if (!Array.isArray(posts)) return [];
    
    return posts.filter(post => {
      try {
        const typeMatch = selectedType ? post.type === selectedType : true;
        
        const locationMatch = selectedLocation 
          ? (post.location && typeof post.location === 'string' && post.location.toLowerCase().includes(selectedLocation.toLowerCase()))
          : true;
        
        const searchMatch = searchTerm 
          ? (
              (post.title && typeof post.title === 'string' && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (post.description && typeof post.description === 'string' && post.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (post.postedBy && typeof post.postedBy === 'string' && post.postedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (post.location && typeof post.location === 'string' && post.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (post.tags && Array.isArray(post.tags) && post.tags.some(tag => 
                tag && typeof tag === 'string' && tag.toLowerCase().includes(searchTerm.toLowerCase())
              ))
            )
          : true;
        
        return typeMatch && locationMatch && searchMatch;
      } catch (err) {
        console.error('Error filtering post:', err, post);
        return false;
      }
    });
  }, [posts, selectedType, selectedLocation, searchTerm]);


  const offerPosts = filteredPosts.filter((post) => post.type === "offer");
  const needPosts = filteredPosts.filter((post) => post.type === "need");
  
  // Display posts based on visiblePostCount
  const displayedOfferPosts = offerPosts.slice(0, visiblePostCount);
  const displayedNeedPosts = needPosts.slice(0, visiblePostCount);
  
  // Determine if there are more posts to show
  const hasMoreOffers = offerPosts.length > visiblePostCount;
  const hasMoreNeeds = needPosts.length > visiblePostCount;
  
  const mapPosts = activeTab === 'offers' ? offerPosts : needPosts;
  
  // Filter posts that have valid coordinates
  const postsWithCoordinates = mapPosts.filter(post => 
    post.latitude != null && post.longitude != null && 
    !isNaN(post.latitude) && !isNaN(post.longitude)
  );
  
  const defaultCenter = [41.0082, 28.9784]; // Istanbul coordinates
  const mapCenter = postsWithCoordinates.length > 0
    ? [
        postsWithCoordinates.reduce((sum, p) => sum + p.latitude, 0) / postsWithCoordinates.length,
        postsWithCoordinates.reduce((sum, p) => sum + p.longitude, 0) / postsWithCoordinates.length
      ]
    : defaultCenter;

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  // Helper function to truncate location to 35 characters
  const truncateLocation = (location) => {
    if (!location) return '';
    if (location.length <= 35) return location;
    return location.substring(0, 35) + '...';
  };

  // Helper function to truncate title to 50 characters
  const truncateTitle = (title) => {
    if (!title) return '';
    if (title.length <= 50) return title;
    return title.substring(0, 50) + '...';
  };

  if (loading && posts.length === 0) { // Show full screen loading only on initial load
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="ml-4 text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <p className="text-lg text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-gray-50 pb-4">
      {/* Search Area */}
      <div className="space-y-4 mt-6">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title, description, tag, location, or username..."
              className="pl-10 bg-white border-primary/20 focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/post/new">
            <Button className="shadow-md bg-primary hover:bg-primary/90 text-white whitespace-nowrap" size="lg">
              <Leaf className="w-4 h-4 mr-2" />
              Publish an Offer
            </Button>
          </Link>
        </div>
      </div>

      {/* Map Area */}
      <div>
        <Card className="overflow-hidden shadow-md border-primary/20">
          <CardContent className="p-0">
            <div className="h-[400px] w-full relative">
              {postsWithCoordinates.length > 0 ? (
                <MapContainer
                  center={mapCenter}
                  zoom={postsWithCoordinates.length === 1 ? 13 : 11}
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {postsWithCoordinates.map((post) => {
                    const pinColor = post.type === "offer" ? "#3B82F6" : "#F97316";
                    const customIcon = L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="background-color: ${pinColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10],
                    });
                    
                    return (
                      <Marker
                        key={post.id}
                        position={[post.latitude, post.longitude]}
                        icon={customIcon}
                      >
                        <Popup>
                          <div className="p-3 min-w-[200px]">
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <SimpleAvatar
                                  src={post.avatar}
                                  fallback={post.postedBy ? post.postedBy.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                                  className="w-8 h-8"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm text-gray-900 truncate">{post.title}</h3>
                                  <p className="text-xs text-gray-500 truncate">{post.postedBy}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-600 leading-relaxed">{post.location}</p>
                              </div>
                            </div>
                            <button
                              className="w-full px-4 py-2 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePostClick(post);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              ) : (
                <div className="bg-gradient-to-br from-orange-500/10 via-gray-50 to-primary/10 h-full flex items-center justify-center">
                  <div className="text-gray-500 text-center z-10">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p>No posts with location data</p>
                    <p className="text-sm">
                      Posts with latitude and longitude will appear on the map
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post List with Tabs */}
      <div>
        <SimpleTabs
          defaultValue="offers"
          onValueChange={setActiveTab}
        >
          <SimpleTabsList>
            <SimpleTabsTrigger
              value="offers"
            >
              <Leaf className="w-4 h-4 mr-2" />
              Offers ({offerPosts.length})
            </SimpleTabsTrigger>
            <SimpleTabsTrigger
              value="needs"
            >
              <Package className="w-4 h-4 mr-2" />
              Needs ({needPosts.length})
            </SimpleTabsTrigger>
          </SimpleTabsList>

          <SimpleTabsContent value="offers" className="mt-4">
            {loading && <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />}
            {!loading && offerPosts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No offers found matching the filter.</p>
            )}
            {!loading && offerPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedOfferPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="hover:border-primary hover:shadow-md transition-all cursor-pointer border-primary/20 flex flex-col h-full"
                    onClick={() => handlePostClick(post)}
                  >
                    <CardHeader className="p-4 pb-3 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 flex gap-4 min-h-[120px]">
                          {/* Post Image Preview */}
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                            {post.image ? (
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <CardTitle className="text-base flex-1 line-clamp-2" title={post.title}>
                                {truncateTitle(post.title)}
                              </CardTitle>
                              <Badge variant="offer" className="flex-shrink-0">
                                Offer
                              </Badge>
                            </div>
                            <div className="flex items-center flex-wrap gap-2 mb-2 min-h-[24px]">
                              {Array.isArray(post.tags) && post.tags.length > 0 ? (
                                post.tags.slice(0, 4).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <div className="h-6" />
                              )}
                            </div>
                            <div className="space-y-1 mt-auto">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="truncate" title={post.location}>{truncateLocation(post.location)}</span>
                              </div>
                              {post.date && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span>
                                    {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    {post.time && ` • ${new Date(`2000-01-01T${post.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                                  </span>
                                </div>
                              )}
                              {post.frequency && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <RefreshCw className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span>{post.frequency === 'one-time' ? 'One-time' : post.frequency === 'weekly' ? 'Weekly' : post.frequency === 'monthly' ? 'Monthly' : post.frequency}</span>
                                </div>
                              )}
                              {post.participantCount && post.participantCount > 1 && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span>{post.participantCount} participants</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </SimpleTabsContent>

          <SimpleTabsContent value="needs" className="mt-4">
             {loading && <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />}
             {!loading && needPosts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No needs found matching the filter.</p>
            )}
            {!loading && needPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedNeedPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="hover:border-orange-500 hover:shadow-md transition-all cursor-pointer border-primary/20 flex flex-col h-full"
                    onClick={() => handlePostClick(post)}
                  >
                    <CardHeader className="p-4 pb-3 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 flex gap-4 min-h-[120px]">
                          {/* Post Image Preview */}
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                            {post.image ? (
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <CardTitle className="text-base flex-1 line-clamp-2" title={post.title}>
                                {truncateTitle(post.title)}
                              </CardTitle>
                              <Badge variant="need" className="flex-shrink-0">
                                Need
                              </Badge>
                            </div>
                            <div className="flex items-center flex-wrap gap-2 mb-2 min-h-[24px]">
                              {Array.isArray(post.tags) && post.tags.length > 0 ? (
                                post.tags.slice(0, 4).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <div className="h-6" />
                              )}
                            </div>
                            <div className="space-y-1 mt-auto">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="truncate" title={post.location}>{truncateLocation(post.location)}</span>
                              </div>
                              {post.date && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span>
                                    {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    {post.time && ` • ${new Date(`2000-01-01T${post.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                                  </span>
                                </div>
                              )}
                              {post.frequency && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <RefreshCw className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span>{post.frequency === 'one-time' ? 'One-time' : post.frequency === 'weekly' ? 'Weekly' : post.frequency === 'monthly' ? 'Monthly' : post.frequency}</span>
                                </div>
                              )}
                              {post.participantCount && post.participantCount > 1 && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span>{post.participantCount} participants</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </SimpleTabsContent>
        </SimpleTabs>
      </div>

      {/* See More Button */}
      {((activeTab === 'offers' && hasMoreOffers) || (activeTab === 'needs' && hasMoreNeeds)) && (
        <div className="flex justify-center py-6">
          <Button
            onClick={() => setVisiblePostCount(prev => prev + 8)}
            className="bg-primary hover:bg-primary/90 text-white shadow-md"
            size="lg"
          >
            See More Posts
          </Button>
        </div>
      )}

      {/* Post Detail Dialog */}
      <SimpleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedPost && (
          <>
            <SimpleDialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <SimpleDialogTitle>
                    {selectedPost.title}
                  </SimpleDialogTitle>
                  <SimpleDialogDescription>
                    <MapPin className="w-4 h-4 text-primary" />
                    {selectedPost.location}
                  </SimpleDialogDescription>
                </div>
                <Badge
                  variant={
                    selectedPost.type === "offer" ? "offer" : "need"
                  }
                >
                  {selectedPost.type === "offer" ? "Offer" : "Need"}
                </Badge>
              </div>
            </SimpleDialogHeader>

            <Separator />

            {/* User Info */}
            <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-lg border border-primary/10">
              <SimpleAvatar
                src={selectedPost.avatar}
                fallback={selectedPost.postedBy.split(" ").map((n) => n[0]).join("")}
              />
              <div className="flex-1">
                <p className="font-medium">{selectedPost.postedBy}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Posted {selectedPost.postedDate}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => {
                  setIsDialogOpen(false);
                  // If viewing own profile, go to /my-profile, otherwise to /profile/:username
                  if (selectedPost.postedBy === user?.username) {
                    navigate('/my-profile');
                  } else {
                    navigate(`/profile/${selectedPost.postedBy}`);
                  }
                }}
              >
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </div>

            {/* Post Image */}
            {selectedPost.image && (
              <div>
                <img 
                  src={selectedPost.image} 
                  alt={selectedPost.title}
                  className="w-full rounded-lg border border-gray-200 shadow-sm object-cover max-h-64"
                />
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedPost.tags) && selectedPost.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-medium">
                <MessageCircle className="w-5 h-5" />
                <h4>Description</h4>
              </div>
              <p className="text-gray-600 leading-relaxed pl-7">
                {selectedPost.description}
              </p>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary/5 to-orange-500/10 p-4 rounded-lg border border-primary/20">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Estimated Duration
                </p>
                <p className="font-medium text-primary">
                  {selectedPost.duration}
                </p>
              </div>
            </div>

            {/* Service Details */}
            {(selectedPost.frequency || selectedPost.participantCount) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedPost.frequency && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Frequency</p>
                      <p className="text-sm font-medium text-gray-700">
                        {selectedPost.frequency === 'one-time' ? 'One-time' : 
                         selectedPost.frequency === 'weekly' ? 'Weekly' : 
                         selectedPost.frequency === 'monthly' ? 'Monthly' : 
                         selectedPost.frequency}
                      </p>
                    </div>
                  </div>
                )}
                {selectedPost.participantCount && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Participants</p>
                      <p className="text-sm font-medium text-gray-700">
                        {selectedPost.participantCount} {selectedPost.participantCount === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date and Time */}
            {selectedPost.date && (
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(selectedPost.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {selectedPost.time && (
                      <span className="ml-2">
                        • {new Date(`2000-01-01T${selectedPost.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => {
                  setIsDialogOpen(false);
                  navigate(`/post-details/${selectedPost.id}`);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>

             
              {user && selectedPost.postedBy !== user.username && (
                <Button
                  className="flex-1 shadow-md"
                  size="lg"
                  onClick={() => {
                    setIsDialogOpen(false);
                    navigate(`/negotiate/${selectedPost.id}`);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {selectedPost.type === "offer"
                    ? "Request Service"
                    : "Offer Help"}
                </Button>
              )}
              
             
              {user && selectedPost.postedBy === user.username && (
                <Link to={`/post/edit/${selectedPost.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-yellow-500/30 hover:bg-yellow-500/5 text-yellow-600"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}
      </SimpleDialog>
    </div>
  );
}