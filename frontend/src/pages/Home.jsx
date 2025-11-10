import React, { useState, useEffect } from "react";
import api from "../api"; 
import { Link } from "react-router-dom"; 
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

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("offers");

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
        
        const formattedPosts = response.data.map(post => ({
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
          mapPosition: { 
            // Random position for map pins
            top: `${Math.random() * 60 + 20}%`, 
            left: `${Math.random() * 60 + 20}%` 
          }, 
        }));
        
        setPosts(formattedPosts);
      } catch (err) {
        console.error("Data fetching error:", err);
        setError("An error occurred while loading posts.");
      } finally {
        setLoading(false);
      }
    };

    const fetchTags = async () => {
      try {
        const response = await api.get('/tags/');
        setTags(response.data); 
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };

    fetchPosts(); 
    fetchTags();
  }, []); 


  // Update useEffect to get filtered data (Frontend-only filtering)
  // Backend filtering is more efficient, but this method
  // provides instant filtering on the frontend.
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
  const mapPosts = activeTab === 'offers' ? offerPosts : needPosts;

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  if (loading && posts.length === 0) { // Show full screen loading only on initial load
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
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
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen pb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500/5 to-orange-500/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-blue-600 font-bold text-lg">The Hive</h3>
            <p className="text-xs text-gray-500">
            Community-Oriented Service Offering Platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Balance: 0 Hours</span>
          </div>
          <Button variant="ghost">My Profile</Button>
        </div>
      </div>

      {/* Search Area */}
      <div className="px-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by text, tag, or location..."
            className="pl-10 bg-white border-blue-500/20 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <SimpleSelect
            placeholder="Filter by tag"
            onValueChange={setSelectedTag}
          >
            {tags.map((tag) => (
              <SimpleSelectItem key={tag.id} value={tag.name}>
                {tag.name}
              </SimpleSelectItem>
            ))}
          </SimpleSelect>

          <SimpleSelect
            placeholder="Location"
            onValueChange={setSelectedLocation}
          >
            {/* We can get locations dynamically from posts (better approach) */}
            {[...new Set(posts.map(p => p.location))].map(location => (
              <SimpleSelectItem key={location} value={location}>
                {location}
              </SimpleSelectItem>
            ))}
          </SimpleSelect>

          <SimpleSelect
            placeholder="Type"
            onValueChange={setSelectedType}
          >
            <SimpleSelectItem value="offer">Offers</SimpleSelectItem>
            <SimpleSelectItem value="need">Needs</SimpleSelectItem>
          </SimpleSelect>
          
          <div className="ml-auto">
            <Link to="/post/new">
              <Button className="shadow-md bg-blue-600 hover:bg-blue-600/90 text-white" size="lg">
                <Leaf className="w-4 h-4 mr-2" />
                Create New Post
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="px-4">
        <Card className="overflow-hidden shadow-md border-blue-500/20">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-orange-500/10 via-gray-50 to-blue-500/10 h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="text-gray-500 text-center z-10">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p>Map Integration (Coming Soon)</p>
                <p className="text-sm">
                  Posts will be displayed on the map
                </p>
              </div>

              {mapPosts.map((post) => {
                  const pinColor =
                    post.type === "offer" ? "#3B82F6" : "#F97316";
                  return (
                    <div
                      key={post.id}
                      className="absolute w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: pinColor,
                        ...post.mapPosition,
                      }}
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post List with Tabs */}
      <div className="px-4">
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
            {loading && <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />}
            {!loading && offerPosts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No offers found matching the filter.</p>
            )}
            {offerPosts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer border-blue-500/20"
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          {post.tags.map((tag) => (
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
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{post.location}</span>
                    </div>
                    {post.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                    {post.frequency && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                        <span>{post.frequency === 'one-time' ? 'One-time' : post.frequency === 'weekly' ? 'Weekly' : post.frequency === 'monthly' ? 'Monthly' : post.frequency}</span>
                      </div>
                    )}
                    {post.participantCount && post.participantCount > 1 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4 text-blue-600" />
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
            {needPosts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-orange-500 hover:shadow-md transition-all cursor-pointer border-blue-500/20"
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          {post.tags.map((tag) => (
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
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{post.location}</span>
                    </div>
                    {post.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                    {post.frequency && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                        <span>{post.frequency === 'one-time' ? 'One-time' : post.frequency === 'weekly' ? 'Weekly' : post.frequency === 'monthly' ? 'Monthly' : post.frequency}</span>
                      </div>
                    )}
                    {post.participantCount && post.participantCount > 1 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>{post.participantCount} participants</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </SimpleTabsContent>
        </SimpleTabs>
      </div>


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
                    <MapPin className="w-4 h-4 text-blue-600" />
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
            <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-lg border border-blue-500/10">
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
              <Button variant="ghost" size="sm" className="text-blue-600">
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Categories</p>
              <div className="flex flex-wrap gap-2">
                {selectedPost.tags.map((tag) => (
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
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <MessageCircle className="w-5 h-5" />
                <h4>Description</h4>
              </div>
              <p className="text-gray-600 leading-relaxed pl-7">
                {selectedPost.description}
              </p>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/5 to-orange-500/10 p-4 rounded-lg border border-blue-500/20">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Estimated Duration
                </p>
                <p className="font-medium text-blue-600">
                  {selectedPost.duration}
                </p>
              </div>
            </div>

            {/* Service Details */}
            {(selectedPost.frequency || selectedPost.participantCount) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedPost.frequency && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
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
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
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
              <Button
                className="flex-1 shadow-md"
                size="lg"
                onClick={() => {
                  console.log(
                    "Request sent:",
                    selectedPost.title,
                  );
                  setIsDialogOpen(false);
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                {selectedPost.type === "offer"
                  ? "Request Service"
                  : "Offer Help"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-gray-300"
                onClick={() => {
                  console.log(
                    "Send message:",
                    selectedPost.postedBy,
                  );
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              {/* Edit Button (as Link) */}
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
            </div>
          </>
        )}
      </SimpleDialog>
    </div>
  );
}