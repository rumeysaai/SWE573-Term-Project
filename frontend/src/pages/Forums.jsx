import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../App";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  MessageCircle,
  Users,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function Forums() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleTopicCount, setVisibleTopicCount] = useState(5);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/forum-topics/");
      setTopics(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error fetching topics:", error);
      toast.error("Failed to load topics");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

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
        {user && (
          <Button className="shadow-md" onClick={() => navigate("/forum/new")}>
            <Sparkles className="w-4 h-4 mr-2" />
            Start New Topic
          </Button>
        )}
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {topics.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No topics yet. Be the first to start a discussion!
            </CardContent>
          </Card>
        ) : (
          <>
            {topics.slice(0, visibleTopicCount).map((topic) => (
              <Card
                key={topic.id}
                className="hover:border-primary hover:shadow-md transition-all cursor-pointer border-primary/20"
                onClick={() => navigate(`/forum/${topic.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 flex gap-4">
                      {/* Topic Image Preview */}
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        {topic.image ? (
                          <img
                            src={topic.image}
                            alt={topic.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MessageCircle className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base text-primary mb-2">
                          {topic.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span>by {topic.author?.username || "Unknown"}</span>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{topic.comments_count || 0} comments</span>
                          </div>
                          <span className="text-xs">
                            {new Date(topic.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {topic.semantic_tags && topic.semantic_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {topic.semantic_tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                {tag.label || tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {topics.length > visibleTopicCount && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleTopicCount(prev => prev + 5)}
                  className="w-full"
                >
                  See More ({topics.length - visibleTopicCount} more)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
