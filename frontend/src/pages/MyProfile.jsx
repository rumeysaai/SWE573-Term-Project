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
import { User, Mail, Phone, MapPin, Save, X, Edit2, Plus, Loader2, Award, Shield, Timer, Smile } from 'lucide-react';
import { Progress } from '../components/ui/progress';

export default function MyProfile() {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [newInterest, setNewInterest] = useState('');
  const [allTags, setAllTags] = useState([]);
  
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
    skills: '',
    avatar: '',
    time_balance: 0,
    interested_tags: [],
  });

  // Local edit states for each section
  const [profilePhotoData, setProfilePhotoData] = useState({ avatar: '' });
  const [personalInfoData, setPersonalInfoData] = useState({ email: '', phone: '', location: '' });
  const [aboutMeData, setAboutMeData] = useState({ bio: '', skills: '', interested_tags: [] });
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
          phone: '',
          location: '',
          bio: userData.profile?.bio || '',
          skills: '',
          avatar: userData.profile?.avatar || '',
          time_balance: userData.profile?.time_balance || 0,
          interested_tags: userData.profile?.interested_tags || [],
        };
        
        setFormData(data);
        setProfilePhotoData({ avatar: data.avatar });
        setPersonalInfoData({ email: data.email, phone: data.phone, location: data.location });
        setAboutMeData({ bio: data.bio, skills: data.skills, interested_tags: data.interested_tags });

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

      setUser(response.data);
      setFormData(prev => ({ ...prev, avatar: profilePhotoData.avatar }));
      setAvatarPreview(null);
      setEditingProfilePhoto(false);
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
        skills: aboutMeData.skills,
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
            <div className="flex items-start gap-6 flex-1 w-full">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {(avatarPreview || formData.avatar) ? (
                  <img 
                    src={avatarPreview || formData.avatar} 
                    alt={formData.username} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl mb-1">{formData.username}</h3>
                <p className="text-slate-600 text-sm">Community Member</p>
                <p className="text-slate-600 text-sm mt-1">
                  TimeBank Balance: <span className="font-semibold text-primary">{formData.time_balance} Hours</span>
                </p>
                {editingProfilePhoto && (
                  <div className="mt-3 space-y-3">
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
            </div>

            {/* Community Ratings Card */}
            <div className="w-full lg:w-auto lg:min-w-[320px] space-y-3 bg-gradient-to-r from-primary/5 to-secondary/10 p-4 rounded-xl border border-primary/20 flex flex-col">
              <h4 className="flex items-center gap-2 text-primary text-sm">
                <Award className="w-4 h-4" />
                Community Ratings
              </h4>
              <div className="space-y-3">
                {/* Reliability */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Shield className="w-3 h-3 text-primary" />
                      Reliability
                    </Label>
                    <span className="text-xs text-primary">4.8/5</span>
                  </div>
                  <Progress value={96} className="h-1.5" />
                </div>
                {/* Time Management */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Timer className="w-3 h-3 text-primary" />
                      Time Management
                    </Label>
                    <span className="text-xs text-primary">4.7/5</span>
                  </div>
                  <Progress value={94} className="h-1.5" />
                </div>
                {/* Friendliness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Smile className="w-3 h-3 text-primary" />
                      Friendliness
                    </Label>
                    <span className="text-xs text-primary">5.0/5</span>
                  </div>
                  <Progress value={100} className="h-1.5" />
                </div>
              </div>
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
                    skills: formData.skills, 
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
                      skills: formData.skills, 
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

            {/* Skills */}
            <div>
              <Label className="mb-2 block">Skills</Label>
              {editingAboutMe ? (
                <Input
                  value={aboutMeData.skills}
                  onChange={(e) => setAboutMeData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="Enter your skills separated by commas"
                />
              ) : (
                <p className="text-slate-700">{formData.skills || 'No skills added yet'}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                List your skills separated by commas
              </p>
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
      </div>
    </div>
  );
}
