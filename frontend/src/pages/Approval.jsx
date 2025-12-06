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
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

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

  // Fetch user's approval-waiting proposals (if no proposalId)
  useEffect(() => {
    const fetchApprovalProposals = async () => {
      if (!user || proposalId) return; // Only fetch if no proposalId

      try {
        setLoadingList(true);
        
        // Fetch sent proposals
        const sentResponse = await api.get('/proposals/', { params: { sent: 'true' } });
        const sentData = Array.isArray(sentResponse.data) ? sentResponse.data : (sentResponse.data?.results || []);
        
        // Fetch received proposals
        const receivedResponse = await api.get('/proposals/', { params: { received: 'true' } });
        const receivedData = Array.isArray(receivedResponse.data) ? receivedResponse.data : (receivedResponse.data?.results || []);
        
        // Combine and filter for accepted proposals
        const allProposals = [...sentData, ...receivedData];
        const acceptedProposals = allProposals.filter(p => 
          p.status === 'accepted' || p.status === 'completed'
        );
        
        // Remove duplicates (in case a proposal appears in both)
        const uniqueProposals = acceptedProposals.filter((p, index, self) =>
          index === self.findIndex((pr) => pr.id === p.id)
        );
        
        // Separate completed and pending proposals
        const completedProposals = uniqueProposals.filter(p => p.status === 'completed' || (p.provider_approved && p.requester_approved));
        const pendingProposals = uniqueProposals.filter(p => p.status !== 'completed' && !(p.provider_approved && p.requester_approved));
        
        // Sort by proposed_date (nearest date first)
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
        
        pendingProposals.sort(sortByDate);
        completedProposals.sort(sortByDate);
        
        setProposals({ pending: pendingProposals, completed: completedProposals });
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
      } else {
        toast.success('You have approved the proposal');
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
      
      // Get updated user profile to show balance change
      const userResponse = await api.get('/session/');
      const updatedBalance = userResponse.data?.profile?.time_balance || 0;
      
      // Determine who received balance based on post type
      const isOffer = proposal.post?.post_type === 'offer' || proposal.post_type === 'offer';
      const isCurrentUser = isOffer 
        ? user?.id === proposal.provider_id 
        : user?.id === proposal.requester_id;
      
      if (isCurrentUser) {
        toast.success(
          `Event completed! ${proposal.timebank_hour} hours added to your balance. New balance: ${updatedBalance} hours.`
        );
      } else {
        toast.success('You have approved the proposal. Event completed!');
      }
      
      // Refresh proposal data
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
      
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
                  if (isProvider) return !p.provider_approved;
                  if (isRequester) return p.provider_approved && !p.requester_approved;
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
                  return (
                    <Card 
                      key={p.id} 
                      className="shadow-md border-green-200 bg-green-50 hover:shadow-lg transition-shadow cursor-pointer"
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
                              <Badge className="bg-green-600 text-white">
                                Completed
                              </Badge>
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

          {/* Empty State */}
          {(!proposals.pending || proposals.pending.length === 0) && 
           (!proposals.completed || proposals.completed.length === 0) && (
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

        {/* Approval Status */}
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
                    <p className="font-medium">{proposal.provider_username} (Post Owner)</p>
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
                    <p className="font-medium">{proposal.requester_username} (Requester)</p>
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

        {/* Approval Action */}
        {proposal.status === 'completed' || (proposal.provider_approved && proposal.requester_approved) ? (
          <Card className="shadow-md border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-900 mb-2">
                  Event Completed
                </p>
                <p className="text-sm text-green-700">
                  Both parties have approved this event. The event is now marked as completed.
                </p>
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
                    <Button
                      onClick={handleRequesterApprove}
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
                          Approve as Requester
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {(!canProviderApprove() && !canRequesterApprove()) && (
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
      </div>
    </div>
  );
}

