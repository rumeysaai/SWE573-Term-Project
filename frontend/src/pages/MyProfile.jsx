import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api';
import { useAuth } from '../App';
import { toast } from 'sonner';
import notificationService from '../services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { User, Mail, Phone, MapPin, Save, X, Edit2, Loader2, Award, Shield, Timer, Smile, Clock, TrendingUp, TrendingDown, MessageSquare, Star, Wallet, Leaf, Package, XCircle } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { SimpleTabs, SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent } from '../components/ui/SimpleTabs';
import { useNavigate } from 'react-router-dom';
import TagSelector from '../components/TagSelector';

export default function MyProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [showBalanceHistory, setShowBalanceHistory] = useState(false);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [cancelledJobs, setCancelledJobs] = useState([]);
  const [visibleOfferCount, setVisibleOfferCount] = useState(3);
  const [visibleNeedCount, setVisibleNeedCount] = useState(3);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(3);
  
  // Edit states for each card
  const [editingProfilePhoto, setEditingProfilePhoto] = useState(false);
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [editingAboutMe, setEditingAboutMe] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: '',
    time_balance: 0,
    interested_tags: [],
  });

  // Local edit states for each section
  const [profilePhotoData, setProfilePhotoData] = useState({ avatar: '' });
  const [personalInfoData, setPersonalInfoData] = useState({ firstName: '', lastName: '', email: '', phone: '', location: '' });
  const [aboutMeData, setAboutMeData] = useState({ bio: '', interested_tags: [] });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Location autocomplete states
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // STEP 1: Use time_balance from user context if available (instant, no API call)
        if (user?.profile?.time_balance !== undefined) {
          setFormData(prev => ({
            ...prev,
            time_balance: user.profile.time_balance
          }));
        }
        
        // STEP 2: Fetch full profile data (time_balance already shown from context)
        // Include review_averages for Community Ratings display
        const [profileResponse, postsResponse] = await Promise.all([
          api.get('/users/me/', { params: { include_reviews: 'true' } }),
          user?.username ? api.get('/posts/', { params: { posted_by__username: user.username } }) : Promise.resolve({ data: [] }),
        ]);
        const userData = profileResponse.data;
        const data = {
          username: userData.username || '',
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          phone: userData.profile?.phone || '',
          location: userData.profile?.location || '',
          bio: userData.profile?.bio || '',
          avatar: userData.profile?.avatar || '',
          time_balance: userData.profile?.time_balance || user?.profile?.time_balance || 0,
          interested_tags: userData.profile?.interested_tags || [],
          review_averages: userData.profile?.review_averages || null,
        };
        
        // Set reviews if available
        if (userData.reviews) {
          setReviews(userData.reviews);
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
        const userId = userData.id;
        
        // Fetch all proposals to find completed ones for this user
        const [sentProposalsResponse, receivedProposalsResponse] = await Promise.all([
          api.get(`/proposals/?sent=true&username=${user?.username}`),
          api.get(`/proposals/?received=true&username=${user?.username}`),
        ]);
        
        // Combine all proposals
        const sentProposals = Array.isArray(sentProposalsResponse.data) 
          ? sentProposalsResponse.data 
          : (sentProposalsResponse.data?.results || []);
        const receivedProposals = Array.isArray(receivedProposalsResponse.data) 
          ? receivedProposalsResponse.data 
          : (receivedProposalsResponse.data?.results || []);
        
        const allProposals = [...sentProposals, ...receivedProposals];
        
        // Filter proposals that belong to the current user
        const userProposals = allProposals.filter(proposal => {
          return proposal.requester_id === userId || proposal.provider_id === userId;
        });
        
        // Filter completed proposals
        const completedProposals = userProposals.filter(proposal => {
          if (proposal.status !== 'completed') return false;
          
          const postType = proposal.post_type || proposal.post?.post_type;
          const isProvider = proposal.provider_id === userId;
          const isRequester = proposal.requester_id === userId;
          
          if (postType === 'offer') {
            return isProvider;
          } else if (postType === 'need') {
            return isRequester;
          }
          return false;
        });
        
        // Filter cancelled job proposals
        const cancelledJobProposals = userProposals.filter(proposal => {
          if (!proposal.job_status || proposal.job_status !== 'cancelled') {
            return false;
          }
          
          const postType = proposal.post_type || proposal.post?.post_type;
          const isProvider = proposal.provider_id === userId;
          const isRequester = proposal.requester_id === userId;
          
          if (postType === 'offer') {
            return isRequester;
          } else if (postType === 'need') {
            return isProvider;
          }
          return false;
        });
        
        // Fetch post details for completed proposals
        const completedJobsWithPosts = await Promise.all(
          completedProposals.map(async (proposal) => {
            try {
              const postResponse = await api.get(`/posts/${proposal.post_id || proposal.post?.id}/`);
              return {
                proposalId: proposal.id,
                post: postResponse.data,
                timebank_hour: proposal.timebank_hour,
                proposed_date: proposal.proposed_date,
                updated_at: proposal.updated_at || proposal.updatedAt,
              };
            } catch (err) {
              console.error('Error fetching post for proposal:', err);
              return null;
            }
          })
        );
        
        const validJobs = completedJobsWithPosts.filter(job => job !== null);
        setCompletedJobs(validJobs);
        
        // Fetch post details for cancelled job proposals
        const cancelledJobsWithPosts = await Promise.all(
          cancelledJobProposals.map(async (proposal) => {
            try {
              const postResponse = await api.get(`/posts/${proposal.post_id || proposal.post?.id}/`);
              return {
                proposalId: proposal.id,
                post: postResponse.data,
                timebank_hour: proposal.timebank_hour,
                proposed_date: proposal.proposed_date,
                updated_at: proposal.updated_at || proposal.updatedAt,
                cancelled_by: proposal.job_cancelled_by_username,
                cancellation_reason: proposal.job_cancellation_reason,
                job_status: 'cancelled',
              };
            } catch (err) {
              console.error('Error fetching post for cancelled proposal:', err);
              return null;
            }
          })
        );
        
        const validCancelledJobs = cancelledJobsWithPosts.filter(job => job !== null);
        setCancelledJobs(validCancelledJobs);
        
        console.log('MyProfile: Backend response:', {
          interested_tags_from_backend: data.interested_tags,
          interested_tags_type: typeof data.interested_tags,
          is_array: Array.isArray(data.interested_tags),
          length: data.interested_tags?.length,
          review_averages: data.review_averages,
          review_averages_from_backend: userData.profile?.review_averages,
          profile_data: userData.profile
        });
        
        setFormData(data);
        
        // Update AuthContext user state with latest time_balance so Header.jsx also updates
        if (setUser && userData.profile?.time_balance !== undefined) {
          setUser(prevUser => ({
            ...prevUser,
            profile: {
              ...prevUser?.profile,
              time_balance: userData.profile.time_balance
            }
          }));
        }
        setProfilePhotoData({ avatar: data.avatar });
        setPersonalInfoData({ 
          firstName: data.firstName, 
          lastName: data.lastName, 
          email: data.email, 
          phone: data.phone, 
          location: data.location 
        });
        setLocationInput(data.location || '');
        
        // Convert tag IDs to TagSelector format for display
        // Use tag details from backend if available (optimized - no extra API call)
        let tagSelectorTags = [];
        if (userData.profile?.interested_tags_details && Array.isArray(userData.profile.interested_tags_details) && userData.profile.interested_tags_details.length > 0) {
          // Backend already sent tag details - use them directly (FAST!)
          tagSelectorTags = userData.profile.interested_tags_details.map(tag => ({
            id: tag.id,
            name: tag.name || tag.label,
            label: tag.label || tag.name,
            wikidata_id: tag.wikidata_id,
            description: tag.description,
            is_custom: tag.is_custom
          }));
          console.log('MyProfile: Using tag details from backend (optimized):', tagSelectorTags.length, 'tags');
        } else if (data.interested_tags && Array.isArray(data.interested_tags) && data.interested_tags.length > 0) {
          // Fallback: Fetch tag details if backend didn't send them (shouldn't happen with new code)
          console.log('MyProfile: Fallback - Fetching tag details for', data.interested_tags.length, 'tags');
          try {
            const tagsResponse = await api.get('/tags/');
            let allTagsData = [];
            if (Array.isArray(tagsResponse.data)) {
              allTagsData = tagsResponse.data;
            } else if (tagsResponse.data && typeof tagsResponse.data === 'object') {
              allTagsData = tagsResponse.data.results || [];
            }
            
            // Map tag IDs to TagSelector format
            tagSelectorTags = data.interested_tags.map(tagId => {
              const tag = allTagsData.find(t => {
                const tId = typeof t.id === 'string' ? parseInt(t.id, 10) : t.id;
                const searchId = typeof tagId === 'string' ? parseInt(tagId, 10) : tagId;
                return tId === searchId;
              });
              
              if (tag) {
                return {
                  id: tag.id,
                  name: tag.name || tag.label,
                  label: tag.label || tag.name,
                  wikidata_id: tag.wikidata_id,
                  description: tag.description,
                  is_custom: tag.is_custom
                };
              }
              return null;
            }).filter(Boolean);
          } catch (error) {
            console.error('Error fetching tags for display:', error);
          }
        } else {
          console.log('MyProfile: No interested_tags or empty array');
        }
        
        console.log('MyProfile: Setting aboutMeData with', tagSelectorTags.length, 'tags');
        setAboutMeData({ bio: data.bio, interested_tags: tagSelectorTags });
        console.log('MyProfile: aboutMeData set, should see tags in About Me section');
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Subscribe to time balance updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = notificationService.onTimeBalanceUpdate((timeBalance) => {
      setFormData(prev => ({
        ...prev,
        time_balance: timeBalance
      }));
      
      if (setUser) {
        setUser(prevUser => ({
          ...prevUser,
          profile: {
            ...prevUser?.profile,
            time_balance: timeBalance
          }
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, setUser]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest('.location-suggestions-container')) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (editingPersonalInfo) {
      setLocationInput(personalInfoData.location || '');
      setShowSuggestions(false);
      setLocationSuggestions([]);
    }
  }, [editingPersonalInfo]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarPreview(base64String);
        setProfilePhotoData({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfilePhoto = async () => {
    try {
      setSaving(prev => ({ ...prev, profilePhoto: true }));
      const response = await api.put('/users/me/', {
        avatar: profilePhotoData.avatar,
      });

      // Update user context
      if (response.data) {
        setUser(response.data);
      }

      // Update formData with the new avatar from response or use the uploaded on
      const updatedAvatar = response.data?.profile?.avatar || profilePhotoData.avatar;
      setFormData(prev => ({ ...prev, avatar: updatedAvatar }));
      
      // Clear preview and close edit mode
      setAvatarPreview(null);
      setEditingProfilePhoto(false);
      
      // Refresh profile data to ensure everything is in sync
      const profileResponse = await api.get('/users/me/');
      if (profileResponse.data) {
        const userData = profileResponse.data;
        setFormData(prev => ({
          ...prev,
          avatar: userData.profile?.avatar || updatedAvatar,
        }));
      }
      
      toast.success('Profile photo updated successfully');
    } catch (error) {
      console.error('Error updating profile photo:', error);
      toast.error('Failed to update profile photo');
    } finally {
      setSaving(prev => ({ ...prev, profilePhoto: false }));
    }
  };

  const handleSavePersonalInfo = async () => {
    try {
      setSaving(prev => ({ ...prev, personalInfo: true }));
      const response = await api.put('/users/me/', {
        first_name: personalInfoData.firstName,
        last_name: personalInfoData.lastName,
        email: personalInfoData.email,
        phone: personalInfoData.phone,
        location: personalInfoData.location,
      });

      setUser(response.data);
      setFormData(prev => ({ 
        ...prev, 
        firstName: personalInfoData.firstName,
        lastName: personalInfoData.lastName,
        email: personalInfoData.email,
        phone: personalInfoData.phone,
        location: personalInfoData.location,
      }));
      setEditingPersonalInfo(false);
      toast.success('Personal information updated successfully');
    } catch (error) {
      console.error('Error updating personal info:', error);
      toast.error('Failed to update personal information');
    } finally {
      setSaving(prev => ({ ...prev, personalInfo: false }));
    }
  };

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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=en`
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
    setPersonalInfoData(prev => ({ ...prev, location: value }));
    
    // Debounce için timeout
    const timeoutId = setTimeout(() => {
      searchLocation(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleLocationSelect = (suggestion) => {
    const locationName = suggestion.display_name;
    setLocationInput(locationName);
    setPersonalInfoData(prev => ({ ...prev, location: locationName }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleSaveAboutMe = async () => {
    try {
      setSaving(prev => ({ ...prev, aboutMe: true }));
      
      // Convert TagSelector format to backend format
      const tagsForBackend = aboutMeData.interested_tags.map(tag => {
        // If tag has ID, send as ID or object with id
        if (tag.id) {
          return tag.id; // Backend accepts integer IDs
        }
        // If it's a new custom tag, send as object with name
        return {
          name: tag.name || tag.label,
          label: tag.label || tag.name,
          wikidata_id: tag.wikidata_id,
          description: tag.description,
          is_custom: tag.is_custom || true
        };
      });
      
      const response = await api.put('/users/me/', {
        bio: aboutMeData.bio,
        interested_tags: tagsForBackend,
      });

      // Update user context
      setUser(response.data);
      
      // Update formData with tag IDs from response
      const updatedInterestedTags = response.data?.profile?.interested_tags || [];
      setFormData(prev => ({ 
        ...prev, 
        bio: aboutMeData.bio, 
        interested_tags: updatedInterestedTags,
      }));
      
      // Update aboutMeData with TagSelector format for display
      if (updatedInterestedTags.length > 0) {
        try {
          const tagsResponse = await api.get('/tags/');
          let allTagsData = [];
          if (Array.isArray(tagsResponse.data)) {
            allTagsData = tagsResponse.data;
          } else if (tagsResponse.data && typeof tagsResponse.data === 'object') {
            allTagsData = tagsResponse.data.results || [];
          }
          
          const tagSelectorTags = updatedInterestedTags.map(tagId => {
            const tag = allTagsData.find(t => t.id === tagId);
            if (tag) {
              return {
                id: tag.id,
                name: tag.name || tag.label,
                label: tag.label || tag.name,
                wikidata_id: tag.wikidata_id,
                description: tag.description,
                is_custom: tag.is_custom
              };
            }
            return null;
          }).filter(Boolean);
          
          setAboutMeData(prev => ({ ...prev, interested_tags: tagSelectorTags }));
        } catch (error) {
          console.error('Error refreshing tags after save:', error);
        }
      } else {
        setAboutMeData(prev => ({ ...prev, interested_tags: [] }));
      }
      
      setEditingAboutMe(false);
      toast.success('About me section updated successfully');
    } catch (error) {
      console.error('Error updating about me:', error);
      toast.error('Failed to update about me section');
    } finally {
      setSaving(prev => ({ ...prev, aboutMe: false }));
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setSaving(prev => ({ ...prev, password: true }));
      // TODO: Implement password change API endpoint
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEditingPassword(false);
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setSaving(prev => ({ ...prev, password: false }));
    }
  };


  const fetchBalanceHistory = async () => {
    try {
      setLoadingHistory(true);
      // Use optimized endpoint that fetches both sent and received proposals in a single call
      const response = await api.get('/proposals/for-approval/', {
        params: { page_size: 200 } // Get more proposals for history
      });

      // Handle paginated response
      const allProposals = response.data.results || [];

      // Remove duplicates by ID
      const uniqueProposals = Array.from(
        new Map(allProposals.map(p => [p.id, p])).values()
      );

      // Build history from proposals
      const history = [];
      
      uniqueProposals.forEach(proposal => {
        const isRequester = proposal.requester_id === user?.id || proposal.requester_username === user?.username;
        const isProvider = proposal.provider_id === user?.id || proposal.provider_username === user?.username;
        const postType = proposal.post_type || proposal.post?.post_type;

        // Accepted proposals: Balance deduction
        if (proposal.status === 'accepted') {
          let amount = 0;
          let description = '';

          if (postType === 'offer' && isRequester) {
            // Offer: requester pays
            amount = -parseFloat(proposal.timebank_hour);
            description = `Accepted proposal for "${proposal.post_title || 'Post'}" (Offer)`;
          } else if (postType === 'need' && isProvider) {
            // Need: provider pays
            amount = -parseFloat(proposal.timebank_hour);
            description = `Accepted proposal for "${proposal.post_title || 'Post'}" (Need)`;
          }

          if (amount !== 0) {
            history.push({
              id: `accepted-${proposal.id}`,
              type: 'deduction',
              amount: Math.abs(amount),
              description,
              date: proposal.updated_at || proposal.created_at,
              proposalId: proposal.id,
            });
          }
        }

        // Completed proposals: Balance addition (for earners) and deduction (for payers)
        if (proposal.status === 'completed') {
          // Add deduction record for payers (if they haven't already been recorded as accepted)
          if (postType === 'offer' && isRequester) {
            // Offer: requester paid (deduction)
            history.push({
              id: `completed-deduction-${proposal.id}`,
              type: 'deduction',
              amount: parseFloat(proposal.timebank_hour),
              description: `Paid for service "${proposal.post_title || 'Post'}" (Offer)`,
              date: proposal.updated_at || proposal.created_at,
              proposalId: proposal.id,
            });
          } else if (postType === 'need' && isProvider) {
            // Need: provider paid (deduction)
            history.push({
              id: `completed-deduction-${proposal.id}`,
              type: 'deduction',
              amount: parseFloat(proposal.timebank_hour),
              description: `Paid for service "${proposal.post_title || 'Post'}" (Need)`,
              date: proposal.updated_at || proposal.created_at,
              proposalId: proposal.id,
            });
          }

          // Add addition record for earners
          if (postType === 'offer' && isProvider) {
            // Offer: provider receives
            history.push({
              id: `completed-addition-${proposal.id}`,
              type: 'addition',
              amount: parseFloat(proposal.timebank_hour),
              description: `Completed "${proposal.post_title || 'Post'}" (Offer)`,
              date: proposal.updated_at || proposal.created_at,
              proposalId: proposal.id,
            });
          } else if (postType === 'need' && isRequester) {
            // Need: requester receives
            history.push({
              id: `completed-addition-${proposal.id}`,
              type: 'addition',
              amount: parseFloat(proposal.timebank_hour),
              description: `Completed "${proposal.post_title || 'Post'}" (Need)`,
              date: proposal.updated_at || proposal.created_at,
              proposalId: proposal.id,
            });
          }
        }

        // Cancelled proposals (if was previously accepted): Balance refund
        if (proposal.status === 'cancelled') {
          let amount = 0;
          let description = '';

          if (postType === 'offer' && isRequester) {
            // Offer: refund to requester
            amount = parseFloat(proposal.timebank_hour);
            description = `Cancelled proposal for "${proposal.post_title || 'Post'}" (Offer - Refund)`;
          } else if (postType === 'need' && isProvider) {
            // Need: refund to provider
            amount = parseFloat(proposal.timebank_hour);
            description = `Cancelled proposal for "${proposal.post_title || 'Post'}" (Need - Refund)`;
          }

          if (amount !== 0) {
            history.push({
              id: `cancelled-${proposal.id}`,
              type: 'refund',
              amount,
              description,
              date: proposal.updated_at || proposal.created_at,
              proposalId: proposal.id,
            });
          }
        }

        // Cancelled jobs (proposal status is accepted but job is cancelled): Balance refund or transfer
        if (proposal.job_status === 'cancelled') {
          const cancelledBy = proposal.job_cancelled_by_username;
          const cancellationReason = proposal.job_cancellation_reason;
          
          // Debug log
          console.log('Cancelled job proposal:', {
            id: proposal.id,
            job_status: proposal.job_status,
            cancellation_reason: cancellationReason,
            post_type: postType,
            isProvider,
            isRequester,
            provider_id: proposal.provider_id,
            requester_id: proposal.requester_id,
            user_id: user?.id
          });

          // Handle "not_showed_up" - transfer to other party
          if (cancellationReason === 'not_showed_up') {
            let amount = 0;
            let description = '';

            if (postType === 'offer' && isProvider) {
              // Offer: transfer to provider (post owner) when requester didn't show up
              amount = parseFloat(proposal.timebank_hour);
              description = `Cancelled job for "${proposal.post_title || 'Post'}" (Offer - Transfer) - Not Showed Up`;
              if (cancelledBy) {
                description += ` by ${cancelledBy}`;
              }
            } else if (postType === 'need' && isRequester) {
              // Need: transfer to requester when provider didn't show up
              amount = parseFloat(proposal.timebank_hour);
              description = `Cancelled job for "${proposal.post_title || 'Post'}" (Need - Transfer) - Not Showed Up`;
              if (cancelledBy) {
                description += ` by ${cancelledBy}`;
              }
            }

            if (amount !== 0) {
              history.push({
                id: `cancelled-job-transfer-${proposal.id}`,
                type: 'addition', // Transfer is an addition for the receiver
                amount,
                description,
                date: proposal.updated_at || proposal.created_at,
                proposalId: proposal.id,
              });
            }
          } else {
            // Handle "other" - refund to original payer
            let amount = 0;
            let description = '';

            if (postType === 'offer' && isRequester) {
              // Offer: refund to requester
              amount = parseFloat(proposal.timebank_hour);
              description = `Cancelled job for "${proposal.post_title || 'Post'}" (Offer - Refund)`;
              if (cancelledBy) {
                description += ` - Cancelled by ${cancelledBy}`;
              }
            } else if (postType === 'need' && isProvider) {
              // Need: refund to provider
              amount = parseFloat(proposal.timebank_hour);
              description = `Cancelled job for "${proposal.post_title || 'Post'}" (Need - Refund)`;
              if (cancelledBy) {
                description += ` - Cancelled by ${cancelledBy}`;
              }
            }

            if (amount !== 0) {
              history.push({
                id: `cancelled-job-${proposal.id}`,
                type: 'refund',
                amount,
                description,
                date: proposal.updated_at || proposal.created_at,
                proposalId: proposal.id,
              });
            }
          }
        }
      });

      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Debug logs
      console.log('Balance history calculation:', {
        totalProposals: uniqueProposals.length,
        historyItems: history.length,
        history: history,
        proposals: uniqueProposals.map(p => ({
          id: p.id,
          status: p.status,
          job_status: p.job_status,
          post_type: p.post_type || p.post?.post_type,
          requester_id: p.requester_id,
          provider_id: p.provider_id,
          timebank_hour: p.timebank_hour,
          post_title: p.post_title || p.post?.title,
        }))
      });

      setBalanceHistory(history);
    } catch (error) {
      console.error('Error fetching balance history:', error);
      toast.error('Failed to load balance history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBalanceCardClick = () => {
    setShowBalanceHistory(true);
    fetchBalanceHistory();
  };

  // Calculate TimeBank statistics
  const [timeBankStats, setTimeBankStats] = useState({ earned: 0, spent: 0, pending: 0 });
  
  useEffect(() => {
    const calculateStats = async () => {
      try {
        // Fetch all proposals
        const [sentResponse, receivedResponse] = await Promise.all([
          api.get('/proposals/?sent=true'),
          api.get('/proposals/?received=true'),
        ]);

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

        let earned = 0;
        let spent = 0;
        let pending = 0;

        uniqueProposals.forEach(proposal => {
          const isRequester = proposal.requester_id === user?.id || proposal.requester_username === formData.username;
          const isProvider = proposal.provider_id === user?.id || proposal.provider_username === formData.username;
          const postType = proposal.post_type || proposal.post?.post_type;
          const amount = parseFloat(proposal.timebank_hour) || 0;

          if (proposal.status === 'completed') {
            if (postType === 'offer' && isProvider) {
              earned += amount;
            } else if (postType === 'need' && isRequester) {
              earned += amount;
            }
          }

          if (proposal.status === 'completed' && proposal.job_status !== 'cancelled') {
            if (postType === 'offer' && isRequester) {
              spent += amount;
            } else if (postType === 'need' && isProvider) {
              spent += amount;
            }
          }

          if (proposal.status === 'accepted' && proposal.job_status !== 'cancelled' && proposal.status !== 'completed') {
            if (postType === 'offer' && isRequester) {
              pending += amount;
            } else if (postType === 'need' && isProvider) {
              pending += amount;
            }
          }
        });

        setTimeBankStats({ earned, spent, pending });
      } catch (error) {
        console.error('Error calculating TimeBank stats:', error);
      }
    };

    if (user && formData.username) {
      calculateStats();
    }
  }, [user, formData.username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl">My Profile Settings</h1>
            <p className="text-slate-600 mt-1">
              View and edit your personal information
            </p>
          </div>
        </div>

        {/* TimeBank Wallet Card */}
        <Card 
          className="p-6 bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/10 border-primary/30 cursor-pointer hover:shadow-xl transition-all overflow-hidden relative"
          onClick={handleBalanceCardClick}
        >
          {/* Wallet Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary rounded-full -ml-24 -mb-24"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/50 rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">TimeBank Wallet</h2>
                  <p className="text-sm text-slate-600">Your time credits - Click to view history</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary">{formData.time_balance.toFixed(2)}</p>
                <p className="text-sm text-slate-600 font-medium">hours</p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/20 hover:bg-white transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-medium text-slate-600">Provided</p>
                </div>
                <p className="text-2xl font-bold text-green-600">+{timeBankStats.earned.toFixed(2)}</p>
                <p className="text-xs text-slate-500">hours</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/20 hover:bg-white transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="text-xs font-medium text-slate-600">Received</p>
                </div>
                <p className="text-2xl font-bold text-red-600">-{timeBankStats.spent.toFixed(2)}</p>
                <p className="text-xs text-slate-500">hours</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/20 hover:bg-white transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <p className="text-xs font-medium text-slate-700">Pending</p>
                </div>
                <p className="text-2xl font-bold text-slate-700">-{timeBankStats.pending.toFixed(2)}</p>
                <p className="text-xs text-slate-500">hours</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Photo Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Profile Photo</h2>
            {!editingProfilePhoto ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setProfilePhotoData({ avatar: formData.avatar });
                  setAvatarPreview(null);
                  setEditingProfilePhoto(true);
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingProfilePhoto(false);
                    setProfilePhotoData({ avatar: formData.avatar });
                    setAvatarPreview(null);
                  }}
                  disabled={saving.profilePhoto}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveProfilePhoto}
                  disabled={saving.profilePhoto || !profilePhotoData.avatar}
                >
                  {saving.profilePhoto ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
          <Separator className="mb-6" />
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Left Side: Profile Photo and Info */}
            <div className="flex flex-col items-center lg:items-start gap-4 flex-1">
              <div className="w-40 h-40 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                {(avatarPreview || formData.avatar) ? (
                  <img 
                    src={avatarPreview || formData.avatar} 
                    alt={formData.username} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-20 h-20 text-primary" />
                )}
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold mb-1">{formData.username}</h3>
                <p className="text-slate-600 text-sm">Community Member</p>
              </div>
              {editingProfilePhoto && (
                <div className="w-full mt-4 space-y-3">
                  <div>
                    <Label htmlFor="avatar-upload" className="mb-2 block">Upload Photo</Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: JPG, PNG, GIF (Max 5MB)
                    </p>
                  </div>
                  <div className="relative">
                    <Label className="mb-2 block">Or Enter URL</Label>
                    <Input
                      type="url"
                      value={profilePhotoData.avatar && !profilePhotoData.avatar.startsWith('data:') ? profilePhotoData.avatar : ''}
                      onChange={(e) => {
                        setProfilePhotoData({ avatar: e.target.value });
                        setAvatarPreview(null);
                      }}
                      placeholder="Profile photo URL"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Community Ratings */}
            <div className="w-full lg:w-auto lg:min-w-[320px] space-y-3 bg-gradient-to-r from-primary/5 to-secondary/10 p-4 rounded-xl border border-primary/20 flex flex-col">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-primary text-sm font-semibold">
                  <Award className="w-4 h-4" />
                  Community Ratings
                </h4>
                {/* {formData.review_averages?.total_reviews > 0 && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Star className="w-3 h-3 fill-primary" />
                    <span>{formData.review_averages.overall.toFixed(1)}/5</span>
                    <span className="text-muted-foreground">({formData.review_averages.total_reviews})</span>
                  </div>
                )} */}
              </div>
              {formData.review_averages && formData.review_averages.total_reviews && formData.review_averages.total_reviews > 0 ? (
                <div className="space-y-3">
                  {/* Overall Rating - Larger */}
                  <div className="space-y-3 text-center pb-3 border-b border-primary/20">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {formData.review_averages.overall?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-2xl font-bold text-primary">/5</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.round(formData.review_averages.overall || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Based on {formData.review_averages.total_reviews} {formData.review_averages.total_reviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                  {/* Friendliness */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Smile className="w-3 h-3 text-primary" />
                        Friendliness
                      </Label>
                      <span className="text-xs text-primary">
                        {(formData.review_averages.friendliness || 0).toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={((formData.review_averages.friendliness || 0) / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Time Management */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Timer className="w-3 h-3 text-primary" />
                        Time Management
                      </Label>
                      <span className="text-xs text-primary">
                        {(formData.review_averages.time_management || 0).toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={((formData.review_averages.time_management || 0) / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Reliability */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Shield className="w-3 h-3 text-primary" />
                        Reliability
                      </Label>
                      <span className="text-xs text-primary">
                        {(formData.review_averages.reliability || 0).toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={((formData.review_averages.reliability || 0) / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Communication */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <MessageSquare className="w-3 h-3 text-primary" />
                        Communication
                      </Label>
                      <span className="text-xs text-primary">
                        {(formData.review_averages.communication || 0).toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={((formData.review_averages.communication || 0) / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Work Quality */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Award className="w-3 h-3 text-primary" />
                        Work Quality
                      </Label>
                      <span className="text-xs text-primary">
                        {(formData.review_averages.work_quality || 0).toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={((formData.review_averages.work_quality || 0) / 5) * 100} className="h-1.5" />
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
        </Card>

        {/* Personal Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Personal Information</h2>
            {!editingPersonalInfo ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPersonalInfoData({ 
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email, 
                    phone: formData.phone, 
                    location: formData.location 
                  });
                  setEditingPersonalInfo(true);
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingPersonalInfo(false);
                    setPersonalInfoData({ 
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      email: formData.email, 
                      phone: formData.phone, 
                      location: formData.location 
                    });
                  }}
                  disabled={saving.personalInfo}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSavePersonalInfo}
                  disabled={saving.personalInfo}
                >
                  {saving.personalInfo ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
          <Separator className="mb-6" />
          
          <div className="space-y-6">
            {/* Username */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <Label className="flex items-center gap-2 md:pt-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Username
              </Label>
              <div className="md:col-span-2">
                <p className="py-2">{formData.username}</p>
                <p className="text-sm text-slate-500">Username cannot be changed</p>
              </div>
            </div>

            {/* First Name and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <Label className="flex items-center gap-2 md:pt-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Name
              </Label>
              <div className="md:col-span-2">
                {editingPersonalInfo ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={personalInfoData.firstName}
                        onChange={(e) => setPersonalInfoData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={personalInfoData.lastName}
                        onChange={(e) => setPersonalInfoData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="py-2">
                    {formData.firstName || formData.lastName 
                      ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
                      : 'Not specified'}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <Label className="flex items-center gap-2 md:pt-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </Label>
              <div className="md:col-span-2">
                {editingPersonalInfo ? (
                  <Input
                    type="email"
                    value={personalInfoData.email}
                    onChange={(e) => setPersonalInfoData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                  />
                ) : (
                  <p className="py-2">{formData.email || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <Label className="flex items-center gap-2 md:pt-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone
              </Label>
              <div className="md:col-span-2">
                {editingPersonalInfo ? (
                  <Input
                    type="tel"
                    value={personalInfoData.phone}
                    onChange={(e) => setPersonalInfoData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="py-2">{formData.phone || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <Label className="flex items-center gap-2 md:pt-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Location
              </Label>
              <div className="md:col-span-2">
                {editingPersonalInfo ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
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
                          // Delay to allow click on suggestion
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        className="h-10 text-sm border-primary/20"
                      />
                      {locationLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
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
                ) : (
                  <p className="py-2">{formData.location || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* About Me */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">About Me</h2>
            {!editingAboutMe ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  // Load tag details when entering edit mode
                  let tagSelectorTags = [];
                  if (formData.interested_tags && Array.isArray(formData.interested_tags) && formData.interested_tags.length > 0) {
                    try {
                      const tagsResponse = await api.get('/tags/');
                      let allTagsData = [];
                      if (Array.isArray(tagsResponse.data)) {
                        allTagsData = tagsResponse.data;
                      } else if (tagsResponse.data && typeof tagsResponse.data === 'object') {
                        allTagsData = tagsResponse.data.results || [];
                      }
                      
                      tagSelectorTags = formData.interested_tags.map(tagId => {
                        const tag = allTagsData.find(t => t.id === tagId);
                        if (tag) {
                          return {
                            id: tag.id,
                            name: tag.name || tag.label,
                            label: tag.label || tag.name,
                            wikidata_id: tag.wikidata_id,
                            description: tag.description,
                            is_custom: tag.is_custom
                          };
                        }
                        return null;
                      }).filter(Boolean);
                    } catch (error) {
                      console.error('Error loading tags for edit:', error);
                    }
                  }
                  
                  setAboutMeData({ 
                    bio: formData.bio, 
                    interested_tags: tagSelectorTags
                  });
                  setEditingAboutMe(true);
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    // Reload tag details when canceling
                    let tagSelectorTags = [];
                    if (formData.interested_tags && Array.isArray(formData.interested_tags) && formData.interested_tags.length > 0) {
                      try {
                        const tagsResponse = await api.get('/tags/');
                        let allTagsData = [];
                        if (Array.isArray(tagsResponse.data)) {
                          allTagsData = tagsResponse.data;
                        } else if (tagsResponse.data && typeof tagsResponse.data === 'object') {
                          allTagsData = tagsResponse.data.results || [];
                        }
                        
                        tagSelectorTags = formData.interested_tags.map(tagId => {
                          // Handle both number and string IDs
                          const tag = allTagsData.find(t => {
                            const tId = typeof t.id === 'string' ? parseInt(t.id, 10) : t.id;
                            const searchId = typeof tagId === 'string' ? parseInt(tagId, 10) : tagId;
                            return tId === searchId;
                          });
                          if (tag) {
                            return {
                              id: tag.id,
                              name: tag.name || tag.label,
                              label: tag.label || tag.name,
                              wikidata_id: tag.wikidata_id,
                              description: tag.description,
                              is_custom: tag.is_custom
                            };
                          }
                          console.warn('Tag not found for ID:', tagId);
                          return null;
                        }).filter(Boolean);
                      } catch (error) {
                        console.error('Error loading tags for cancel:', error);
                      }
                    }
                    
                    setEditingAboutMe(false);
                    setAboutMeData({ 
                      bio: formData.bio, 
                      interested_tags: tagSelectorTags
                    });
                  }}
                  disabled={saving.aboutMe}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveAboutMe}
                  disabled={saving.aboutMe}
                >
                  {saving.aboutMe ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
          <Separator className="mb-6" />
          
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <Label className="mb-2 block">Biography</Label>
              {editingAboutMe ? (
                <Textarea
                  value={aboutMeData.bio}
                  onChange={(e) => setAboutMeData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <p className="text-slate-700 leading-relaxed">{formData.bio || 'No biography added yet'}</p>
              )}
            </div>

            {/* Interests (Tags) */}
            <div>
              <Label className="mb-2 block">Interests</Label>
              
              {editingAboutMe ? (
                <div>
                  <TagSelector
                    value={aboutMeData.interested_tags || []}
                    onChange={(tags) => {
                      console.log('MyProfile: TagSelector onChange called with', tags?.length || 0, 'tags');
                      setAboutMeData(prev => ({
                        ...prev,
                        interested_tags: tags || []
                      }));
                    }}
                    placeholder="Search and select your interests..."
                    isMulti={true}
                    showAllTagsOnOpen={true}
                  />
                  {aboutMeData.interested_tags && aboutMeData.interested_tags.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {aboutMeData.interested_tags.length} tag(s) selected
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    console.log('MyProfile: Rendering tags display. aboutMeData.interested_tags:', aboutMeData.interested_tags);
                    if (aboutMeData.interested_tags && Array.isArray(aboutMeData.interested_tags) && aboutMeData.interested_tags.length > 0) {
                      return aboutMeData.interested_tags.map((tag, index) => {
                        console.log('MyProfile: Rendering tag:', tag);
                        return (
                          <Badge 
                            key={tag.id || index} 
                            variant="secondary"
                            className="bg-secondary/20 text-foreground px-3 py-1"
                          >
                            {tag.name || tag.label || `Tag ${tag.id}`}
                          </Badge>
                        );
                      });
                    } else {
                      console.log('MyProfile: No tags to display');
                      return <p className="text-slate-500 text-sm">No interests added yet</p>;
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Password Change */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Security</h2>
            {!editingPassword ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setEditingPassword(true);
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingPassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={saving.password}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSavePassword}
                  disabled={saving.password}
                >
                  {saving.password ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
          <Separator className="mb-6" />
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Fill in the information below to change your password
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter your current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  disabled={!editingPassword}
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  disabled={!editingPassword}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={!editingPassword}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Contributions to The Hive */}
        {(() => {
          const offerPosts = userPosts.filter(post => post.type === 'offer');
          const needPosts = userPosts.filter(post => post.type === 'need');
          
          return (
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
                          <p className="text-xs mt-1">You haven't received any reviews yet.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      reviews.map((review) => (
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
                      ))
                    )}
                  </SimpleTabsContent>
                </SimpleTabs>
              </CardContent>
            </Card>
          );
        })()}

        {/* Balance History Dialog */}
        <Dialog open={showBalanceHistory} onOpenChange={setShowBalanceHistory}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">TimeBank Balance History</DialogTitle>
              <DialogDescription>
                View all your timebank balance transactions and changes
              </DialogDescription>
            </DialogHeader>
            
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : balanceHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>No balance history found</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {balanceHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.type === 'deduction' 
                        ? 'bg-red-100 text-red-600' 
                        : item.type === 'refund'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {item.type === 'deduction' ? (
                        <TrendingDown className="w-5 h-5" />
                      ) : (
                        <TrendingUp className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className={`text-right flex-shrink-0 ${
                      item.type === 'deduction' 
                        ? 'text-red-600' 
                        : item.type === 'refund'
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`}>
                      <p className={`font-bold text-lg ${
                        item.type === 'deduction' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.type === 'deduction' ? '-' : '+'}{item.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">hours</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
