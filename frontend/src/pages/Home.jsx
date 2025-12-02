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
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("offers");
  const [showAllPosts, setShowAllPosts] = useState(false);

  // Reset showAllPosts when tab changes
  useEffect(() => {
    setShowAllPosts(false);
  }, [activeTab]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (selectedType) params.append('post_type', selectedType);
        if (selectedTag) params.append('tags__name', selectedTag); 
        if (selectedLocation) params.append('location', selectedLocation);
        if (searchTerm) params.append('search', searchTerm); 

        const response = await api.get('/posts/', { params });
        
        // Check if response.data is an array, if not, handle pagination or errors
        let postsData = [];
        if (Array.isArray(response.data)) {
          postsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Handle paginated response (DRF pagination)
          postsData = response.data.results || [];
        }
        
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          title: post.title,
          tags: post.tags, // This is a string array from backend ["Gardening", "Music"]
          location: post.location,
          type: post.post_type, 
          description: post.description,
          duration: post.duration,
          frequency: post.frequency,
          participantCount: post.participant_count,
          date: post.date,
          postedBy: post.postedBy,
          avatar: post.avatar,
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

    const fetchTags = async () => {
      try {
        const response = await api.get('/tags/');
        // Check if response.data is an array, if not, handle pagination
        let tagsData = [];
        if (Array.isArray(response.data)) {
          tagsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Handle paginated response (DRF pagination)
          tagsData = response.data.results || [];
        }
        setTags(tagsData); 
      } catch (err) {
        console.error("Error fetching tags:", err);
        console.error("Error response:", err.response?.data);
        setTags([]); // Set empty array on error
      }
    };

    fetchPosts(); 
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, filtering is done client-side 


  const filteredPosts = posts.filter(post => {
    const typeMatch = selectedType ? post.type === selectedType : true;
    const tagMatch = selectedTag ? post.tags.includes(selectedTag) : true;
    const locationMatch = selectedLocation ? post.location.toLowerCase().includes(selectedLocation.toLowerCase()) : true;
    const searchMatch = searchTerm ? 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    
    return typeMatch && tagMatch && locationMatch && searchMatch;
  });


  const offerPosts = filteredPosts.filter((post) => post.type === "offer");
  const needPosts = filteredPosts.filter((post) => post.type === "need");
  
  // Limit posts to 5 if not showing all
  const displayedOfferPosts = showAllPosts ? offerPosts : offerPosts.slice(0, 5);
  const displayedNeedPosts = showAllPosts ? needPosts : needPosts.slice(0, 5);
  
  const mapPosts = activeTab === 'offers' ? offerPosts : needPosts;
  
  // Filter posts that have valid coordinates
  const postsWithCoordinates = mapPosts.filter(post => 
    post.latitude != null && post.longitude != null && 
    !isNaN(post.latitude) && !isNaN(post.longitude)
  );
  
  // Calculate center of map (default to Istanbul if no posts)
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by text, tag, or location..."
            className="pl-10 bg-white border-primary/20 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <SimpleSelect
            placeholder="Filter by tag"
            onValueChange={setSelectedTag}
          >
            {Array.isArray(tags) && tags.map((tag) => (
              <SimpleSelectItem key={tag.id} value={tag.name}>
                {tag.name}
              </SimpleSelectItem>
            ))}
          </SimpleSelect>
          <div className="ml-auto">
            <Link to="/post/new">
              <Button className="shadow-md bg-primary hover:bg-primary/90 text-white" size="lg">
                <Leaf className="w-4 h-4 mr-2" />
                Publish an Offer
              </Button>
            </Link>
          </div>
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

          <SimpleTabsContent value="offers" className="space-y-3 mt-4">
            {loading && <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />}
            {!loading && offerPosts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No offers found matching the filter.</p>
            )}
            {displayedOfferPosts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-primary hover:shadow-md transition-all cursor-pointer border-primary/20"
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          {Array.isArray(post.tags) && post.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="offer"
                      >
                        Offer
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{post.location}</span>
                    </div>
                    {post.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                    {post.frequency && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="w-4 h-4 text-primary" />
                        <span>{post.frequency === 'one-time' ? 'One-time' : post.frequency === 'weekly' ? 'Weekly' : post.frequency === 'monthly' ? 'Monthly' : post.frequency}</span>
                      </div>
                    )}
                    {post.participantCount && post.participantCount > 1 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{post.participantCount} participants</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </SimpleTabsContent>

          <SimpleTabsContent value="needs" className="space-y-3 mt-4">
             {loading && <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />}
             {!loading && needPosts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No needs found matching the filter.</p>
            )}
            {displayedNeedPosts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-orange-500 hover:shadow-md transition-all cursor-pointer border-primary/20"
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          {Array.isArray(post.tags) && post.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="need"
                      >
                        Need
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{post.location}</span>
                    </div>
                    {post.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                    {post.frequency && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="w-4 h-4 text-primary" />
                        <span>{post.frequency === 'one-time' ? 'One-time' : post.frequency === 'weekly' ? 'Weekly' : post.frequency === 'monthly' ? 'Monthly' : post.frequency}</span>
                      </div>
                    )}
                    {post.participantCount && post.participantCount > 1 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{post.participantCount} participants</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </SimpleTabsContent>
        </SimpleTabs>
      </div>

      {/* See More Button */}
      {!showAllPosts && (
        (activeTab === 'offers' && offerPosts.length > 5) ||
        (activeTab === 'needs' && needPosts.length > 5)
      ) && (
        <div className="flex justify-center py-6">
          <Button
            onClick={() => setShowAllPosts(true)}
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

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* View Details button - visible to all users */}
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

              {/* Show Request Service/Offer Help only if user is not the post owner */}
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
              
              {/* Show Edit button only if user is the post owner */}
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