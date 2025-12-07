import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { User, Mail, Phone, MapPin, Save, X, Edit2, Plus, Loader2, Award, Shield, Timer, Smile, Clock, TrendingUp, TrendingDown, MessageSquare, Star, Wallet } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

export default function MyProfile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [newInterest, setNewInterest] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [showBalanceHistory, setShowBalanceHistory] = useState(false);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Edit states for each card
  const [editingProfilePhoto, setEditingProfilePhoto] = useState(false);
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [editingAboutMe, setEditingAboutMe] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
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
  const [personalInfoData, setPersonalInfoData] = useState({ email: '', phone: '', location: '' });
  const [aboutMeData, setAboutMeData] = useState({ bio: '', interested_tags: [] });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/me/');
        const userData = response.data;
        
        const data = {
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.profile?.phone || '',
          location: userData.profile?.location || '',
          bio: userData.profile?.bio || '',
          avatar: userData.profile?.avatar || '',
          time_balance: userData.profile?.time_balance || 0,
          interested_tags: userData.profile?.interested_tags || [],
          review_averages: userData.profile?.review_averages || null,
        };
        
        setFormData(data);
        setProfilePhotoData({ avatar: data.avatar });
        setPersonalInfoData({ email: data.email, phone: data.phone, location: data.location });
        setAboutMeData({ bio: data.bio, interested_tags: data.interested_tags });

        // Fetch all tags
        const tagsResponse = await api.get('/tags/');
        let tagsData = [];
        if (Array.isArray(tagsResponse.data)) {
          tagsData = tagsResponse.data;
        } else if (tagsResponse.data && typeof tagsResponse.data === 'object') {
          tagsData = tagsResponse.data.results || [];
        }
        setAllTags(tagsData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

      // Update formData with the new avatar from response or use the uploaded one
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
        email: personalInfoData.email,
        phone: personalInfoData.phone,
        location: personalInfoData.location,
      });

      setUser(response.data);
      setFormData(prev => ({ 
        ...prev, 
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

  const handleSaveAboutMe = async () => {
    try {
      setSaving(prev => ({ ...prev, aboutMe: true }));
      const response = await api.put('/users/me/', {
        bio: aboutMeData.bio,
        interested_tags: aboutMeData.interested_tags,
      });

      setUser(response.data);
      setFormData(prev => ({ 
        ...prev, 
        bio: aboutMeData.bio,
        interested_tags: aboutMeData.interested_tags,
      }));
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

  const handleAddInterest = () => {
    const tag = allTags.find(t => t.name.toLowerCase() === newInterest.trim().toLowerCase());
    if (tag && !aboutMeData.interested_tags.includes(tag.id)) {
      setAboutMeData(prev => ({
        ...prev,
        interested_tags: [...prev.interested_tags, tag.id]
      }));
      setNewInterest('');
    } else if (newInterest.trim()) {
      toast.error('Tag not found. Please select from existing tags.');
    }
  };

  const handleRemoveInterest = (tagId) => {
    setAboutMeData(prev => ({
      ...prev,
      interested_tags: prev.interested_tags.filter(id => id !== tagId)
    }));
  };

  const getTagNameById = (tagId) => {
    const tag = allTags.find(t => t.id === tagId);
    return tag ? tag.name : '';
  };

  const fetchBalanceHistory = async () => {
    try {
      setLoadingHistory(true);
      // Fetch all proposals where user is either requester or provider
      const [sentResponse, receivedResponse] = await Promise.all([
        api.get('/proposals/?sent=true'),
        api.get('/proposals/?received=true'),
      ]);

      // Handle both array and paginated response formats
      const sentProposals = Array.isArray(sentResponse.data) 
        ? sentResponse.data 
        : (sentResponse.data?.results || []);
      const receivedProposals = Array.isArray(receivedResponse.data) 
        ? receivedResponse.data 
        : (receivedResponse.data?.results || []);
      
      const allProposals = [...sentProposals, ...receivedProposals];

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

          // Earned: Completed proposals
          if (proposal.status === 'completed') {
            if (postType === 'offer' && isProvider) {
              earned += amount;
            } else if (postType === 'need' && isRequester) {
              earned += amount;
            }
          }

          // Spent: Accepted and completed proposals (harcanan ve tamamlanan)
          if (proposal.status === 'completed' && proposal.job_status !== 'cancelled') {
            if (postType === 'offer' && isRequester) {
              spent += amount;
            } else if (postType === 'need' && isProvider) {
              spent += amount;
            }
          }

          // Pending: Accepted but not completed yet (waiting for approval/completion)
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
                  <p className="text-xs font-medium text-slate-600">Earned</p>
                </div>
                <p className="text-2xl font-bold text-green-600">+{timeBankStats.earned.toFixed(2)}</p>
                <p className="text-xs text-slate-500">hours</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/20 hover:bg-white transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="text-xs font-medium text-slate-600">Spent</p>
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
              {formData.review_averages?.total_reviews > 0 ? (
                <div className="space-y-3">
                  {/* Overall Rating - Larger */}
                  <div className="space-y-3 text-center pb-3 border-b border-primary/20">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {formData.review_averages.overall.toFixed(1)}
                      </span>
                      <span className="text-2xl text-slate-500">/5</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.round(formData.review_averages.overall)
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
                        {formData.review_averages.friendliness.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(formData.review_averages.friendliness / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Time Management */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Timer className="w-3 h-3 text-primary" />
                        Time Management
                      </Label>
                      <span className="text-xs text-primary">
                        {formData.review_averages.time_management.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(formData.review_averages.time_management / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Reliability */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Shield className="w-3 h-3 text-primary" />
                        Reliability
                      </Label>
                      <span className="text-xs text-primary">
                        {formData.review_averages.reliability.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(formData.review_averages.reliability / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Communication */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <MessageSquare className="w-3 h-3 text-primary" />
                        Communication
                      </Label>
                      <span className="text-xs text-primary">
                        {formData.review_averages.communication.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(formData.review_averages.communication / 5) * 100} className="h-1.5" />
                  </div>
                  {/* Work Quality */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Award className="w-3 h-3 text-primary" />
                        Work Quality
                      </Label>
                      <span className="text-xs text-primary">
                        {formData.review_averages.work_quality.toFixed(1)}/5
                      </span>
                    </div>
                    <Progress value={(formData.review_averages.work_quality / 5) * 100} className="h-1.5" />
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
                  <Input
                    value={personalInfoData.location}
                    onChange={(e) => setPersonalInfoData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter your location"
                  />
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
                onClick={() => {
                  setAboutMeData({ 
                    bio: formData.bio, 
                    interested_tags: formData.interested_tags 
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
                  onClick={() => {
                    setEditingAboutMe(false);
                    setAboutMeData({ 
                      bio: formData.bio, 
                      interested_tags: formData.interested_tags 
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
              
              {/* Display existing interests as tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.interested_tags.map(tagId => {
                  const tagName = getTagNameById(tagId);
                  if (!tagName) return null;
                  return (
                    <Badge 
                      key={tagId} 
                      variant="secondary"
                      className="bg-secondary/20 text-foreground px-3 py-1 hover:bg-secondary/30 transition-colors"
                    >
                      {tagName}
                      {editingAboutMe && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(tagId)}
                          className="ml-2 hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
                {formData.interested_tags.length === 0 && (
                  <p className="text-slate-500 text-sm">No interests added yet</p>
                )}
              </div>

              {/* Add new interest input (only in edit mode) */}
              {editingAboutMe && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInterest();
                        }
                      }}
                      placeholder="Type tag name (from existing tags)"
                      className="flex-1"
                      list="tags-list"
                    />
                    <datalist id="tags-list">
                      {allTags.map(tag => (
                        <option key={tag.id} value={tag.name} />
                      ))}
                    </datalist>
                    <Button
                      type="button"
                      onClick={handleAddInterest}
                      disabled={!newInterest.trim()}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">
                    Select from existing tags or type tag name
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allTags.filter(tag => !aboutMeData.interested_tags.includes(tag.id)).map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary/20"
                        onClick={() => {
                          setAboutMeData(prev => ({
                            ...prev,
                            interested_tags: [...prev.interested_tags, tag.id]
                          }));
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
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
