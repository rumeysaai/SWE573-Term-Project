import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
  MessageCircle,
  ArrowLeft,
  Send,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  Flag,
} from 'lucide-react';
import { SimpleAvatar } from '../components/ui/SimpleAvatar';

export default function TopicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchTopic();
  }, [id]);

  const fetchTopic = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forum-topics/${id}/`);
      setTopic(response.data);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching topic:', error);
      toast.error('Failed to load topic');
      navigate('/forums');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to comment');
      navigate('/login');
      return;
    }

    if (!commentContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/forum-comments/', {
        topic_id: parseInt(id, 10),
        content: commentContent,
      });

      setComments(prev => [...prev, response.data]);
      setCommentContent('');
      toast.success('Comment posted successfully!');
      
      // Refresh topic to update comment count
      fetchTopic();
    } catch (error) {
      console.error('Error posting comment:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to post comment';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportComment = async (commentId) => {
    if (!user) {
      toast.error('Please login to report comments');
      return;
    }

    try {
      await api.post(`/forum-comments/${commentId}/report/`);
      toast.success('Comment reported successfully');
      // Refresh to update report count if needed
      fetchTopic();
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error('Failed to report comment');
    }
  };

  const handleToggleHide = async () => {
    if (!user?.is_staff) {
      toast.error('Only admins can hide/unhide topics');
      return;
    }

    setToggling(true);

    try {
      const response = await api.post(`/forum-topics/${id}/toggle_hide/`);
      setTopic(prev => ({
        ...prev,
        is_hidden: response.data.is_hidden,
      }));
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to toggle visibility';
      toast.error(errorMsg);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 py-4">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-primary/20">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Topic not found
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/forums')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </Button>

        {/* Topic Card */}
        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl text-primary">
                    {topic.title}
                  </CardTitle>
                  {topic.is_hidden && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Hidden
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => topic.author?.username && navigate(`/profile/${topic.author.username}`)}
                  >
                    <SimpleAvatar
                      src={topic.author?.avatar || `https://placehold.co/100x100/EBF8FF/3B82F6?text=${(topic.author?.username || 'U')[0].toUpperCase()}`}
                      fallback={(topic.author?.username || 'U')[0].toUpperCase()}
                      className="w-12 h-12"
                    />
                    <span className="font-medium text-gray-700 text-base">by {topic.author?.username || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(topic.created_at).toLocaleString()}</span>
                  </div>
                  {topic.semantic_tags && topic.semantic_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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
              {/* Admin Toggle Hide Button */}
              {user?.is_staff && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleHide}
                  disabled={toggling}
                  className="flex-shrink-0"
                >
                  {toggling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : topic.is_hidden ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Topic Image - Full width at top */}
          {topic.image && (
            <div className="w-full overflow-hidden border-t border-b border-gray-200">
              <img 
                src={topic.image} 
                alt={topic.title}
                className="w-full h-96 object-cover object-center"
                style={{ 
                  objectFit: 'cover', 
                  width: '100%', 
                  height: '24rem',
                  objectPosition: 'center'
                }}
              />
            </div>
          )}

          <CardContent className="pt-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {topic.content}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-l-4 border-primary/40 pl-4 space-y-2 bg-secondary/20 p-3 rounded-r-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">
                      {comment.author?.username || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      {user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReportComment(comment.id)}
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Flag className="w-3 h-3 mr-1" />
                          Report
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))
            )}

            {/* Comment Form */}
            {user ? (
              <div className="pt-4 space-y-3 border-t border-primary/20">
                <Label htmlFor="comment" className="text-sm font-medium">
                  Add a Comment
                </Label>
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <Textarea
                    id="comment"
                    placeholder="Write your comment..."
                    rows={3}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="bg-card border-primary/20 focus:border-primary"
                  />
                  <Button
                    type="submit"
                    className="shadow-md"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="pt-4 border-t border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Please login to comment
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

