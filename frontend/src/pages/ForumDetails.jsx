import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { SimpleAvatar } from '../components/ui/SimpleAvatar';
import {
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function ForumDetails() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [topicLiked, setTopicLiked] = useState(false);

  const topic = mockTopics.find(t => t.id === parseInt(topicId));
  const topicComments = mockComments.filter(c => c.topicId === parseInt(topicId));

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">Topic not found</p>
          <Button onClick={() => navigate('/forum')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </Card>
      </div>
    );
  }

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    toast.success('Comment added');
    setNewComment('');
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

  const handleLikeTopic = () => {
    setTopicLiked(!topicLiked);
    toast.success(topicLiked ? 'Like removed' : 'Topic liked');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/forum')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Forum
      </Button>

      {/* Topic Details Card */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{topic.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <SimpleAvatar
                    src={topic.authorAvatar}
                    fallback={topic.author.substring(0, 2).toUpperCase()}
                    className="w-6 h-6"
                  />
                  <span>by {topic.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDistanceToNow(topic.createdAt, { addSuffix: true })}</span>
                </div>
                {topic.category === 'event' && topic.date && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-primary bg-primary/10 text-primary"
                  >
                    <Calendar className="w-3 h-3" />
                    {topic.date}
                  </Badge>
                )}
              </div>
            </div>
            <Badge
              variant={topic.category === 'event' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {topic.category === 'event' ? 'Event' : 'Discussion'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Topic Content */}
          <div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {topic.content}
            </p>
          </div>

          <Separator />

          {/* Like and Comment Count */}
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={handleLikeTopic}
              className={topicLiked ? 'text-primary' : 'text-gray-600'}
            >
              <ThumbsUp className={`w-4 h-4 mr-2 ${topicLiked ? 'fill-primary' : ''}`} />
              {topic.likes + (topicLiked ? 1 : 0)} likes
            </Button>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-4 h-4" />
              <span>{topicComments.length} comments</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg">Comments ({topicComments.length})</h2>
        </div>

        {/* Add Comment */}
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
            Post Comment
          </Button>
        </div>

        <Separator className="my-6" />

        {/* Comments List */}
        <div className="space-y-4">
          {topicComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No comments yet</p>
              <p className="text-sm text-slate-400 mt-1">Be the first to comment!</p>
            </div>
          ) : (
            topicComments
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((comment) => {
                const isLiked = likedComments.has(comment.id);
                const displayLikes = comment.likes + (isLiked ? 1 : 0);

                return (
                  <div
                    key={comment.id}
                    className="border-l-4 border-primary/40 pl-4 space-y-2 bg-secondary/20 p-3 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SimpleAvatar
                          src={comment.authorAvatar}
                          fallback={comment.author.substring(0, 2).toUpperCase()}
                          className="w-8 h-8"
                        />
                        <div>
                          <p className="font-medium text-sm">{comment.author}</p>
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
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
                    <p className="text-slate-700 mb-2">{comment.text}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                    >
                      Reply
                    </Button>
                  </div>
                );
              })
          )}
        </div>
      </Card>
    </div>
  );
}

