import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  ThumbsUp,
  MessageCircle,
  Calendar,
  Users,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

export default function Forum() {
  const [activeTab, setActiveTab] = useState("events");
  const topics = [
    {
      id: 1,
      title: "Tips for First-Time TimeBank Users",
      author: "CommunityHelper",
      likes: 24,
      comments: 12,
      category: "discussion",
    },
    {
      id: 2,
      title: "Neighborhood Garden Day - October 25th",
      author: "GreenThumb",
      likes: 18,
      comments: 8,
      category: "event",
      date: "Oct 25, 2025",
    },
    {
      id: 3,
      title: "What services are most in demand?",
      author: "NewMember42",
      likes: 15,
      comments: 20,
      category: "discussion",
    },
    {
      id: 4,
      title: "Online Cooking Class - This Saturday",
      author: "ChefSarah",
      likes: 32,
      comments: 14,
      category: "event",
      date: "Oct 19, 2025",
    },
  ];

  const comments = [
    {
      author: "storyteller_94",
      text: "Great question! I've had success with gardening and tutoring services.",
      likes: 5,
    },
    {
      author: "designer_can",
      text: "Digital skills are always in high demand in our community.",
      likes: 8,
    },
    {
      author: "miss_chopin",
      text: "Check the tags cloud on your profile to see trending categories!",
      likes: 3,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-primary">Community Forums</h2>
            <p className="text-muted-foreground text-sm">
              Connect with your community
            </p>
          </div>
        </div>
        <Button className="shadow-md">
          {activeTab === "events" ? (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Start New Event
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Start New Topic
            </>
          )}
        </Button>
      </div>

      {/* Forum Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-muted/50 border border-primary/20">
          <TabsTrigger value="discussions" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MessageCircle className="w-4 h-4 mr-2" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="space-y-4">
          {topics
            .filter((t) => t.category === "discussion")
            .map((topic) => (
              <Card
                key={topic.id}
                className="hover:border-primary hover:shadow-md transition-all cursor-pointer border-primary/20"
              >
                <CardHeader>
                  <CardTitle className="text-base text-primary">
                    {topic.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>by {topic.author}</span>
                    <div className="flex items-center gap-1 text-primary">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{topic.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{topic.comments} comments</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

          {/* Comments Section - FR-CF-301 */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
              <CardTitle className="text-base text-primary">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {comments.map((comment, index) => (
                <div
                  key={index}
                  className="border-l-4 border-primary/40 pl-4 space-y-2 bg-secondary/20 p-3 rounded-r-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">
                      {comment.author}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 hover:bg-primary/10"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1 text-primary" />
                      {comment.likes}
                    </Button>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                  >
                    Reply
                  </Button>
                </div>
              ))}

              <div className="pt-4 space-y-3">
                <Textarea
                  placeholder="Write your comment..."
                  rows={3}
                  className="bg-card border-primary/20 focus:border-primary"
                />
                <Button className="shadow-md">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {topics
            .filter((t) => t.category === "event")
            .map((topic) => (
              <Card
                key={topic.id}
                className="hover:border-primary hover:shadow-md transition-all cursor-pointer border-primary/20 bg-gradient-to-r from-card to-secondary/10"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base text-primary">
                        {topic.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span>by {topic.author}</span>
                        <div className="flex items-center gap-1 text-primary">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{topic.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{topic.comments} comments</span>
                        </div>
                      </div>
                    </div>
                    {topic.date && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 border-primary bg-primary/10 text-primary"
                      >
                        <Calendar className="w-3 h-3" />
                        {topic.date}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}