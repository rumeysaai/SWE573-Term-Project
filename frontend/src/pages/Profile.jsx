import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { SimpleTabs, SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent } from "../components/ui/SimpleTabs";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "../App";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  User,
  Leaf,
  Sprout,
  MapPin,
  Shield,
  Award,
  Timer,
  Smile,
  MessageCircle,
  Package,
} from "lucide-react";

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [profileResponse, postsResponse] = await Promise.all([
          api.get(`/users/${username}/`),
          api.get('/posts/', { params: { posted_by__username: username } })
        ]);
        
        setProfileData(profileResponse.data);
        
        // Format posts data
        let postsData = [];
        if (Array.isArray(postsResponse.data)) {
          postsData = postsResponse.data;
        } else if (postsResponse.data && typeof postsResponse.data === 'object') {
          postsData = postsResponse.data.results || [];
        }
        
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          title: post.title,
          tags: post.tags || [],
          location: post.location,
          type: post.post_type,
          description: post.description,
          duration: post.duration,
          frequency: post.frequency,
          participantCount: post.participant_count,
          date: post.date,
          postedBy: post.postedBy,
          avatar: post.avatar,
          postedDate: post.postedDate,
        }));
        
        setUserPosts(formattedPosts);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const offerPosts = userPosts.filter(post => post.type === 'offer');
  const needPosts = userPosts.filter(post => post.type === 'need');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Info */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <User className="w-6 h-6" />
            </div>
            <CardTitle className="text-primary" style={{ fontWeight: 400 }}>Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* User Photo, Basic Info & Rating Categories */}
          <div className="flex flex-col lg:flex-row lg:items-stretch items-start gap-6">
            {/* Left Side: Avatar & Basic Info */}
            <div className="flex items-start gap-4 flex-1 w-full">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-md">
                <AvatarImage
                  src={profileData.avatar || "https://placehold.co/100x100/EBF8FF/3B82F6?text=User"}
                  alt={profileData.username}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profileData.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    {(profileData.first_name || profileData.last_name) && (
                      <h3 className="text-lg font-semibold text-gray-900">
                        {[profileData.first_name, profileData.last_name].filter(Boolean).join(' ') || ''}
                      </h3>
                    )}
                    <Label>{profileData.username}</Label>
                    {profileData.bio && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {profileData.bio}
                      </p>
                    )}
                  </div>
                  {user && user.username !== profileData.username && (
                    <Button 
                      className="mt-4 bg-primary hover:bg-primary/90 text-white"
                      onClick={() => {
                        // TODO: Navigate to messaging page or open message dialog
                        console.log('Send message to', profileData.username);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Rating Categories (Compact) */}
            <div className="w-full lg:w-auto lg:min-w-[320px] space-y-3 bg-gradient-to-r from-primary/5 to-secondary/10 p-4 rounded-xl border border-primary/20 flex flex-col">
              <h4 className="flex items-center gap-2 text-primary text-sm">
                <Award className="w-4 h-4" />
                Community Ratings
              </h4>
              <div className="space-y-3">
                {/* Reliability */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Shield className="w-3 h-3 text-primary" />
                      Reliability
                    </Label>
                    <span className="text-xs text-primary">4.8/5</span>
                  </div>
                  <Progress value={96} className="h-1.5" />
                </div>
                {/* Time Management */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Timer className="w-3 h-3 text-primary" />
                      Time Management
                    </Label>
                    <span className="text-xs text-primary">4.7/5</span>
                  </div>
                  <Progress value={94} className="h-1.5" />
                </div>
                {/* Friendliness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Smile className="w-3 h-3 text-primary" />
                      Friendliness
                    </Label>
                    <span className="text-xs text-primary">5.0/5</span>
                  </div>
                  <Progress value={100} className="h-1.5" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributions - FR-RA-402 */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
              <Leaf className="w-5 h-5" />
            </div>
            <CardTitle className="text-primary" style={{ fontWeight: 400 }}>
              Contributions to The Hive
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <SimpleTabs defaultValue="offers">
            <SimpleTabsList>
              <SimpleTabsTrigger value="offers">
                <Leaf className="w-4 h-4 mr-2" />
                Offers
              </SimpleTabsTrigger>
              <SimpleTabsTrigger value="needs">
                <Package className="w-4 h-4 mr-2" />
                Needs
              </SimpleTabsTrigger>
              <SimpleTabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                Transaction History
              </SimpleTabsTrigger>
            </SimpleTabsList>

            <SimpleTabsContent value="offers" className="space-y-3 mt-6">
              {offerPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Leaf className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                  <p>No offers published yet.</p>
                </div>
              ) : (
                offerPosts.map((post) => (
                  <div
                    key={post.id}
                    className="border-2 border-primary/40 bg-primary/5 rounded-xl p-4 space-y-2 hover:border-primary/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-primary font-medium">{post.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {post.postedDate ? formatDistanceToNow(new Date(post.postedDate), { addSuffix: true }) : 'Recently'}
                        </p>
                        {post.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {post.description}
                          </p>
                        )}
                      </div>
                      {post.duration && (
                        <Badge
                          variant="outline"
                          className="border-primary text-primary bg-primary/10"
                        >
                          {post.duration}
                        </Badge>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {post.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {post.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{post.location}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </SimpleTabsContent>

            <SimpleTabsContent value="needs" className="space-y-3 mt-6">
              {needPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 text-orange-500/50" />
                  <p>No needs published yet.</p>
                </div>
              ) : (
                needPosts.map((post) => (
                  <div
                    key={post.id}
                    className="border-2 border-accent/60 bg-accent/10 rounded-xl p-4 space-y-2 hover:border-accent/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-orange-600 font-medium">{post.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {post.postedDate ? formatDistanceToNow(new Date(post.postedDate), { addSuffix: true }) : 'Recently'}
                        </p>
                        {post.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {post.description}
                          </p>
                        )}
                      </div>
                      {post.duration && (
                        <Badge
                          variant="outline"
                          className="border-accent text-orange-600 bg-accent/20"
                        >
                          {post.duration}
                        </Badge>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {post.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {post.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{post.location}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </SimpleTabsContent>

            <SimpleTabsContent value="history" className="space-y-3 mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                <p>No transaction history available yet.</p>
              </div>
            </SimpleTabsContent>
          </SimpleTabs>
        </CardContent>
      </Card>
    </div>
  );
}

