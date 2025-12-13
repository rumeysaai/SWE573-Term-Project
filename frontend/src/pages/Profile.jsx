import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'sonner';
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
  Leaf,
  MapPin,
  Shield,
  Award,
  Timer,
  Smile,
  Package,
  MessageSquare,
  Star,
  XCircle,
  Tag,
} from "lucide-react";

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [cancelledJobs, setCancelledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interestedTags, setInterestedTags] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [visibleOfferCount, setVisibleOfferCount] = useState(3);
  const [visibleNeedCount, setVisibleNeedCount] = useState(3);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(3);
  const [visibleReviewCount, setVisibleReviewCount] = useState(3);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Profile fetchProfile started for username:', username);
        const [profileResponse, postsResponse] = await Promise.all([
          api.get(`/users/${username}/`),
          api.get('/posts/', { params: { posted_by__username: username } }),
        ]);
        
        setProfileData(profileResponse.data);
        console.log('Profile: Full profile data from backend:', profileResponse.data);
        console.log('Profile: Location from backend:', profileResponse.data?.profile?.location || profileResponse.data?.location);
        
        // Set reviews if available
        if (profileResponse.data.reviews) {
          setReviews(profileResponse.data.reviews);
        }
        
        // Use interested_tags_details from backend (already included in UserSerializer)
        const interestedTagsDetails = profileResponse.data?.profile?.interested_tags_details || [];
        console.log('Profile: interested_tags_details from backend:', interestedTagsDetails);
        
        if (interestedTagsDetails.length > 0) {
          const tags = interestedTagsDetails.map(tag => ({
            id: tag.id,
            name: tag.name || tag.label,
            label: tag.label || tag.name,
          }));
          setInterestedTags(tags);
        } else {
          setInterestedTags([]);
        }
        
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

        // Get user ID from profile
        const userId = profileResponse.data.id;

        // We need to get proposals where user is either requester or provider
        const [sentProposalsResponse, receivedProposalsResponse] = await Promise.all([
          api.get(`/proposals/?sent=true&username=${username}`),
          api.get(`/proposals/?received=true&username=${username}`),
        ]);
       
        // Handle both array and paginated response formats
        const sentProposals = Array.isArray(sentProposalsResponse.data) 
          ? sentProposalsResponse.data 
          : (sentProposalsResponse.data?.results || []);
        const receivedProposals = Array.isArray(receivedProposalsResponse.data) 
          ? receivedProposalsResponse.data 
          : (receivedProposalsResponse.data?.results || []);
        
        const allProposals = [...sentProposals, ...receivedProposals];

        // Filter proposals that belong to the profile user (not the authenticated user)
        const userProposals = allProposals.filter(proposal => {
          // Check if this proposal belongs to the profile user
          const belongsToUser = 
            proposal.requester_id === userId || 
            proposal.provider_id === userId;
          
          return belongsToUser;
        });

        // Debug: Log proposals to check job_status
        console.log('Total user proposals:', userProposals.length);
        console.log('User proposals with job_status:', userProposals.map(p => ({
          id: p.id,
          status: p.status,
          job_status: p.job_status,
          post_type: p.post_type || p.post?.post_type,
          requester_id: p.requester_id,
          provider_id: p.provider_id
        })));

        // Filter completed proposals where:
        // - For 'offer' posts: user is provider (post owner)
        // - For 'need' posts: user is requester
        const completedProposals = userProposals.filter(proposal => {
          if (proposal.status !== 'completed') return false;
          
          const postType = proposal.post_type || proposal.post?.post_type;
          const isProvider = proposal.provider_id === userId;
          const isRequester = proposal.requester_id === userId;

          if (postType === 'offer') {
            return isProvider; // Offer: provider completed
          } else if (postType === 'need') {
            return isRequester; // Need: requester completed
          }
          return false;
        });

        // Filter cancelled job proposals (proposals with cancelled jobs)
        // For cancelled jobs, we need to check who received the refund
        const cancelledJobProposals = userProposals.filter(proposal => {
          // Only include proposals with cancelled jobs
          if (!proposal.job_status || proposal.job_status !== 'cancelled') {
            return false;
          }
          
          const postType = proposal.post_type || proposal.post?.post_type;
          const isProvider = proposal.provider_id === userId;
          const isRequester = proposal.requester_id === userId;

          // For 'offer': requester gets refund
          // For 'need': provider gets refund
          if (postType === 'offer') {
            return isRequester; // Offer: requester gets refund
          } else if (postType === 'need') {
            return isProvider; // Need: provider gets refund
          }
          return false;
        });

        console.log('Cancelled job proposals found:', cancelledJobProposals.length);
        console.log('Cancelled job proposals details:', cancelledJobProposals.map(p => ({
          id: p.id,
          status: p.status,
          job_status: p.job_status,
          post_type: p.post_type || p.post?.post_type
        })));

        // Use post_details from proposal to avoid N+1 queries (embedded in backend)
        const completedJobsWithPosts = completedProposals.map((proposal) => {
          // Use embedded post_details if available, otherwise fallback to post_id
          const postData = proposal.post_details || (proposal.post_id ? { id: proposal.post_id } : null);
          
          if (!postData) {
            return null;
          }
          
          return {
            proposalId: proposal.id,
            post: postData,
            timebank_hour: proposal.timebank_hour,
            proposed_date: proposal.proposed_date,
            updated_at: proposal.updated_at || proposal.updatedAt,
          };
        }).filter(job => job !== null);

        setCompletedJobs(completedJobsWithPosts);

        // Use post_details from proposal to avoid N+1 queries (embedded in backend)
        const cancelledJobsWithPosts = cancelledJobProposals.map((proposal) => {
          // Use embedded post_details if available, otherwise fallback to post_id
          const postData = proposal.post_details || (proposal.post_id ? { id: proposal.post_id } : null);
          
          if (!postData) {
            return null;
          }
          
          return {
            proposalId: proposal.id,
            post: postData,
            timebank_hour: proposal.timebank_hour,
            proposed_date: proposal.proposed_date,
            updated_at: proposal.updated_at || proposal.updatedAt,
            cancelled_by: proposal.job_cancelled_by_username,
            cancellation_reason: proposal.job_cancellation_reason,
            job_status: 'cancelled',
          };
        }).filter(job => job !== null);

        setCancelledJobs(cancelledJobsWithPosts);
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
          <CardTitle className="text-primary" style={{ fontWeight: 400 }}>
            {(profileData.first_name || profileData.last_name) 
              ? [profileData.first_name, profileData.last_name]
                  .filter(Boolean)
                  .map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
                  .join(' ')
              : 'Profile'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* User Photo, Basic Info & Rating Categories */}
          <div className="flex flex-col lg:flex-row lg:items-stretch items-start gap-6">
            {/* Left Side: Avatar & Basic Info */}
            <div className="flex flex-col items-center lg:items-start flex-1 w-full gap-4">
              {/* Avatar */}
              <Avatar className="w-32 h-32 lg:w-40 lg:h-40 border-4 border-primary/20 shadow-md">
                <AvatarImage
                  src={profileData.profile?.avatar || profileData.avatar || "https://placehold.co/100x100/EBF8FF/3B82F6?text=User"}
                  alt={profileData.username}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profileData.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Username, About Me */}
              <div className="flex flex-col items-center lg:items-start gap-3 w-full">
                <Label className="text-base">{profileData.username}</Label>
                
                {(profileData.profile?.bio || profileData.bio) && (
                  <div className="text-center lg:text-left w-full">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profileData.profile?.bio || profileData.bio}
                    </p>
                  </div>
                )}
                
                {/* Location */}
                {(() => {
                  const location = profileData.profile?.location || profileData.location;
                  console.log('Profile render: location value:', location);
                  if (location) {
                    return (
                      <div className="flex items-center gap-2 text-center lg:text-left w-full">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {location}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Interests */}
                {(() => {
                  console.log('Profile render: interestedTags state:', interestedTags, 'length:', interestedTags?.length);
                  if (interestedTags && Array.isArray(interestedTags) && interestedTags.length > 0) {
                    return (
                      <div className="text-center lg:text-left w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-4 h-4 text-primary" />
                          <Label className="text-sm font-medium text-foreground">Interests</Label>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                          {interestedTags.map((tag) => (
                            <Badge 
                              key={tag.id || tag.name || Math.random()} 
                              variant="secondary"
                              className="bg-secondary/20 text-foreground px-3 py-1"
                            >
                              {tag.name || tag.label || `Tag ${tag.id}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Right Side: Rating Categories (Compact) */}
            <div className="w-full lg:w-auto lg:min-w-[320px] space-y-3 bg-gradient-to-r from-primary/5 to-secondary/10 p-4 rounded-xl border border-primary/20 flex flex-col">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-primary text-sm">
                  <Award className="w-4 h-4" />
                  Community Ratings
                </h4>
                {profileData.profile?.review_averages?.total_reviews > 0 && (
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-4 h-4 fill-primary" />
                    <span className="text-lg font-bold">{profileData.profile.review_averages.overall.toFixed(1)}/5</span>
                    <span className="text-xs text-muted-foreground">({profileData.profile.review_averages.total_reviews})</span>
                  </div>
                )}
              </div>
              {profileData.profile?.review_averages?.total_reviews > 0 ? (
                <div className="space-y-3">
                  {/* Overall Rating */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Star className="w-3 h-3 text-primary" />
                        Overall Rating
                      </Label>
                      <span className="text-sm font-semibold text-primary">
                        {profileData.profile.review_averages.overall.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(profileData.profile.review_averages.overall / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Friendliness */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Smile className="w-3 h-3 text-primary" />
                        Friendliness
                      </Label>
                      <span className="text-xs text-primary">
                        {profileData.profile.review_averages.friendliness.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(profileData.profile.review_averages.friendliness / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Time Management */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Timer className="w-3 h-3 text-primary" />
                        Time Management
                      </Label>
                      <span className="text-xs text-primary">
                        {profileData.profile.review_averages.time_management.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(profileData.profile.review_averages.time_management / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Reliability */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Shield className="w-3 h-3 text-primary" />
                        Reliability
                      </Label>
                      <span className="text-xs text-primary">
                        {profileData.profile.review_averages.reliability.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(profileData.profile.review_averages.reliability / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Communication */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <MessageSquare className="w-3 h-3 text-primary" />
                        Communication
                      </Label>
                      <span className="text-xs text-primary">
                        {profileData.profile.review_averages.communication.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(profileData.profile.review_averages.communication / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Work Quality */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Award className="w-3 h-3 text-primary" />
                        Work Quality
                      </Label>
                      <span className="text-xs text-primary">
                        {profileData.profile.review_averages.work_quality.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(profileData.profile.review_averages.work_quality / 5) * 100} className="h-1.5" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No reviews yet</p>
                  <p className="text-xs mt-1">Be the first to review this user!</p>
                </div>
              )}
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
                <Award className="w-4 h-4 mr-2" />
                The Hive History
              </SimpleTabsTrigger>
              <SimpleTabsTrigger value="comments">
                <MessageSquare className="w-4 h-4 mr-2" />
                Reviews ({reviews.length})
              </SimpleTabsTrigger>
            </SimpleTabsList>

            <SimpleTabsContent value="offers" className="space-y-3 mt-6">
              {offerPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Leaf className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                  <p>No offers published yet.</p>
                </div>
              ) : (
                <>
                  {offerPosts.slice(0, visibleOfferCount).map((post) => (
                  <div
                    key={post.id}
                    className="border-2 border-primary/40 bg-white rounded-xl p-4 space-y-2 hover:border-primary/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/post-details/${post.id}`)}
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
                  ))}
                  {offerPosts.length > visibleOfferCount && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleOfferCount(prev => prev + 3)}
                        className="w-full"
                      >
                        See More ({offerPosts.length - visibleOfferCount} more)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SimpleTabsContent>

            <SimpleTabsContent value="needs" className="space-y-3 mt-6">
              {needPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 text-orange-500/50" />
                  <p>No needs published yet.</p>
                </div>
              ) : (
                <>
                  {needPosts.slice(0, visibleNeedCount).map((post) => (
                  <div
                    key={post.id}
                    className="border-2 border-orange-500 bg-white rounded-xl p-4 space-y-2 hover:border-orange-600 transition-colors cursor-pointer"
                    onClick={() => navigate(`/post-details/${post.id}`)}
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
                  ))}
                  {needPosts.length > visibleNeedCount && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleNeedCount(prev => prev + 3)}
                        className="w-full"
                      >
                        See More ({needPosts.length - visibleNeedCount} more)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SimpleTabsContent>

            <SimpleTabsContent value="history" className="space-y-3 mt-6">
              {(completedJobs.length === 0 && cancelledJobs.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                  <p>No service history available yet.</p>
                </div>
              ) : (
                <>
                  {/* Completed and Cancelled Jobs */}
                  {[...completedJobs, ...cancelledJobs].slice(0, visibleHistoryCount).map((job) => {
                    const post = job.post;
                    const isCancelled = job.job_status === 'cancelled';
                    return (
                      <div
                        key={isCancelled ? `cancelled-${job.proposalId}` : job.proposalId}
                        className={`border-2 ${isCancelled ? 'border-red-500 hover:border-red-600' : 'border-green-500 hover:border-green-600'} bg-white rounded-xl p-4 space-y-2 transition-colors cursor-pointer`}
                        onClick={() => navigate(`/post-details/${post.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`${isCancelled ? 'text-red-700' : 'text-green-700'} font-medium`}>{post.title}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {job.updated_at 
                                ? formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })
                                : job.proposed_date
                                ? formatDistanceToNow(new Date(job.proposed_date), { addSuffix: true })
                                : 'Recently'}
                            </p>
                            {post.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {post.description}
                              </p>
                            )}
                            <div className={`mt-2 flex items-center gap-4 text-xs ${isCancelled ? 'text-red-600' : 'text-green-600'}`}>
                              {isCancelled ? (
                                <>
                                  <span className="flex items-center gap-1 font-bold">
                                    <XCircle className="w-3 h-3" />
                                    {job.cancellation_reason === 'not_showed_up' 
                                      ? 'Cancelled - Transferred'
                                      : 'Cancelled - Refunded'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {job.cancellation_reason === 'not_showed_up' 
                                      ? `+${job.timebank_hour} hours transferred`
                                      : `+${job.timebank_hour} hours refunded`}
                                  </span>
                                  {job.cancelled_by && (
                                    <span className="text-red-600">
                                      Cancelled by {job.cancelled_by}
                                      {job.cancellation_reason === 'not_showed_up' && ' (Not Showed Up)'}
                                      {job.cancellation_reason === 'other' && ' (Other)'}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1 font-bold">
                                    <Award className="w-3 h-3" />
                                    Completed
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {job.timebank_hour} hours
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {post.duration && (
                            <Badge
                              variant="outline"
                              className={isCancelled ? "border-red-300 text-red-700 bg-red-100" : "border-green-300 text-green-700 bg-green-100"}
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
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>{post.location}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(completedJobs.length + cancelledJobs.length) > visibleHistoryCount && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleHistoryCount(prev => prev + 3)}
                        className="w-full"
                      >
                        See More ({(completedJobs.length + cancelledJobs.length) - visibleHistoryCount} more)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SimpleTabsContent>

            <SimpleTabsContent value="comments" className="space-y-4 mt-6">
              {reviews.length === 0 ? (
                <Card className="border-primary/20">
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No comments yet</p>
                    <p className="text-xs mt-1">This user hasn't received any reviews yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {reviews.slice(0, visibleReviewCount).map((review) => (
                  <Card key={review.id} className="border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {review.reviewer_username?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {review.reviewer_username || 'Unknown User'}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">
                            {review.work_quality ? ((review.friendliness + review.time_management + review.reliability + review.communication + review.work_quality) / 5).toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {review.post_title && (
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Post:</p>
                            {review.post_type && review.role && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs capitalize"
                              >
                                {review.post_type === 'offer' ? 'Offer' : 'Need'} • Role: {review.role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-base font-medium text-primary">
                            {review.post_title}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Smile className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Friendliness</p>
                            <p className="text-sm font-semibold">{review.friendliness}/5</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Time Management</p>
                            <p className="text-sm font-semibold">{review.time_management}/5</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Reliability</p>
                            <p className="text-sm font-semibold">{review.reliability}/5</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Communication</p>
                            <p className="text-sm font-semibold">{review.communication}/5</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Work Quality</p>
                            <p className="text-sm font-semibold">{review.work_quality}/5</p>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  ))}
                  {reviews.length > visibleReviewCount && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleReviewCount(prev => prev + 3)}
                        className="w-full"
                      >
                        See More ({reviews.length - visibleReviewCount} more)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SimpleTabsContent>
          </SimpleTabs>
        </CardContent>
      </Card>
    </div>
  );
}

