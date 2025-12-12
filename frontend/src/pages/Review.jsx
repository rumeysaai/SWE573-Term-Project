import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Star,
  Smile,
  Timer,
  Shield,
  MessageSquare,
  Award,
  Loader2,
  User,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

export default function Review() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [proposal, setProposal] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingReview, setExistingReview] = useState(null);
  const [reviewData, setReviewData] = useState({
    friendliness: 0,
    time_management: 0,
    reliability: 0,
    communication: 0,
    work_quality: 0,
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch proposal and post data
  useEffect(() => {
    const fetchData = async () => {
      if (!proposalId || !user) return;

      try {
        setLoading(true);
        
        // Fetch proposal
        const proposalResponse = await api.get(`/proposals/${proposalId}/`);
        const proposalData = proposalResponse.data;
        setProposal(proposalData);

        // Fetch post
        if (proposalData.post_id) {
          const postResponse = await api.get(`/posts/${proposalData.post_id}/`);
          setPost(postResponse.data);
        }

        // Check if user is requester or provider
        const isRequester = user.id === proposalData.requester_id;
        const isProvider = user.id === proposalData.provider_id;

        if (!isRequester && !isProvider) {
          toast.error('You are not authorized to review this proposal.');
          navigate('/approval');
          return;
        }

        // Check if proposal is accepted or completed
        if (proposalData.status !== 'accepted' && proposalData.status !== 'completed') {
          toast.error('This proposal is not accepted or completed yet.');
          navigate('/approval');
          return;
        }

        // Check if user can review based on approval status
        // For both offer and need: user can review if they have approved OR declined
        let canReview = false;
        
        // Check if user cancelled the job
        const userCancelledJob = proposalData.job_status === 'cancelled' && 
          ((isRequester && proposalData.job_cancelled_by_id === user.id) ||
           (isProvider && proposalData.job_cancelled_by_id === user.id));
        
        if (isRequester) {
          // Requester can review if requester has approved OR cancelled the job
          canReview = proposalData.requester_approved || userCancelledJob;
        } else if (isProvider) {
          // Provider can review if provider has approved OR cancelled the job
          canReview = proposalData.provider_approved || userCancelledJob;
        }
        
        if (!canReview) {
          toast.error('You can only review after you have approved or declined the proposal.');
          navigate('/approval');
          return;
        }

        // Fetch existing review
        try {
          const reviewResponse = await api.get('/reviews/', { 
            params: { proposal: proposalId, reviewer: user.id } 
          });
          const reviews = Array.isArray(reviewResponse.data) 
            ? reviewResponse.data 
            : (reviewResponse.data?.results || []);
          
          if (reviews.length > 0) {
            setExistingReview(reviews[0]);
          }
        } catch (err) {
          console.error('Error fetching review:', err);
        }
      } catch (err) {
        console.error('Error fetching proposal:', err);
        toast.error('Failed to load proposal');
        navigate('/approval');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [proposalId, user, navigate]);

  // Get user to review (the other party)
  const getUserToReview = () => {
    if (!proposal || !user) return null;

    const isRequester = user.id === proposal.requester_id;
    
    if (isRequester) {
      // If current user is requester, they review the provider
      return {
        id: proposal.provider_id,
        username: proposal.provider_username,
      };
    } else {
      // If current user is provider, they review the requester
      return {
        id: proposal.requester_id,
        username: proposal.requester_username,
      };
    }
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!proposal || !reviewData.friendliness || !reviewData.time_management || 
        !reviewData.reliability || !reviewData.communication || !reviewData.work_quality) {
      toast.error('Please rate all criteria');
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post('/reviews/', {
        proposal: proposalId,
        friendliness: reviewData.friendliness,
        time_management: reviewData.time_management,
        reliability: reviewData.reliability,
        communication: reviewData.communication,
        work_quality: reviewData.work_quality,
        comment: reviewData.comment || '',
      });
      
      toast.success('Review submitted successfully!');
      
      // Fetch updated review
      const reviewResponse = await api.get('/reviews/', { 
        params: { proposal: proposalId, reviewer: user.id } 
      });
      const reviews = Array.isArray(reviewResponse.data) 
        ? reviewResponse.data 
        : (reviewResponse.data?.results || []);
      
      if (reviews.length > 0) {
        setExistingReview(reviews[0]);
      }

      // Navigate back to approval page after a short delay
      setTimeout(() => {
        navigate('/approval');
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Proposal not found.</p>
          <Button onClick={() => navigate('/approval')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Approvals
          </Button>
        </div>
      </div>
    );
  }

  const userToReview = getUserToReview();

  // If review already exists, show submitted message
  if (existingReview) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/approval')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Approvals
          </Button>

          <Card className="shadow-md border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback>
                      {userToReview?.username?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-semibold text-green-900">
                      Review Already Submitted
                    </h2>
                    <p className="text-sm text-green-700">
                      You have already reviewed {userToReview?.username}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2 text-sm text-green-800">
                  <div className="flex items-center justify-center gap-1">
                    <Smile className="w-4 h-4" />
                    <span>Friendliness: {existingReview.friendliness}/5</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Timer className="w-4 h-4" />
                    <span>Time Management: {existingReview.time_management}/5</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Reliability: {existingReview.reliability}/5</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>Communication: {existingReview.communication}/5</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>Work Quality: {existingReview.work_quality}/5</span>
                  </div>
                </div>
                
                {existingReview.comment && (
                  <div className="mt-6 pt-6 border-t border-green-300">
                    <p className="text-sm font-medium text-green-900 mb-2">Your Comment:</p>
                    <p className="text-sm text-green-800 whitespace-pre-wrap">{existingReview.comment}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/approval')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Approvals
        </Button>

        {/* Proposal Info */}
        <Card className="shadow-md border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>{proposal.post_title || 'Proposal'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              {proposal.proposed_date && (
                <div className="flex items-center gap-2">
                  <span>Date: {new Date(proposal.proposed_date).toLocaleDateString()}</span>
                  {proposal.proposed_time && <span>at {proposal.proposed_time}</span>}
                </div>
              )}
              {proposal.proposed_location && (
                <div className="flex items-center gap-2">
                  <span>Location: {proposal.proposed_location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review Form */}
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Review{' '}
              <span 
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => userToReview && navigate(`/profile/${userToReview.username}`)}
              >
                {userToReview?.username}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Please rate your experience with{' '}
              <span 
                className="cursor-pointer hover:text-primary transition-colors font-medium"
                onClick={() => userToReview && navigate(`/profile/${userToReview.username}`)}
              >
                {userToReview?.username}
              </span>{' '}
              on the following criteria:
            </p>
            
            {/* Friendliness */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Smile className="w-4 h-4 text-primary" />
                Friendliness
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, friendliness: rating })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      reviewData.friendliness === rating
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:border-primary/50'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Management */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                Time Management
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, time_management: rating })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      reviewData.time_management === rating
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:border-primary/50'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Reliability */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Reliability
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, reliability: rating })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      reviewData.reliability === rating
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:border-primary/50'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Communication */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Communication
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, communication: rating })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      reviewData.communication === rating
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:border-primary/50'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Quality */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Work Quality
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, work_quality: rating })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      reviewData.work_quality === rating
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:border-primary/50'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="review-comment" className="text-sm font-medium">
                Comment (Optional)
              </Label>
              <Textarea
                id="review-comment"
                placeholder="Share your experience with this user..."
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                className="min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview || !reviewData.friendliness || !reviewData.time_management || 
                       !reviewData.reliability || !reviewData.communication || !reviewData.work_quality}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {submittingReview ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

