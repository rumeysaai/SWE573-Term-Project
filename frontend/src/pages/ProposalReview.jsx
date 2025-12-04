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
  Send,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

export default function ProposalReview() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [hasPostOwnerProposal, setHasPostOwnerProposal] = useState(false);
  const [hasPendingProposal, setHasPendingProposal] = useState(false);
  const [counterOfferData, setCounterOfferData] = useState({
    hours: 2,
    date: '',
    time: '',
    location: '',
    notes: '',
  });
  
  // Location autocomplete states
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

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
        setPost(postResponse.data);

        // Check if post owner has already sent a proposal for this post
        // and if there are any pending proposals for this post
        if (user && postResponse.data.postedBy === user.username) {
          try {
            const proposalsResponse = await api.get('/proposals/', {
              params: { post: proposalData.post_id }
            });
            const proposalsData = Array.isArray(proposalsResponse.data)
              ? proposalsResponse.data
              : (proposalsResponse.data?.results || []);
            
            // Check if post owner has sent any proposal for this post
            const postOwnerProposal = proposalsData.find(
              p => p.sender_id === user.id
            );
            setHasPostOwnerProposal(!!postOwnerProposal);
            
            // Check if there are any pending proposals (waiting status) for this post
            const pendingProposals = proposalsData.filter(
              p => p.status === 'waiting'
            );
            setHasPendingProposal(pendingProposals.length > 0);
          } catch (err) {
            console.error('Error checking post owner proposals:', err);
            // If check fails, assume no proposal exists
            setHasPostOwnerProposal(false);
            setHasPendingProposal(false);
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
  }, [proposalId, user]);

  const handleAccept = async () => {
    if (!proposal) return;

    try {
      setProcessing(true);
      await api.patch(`/proposals/${proposalId}/`, { status: 'accepted' });
      toast.success('Proposal accepted successfully!');
      // Refresh proposal data
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
    } catch (err) {
      console.error('Error accepting proposal:', err);
      toast.error(err.response?.data?.detail || 'Failed to accept proposal');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!proposal) return;

    try {
      setProcessing(true);
      await api.patch(`/proposals/${proposalId}/`, { status: 'declined' });
      toast.success('Proposal declined');
      // Refresh proposal data
      const response = await api.get(`/proposals/${proposalId}/`);
      setProposal(response.data);
    } catch (err) {
      console.error('Error declining proposal:', err);
      toast.error(err.response?.data?.detail || 'Failed to decline proposal');
    } finally {
      setProcessing(false);
    }
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

  // Location autocomplete functions
  const searchLocation = async (query) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLocationLoading(true);
    try {
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
    setCounterOfferData(prev => ({ ...prev, location: value }));
    
    if (locationInput !== value) {
      const timeoutId = setTimeout(() => {
        searchLocation(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleLocationSelect = (suggestion) => {
    setLocationInput(suggestion.display_name);
    setCounterOfferData(prev => ({
      ...prev,
      location: suggestion.display_name,
    }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleCounterOffer = async () => {
    if (!counterOfferData.date) {
      toast.error('Please select a date');
      return;
    }

    try {
      // Combine time, location, and notes into notes field
      let notesText = counterOfferData.notes || '';
      if (counterOfferData.time) {
        notesText = `Time: ${counterOfferData.time}\n${notesText}`.trim();
      }
      if (counterOfferData.location) {
        notesText = `Location: ${counterOfferData.location}\n${notesText}`.trim();
      }

      const proposalPayload = {
        post: proposal.post_id,
        notes: notesText,
        timebank_hour: counterOfferData.hours.toString(),
        status: 'waiting',
        date: counterOfferData.date,
      };

      await api.post('/proposals/', proposalPayload);
      toast.success('Counter offer sent successfully!');
      setShowCounterOffer(false);
      setCounterOfferData({ hours: 2, date: '', time: '', location: '', notes: '' });
      setLocationInput('');
      setHasPostOwnerProposal(true); // Mark that post owner has sent a proposal
      
      // Navigate to negotiation page
      navigate(`/negotiate/${proposal.post_id}`);
    } catch (err) {
      console.error('Error sending counter offer:', err);
      toast.error(err.response?.data?.detail || 'Failed to send counter offer');
    }
  };

  const locationFromNotes = proposal.notes?.split('\n').find(line => line.startsWith('Location:'))?.replace('Location:', '').trim();
  const timeFromNotes = proposal.notes?.split('\n').find(line => line.startsWith('Time:'))?.replace('Time:', '').trim();
  const notesText = proposal.notes?.split('\n').filter(line => !line.startsWith('Location:') && !line.startsWith('Time:')).join('\n').trim();

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
            <h2 className="text-primary text-slate-900 font-normal">Review Proposal</h2>
            <p className="text-muted-foreground text-sm text-slate-600">
              {post.title}
            </p>
          </div>
        </div>

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
                  proposal.status === 'accepted'
                    ? 'default'
                    : proposal.status === 'declined'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {proposal.status === 'accepted'
                  ? 'Accepted'
                  : proposal.status === 'declined'
                  ? 'Declined'
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
                <p className="font-medium">{proposal.sender_username}</p>
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

              {proposal.date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary text-slate-900" />
                  <div>
                    <p className="text-sm text-muted-foreground text-slate-600">Proposed Date</p>
                    <p className="font-medium">
                      {new Date(proposal.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}

              {timeFromNotes && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary text-slate-900" />
                  <div>
                    <p className="text-sm text-muted-foreground text-slate-600">Proposed Time</p>
                    <p className="font-medium">{timeFromNotes}</p>
                  </div>
                </div>
              )}

              {locationFromNotes && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary text-slate-900" />
                  <div>
                    <p className="text-sm text-muted-foreground text-slate-600">Location</p>
                    <p className="font-medium">{locationFromNotes}</p>
                  </div>
                </div>
              )}

              {notesText && (
                <div className="bg-muted/30 p-3 rounded-lg border border-primary/10 bg-slate-50/30">
                  <p className="text-sm text-muted-foreground mb-1 text-slate-600">Additional Notes:</p>
                  <p className="text-sm whitespace-pre-line">{notesText}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {proposal.status === 'waiting' && (
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button
                  onClick={handleAccept}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Proposal
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDecline}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline Proposal
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {proposal.status === 'declined' && !hasPostOwnerProposal && !hasPendingProposal && (
          <Card className="shadow-md border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary text-slate-900">Make Counter Offer</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!showCounterOffer ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-slate-600 mb-4">
                    This proposal has been declined. Would you like to make a counter offer?
                  </p>
                  <Button onClick={() => setShowCounterOffer(true)}>
                    Make Counter Offer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="counter-hours" className="text-primary text-slate-900">Duration (Hours)</Label>
                      <Input
                        id="counter-hours"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={counterOfferData.hours}
                        onChange={(e) => setCounterOfferData({ ...counterOfferData, hours: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="counter-time" className="text-primary text-slate-900">Time</Label>
                      <Input
                        id="counter-time"
                        type="time"
                        value={counterOfferData.time}
                        onChange={(e) => setCounterOfferData({ ...counterOfferData, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="counter-date" className="text-primary text-slate-900">Date</Label>
                    <Input
                      id="counter-date"
                      type="date"
                      value={counterOfferData.date}
                      onChange={(e) => setCounterOfferData({ ...counterOfferData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="counter-location" className="text-primary text-slate-900">Location</Label>
                    <div className="relative">
                      <Input
                        id="counter-location"
                        type="text"
                        placeholder="Type location (e.g., Kadıköy, Beşiktaş...)"
                        value={locationInput}
                        onChange={handleLocationInputChange}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                      />
                      {locationLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      )}
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
                    <Label htmlFor="counter-notes" className="text-primary text-slate-900">Additional Notes</Label>
                    <Textarea
                      id="counter-notes"
                      rows={4}
                      placeholder="Additional details about your counter offer..."
                      value={counterOfferData.notes}
                      onChange={(e) => setCounterOfferData({ ...counterOfferData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={handleCounterOffer}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Counter Offer
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowCounterOffer(false);
                        setCounterOfferData({ hours: 2, date: '', time: '', location: '', notes: '' });
                        setLocationInput('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {proposal.status === 'declined' && (hasPostOwnerProposal || hasPendingProposal) && (
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <p className="text-muted-foreground text-slate-600">
                  {hasPostOwnerProposal 
                    ? 'This proposal has been declined. You have already sent a counter offer.'
                    : 'This proposal has been declined. There is already a pending proposal for this post. Please wait for a response.'}
                </p>
                {hasPostOwnerProposal && (
                  <Button 
                    onClick={() => navigate(`/negotiate/${proposal.post_id}`)}
                    className="mt-4"
                  >
                    View Negotiation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {proposal.status === 'accepted' && (
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <p className="text-muted-foreground text-slate-600">
                  This proposal has been accepted
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

