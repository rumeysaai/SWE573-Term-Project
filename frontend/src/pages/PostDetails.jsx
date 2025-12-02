import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { SimpleAvatar } from '../components/ui/SimpleAvatar';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Users,
  Loader2,
  Edit2,
  User,
  MessageCircle,
  Send,
  ThumbsUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function PostDetails() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/posts/${postId}/`);
        const postData = response.data;
        
        const formattedPost = {
          id: postData.id,
          title: postData.title,
          tags: postData.tags || [],
          location: postData.location,
          type: postData.post_type,
          description: postData.description,
          duration: postData.duration,
          frequency: postData.frequency,
          participantCount: postData.participant_count,
          date: postData.date,
          postedBy: postData.postedBy,
          avatar: postData.avatar,
          postedDate: postData.postedDate,
        };
        
        setPost(formattedPost);
        
        // TODO: Fetch comments from API when comment endpoint is available
        // For now, using empty array
        setComments([]);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    // TODO: Send comment to API when comment endpoint is available
    const comment = {
      id: `comment-${Date.now()}`,
      postId: post.id,
      authorId: user.id,
      authorName: user.username,
      content: newComment,
      likes: 0,
      createdAt: new Date(),
    };

    setComments([...comments, comment]);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleLikeComment = (commentId) => {
    if (likedComments.has(commentId)) {
      setLikedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      setLikedComments(prev => new Set(prev).add(commentId));
      toast.success('Comment liked');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = post.postedBy === user?.username;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Post Details Card */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">{post.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">{post.location}</span>
              </div>
            </div>
            <Badge
              variant={post.type === "offer" ? "offer" : "need"}
              className="text-sm"
            >
              {post.type === "offer" ? "Offer" : "Need"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-lg border border-primary/10">
            <SimpleAvatar
              src={post.avatar}
              fallback={post.postedBy.split(" ").map((n) => n[0]).join("")}
            />
            <div className="flex-1">
              <p className="font-medium">{post.postedBy}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Posted {post.postedDate ? formatDistanceToNow(new Date(post.postedDate), { addSuffix: true }) : 'Recently'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.description}
            </p>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Duration */}
          {post.duration && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary/5 to-orange-500/10 p-4 rounded-lg border border-primary/20">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Duration</p>
                <p className="font-medium text-primary">{post.duration}</p>
              </div>
            </div>
          )}

          {/* Service Details */}
          {(post.frequency || post.participantCount) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {post.frequency && (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Frequency</p>
                    <p className="text-sm font-medium text-gray-700">
                      {post.frequency === 'one-time' ? 'One-time' :
                       post.frequency === 'weekly' ? 'Weekly' :
                       post.frequency === 'monthly' ? 'Monthly' :
                       post.frequency}
                    </p>
                  </div>
                </div>
              )}
              {post.participantCount && (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Participants</p>
                    <p className="text-sm font-medium text-gray-700">
                      {post.participantCount} {post.participantCount === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {post.date && (
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isOwner ? (
              <Button
                onClick={() => navigate(`/post/edit/${post.id}`)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Post
              </Button>
            ) : (
              <Button
                onClick={() => navigate(`/negotiate/${post.id}`)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {post.type === 'offer' ? 'Request Service' : 'Offer Help'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg">Comments ({comments.length})</h2>
        </div>

        {/* Add Comment */}
        {user && (
          <div className="mb-6">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              className="mb-3"
              rows={3}
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Add Comment
            </Button>
          </div>
        )}

        {!user && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Please login to add a comment.
            </p>
          </div>
        )}

        <Separator className="my-6" />

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No comments yet</p>
              <p className="text-sm text-slate-400 mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((comment) => {
                const isLiked = likedComments.has(comment.id);
                const displayLikes = comment.likes + (isLiked ? 1 : 0);

                return (
                  <div 
                    key={comment.id} 
                    className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{comment.authorName}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(comment.createdAt).toLocaleDateString('en-US')} • {new Date(comment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-700 mb-3 ml-10">{comment.content}</p>
                    <div className="flex items-center gap-4 ml-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment.id)}
                        className={isLiked ? 'text-primary' : 'text-slate-600'}
                      >
                        <ThumbsUp className={`w-4 h-4 mr-1 ${isLiked ? 'fill-primary' : ''}`} />
                        {displayLikes > 0 && <span>{displayLikes}</span>}
                      </Button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </Card>
    </div>
  );
}
