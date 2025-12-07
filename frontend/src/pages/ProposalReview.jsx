import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export default function ProposalReview() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseAction, setResponseAction] = useState(null); // 'accept' or 'decline'
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [canAccept, setCanAccept] = useState(true); // Check if user can accept (balance < 10 for offers)

  useEffect(() => {
    const fetchProposal = async () => {
      if (!proposalId) {
        setError('Proposal ID is missing');
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
        const postData = postResponse.data;
        setPost(postData);

        // Check balance for offer posts (provider receives credit when accepting)
        if (postData?.post_type === 'offer' && user) {
          try {
            const userResponse = await api.get('/users/me/');
            const currentBalance = userResponse.data?.profile?.time_balance || 0;
            
            if (currentBalance >= 10) {
              setCanAccept(false);
            } else {
              setCanAccept(true);
            }
          } catch (err) {
            console.error('Error checking balance:', err);
            setCanAccept(true); // Allow accept if balance check fails
          }
        } else {
          setCanAccept(true);
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
  }, [proposalId, user]);

  const handleAcceptClick = async () => {
    // Check balance for offer posts (provider receives credit when accepting)
    if (post?.post_type === 'offer' && user) {
      try {
        const userResponse = await api.get('/users/me/');
        const currentBalance = userResponse.data?.profile?.time_balance || 0;
        
        if (currentBalance >= 10) {
          toast.error('You have 10 hours credit. You should spent some of your credit before providing another service.');
          return;
        }
      } catch (err) {
        console.error('Error checking balance:', err);
        // Continue if balance check fails
      }
    }
    
    setResponseAction('accept');
    setShowResponseForm(true);
  };

  const handleDeclineClick = () => {
    setResponseAction('decline');
    setShowResponseForm(true);
  };

  const handleAccept = async () => {
    if (!proposal) return;

    // Check balance again before accepting (offer posts only)
    if (post?.post_type === 'offer' && user) {
      try {
        const userResponse = await api.get('/users/me/');
        const currentBalance = userResponse.data?.profile?.time_balance || 0;
        
        if (currentBalance >= 10) {
          toast.error('You have 10 hours credit. You should spent some of your credit before providing another service.');
          return;
        }
      } catch (err) {
        console.error('Error checking balance:', err);
        // Continue if balance check fails
      }
    }

    try {
      setProcessing(true);
      const updateData = { status: 'accepted' };
      if (responseMessage.trim()) {
        // Append response message to notes
        const currentNotes = proposal.notes || '';
        const responseNote = `\n\n[Response from ${user?.username}]: ${responseMessage.trim()}`;
        updateData.notes = currentNotes + responseNote;
      }
      await api.patch(`/proposals/${proposalId}/`, updateData);
      
      // Get updated user profile to show balance change
      const userResponse = await api.get('/session/');
      const updatedBalance = userResponse.data?.profile?.time_balance || 0;
      
      // Determine who paid based on post type
      const isOffer = proposal.post?.post_type === 'offer' || proposal.post_type === 'offer';
      const isCurrentUser = isOffer 
        ? user?.id === proposal.requester_id 
        : user?.id === proposal.provider_id;
      
      if (isCurrentUser) {
        toast.success(
          `Proposal accepted successfully! ${proposal.timebank_hour} hours deducted from your balance. New balance: ${updatedBalance} hours.`
        );
      } else {
        toast.success('Proposal accepted successfully!');
      }
      
      // Refresh proposal data
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
      
      // Refresh user data
      if (user) {
        window.dispatchEvent(new CustomEvent('userUpdated'));
      }
      
      setShowResponseForm(false);
      setResponseMessage('');
      setResponseAction(null);
    } catch (err) {
      console.error('Error accepting proposal:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Failed to accept proposal';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!proposal) return;

    try {
      setProcessing(true);
      const updateData = { status: 'declined' };
      if (responseMessage.trim()) {
        // Append response message to notes
        const currentNotes = proposal.notes || '';
        const responseNote = `\n\n[Response from ${user?.username}]: ${responseMessage.trim()}`;
        updateData.notes = currentNotes + responseNote;
      }
      await api.patch(`/proposals/${proposalId}/`, updateData);
      toast.success('Proposal declined');
      // Refresh proposal data
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
      setShowResponseForm(false);
      setResponseMessage('');
      setResponseAction(null);
    } catch (err) {
      console.error('Error declining proposal:', err);
      toast.error(err.response?.data?.detail || 'Failed to decline proposal');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelResponse = () => {
    setShowResponseForm(false);
    setResponseMessage('');
    setResponseAction(null);
  };

  const handleCancelNegotiationClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelNegotiationConfirm = async () => {
    if (!proposal) return;

    try {
      setProcessing(true);
      setShowCancelConfirm(false);
      const updateData = { status: 'cancelled' };
      await api.patch(`/proposals/${proposalId}/`, updateData);
      
      // Get updated user profile to show balance refund (if was accepted)
      const userResponse = await api.get('/session/');
      const updatedBalance = userResponse.data?.profile?.time_balance || 0;
      
      // Check if proposal was accepted before (to show refund message)
      const wasAccepted = proposal.status === 'accepted';
      
      if (wasAccepted) {
        // Determine who got refunded based on post type
        const isOffer = proposal.post?.post_type === 'offer' || proposal.post_type === 'offer';
        const isCurrentUser = isOffer 
          ? user?.id === proposal.requester_id 
          : user?.id === proposal.provider_id;
        
        if (isCurrentUser) {
          toast.success(
            `Negotiation cancelled successfully! ${proposal.timebank_hour} hours refunded to your balance. New balance: ${updatedBalance} hours.`
          );
        } else {
          toast.success('Negotiation cancelled successfully');
        }
        
        // Refresh user data
        if (user) {
          window.dispatchEvent(new CustomEvent('userUpdated'));
        }
      } else {
        toast.success('Negotiation cancelled successfully');
      }
      
      // Store who cancelled this proposal in sessionStorage
      sessionStorage.setItem(`proposal_${proposalId}_cancelled_by`, user?.id?.toString() || '');
      
      // Refresh proposal data
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
      
      // Notify Header to refresh proposals
      window.dispatchEvent(new CustomEvent('proposalUpdated'));
    } catch (err) {
      console.error('Error cancelling negotiation:', err);
      toast.error(err.response?.data?.detail || 'Failed to cancel negotiation');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelConfirmClose = () => {
    setShowCancelConfirm(false);
  };

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
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is the post owner
  if (post.postedBy !== user?.username) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">You are not authorized to review this proposal</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const locationFromNotes = proposal.notes?.split('\n').find(line => line.startsWith('Location:'))?.replace('Location:', '').trim();
  const timeFromNotes = proposal.notes?.split('\n').find(line => line.startsWith('Time:'))?.replace('Time:', '').trim();
  const providerResponseMessage = proposal.notes?.split('\n').find(line => line.includes('[Response from'))?.replace(/\[Response from .+?\]:\s*/, '') || null;
  const notesText = proposal.notes?.split('\n').filter(line => !line.startsWith('Location:') && !line.startsWith('Time:') && !line.includes('[Response from')).join('\n').trim();

  // Calculate event datetime and check if cancellation is allowed (12 hours before event)
  const canCancelNegotiation = () => {
    if (!proposal || !proposal.proposed_date) {
      console.log('canCancelNegotiation: No proposal or proposed_date');
      return false;
    }
    
    try {
      // Create event date from proposal date (assuming ISO format or YYYY-MM-DD)
      const dateStr = proposal.proposed_date;
      const eventDate = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(eventDate.getTime())) {
        console.log('canCancelNegotiation: Invalid date', dateStr);
        return false;
      }
      
      // If time is provided, add it to the date
      const timeValue = proposal.proposed_time || timeFromNotes;
      if (timeValue) {
        // Handle time formats: "HH:MM" or "HH:MM:SS"
        const timeParts = timeValue.split(':');
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        eventDate.setHours(hours, minutes, 0, 0);
      } else {
        // Default to end of day if no time specified
        eventDate.setHours(23, 59, 59, 999);
      }
      
      // Current time
      const now = new Date();
      
      // Calculate difference in milliseconds
      const diffMs = eventDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      console.log('canCancelNegotiation:', {
        proposed_date: proposal.proposed_date,
        proposed_time: proposal.proposed_time,
        timeFromNotes,
        eventDate: eventDate.toISOString(),
        now: now.toISOString(),
        diffHours,
        canCancel: diffHours > 12
      });
      
      // Can cancel if more than 12 hours remain
      return diffHours > 12;
    } catch (err) {
      console.error('Error calculating cancellation availability:', err);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
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
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-primary text-slate-900 font-normal">Negotiation</h2>
            <p className="text-muted-foreground text-sm text-slate-600">
              {post.title}
            </p>
          </div>
        </div>

        {/* Cancelled Card - Show above Post Summary if cancelled */}
        {proposal.status === 'cancelled' && (
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-red-900 mb-2">
                    Proposal Cancelled
                  </p>
                  <p className="text-sm text-red-700 mb-4">
                    {(() => {
                      // Check if current user cancelled this proposal
                      const cancelledByUserId = sessionStorage.getItem(`proposal_${proposalId}_cancelled_by`);
                      const isCurrentUserCancelled = cancelledByUserId && cancelledByUserId === user?.id?.toString();
                      
                      if (isCurrentUserCancelled) {
                        return `You have cancelled this negotiation.`;
                      }
                      
                      // Determine who cancelled: if current user is provider (post owner), then requester cancelled, and vice versa
                      const isCurrentUserProvider = user?.id === proposal.provider_id;
                      const isCurrentUserRequester = user?.id === proposal.requester_id;
                      
                      if (isCurrentUserProvider) {
                        // Current user is post owner, so requester cancelled
                        return `This proposal has been cancelled by ${proposal.requester_username} (Requester).`;
                      } else if (isCurrentUserRequester) {
                        // Current user is requester, so provider (post owner) cancelled
                        return `This proposal has been cancelled by ${proposal.provider_username} (Post Owner).`;
                      } else {
                        // Fallback: show both options
                        return `This proposal has been cancelled.`;
                      }
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Event - Show above Post Summary if accepted */}
        {proposal.status === 'accepted' && (
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-blue-900 mb-2">
                    Upcoming Event With {proposal.requester_username}
                  </p>
                  <p className="text-sm text-blue-700 mb-4">
                    This proposal has been accepted
                  </p>
                  {proposal.proposed_date && (
                    <p className="text-xs text-blue-600 mt-3">
                      Event Date: {new Date(proposal.proposed_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {(proposal.proposed_time || timeFromNotes) && ` at ${proposal.proposed_time || timeFromNotes}`}
                    </p>
                  )}
                  <div className="mt-6 flex gap-3 justify-center">
                    <Button
                      onClick={() => navigate(`/approval/${proposalId}`)}
                      variant="outline"
                      className="bg-green-600 hover:bg-green-700 text-white border-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Go to Approval
                    </Button>
                    {canCancelNegotiation() && (
                      <Button
                        onClick={handleCancelNegotiationClick}
                        disabled={processing}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel the Event
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post Summary */}
        <Card className="shadow-md border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
            <CardTitle className="text-primary text-slate-900">{post.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {post.description && (
              <p className="text-slate-700 mb-4">{post.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {post.tags && post.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Proposal Details */}
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary text-slate-900">Proposal Details</CardTitle>
              <Badge
                variant={
                  proposal.status === 'completed'
                    ? 'default'
                    : proposal.status === 'accepted'
                    ? 'default'
                    : proposal.status === 'declined' || proposal.status === 'cancelled'
                    ? 'destructive'
                    : 'secondary'
                }
                className={
                  proposal.status === 'completed'
                    ? 'bg-blue-600 text-white'
                    : proposal.status === 'accepted'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : ''
                }
              >
                {proposal.status === 'completed'
                  ? 'Completed'
                  : proposal.status === 'accepted'
                  ? 'Accepted'
                  : proposal.status === 'declined'
                  ? 'Declined'
                  : proposal.status === 'cancelled'
                  ? 'Cancelled'
                  : 'Waiting'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Sender Info */}
            <div className="flex items-center gap-3 bg-secondary/10 p-3 rounded-lg border border-primary/10">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center bg-slate-900/10">
                <User className="w-5 h-5 text-primary text-slate-900" />
              </div>
              <div>
                <p className="font-medium">{proposal.requester_username}</p>
                <p className="text-xs text-muted-foreground text-slate-600">
                  Proposal sent on {new Date(proposal.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Proposal Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary text-slate-900" />
                <div>
                  <p className="text-sm text-muted-foreground text-slate-600">TimeBank Hours</p>
                  <p className="font-medium text-primary text-slate-900">{proposal.timebank_hour} hours</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary text-slate-900" />
                <div>
                  <p className="text-sm text-muted-foreground text-slate-600">Proposed Date</p>
                  <p className="font-medium">
                    {proposal.proposed_date ? (
                      new Date(proposal.proposed_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </p>
                </div>
              </div>

              {(proposal.proposed_time || timeFromNotes) && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary text-slate-900" />
                  <div>
                    <p className="text-sm text-muted-foreground text-slate-600">Proposed Time</p>
                    <p className="font-medium">{proposal.proposed_time || timeFromNotes}</p>
                  </div>
                </div>
              )}

              {(proposal.proposed_location || locationFromNotes) && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary text-slate-900" />
                  <div>
                    <p className="text-sm text-muted-foreground text-slate-600">Location</p>
                    <p className="font-medium">{proposal.proposed_location || locationFromNotes}</p>
                  </div>
                </div>
              )}

              {notesText && (
                <div className="bg-muted/30 p-3 rounded-lg border border-primary/10 bg-slate-50/30">
                  <p className="text-sm text-muted-foreground mb-1 text-slate-600">Additional Notes:</p>
                  <p className="text-sm whitespace-pre-line">{notesText}</p>
                </div>
              )}

              {providerResponseMessage && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Your Response:</p>
                  <p className="text-sm text-blue-800 whitespace-pre-line">{providerResponseMessage}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {proposal.status === 'waiting' && !showResponseForm && (
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-6">
              {!canAccept && post?.post_type === 'offer' && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    You have 10 hours credit. You should spent some of your credit before providing another service.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={handleAcceptClick}
                  disabled={processing || !canAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Proposal
                </Button>
                <Button
                  onClick={handleDeclineClick}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response Form with Message */}
        {proposal.status === 'waiting' && showResponseForm && (
          <Card className="shadow-md border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary text-slate-900">
                {responseAction === 'accept' ? 'Accept Proposal' : 'Decline Proposal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {responseAction === 'accept' && !canAccept && post?.post_type === 'offer' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    You have 10 hours credit. You should spent some of your credit before providing another service.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="response-message" className="text-primary text-slate-900">
                  Message (Optional)
                </Label>
                <Textarea
                  id="response-message"
                  rows={4}
                  placeholder={`Add a message to ${responseAction === 'accept' ? 'accept' : 'decline'} this proposal...`}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-slate-500">
                  This message will be added to the proposal notes.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={responseAction === 'accept' ? handleAccept : handleDecline}
                  disabled={processing || (responseAction === 'accept' && !canAccept)}
                  className={`flex-1 ${responseAction === 'accept' ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed' : ''}`}
                  variant={responseAction === 'decline' ? 'destructive' : 'default'}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {responseAction === 'accept' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Accept
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Confirm Decline
                        </>
                      )}
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelResponse}
                  disabled={processing}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}




        {/* Cancel Negotiation Confirmation Dialog */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Negotiation</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this negotiation? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelConfirmClose}
                disabled={processing}
              >
                Back
              </Button>
              <Button
                onClick={handleCancelNegotiationConfirm}
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

