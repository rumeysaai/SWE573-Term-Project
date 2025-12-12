import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Loader2,
  Star,
  XCircle,
} from 'lucide-react';
import { SimpleAvatar } from '../components/ui/SimpleAvatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';

export default function Approval() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('other');
  const [declining, setDeclining] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [canReview, setCanReview] = useState(false);

  // Fetch user's approval-waiting proposals (if no proposalId)
  useEffect(() => {
    const fetchApprovalProposals = async () => {
      if (!user || proposalId) return; // Only fetch if no proposalId

      try {
        setLoadingList(true);
        
        // Fetch all proposals for approval in a single API call (optimized endpoint with pagination)
        const response = await api.get('/proposals/for-approval/', {
          params: { page: 1, page_size: 100 } // Get first 100 proposals (adjust as needed)
        });
        
        // Handle paginated response
        let allProposals = [];
        if (response.data.results) {
          // Paginated response
          allProposals = response.data.results;
          // Note: For now we fetch first page only. Can be extended to load more pages on scroll
        } else if (Array.isArray(response.data)) {
          // Non-paginated response (fallback)
          allProposals = response.data;
        }
        
        // Filter for accepted or completed proposals (but exclude cancelled proposals)
        // However, include proposals that have cancelled jobs, but only if the current user is involved
        const relevantProposals = allProposals.filter(p => {
          // First check if proposal has cancelled job
          if (p.job_status === 'cancelled') {
            // Only show cancelled jobs if current user is involved
            const isRequester = user?.id === p.requester_id;
            const isProvider = user?.id === p.provider_id;
            return isRequester || isProvider;
          }
          
          // Exclude proposals with cancelled status (only if they don't have cancelled jobs)
          if (p.status === 'cancelled') return false;
          
          // Include accepted or completed proposals
          return (p.status === 'accepted' || p.status === 'completed');
        });
        
        // Remove duplicates (in case a proposal appears in both)
        const uniqueProposals = relevantProposals.filter((p, index, self) =>
          index === self.findIndex((pr) => pr.id === p.id)
        );
        
        // Separate cancelled jobs, completed, and pending proposals
        const cancelledJobs = uniqueProposals.filter(p => p.job_status === 'cancelled');
        const completedProposals = uniqueProposals.filter(p => 
          p.job_status !== 'cancelled' && 
          (p.status === 'completed' || (p.provider_approved && p.requester_approved))
        );
        const pendingProposals = uniqueProposals.filter(p => 
          p.job_status !== 'cancelled' && 
          p.status !== 'completed' && 
          !(p.provider_approved && p.requester_approved)
        );
        
        // Sort by proposed_date (nearest date first for pending/completed, newest first for cancelled)
        const sortByDate = (a, b) => {
          const dateA = a.proposed_date ? new Date(a.proposed_date) : new Date(0);
          const dateB = b.proposed_date ? new Date(b.proposed_date) : new Date(0);
          
          // If same date, check time
          if (dateA.getTime() === dateB.getTime() && a.proposed_time && b.proposed_time) {
            const timeA = a.proposed_time.split(':').map(Number);
            const timeB = b.proposed_time.split(':').map(Number);
            const minutesA = timeA[0] * 60 + (timeA[1] || 0);
            const minutesB = timeB[0] * 60 + (timeB[1] || 0);
            return minutesA - minutesB;
          }
          
          return dateA - dateB;
        };
        
        // Sort cancelled jobs by date (newest first - reverse order)
        const sortCancelledByDate = (a, b) => {
          const dateA = a.proposed_date ? new Date(a.proposed_date) : new Date(0);
          const dateB = b.proposed_date ? new Date(b.proposed_date) : new Date(0);
          
          // If same date, check time
          if (dateA.getTime() === dateB.getTime() && a.proposed_time && b.proposed_time) {
            const timeA = a.proposed_time.split(':').map(Number);
            const timeB = b.proposed_time.split(':').map(Number);
            const minutesA = timeA[0] * 60 + (timeA[1] || 0);
            const minutesB = timeB[0] * 60 + (timeB[1] || 0);
            return minutesB - minutesA; // Reverse for newest first
          }
          
          return dateB - dateA; // Reverse for newest first
        };
        
        // Sort completed proposals by date (newest first - reverse order)
        const sortCompletedByDate = (a, b) => {
          const dateA = a.proposed_date ? new Date(a.proposed_date) : new Date(0);
          const dateB = b.proposed_date ? new Date(b.proposed_date) : new Date(0);
          
          // If same date, check time
          if (dateA.getTime() === dateB.getTime() && a.proposed_time && b.proposed_time) {
            const timeA = a.proposed_time.split(':').map(Number);
            const timeB = b.proposed_time.split(':').map(Number);
            const minutesA = timeA[0] * 60 + (timeA[1] || 0);
            const minutesB = timeB[0] * 60 + (timeB[1] || 0);
            return minutesB - minutesA; // Reverse for newest first
          }
          
          return dateB - dateA; // Reverse for newest first
        };
        
        pendingProposals.sort(sortByDate);
        completedProposals.sort(sortCompletedByDate);
        cancelledJobs.sort(sortCancelledByDate);
        
        // Use review info from backend (already included in proposal data via embedding)
        const completedWithReviews = completedProposals.map((p) => ({
          ...p,
          hasReviewed: p.has_reviewed || false,
          canReview: p.can_review || false
        }));
        
        setProposals({ pending: pendingProposals, completed: completedWithReviews, cancelled: cancelledJobs });
      } catch (err) {
        console.error('Error fetching approval proposals:', err);
        toast.error('Failed to load proposals');
      } finally {
        setLoadingList(false);
        setLoading(false);
      }
    };

    fetchApprovalProposals();
  }, [user, proposalId]);

  // Fetch single proposal details (if proposalId exists)
  useEffect(() => {
    const fetchProposal = async () => {
      if (!proposalId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/proposals/${proposalId}/`);
        const proposalData = response.data;
        setProposal(proposalData);

        // Fetch post details
        const postResponse = await api.get(`/posts/${proposalData.post_id}/`);
        setPost(postResponse.data);

        // Check if user can review and has reviewed
        if (user) {
          const isRequester = user.id === proposalData.requester_id;
          const isProvider = user.id === proposalData.provider_id;
          
          if (isRequester || isProvider) {
            // Check if user can review based on approval status
            // For both offer and need: user can review if they have approved OR declined the job
            // Check if user cancelled the job
            const userCancelledJob = proposalData.job_status === 'cancelled' && 
              ((isRequester && proposalData.job_cancelled_by_id === user.id) ||
               (isProvider && proposalData.job_cancelled_by_id === user.id));
            
            let userCanReview = false;
            if (isRequester) {
              // Requester can review if requester has approved OR cancelled the job
              userCanReview = proposalData.requester_approved || userCancelledJob;
            } else if (isProvider) {
              // Provider can review if provider has approved OR cancelled the job
              userCanReview = proposalData.provider_approved || userCancelledJob;
            }
            
            setCanReview(userCanReview);
            
            // Check if user has already reviewed
            if (userCanReview) {
              try {
                const reviewResponse = await api.get('/reviews/', { 
                  params: { proposal: proposalId, reviewer: user.id } 
                });
                const reviews = Array.isArray(reviewResponse.data) 
                  ? reviewResponse.data 
                  : (reviewResponse.data?.results || []);
                setHasReviewed(reviews.length > 0);
              } catch (err) {
                console.error('Error checking review:', err);
                setHasReviewed(false);
              }
            } else {
              setHasReviewed(false);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching proposal:', err);
        setError('Failed to load proposal');
        toast.error('Failed to load proposal');
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [proposalId]);


  // Check if user can approve (after proposed date/time)
  const canApprove = () => {
    if (!proposal || !proposal.proposed_date) {
      return false;
    }
    
    try {
      const dateStr = proposal.proposed_date;
      const eventDate = new Date(dateStr);
      
      if (isNaN(eventDate.getTime())) {
        return false;
      }
      
      const timeValue = proposal.proposed_time;
      if (timeValue) {
        const timeParts = timeValue.split(':');
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        eventDate.setHours(hours, minutes, 0, 0);
      } else {
        // If no time specified, set to end of day
        eventDate.setHours(23, 59, 59, 999);
      }
      
      // Check if current date/time is after or equal to event date/time
      const now = new Date();
      return now >= eventDate;
    } catch (error) {
      console.error('Error calculating approval window:', error);
      return false;
    }
  };

  // Check if user is provider and can approve based on post type
  const canProviderApprove = () => {
    // Don't show approve buttons if job is cancelled
    if (proposal?.job_status === 'cancelled') return false;
    if (!user || !proposal) return false;
    if (user.id !== proposal.provider_id) return false;
    if (proposal.provider_approved) return false;
    if (!canApprove()) return false;
    
    // For 'offer' type: provider can approve first (no prerequisite)
    // For 'need' type: provider must wait for requester approval first
    if (proposal.post_type === 'offer') {
      return true;
    } else if (proposal.post_type === 'need') {
      return proposal.requester_approved; // Must wait for requester to approve first
    }
    
    return false;
  };

  // Check if user is requester and can approve based on post type
  const canRequesterApprove = () => {
    // Don't show approve buttons if job is cancelled
    if (proposal?.job_status === 'cancelled') return false;
    if (!user || !proposal) return false;
    if (user.id !== proposal.requester_id) return false;
    if (proposal.requester_approved) return false;
    if (!canApprove()) return false;
    
    // For 'offer' type: requester must wait for provider approval first
    // For 'need' type: requester can approve first (no prerequisite)
    if (proposal.post_type === 'offer') {
      return proposal.provider_approved; // Must wait for provider to approve first
    } else if (proposal.post_type === 'need') {
      return true;
    }
    
    return false;
  };

  const handleProviderApprove = async () => {
    if (!proposal) return;

    try {
      setProcessing(true);
      await api.patch(`/proposals/${proposalId}/`, { provider_approved: true });
      
      // Get updated user profile to show balance change (if completed)
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
      
      // Check if both approved (completed)
      if (response.data.provider_approved && response.data.requester_approved) {
        const userResponse = await api.get('/session/');
        const updatedBalance = userResponse.data?.profile?.time_balance || 0;
        const isOffer = response.data.post_type === 'offer';
        const isCurrentUser = isOffer 
          ? user?.id === response.data.provider_id 
          : user?.id === response.data.requester_id;
        
        if (isCurrentUser) {
          toast.success(
            `Event completed! ${response.data.timebank_hour} hours added to your balance. New balance: ${updatedBalance} hours.`
          );
          if (user) {
            window.dispatchEvent(new CustomEvent('userUpdated'));
          }
        } else {
          toast.success('You have approved the proposal. Event completed!');
        }
        // Navigate to review page after both approved
        navigate(`/review/${proposalId}`);
      } else {
        toast.success('You have approved the proposal');
        // Navigate to review page after approval
        navigate(`/review/${proposalId}`);
      }
    } catch (err) {
      console.error('Error approving proposal:', err);
      toast.error(err.response?.data?.detail || 'Failed to approve proposal');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequesterApprove = async () => {
    if (!proposal) return;

    try {
      setProcessing(true);
      await api.patch(`/proposals/${proposalId}/`, { requester_approved: true });
      
      // Refresh proposal data first
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
      
      // Get updated user profile to show balance change
      const userResponse = await api.get('/session/');
      const updatedBalance = userResponse.data?.profile?.time_balance || 0;
      
      // Determine who received balance based on post type
      const isOffer = response.data.post_type === 'offer';
      const isCurrentUser = isOffer 
        ? user?.id === response.data.provider_id 
        : user?.id === response.data.requester_id;
      
      // Check if both approved (completed)
      if (response.data.provider_approved && response.data.requester_approved) {
        if (isCurrentUser) {
          toast.success(
            `Event completed! ${response.data.timebank_hour} hours added to your balance. New balance: ${updatedBalance} hours.`
          );
        } else {
          toast.success('You have approved the proposal. Event completed!');
        }
        // Navigate to review page after both approved
        navigate(`/review/${proposalId}`);
      } else {
        toast.success('You have approved the proposal');
        // Navigate to review page after approval
        navigate(`/review/${proposalId}`);
      }
      
      // Refresh user data
      if (user) {
        window.dispatchEvent(new CustomEvent('userUpdated'));
      }
      
      // Notify Header to refresh proposals
      window.dispatchEvent(new CustomEvent('proposalUpdated'));
    } catch (err) {
      console.error('Error approving proposal:', err);
      toast.error(err.response?.data?.detail || 'Failed to approve proposal');
    } finally {
      setProcessing(false);
    }
  };


  // Handle decline event
  const handleDeclineEvent = async () => {
    if (!proposal) return;

    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }

    try {
      setDeclining(true);
      
      // Decline job but keep proposal status as accepted
      const updateData = { 
        decline_job: true,
        cancellation_reason: cancellationReason,
        notes: `[Declined by ${user?.username}]: ${declineReason.trim()}`
      };
      await api.patch(`/proposals/${proposalId}/`, updateData);
      
      // Fetch updated user session to reflect balance changes
      const userResponse = await api.get('/session/');
      const updatedBalance = userResponse.data?.profile?.time_balance || 0;
      
      // Determine who gets refunded/transferred based on post type and cancellation reason
      const isOffer = proposal.post_type === 'offer' || proposal.post?.post_type === 'offer';
      const isCurrentUserRequester = user?.id === proposal.requester_id;
      const isCurrentUserProvider = user?.id === proposal.provider_id;

      if (cancellationReason === 'not_showed_up') {
        // Balance transferred to other party
        if ((isOffer && isCurrentUserRequester) || (!isOffer && isCurrentUserProvider)) {
          toast.success(
            `Event declined! ${proposal.timebank_hour} hours transferred to the other party. Your balance remains unchanged: ${updatedBalance} hours.`
          );
        } else {
          toast.success(
            `Event declined! ${proposal.timebank_hour} hours transferred to your balance. New balance: ${updatedBalance} hours.`
          );
        }
      } else {
        // Refund to original payer
        if ((isOffer && isCurrentUserRequester) || (!isOffer && isCurrentUserProvider)) {
          toast.success(
            `Event declined! ${proposal.timebank_hour} hours refunded to your balance. New balance: ${updatedBalance} hours.`
          );
        } else {
          toast.success('Event declined successfully');
        }
      }
      
      // Store who cancelled this proposal in sessionStorage
      sessionStorage.setItem(`proposal_${proposalId}_cancelled_by`, user?.id?.toString() || '');
      
      // Refresh proposal data - wait a bit to ensure job is saved
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
      
      // Update user context
      if (user) {
        window.dispatchEvent(new CustomEvent('userUpdated'));
      }
      
      // Notify Header to refresh proposals
      window.dispatchEvent(new CustomEvent('proposalUpdated'));
      
      // Close dialog and reset
      setShowDeclineDialog(false);
      setDeclineReason('');
      
      // Navigate to review page after decline
      navigate(`/review/${proposalId}`);
    } catch (err) {
      console.error('Error declining event:', err);
      toast.error(err.response?.data?.detail || 'Failed to decline event');
    } finally {
      setDeclining(false);
    }
  };


  // If no proposalId, show list of approval-waiting proposals
  if (!proposalId) {
    if (loadingList) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading proposals...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white text-slate-900">
        <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-md bg-slate-900 text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-primary text-slate-900 font-normal">My Approvals</h2>
              <p className="text-muted-foreground text-sm text-slate-600">
                Review and approve accepted proposals
              </p>
            </div>
          </div>

          {/* Pending Approvals Section */}
          {proposals.pending && proposals.pending.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Approvals</h3>
              <div className="space-y-4">
                {proposals.pending.map((p) => {
                const isProvider = user?.id === p.provider_id;
                const isRequester = user?.id === p.requester_id;
                const canApproveNow = () => {
                  if (!p.proposed_date) return false;
                  try {
                    const dateStr = p.proposed_date;
                    const eventDate = new Date(dateStr);
                    if (isNaN(eventDate.getTime())) return false;
                    
                    const timeValue = p.proposed_time;
                    if (timeValue) {
                      const timeParts = timeValue.split(':');
                      const hours = parseInt(timeParts[0], 10) || 0;
                      const minutes = parseInt(timeParts[1], 10) || 0;
                      eventDate.setHours(hours, minutes, 0, 0);
                    } else {
                      // If no time specified, set to end of day
                      eventDate.setHours(23, 59, 59, 999);
                    }
                    
                    // Check if current date/time is after or equal to event date/time
                    const now = new Date();
                    return now >= eventDate;
                  } catch {
                    return false;
                  }
                };
                
                const canApprove = () => {
                  if (!canApproveNow()) return false;
                  
                  const postType = p.post_type || p.post?.post_type;
                  
                  if (isProvider) {
                    // Provider approval logic
                    if (postType === 'offer') {
                      // Offer: provider can approve first (no prerequisite)
                      return !p.provider_approved;
                    } else if (postType === 'need') {
                      // Need: provider must wait for requester approval first
                      return p.requester_approved && !p.provider_approved;
                    }
                  }
                  
                  if (isRequester) {
                    // Requester approval logic
                    if (postType === 'offer') {
                      // Offer: requester must wait for provider approval first
                      return p.provider_approved && !p.requester_approved;
                    } else if (postType === 'need') {
                      // Need: requester can approve first (no prerequisite)
                      return !p.requester_approved;
                    }
                  }
                  
                  return false;
                };

                return (
                  <Card 
                    key={p.id} 
                    className="shadow-md border-primary/20 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/approval/${p.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-slate-900 mb-2">
                            {p.post_title}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            {p.proposed_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(p.proposed_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                  {p.proposed_time && ` at ${p.proposed_time}`}
                                </span>
                              </div>
                            )}
                            {p.proposed_location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{p.proposed_location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{p.timebank_hour} hours</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge 
                              variant={p.status === 'completed' ? 'default' : 'outline'}
                              className={p.status === 'completed' ? 'bg-green-600 text-white' : ''}
                            >
                              {p.status === 'completed' ? 'Completed' : 'Accepted'}
                            </Badge>
                            {canApprove() && (
                              <Badge className="bg-blue-600 text-white">
                                Ready to Approve
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/approval/${p.id}`);
                          }}
                        >
                          View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
              </div>
            </div>
          )}

          {/* Completed Approvals Section */}
          {proposals.completed && proposals.completed.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Completed Approvals</h3>
              <div className="space-y-4">
                {proposals.completed.map((p) => {
                  const isRequester = user?.id === p.requester_id;
                  const isProvider = user?.id === p.provider_id;
                  // Check if user can review based on approval status
                  // For both offer and need: user can review if they have approved OR declined the job
                  // Calculate canReview from proposal data
                  let canReview = false;
                  const userCancelledJob = p.job_status === 'cancelled' && 
                    ((isRequester && p.job_cancelled_by_id === user?.id) ||
                     (isProvider && p.job_cancelled_by_id === user?.id));
                  
                  if (isRequester) {
                    canReview = p.requester_approved || userCancelledJob;
                  } else if (isProvider) {
                    canReview = p.provider_approved || userCancelledJob;
                  }
                  
                  // Check if reviewed (only if canReview is true to avoid unnecessary API calls)
                  const hasReviewed = p.hasReviewed || false;
                  
                  return (
                    <Card 
                      key={p.id} 
                      className="shadow-md border-green-200 bg-green-50 hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-900 mb-2">
                              {p.post_title}
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              {p.proposed_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(p.proposed_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                    {p.proposed_time && ` at ${p.proposed_time}`}
                                  </span>
                                </div>
                              )}
                              {p.proposed_location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{p.proposed_location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{p.timebank_hour} hours</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className="bg-green-600 text-white">
                                Completed
                              </Badge>
                              {hasReviewed && (
                                <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                                  Reviewed
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canReview && (
                              <Button
                                variant="default"
                                className="bg-primary hover:bg-primary/90 text-white"
                                disabled={hasReviewed}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/review/${p.id}`);
                                }}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                {hasReviewed ? 'Reviewed' : 'Review'}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/approval/${p.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled Jobs Section */}
          {proposals.cancelled && proposals.cancelled.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Cancelled Jobs</h3>
              <div className="space-y-4">
                {proposals.cancelled.map((p) => {
                  const isCurrentUserCancelled = p.job_cancelled_by_id === user?.id;
                  
                  return (
                    <Card 
                      key={p.id} 
                      className="shadow-md border-red-200 bg-red-50 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/approval/${p.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-900 mb-2">
                              {p.post_title}
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              {p.proposed_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(p.proposed_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                    {p.proposed_time && ` at ${p.proposed_time}`}
                                  </span>
                                </div>
                              )}
                              {p.proposed_location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{p.proposed_location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{p.timebank_hour} hours</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                              <Badge 
                                variant="outline"
                                className="bg-red-600 hover:bg-red-700 text-white border-red-700"
                              >
                                Cancelled
                              </Badge>
                            </div>
                            <div className="space-y-3 mt-2">
                              {/* Post Owner and Requester Info */}
                              <div className="flex items-center gap-4">
                                <div 
                                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${p.provider_id}`);
                                  }}
                                >
                                  <SimpleAvatar 
                                    src={p.provider_avatar || `https://placehold.co/40x40/EBF8FF/3B82F6?text=${p.provider_username?.charAt(0) || 'P'}`}
                                    fallback={p.provider_username?.charAt(0) || 'P'}
                                    className="h-8 w-8"
                                  />
                                  <div>
                                    <p className="text-xs text-gray-500">Post Owner</p>
                                    <p className="text-sm font-medium text-slate-900">{p.provider_username}</p>
                                  </div>
                                </div>
                                <div 
                                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${p.requester_id}`);
                                  }}
                                >
                                  <SimpleAvatar 
                                    src={p.requester_avatar || `https://placehold.co/40x40/EBF8FF/3B82F6?text=${p.requester_username?.charAt(0) || 'R'}`}
                                    fallback={p.requester_username?.charAt(0) || 'R'}
                                    className="h-8 w-8"
                                  />
                                  <div>
                                    <p className="text-xs text-gray-500">Requester</p>
                                    <p className="text-sm font-medium text-slate-900">{p.requester_username}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Cancelled By Info */}
                              <div className="flex items-center gap-2 pt-2 border-t border-red-200">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <p className="text-sm text-red-700">
                                  {isCurrentUserCancelled
                                    ? "You have cancelled this event."
                                    : p.job_cancelled_by_username
                                      ? (
                                          <span>
                                            Cancelled by{' '}
                                            <span 
                                              className="font-medium cursor-pointer hover:underline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/profile/${p.job_cancelled_by_id}`);
                                              }}
                                            >
                                              {p.job_cancelled_by_username}
                                            </span>
                                          </span>
                                        )
                                      : "This event has been cancelled."}
                                </p>
                              </div>
                              {p.job_cancellation_reason && (
                                <p className="text-xs text-red-600">
                                  <span className="font-medium">Reason: </span>
                                  {p.job_cancellation_reason === 'not_showed_up' 
                                    ? 'Not Showed Up'
                                    : p.job_cancellation_reason === 'other'
                                    ? 'Other'
                                    : p.job_cancellation_reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/approval/${p.id}`);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {(!proposals.pending || proposals.pending.length === 0) && 
           (!proposals.completed || proposals.completed.length === 0) &&
           (!proposals.cancelled || proposals.cancelled.length === 0) && (
            <Card className="shadow-md border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    No Approvals
                  </p>
                  <p className="text-sm text-gray-500">
                    You don't have any accepted proposals waiting for approval.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Proposal not found'}</p>
          <Button onClick={() => navigate('/approval')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Approvals
          </Button>
        </div>
      </div>
    );
  }

  // Only show approval page for accepted or completed proposals
  if (proposal.status !== 'accepted' && proposal.status !== 'completed') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">This proposal is not accepted. Only accepted proposals can be approved.</p>
          <Button onClick={() => navigate('/approval')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Approvals
          </Button>
        </div>
      </div>
    );
  }

  const isProvider = user?.id === proposal.provider_id;
  const isRequester = user?.id === proposal.requester_id;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/approval')}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-md bg-slate-900 text-white">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-primary text-slate-900 font-normal">Event Approval</h2>
            <p className="text-muted-foreground text-sm text-slate-600">
              {post.title}
            </p>
          </div>
        </div>

        {/* Cancelled Job Info */}
        {proposal.job_status === 'cancelled' && (
          <Card className="shadow-md border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Cancelled Job</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm text-red-700">
                {proposal.job_cancelled_by_id === user?.id
                  ? "You have cancelled this job."
                  : proposal.job_cancelled_by_username
                    ? `Cancelled by ${proposal.job_cancelled_by_username}`
                    : "This job has been cancelled."}
              </p>
              {proposal.job_cancellation_reason && (
                <p className="text-sm text-red-600 mt-2">
                  <span className="font-medium">Cancellation Reason: </span>
                  {proposal.job_cancellation_reason === 'not_showed_up' 
                    ? 'Not Showed Up'
                    : proposal.job_cancellation_reason === 'other'
                    ? 'Other'
                    : proposal.job_cancellation_reason}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approval Status - Hide for cancelled jobs */}
        {proposal?.job_status !== 'cancelled' && (
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary text-slate-900">Approval Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    proposal.provider_approved 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {proposal.provider_approved ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p 
                      className="font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/profile/${proposal.provider_username}`)}
                    >
                      {proposal.provider_username} (Post Owner)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {proposal.provider_approved ? 'Approved' : 'Pending approval'}
                    </p>
                  </div>
                </div>
                {proposal.provider_approved && (
                  <Badge className="bg-green-600 text-white">Approved</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    proposal.requester_approved 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {proposal.requester_approved ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p 
                      className="font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/profile/${proposal.requester_username}`)}
                    >
                      {proposal.requester_username} (Requester)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {proposal.requester_approved 
                        ? 'Approved' 
                        : proposal.provider_approved 
                          ? 'Waiting for approval' 
                          : 'Waiting for provider approval'}
                    </p>
                  </div>
                </div>
                {proposal.requester_approved && (
                  <Badge className="bg-green-600 text-white">Approved</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Event Details */}
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary text-slate-900">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {proposal.proposed_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary text-slate-900" />
                <div>
                  <p className="text-sm text-muted-foreground text-slate-600">Date</p>
                  <p className="font-medium">
                    {new Date(proposal.proposed_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
            {proposal.proposed_time && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary text-slate-900" />
                <div>
                  <p className="text-sm text-muted-foreground text-slate-600">Time</p>
                  <p className="font-medium">{proposal.proposed_time}</p>
                </div>
              </div>
            )}
            {proposal.proposed_location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary text-slate-900" />
                <div>
                  <p className="text-sm text-muted-foreground text-slate-600">Location</p>
                  <p className="font-medium">{proposal.proposed_location}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary text-slate-900" />
              <div>
                <p className="text-sm text-muted-foreground text-slate-600">TimeBank Hours</p>
                <p className="font-medium">{proposal.timebank_hour} hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Button - Show if user can review (even if not both approved) */}
        {proposal.status === 'accepted' && canReview && (
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-lg font-semibold mb-4">Review</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {isRequester 
                    ? 'You can now review the provider.'
                    : 'You can now review the requester.'}
                </p>
                <Button
                  variant="default"
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={hasReviewed}
                  onClick={() => navigate(`/review/${proposalId}`)}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {hasReviewed ? 'Reviewed' : 'Review'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approval Action */}
        {proposal.status === 'completed' || (proposal.provider_approved && proposal.requester_approved) ? (
          <Card className="shadow-md border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-900 mb-2">
                  Event Completed
                </p>
                <p className="text-sm text-green-700 mb-6">
                  Both parties have approved this event. The event is now marked as completed.
                </p>
                {/* Review Button */}
                {canReview && (
                  <Button
                    variant="default"
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={hasReviewed}
                    onClick={() => navigate(`/review/${proposalId}`)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {hasReviewed ? 'Reviewed' : 'Review'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {isProvider && canProviderApprove() && (
              <Card className="shadow-md border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-lg font-semibold mb-4">Approve Event Completion</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Confirm that the event has been completed successfully.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleProviderApprove}
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve as Provider
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowDeclineDialog(true)}
                        disabled={processing || declining}
                        variant="destructive"
                        size="lg"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isRequester && canRequesterApprove() && (
              <Card className="shadow-md border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-lg font-semibold mb-4">Approve Event Completion</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {proposal.post_type === 'offer' 
                        ? 'The post owner (provider) has approved. Confirm that the event has been completed successfully.'
                        : 'Confirm that the event has been completed successfully. Post owner (provider) will approve after your confirmation.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleRequesterApprove}
                        disabled={processing || declining}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve as Requester
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowDeclineDialog(true)}
                        disabled={processing || declining}
                        variant="destructive"
                        size="lg"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(!canProviderApprove() && !canRequesterApprove() && proposal?.job_status !== 'cancelled') && (
              <Card className="shadow-md border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      {!canApprove() 
                        ? 'You can approve this event after the event date and time has passed.'
                        : isProvider && proposal.provider_approved
                          ? 'You have already approved this event.'
                          : isProvider && proposal.post_type === 'need' && !proposal.requester_approved
                            ? 'Waiting for requester approval (need type posts require requester to approve first).'
                          : isRequester && proposal.requester_approved
                            ? 'You have already approved this event.'
                          : isRequester && proposal.post_type === 'offer' && !proposal.provider_approved
                            ? 'Waiting for post owner (provider) approval (offer type posts require provider to approve first).'
                          : 'You are not authorized to approve this event.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Decline Event Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                Decline Event Completion
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for declining this event. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancellation-type">Cancellation Type</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cancellation_reason"
                      value="not_showed_up"
                      checked={cancellationReason === 'not_showed_up'}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Not Showed Up - Transfer balance to other party</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cancellation_reason"
                      value="other"
                      checked={cancellationReason === 'other'}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Other - Refund balance</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="decline-reason">Reason for Decline</Label>
                <Textarea
                  id="decline-reason"
                  placeholder="Explain why you are declining this event..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeclineDialog(false);
                    setDeclineReason('');
                    setCancellationReason('other');
                  }}
                  disabled={declining}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeclineEvent}
                  disabled={declining || !declineReason.trim()}
                >
                  {declining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Confirm Decline
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

