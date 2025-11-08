// src/components/HomePage.tsx

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function HomePage() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("offers");

  const posts = [
    {
      id: 1,
      title: "Garden Help Needed",
      tags: ["Gardening", "Physical Work"],
      location: "Beykoz",
      type: "need",
      description:
        "I need help maintaining my backyard garden. Tasks include weeding, planting seasonal flowers, and general landscaping. Experience with organic gardening is a plus!",
      duration: "3-4 hours",
      postedBy: "Ayşe Yılmaz",
      postedDate: "2 days ago",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      mapPosition: { top: "40%", right: "28%" },
    },
    {
      id: 2,
      title: "Web Design Services",
      tags: ["Design", "Digital"],
      location: "Beşiktaş",
      type: "offer",
      description:
        "Offering professional web design services including UI/UX design, responsive layouts, and modern web interfaces. Proficient in Figma, Adobe XD, and React.",
      duration: "Flexible",
      postedBy: "Mehmet Kaya",
      postedDate: "1 day ago",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      mapPosition: { top: "20%", left: "32%" },
    },
    {
      id: 3,
      title: "Language Tutoring (Spanish)",
      tags: ["Education", "Language"],
      location: "Kadıköy",
      type: "offer",
      description:
        "Native Spanish speaker offering conversational practice and grammar lessons. Perfect for beginners to intermediate learners. I can help with DELE exam preparation too!",
      duration: "1-2 hours per session",
      postedBy: "Maria Garcia",
      postedDate: "3 days ago",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
      mapPosition: { bottom: "24%", left: "44%" },
    },
    {
      id: 4,
      title: "Mathematics Tutoring For Children",
      tags: ["Education", "Mathematics"],
      location: "Bostancı",
      type: "need",
      description:
        "Looking for a patient tutor to help my 10-year-old daughter with mathematics. She needs support with multiplication tables and basic geometry.",
      duration: "2 hours weekly",
      postedBy: "Can Öztürk",
      postedDate: "5 days ago",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      mapPosition: { top: "55%", left: "65%" },
    },
    {
      id: 5,
      title: "Piano Tutoring For Adults",
      tags: ["Education", "Music", "Piano"],
      location: "Göktürk",
      type: "offer",
      description:
        "Experienced piano teacher offering lessons for adult beginners. Learn to play your favorite songs while building a solid foundation in music theory and technique.",
      duration: "1 hour per session",
      postedBy: "Zeynep Demir",
      postedDate: "1 week ago",
      avatar:
        "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?w=100&h=100&fit=crop",
      mapPosition: { top: "30%", right: "20%" },
    },
  ];

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-secondary/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-primary">The Hive</h3>
            <p className="text-xs text-muted-foreground">
              Community Time Bank
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-sm border">
            <Clock className="w-4 h-4 text-primary" />
            <span>TimeBank Balance: 3 Hours</span>
          </div>
          <Button variant="ghost">My Profile</Button>
        </div>
      </div>

      {/* Search Area */}
      <div className="px-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by text, tags, or location..."
            className="pl-10 bg-card border-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex gap-3">
          <Select>
            <SelectTrigger className="w-[180px] bg-card border-primary/20">
              <SelectValue placeholder="Filter by Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gardening">Gardening</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px] bg-card border-primary/20">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">North District</SelectItem>
              <SelectItem value="central">Central</SelectItem>
              <SelectItem value="east">East Side</SelectItem>
              <SelectItem value="south">South District</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px] bg-card border-primary/20">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offer">Offers</SelectItem>
              <SelectItem value="need">Needs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Map Area */}
      <div className="px-4">
        <Card className="overflow-hidden shadow-md border-primary/20">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-secondary/30 via-muted to-accent/20 h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="text-muted-foreground text-center z-10">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p>OpenStreetMap Integration</p>
                <p className="text-sm">
                  FR-SM-100: Map with Offer/Need Pins
                </p>
              </div>

              {/* Dynamic pins based on active tab */}
              {posts
                .filter(
                  (post) => post.type === activeTab.slice(0, -1),
                )
                .map((post) => {
                  const pinColor =
                    post.type === "offer" ? "#2A77EB" : "#FA7E0E";
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
        <Tabs
          defaultValue="offers"
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full bg-muted/50 border border-primary/20">
            <TabsTrigger
              value="offers"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Leaf className="w-4 h-4 mr-2" />
              Offers ({posts.filter((p) => p.type === "offer").length})
            </TabsTrigger>
            <TabsTrigger
              value="needs"
              className="flex-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Package className="w-4 h-4 mr-2" />
              Needs ({posts.filter((p) => p.type === "need").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="space-y-3 mt-4">
            {posts
              .filter((post) => post.type === "offer")
              .map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-primary hover:shadow-md transition-all cursor-pointer border-primary/20"
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {post.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-secondary text-secondary-foreground"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      >
                        Offer
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{post.location}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="needs" className="space-y-3 mt-4">
            {posts
              .filter((post) => post.type === "need")
              .map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-accent hover:shadow-md transition-all cursor-pointer border-primary/20"
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {post.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-secondary text-secondary-foreground"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 border-accent shadow-sm"
                      >
                        Need
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{post.location}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create New Post Button */}
      <div className="px-4 pb-4">
        <Button className="w-full shadow-md" size="lg">
          <Leaf className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">
                      {selectedPost.title}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {selectedPost.location}
                    </DialogDescription>
                  </div>
                  <Badge
                    variant={
                      selectedPost.type === "offer" ? "default" : "outline"
                    }
                    className={
                      selectedPost.type === "offer"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : "bg-accent text-accent-foreground hover:bg-accent/90 border-accent shadow-sm"
                    }
                  >
                    {selectedPost.type === "offer" ? "Offer" : "Need"}
                  </Badge>
                </div>
              </DialogHeader>

              <Separator className="my-4 bg-primary/20" />

              {/* User Info */}
              <div className="flex items-center gap-3 bg-secondary/10 p-4 rounded-lg border border-primary/10">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage
                    src={selectedPost.avatar}
                    alt={selectedPost.postedBy}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedPost.postedBy
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedPost.postedBy}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Posted {selectedPost.postedDate}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPost.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="my-4 bg-primary/20" />

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <MessageCircle className="w-5 h-5" />
                  <h4>Description</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {selectedPost.description}
                </p>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-primary/5 to-secondary/10 p-4 rounded-lg border border-primary/20">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estimated Duration
                  </p>
                  <p className="font-medium text-primary">
                    {selectedPost.duration}
                  </p>
                </div>
              </div>

              <Separator className="my-4 bg-primary/20" />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 shadow-md"
                  size="lg"
                  onClick={() => {
                    console.log(
                      "Request sent for:",
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
                  className="border-primary/30 hover:bg-primary/5"
                  onClick={() => {
                    console.log(
                      "Message user:",
                      selectedPost.postedBy,
                    );
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}