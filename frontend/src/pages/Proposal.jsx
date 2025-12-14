import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { toast } from 'sonner';

import { 
  ArrowLeft, 
  Send, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export default function Proposal() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [postDetails, setPostDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentUser = useMemo(() => {
    return user ? {
      id: user.id,
      userName: user.username,
    } : null;
  }, [user?.id, user?.username]);
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  const [showNewProposal, setShowNewProposal] = useState(false);
  const [proposalData, setProposalData] = useState({
    hours: 2,
    date: '',
    time: '',
    location: '',
    latitude: null,
    longitude: null,
    notes: '',
  });
  
  // Location autocomplete states
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Cancel event states
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId) {
        setError('Post ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/posts/${postId}/`);
        const post = response.data;
        
        setPostDetails({
          id: post.id,
          title: post.title,
          type: post.post_type,
          owner: post.postedBy,
          tags: post.tags || [],
          location: post.location,
          description: post.description,
          duration: post.duration,
          frequency: post.frequency,
          participant_count: post.participant_count,
          date: post.date,
          latitude: post.latitude,
          longitude: post.longitude,
          avatar: post.avatar,
        });
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Failed to load post details');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  // Initialize proposal form with post owner's values when post details are loaded
  useEffect(() => {
    if (postDetails) {
      // Set date from post
      if (postDetails.date) {
        setProposalData(prev => ({
          ...prev,
          date: postDetails.date,
        }));
      }
      
      // Set location from post
      if (postDetails.location) {
        setProposalData(prev => ({
          ...prev,
          location: postDetails.location,
          latitude: postDetails.latitude !== null && postDetails.latitude !== undefined ? postDetails.latitude : prev.latitude,
          longitude: postDetails.longitude !== null && postDetails.longitude !== undefined ? postDetails.longitude : prev.longitude,
        }));
        setLocationInput(postDetails.location);
      }
      
      
      if (postDetails.duration) {
        const durationMatch = postDetails.duration.match(/(\d+)\s*h/i);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1], 10);
          if (hours && hours >= 1) {
            setProposalData(prev => ({ ...prev, hours }));
          }
        }
      }
     
    }
  }, [postDetails]);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!postId || !user?.id) return;

      try {
        setLoadingProposals(true);
        // Fetch proposals for this post
        const response = await api.get('/proposals/', { 
          params: { post: postId } 
        });
        
        const proposalsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.results || []);
        
        // Transform backend data to frontend format
        const transformedProposals = proposalsData.map(proposal => {
          const notes = proposal.notes || '';
          const locationFromNotes = notes.split('\n').find(line => line.startsWith('Location:'))?.replace('Location:', '').trim() || '';
          const timeFromNotes = notes.split('\n').find(line => line.startsWith('Time:'))?.replace('Time:', '').trim() || '';
          const providerResponseMessage = notes.split('\n').find(line => line.includes('[Response from'))?.replace(/\[Response from .+?\]:\s*/, '') || null;
          
          return {
            id: proposal.id,
            fromUserId: proposal.requester_id,
            fromUserName: proposal.requester_username,
            hours: parseFloat(proposal.timebank_hour),
            date: proposal.proposed_date || '',
            time: proposal.proposed_time || timeFromNotes,
            location: proposal.proposed_location || locationFromNotes,
            notes: notes.split('\n').filter(line => !line.startsWith('Location:') && !line.startsWith('Time:') && !line.includes('[Response from')).join('\n').trim(),
            responseMessage: providerResponseMessage,
            timestamp: new Date(proposal.created_at),
            status: proposal.status === 'waiting' ? 'pending' : (proposal.status === 'declined' ? 'declined' : proposal.status === 'completed' ? 'completed' : proposal.status === 'cancelled' ? 'cancelled' : proposal.status),
            job_status: proposal.job_status, // Include job_status for filtering
          };
        });
        
        setProposals(transformedProposals);
      } catch (err) {
        console.error('Error fetching proposals:', err);
        toast.error('Failed to load proposals');
      } finally {
        setLoadingProposals(false);
      }
    };

    fetchProposals();
  }, [postId, user?.id]);

  // Location autocomplete functions
  const searchLocation = async (query) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLocationLoading(true);
    try {
      // OpenStreetMap Nominatim API - Global search 
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      setLocationSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Location search error:", err);
      setLocationSuggestions([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    setProposalData(prev => ({ ...prev, location: value }));
    
    // Debounce için timeout
    if (locationInput !== value) {
      const timeoutId = setTimeout(() => {
        searchLocation(value);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleLocationSelect = (suggestion) => {
    setLocationInput(suggestion.display_name);
    setProposalData(prev => ({
      ...prev,
      location: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  // Find user's own pending proposal
  const userPendingProposal = currentUser ? proposals.find(p => p.status === 'pending' && p.fromUserId === currentUser.id) : null;
  
  // Check if user has any proposals
  const userProposals = currentUser ? proposals.filter(p => p.fromUserId === currentUser.id) : [];
  
  // Sort proposals by timestamp (newest first) for display
  const sortedUserProposals = [...userProposals].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Get the most recent proposal (sorted by timestamp, most recent first)
  const mostRecentProposal = sortedUserProposals.length > 0 ? sortedUserProposals[0] : null;
  
  // Find user's accepted proposal (exclude cancelled jobs)
  const acceptedProposal = sortedUserProposals.find(p => 
    p.status === 'accepted' && p.job_status !== 'cancelled'
  );
  
 
  // If job_status is 'cancelled', allow new proposals (even if proposal status is 'accepted')
  const hasAcceptedProposal = mostRecentProposal?.status === 'accepted' 
    && mostRecentProposal?.status !== 'completed'
    && mostRecentProposal?.job_status !== 'cancelled';

  // Calculate event datetime and check if cancellation is allowed (12 hours before event)
  const canCancelNegotiation = () => {
    if (!acceptedProposal || !acceptedProposal.date) {
      return false;
    }
    
    try {
      // Create event date from proposal date
      const dateStr = acceptedProposal.date;
      const eventDate = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(eventDate.getTime())) {
        return false;
      }
      
      // If time is provided, add it to the date
      const timeValue = acceptedProposal.time;
      if (timeValue) {
        
        const timeParts = timeValue.split(':');
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        eventDate.setHours(hours, minutes, 0, 0);
      } else {
        
        eventDate.setHours(23, 59, 59, 999);
      }
      
      // Current time
      const now = new Date();
      
      // Calculate difference in milliseconds
      const diffMs = eventDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Can cancel if more than 12 hours remain
      return diffHours > 12;
    } catch (error) {
      console.error('Error calculating cancellation window:', error);
      return false;
    }
  };

  const handleCancelNegotiationClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelNegotiationConfirm = async () => {
    if (!acceptedProposal) return;

    try {
      setProcessing(true);
      setShowCancelConfirm(false);
      const updateData = { status: 'cancelled' };
      await api.patch(`/proposals/${acceptedProposal.id}/`, updateData);
      
      // Get updated user profile to show balance refund (if was accepted)
      const userResponse = await api.get('/session/');
      const updatedBalance = userResponse.data?.profile?.time_balance || 0;
      
      // Check if proposal was accepted before (to show refund message)
      const wasAccepted = acceptedProposal.status === 'accepted';
      
      if (wasAccepted && user) {
        // Determine who got refunded based on post type
        const isOffer = postDetails?.post_type === 'offer';
        const isCurrentUser = isOffer 
          ? user?.id?.toString() === acceptedProposal.requester_id?.toString()
          : user?.id?.toString() === acceptedProposal.provider_id?.toString();
        
        if (isCurrentUser) {
          toast.success(
            `Event cancelled successfully! ${acceptedProposal.hours} hours refunded to your balance. New balance: ${updatedBalance} hours.`
          );
          // Refresh user data
          window.dispatchEvent(new CustomEvent('userUpdated'));
        } else {
          toast.success('Event cancelled successfully');
        }
      } else {
        toast.success('Event cancelled successfully');
      }
      
      // Store who cancelled this proposal in sessionStorage
      sessionStorage.setItem(`proposal_${acceptedProposal.id}_cancelled_by`, currentUser?.id?.toString() || '');
      
      // Refresh proposals data
      const proposalsResponse = await api.get(`/proposals/?post=${postId}`);
      const proposalsData = proposalsResponse.data;
      
      const transformedProposals = proposalsData.map(proposal => {
        const notes = proposal.notes || '';
        const locationFromNotes = notes.split('\n').find(line => line.startsWith('Location:'))?.replace('Location:', '').trim() || '';
        const timeFromNotes = notes.split('\n').find(line => line.startsWith('Time:'))?.replace('Time:', '').trim() || '';
        const providerResponseMessage = notes.split('\n').find(line => line.includes('[Response from'))?.replace(/\[Response from .+?\]:\s*/, '') || null;
        
        return {
          id: proposal.id,
          fromUserId: proposal.requester_id,
          fromUserName: proposal.requester_username,
          hours: parseFloat(proposal.timebank_hour),
          date: proposal.proposed_date || '',
          time: proposal.proposed_time || timeFromNotes,
          location: proposal.proposed_location || locationFromNotes,
          notes: notes.split('\n').filter(line => !line.startsWith('Location:') && !line.startsWith('Time:') && !line.includes('[Response from')).join('\n').trim(),
          responseMessage: providerResponseMessage,
          timestamp: new Date(proposal.created_at),
          status: proposal.status === 'waiting' ? 'pending' : (proposal.status === 'declined' ? 'declined' : proposal.status === 'completed' ? 'completed' : proposal.status === 'cancelled' ? 'cancelled' : proposal.status),
        };
      });
      
      setProposals(transformedProposals);
      
      // Notify Header to refresh proposals
      window.dispatchEvent(new CustomEvent('proposalUpdated'));
    } catch (err) {
      console.error('Error cancelling event:', err);
      toast.error(err.response?.data?.detail || 'Failed to cancel event');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelConfirmClose = () => {
    setShowCancelConfirm(false);
  };

  const handleSubmitProposal = async () => {
    if (!currentUser) {
      toast.error('Please log in to send a proposal');
      return;
    }
    if (!postId) {
      toast.error('Post ID is missing');
      return;
    }
    
    // Check if user already has a proposal for this post
    if (userProposals.length > 0) {
      // Check if there's any proposal that's active (not completed/cancelled)
      // A proposal is active if:
      // - status is NOT 'completed' and NOT 'cancelled'
      // - AND job_status is NOT 'cancelled' and NOT 'completed' (cancelled/completed jobs allow new proposals)
      const activeProposal = userProposals.find(p => {
        const status = p.status;
        const jobStatus = p.job_status || p.jobStatus;
        
        // If status is completed or cancelled, proposal is not active
        if (status === 'completed' || status === 'cancelled') {
          return false;
        }
        
        // If job_status is cancelled or completed, allow new proposals
        if (jobStatus === 'cancelled' || jobStatus === 'completed') {
          return false;
        }
        
        // Otherwise, proposal is active
        return true;
      });
      
      if (activeProposal) {
        toast.error('You have already sent a proposal for this post. Please wait for the current proposal to be completed or cancelled.');
        return;
      }
    }
    
    if (!proposalData.date) {
      toast.error('Please select a date');
      return;
    }
    if (!proposalData.time) {
      toast.error('Please select a time');
      return;
    }
    
    // Check if proposed date/time is at least 24 hours from now
    const proposedDateTime = new Date(`${proposalData.date}T${proposalData.time}`);
    const now = new Date();
    const hoursUntilProposal = (proposedDateTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilProposal < 24) {
      toast.error('Proposal date and time must be at least 24 hours from now.');
      return;
    }
    
    if (!proposalData.location || proposalData.location.trim() === '') {
      toast.error('Please select a location');
      return;
    }
    if (!proposalData.hours || proposalData.hours <= 0) {
      toast.error('Please enter a valid TimeBank hour value (minimum 1 hour)');
      return;
    }
    if (proposalData.hours % 1 !== 0) {
      toast.error('TimeBank hours must be whole numbers (1, 2, 3, etc.)');
      return;
    }

    // Check balance for 'offer' posts (requester pays)
    if (postDetails?.type === 'offer') {
      try {
        // Fetch user's current balance and proposals
        // exclude_images=true to reduce payload size - images not needed for balance calculation
        const [userResponse, sentResponse, receivedResponse] = await Promise.all([
          api.get('/users/me/'),
          api.get('/proposals/?sent=true&exclude_images=true'),
          api.get('/proposals/?received=true&exclude_images=true'),
        ]);

        const currentBalance = userResponse.data?.profile?.time_balance || 0;
        
        // Calculate pending balance
        const sentProposals = Array.isArray(sentResponse.data) 
          ? sentResponse.data 
          : (sentResponse.data?.results || []);
        const receivedProposals = Array.isArray(receivedResponse.data) 
          ? receivedResponse.data 
          : (receivedResponse.data?.results || []);
        
        const allProposals = [...sentProposals, ...receivedProposals];
        const uniqueProposals = Array.from(
          new Map(allProposals.map(p => [p.id, p])).values()
        );

        let pending = 0;
        uniqueProposals.forEach(proposal => {
          const isRequester = proposal.requester_id === currentUser.id || proposal.requester_username === currentUser.userName;
          const postType = proposal.post_type || proposal.post?.post_type;
          const amount = parseFloat(proposal.timebank_hour) || 0;

          // Pending: Accepted but not completed yet (for offer posts, requester pending)
          if (proposal.status === 'accepted' && proposal.job_status !== 'cancelled' && postType === 'offer' && isRequester) {
            pending += amount;
          }
        });

        // Check if balance is sufficient: available balance must be >= requested hours
        const availableBalance = currentBalance - pending;
        if (availableBalance < proposalData.hours) {
          toast.error(`Insufficient balance. You have ${availableBalance.toFixed(2)} hours available. You cannot propose more hours than your available balance.`);
          return;
        }
      } catch (err) {
        console.error('Error checking balance:', err);
        
      }
    }

    try {
      
      const notesText = proposalData.notes || '';

      const proposalPayload = {
        post: parseInt(postId),
        notes: notesText,
        timebank_hour: proposalData.hours.toString(),
        status: 'waiting', // Backend uses 'waiting' as default
        proposed_date: proposalData.date || null,
        proposed_time: proposalData.time || null,
        proposed_location: proposalData.location || null,
      };

      const response = await api.post('/proposals/', proposalPayload);
      
      // Add the new proposal to the list
      const newProposal = {
        id: response.data.id,
        fromUserId: response.data.requester_id,
        fromUserName: response.data.requester_username,
        hours: parseFloat(response.data.timebank_hour),
        date: response.data.proposed_date || '',
        time: response.data.proposed_time || proposalData.time,
        location: response.data.proposed_location || proposalData.location,
        notes: response.data.notes || '',
        timestamp: new Date(response.data.created_at),
        status: 'pending', // Frontend uses 'pending' for 'waiting'
      };

      setProposals([...proposals, newProposal]);
      setShowNewProposal(false);
      setProposalData({ hours: 2, date: '', time: '', location: '', latitude: null, longitude: null, notes: '' });
      setLocationInput('');
      setLocationSuggestions([]);
      setShowSuggestions(false);
      toast.success('Proposal sent successfully!');
    } catch (err) {
      console.error('Error sending proposal:', err);
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Failed to send proposal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading post details...</p>
        </div>
      </div>
    );
  }

  if (error || !postDetails) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
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
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-primary text-slate-900 font-normal">
              Negotiation: {postDetails.title}
            </h2>
            <div 
              className="flex items-center gap-2 mt-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/profile/${postDetails.owner}`)}
            >
              {postDetails.avatar ? (
                <img 
                  src={postDetails.avatar} 
                  alt={postDetails.owner}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <p className="text-muted-foreground text-sm text-slate-600 hover:text-primary transition-colors">
                {postDetails.owner}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Event - Show above Post Summary if user has accepted proposal */}
        {acceptedProposal && (
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-blue-900 mb-2">
                    Upcoming Event With {postDetails.owner}
                  </p>
                  <p className="text-sm text-blue-700 mb-4">
                    Your proposal has been accepted
                  </p>
                  {acceptedProposal.date && (
                    <p className="text-xs text-blue-600 mt-3">
                      Event Date: {new Date(acceptedProposal.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {acceptedProposal.time && ` at ${acceptedProposal.time}`}
                    </p>
                  )}
                  {acceptedProposal.location && (
                    <p className="text-xs text-blue-600 mt-2">
                      Location: {acceptedProposal.location}
                    </p>
                  )}
                  <div className="mt-6 flex gap-3 justify-center">
                    <Button
                      onClick={() => navigate(`/approval/${acceptedProposal.id}`)}
                      variant="outline"
                      className="bg-green-600 hover:bg-green-700 text-white border-green-700"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Go to Approval
                    </Button>
                    {canCancelNegotiation() && (
                      <Button
                        onClick={handleCancelNegotiationClick}
                        disabled={processing}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Cancel the Event'
                        )}
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-primary text-slate-900">
                  {postDetails.title}
                </CardTitle>
                <div 
                  className="flex items-center gap-2 mt-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/profile/${postDetails.owner}`)}
                >
                  {postDetails.avatar ? (
                    <img 
                      src={postDetails.avatar} 
                      alt={postDetails.owner}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground text-slate-600 hover:text-primary transition-colors">
                    {postDetails.owner}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-primary text-slate-900" />
                  <span className="text-sm text-muted-foreground text-slate-600">{postDetails.location}</span>
                </div>
              </div>
              <Badge 
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {postDetails.type === 'offer' ? 'Offer' : 'Request'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {postDetails.description && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-slate-700">{postDetails.description}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {postDetails.tags && postDetails.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {postDetails.duration && (
              <div className="mt-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Duration: {postDetails.duration}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current/Pending Proposal */}
          {userPendingProposal ? (
            <Card className="border-accent shadow-md border-primary">
              <CardHeader className="bg-gradient-to-r from-accent/10 to-secondary/20 from-primary/10 to-slate-100/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent text-primary" />
                  <CardTitle className="text-accent text-primary">Pending Proposal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 bg-secondary/10 p-3 rounded-lg border border-primary/10">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center bg-slate-900/10">
                    <User className="w-5 h-5 text-primary text-slate-900" />
                  </div>
                  <div>
                    <p className="font-medium">{userPendingProposal.fromUserName}</p>
                    <p className="text-xs text-muted-foreground text-slate-600">
                      {userPendingProposal.timestamp.toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary text-slate-900" />
                    <div>
                      <p className="text-sm text-muted-foreground text-slate-600">Duration</p>
                      <p className="font-medium text-primary text-slate-900">{userPendingProposal.hours} hours</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary text-slate-900" />
                    <div>
                      <p className="text-sm text-muted-foreground text-slate-600">Date & Time</p>
                      <p className="font-medium">
                        {new Date(userPendingProposal.date).toLocaleDateString('en-US')} - {userPendingProposal.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary text-slate-900" />
                    <div>
                      <p className="text-sm text-muted-foreground text-slate-600">Location</p>
                      <p className="font-medium">{userPendingProposal.location}</p>
                    </div>
                  </div>

                  {userPendingProposal.notes && (
                    <div className="bg-muted/30 p-3 rounded-lg border border-primary/10 bg-slate-50/30">
                      <p className="text-sm text-muted-foreground mb-1 text-slate-600">Notes:</p>
                      <p className="text-sm">{userPendingProposal.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20 shadow-md">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-slate-600">No pending proposal</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Proposal Form */}
          <Card className={`shadow-md border-primary/20 ${!userPendingProposal ? 'md:col-span-2' : ''}`}>
            <CardHeader>
              <CardTitle className="text-primary text-slate-900">
                Create Request
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {hasAcceptedProposal ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-slate-600">
                    Your last proposal has been accepted. Please wait for the current event to be completed before creating a new proposal.
                  </p>
                </div>
              ) : showNewProposal || !userPendingProposal ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours" className="text-primary text-slate-900">Duration (Hours) <span className="text-red-500">*</span></Label>
                      <Input
                        id="hours"
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={proposalData.hours}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow whole numbers (integers)
                          if (value === '' || value === null || value === undefined) {
                            setProposalData({ ...proposalData, hours: '' });
                            return;
                          }
                          const numValue = parseInt(value, 10);
                          if (!isNaN(numValue) && numValue >= 1) {
                            setProposalData({ ...proposalData, hours: numValue });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-primary text-slate-900">Time <span className="text-red-500">*</span></Label>
                      <Input
                        id="time"
                        type="time"
                        required
                        value={proposalData.time}
                        onChange={(e) => setProposalData({ ...proposalData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-primary text-slate-900">Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      value={proposalData.date}
                      onChange={(e) => setProposalData({ ...proposalData, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-primary text-slate-900">Location <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="location"
                        type="text"
                        required
                        placeholder="Type location (e.g., Kadıköy, Beşiktaş...)"
                        value={locationInput}
                        onChange={handleLocationInputChange}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow click on suggestion
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                      />
                      {locationLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      )}
                      
                      {/* Suggestions Dropdown */}
                      {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {locationSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => handleLocationSelect(suggestion)}
                              className="px-4 py-2 hover:bg-primary/5 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-sm text-gray-900">
                                {suggestion.display_name.split(',')[0]}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {suggestion.display_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-primary text-slate-900">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      placeholder="Additional details about your proposal..."
                      value={proposalData.notes}
                      onChange={(e) => setProposalData({ ...proposalData, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={handleSubmitProposal}
                      disabled={hasAcceptedProposal}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Proposal
                    </Button>
                    {userPendingProposal && (
                      <Button 
                        variant="outline"
                        onClick={() => setShowNewProposal(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-slate-600">
                    You have a pending proposal. Please wait for a response before creating a new request.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proposal History */}
        {sortedUserProposals.length > 0 && (
          <Card className="shadow-md border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary text-slate-900" />
                <CardTitle className="text-primary text-slate-900">Proposal History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {sortedUserProposals.map((proposal, index) => {
                const isOwn = proposal.fromUserId === currentUser.id;
                
                return (
                  <div
                    key={proposal.id}
                    className={`relative pl-8 pb-4 ${index !== sortedUserProposals.length - 1 ? 'border-l-2 border-primary/20' : ''}`}
                  >
                    {/* Timeline dot */}
                      <div className={`absolute left-0 top-0 w-4 h-4 rounded-full border-2 ${
                        proposal.status === 'completed'
                          ? 'bg-blue-500 border-blue-500'
                          : proposal.status === 'accepted' 
                          ? 'bg-green-500 border-green-500' 
                          : proposal.status === 'declined'
                          ? 'bg-red-500 border-red-500'
                          : proposal.status === 'cancelled'
                          ? 'bg-red-500 border-red-500'
                          : isOwn
                          ? 'bg-primary border-primary bg-slate-900 border-slate-900'
                          : 'bg-secondary border-secondary bg-slate-100 border-slate-400'
                      }`} />

                    <div className={`rounded-lg border-2 p-4 ${
                      proposal.status === 'completed'
                        ? 'bg-blue-50 border-blue-200'
                        : proposal.status === 'accepted'
                        ? 'bg-green-50 border-green-200'
                        : proposal.status === 'declined'
                        ? 'bg-red-50 border-red-200'
                        : proposal.status === 'cancelled'
                        ? 'bg-red-50 border-red-200'
                        : isOwn
                        ? 'bg-primary/5 border-primary/30 bg-slate-900/5 border-slate-900/30'
                        : 'bg-secondary/10 border-secondary/30 bg-slate-100/10 border-slate-400/30'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{proposal.fromUserName}</p>
                          <p className="text-xs text-muted-foreground text-slate-600">
                            {proposal.timestamp.toLocaleString('en-US')}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            proposal.status === 'completed'
                              ? 'default'
                              : proposal.status === 'accepted' 
                              ? 'default' 
                              : proposal.status === 'declined'
                              ? 'destructive'
                              : proposal.status === 'cancelled'
                              ? 'destructive'
                              : 'outline'
                          }
                          className={
                            proposal.status === 'completed'
                              ? 'bg-blue-600 text-white'
                              : proposal.status === 'pending'
                              ? 'bg-accent text-accent-foreground border-accent bg-primary text-white border-primary'
                              : proposal.status === 'accepted'
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-700'
                              : proposal.status === 'declined'
                              ? 'bg-red-600 text-white'
                              : proposal.status === 'cancelled'
                              ? 'bg-red-600 text-white'
                              : ''
                          }
                        >
                          {proposal.status === 'completed' && 'Completed'}
                          {(proposal.status === 'pending' || proposal.status === 'waiting') && 'Pending'}
                          {proposal.status === 'accepted' && 'Accepted'}
                          {proposal.status === 'declined' && 'Declined'}
                          {proposal.status === 'cancelled' && 'Cancelled'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary text-slate-900" />
                          <span>{proposal.hours}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary text-slate-900" />
                          <span>
                            {proposal.date && proposal.date !== '' 
                              ? new Date(proposal.date).toLocaleDateString('en-US')
                              : 'Date not specified'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary text-slate-900" />
                          <span>{proposal.time || 'Time not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2 md:col-span-3">
                          <MapPin className="w-4 h-4 text-primary text-slate-900" />
                          <span>{proposal.location}</span>
                        </div>
                      </div>

                      {proposal.notes && (
                        <div className="mt-3 pt-3 border-t border-primary/10">
                          <p className="text-sm text-muted-foreground text-slate-600">{proposal.notes}</p>
                        </div>
                      )}

                      {proposal.responseMessage && (
                        <div className="mt-3 pt-3 border-t border-primary/10">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-medium text-blue-900 mb-1">Response from Provider:</p>
                            <p className="text-sm text-blue-800">{proposal.responseMessage}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Event Confirmation Dialog */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this event? This action cannot be undone.
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
                  'Cancel the Event'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

