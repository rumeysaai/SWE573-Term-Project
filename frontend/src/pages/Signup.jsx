// src/pages/SignupPage.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api'; 
import { useAuth } from '../App'; 
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Leaf, UserPlus, MapPin, FileText, Tag, Loader2, ScrollText } from 'lucide-react';
import TagSelector from '../components/TagSelector'; 

export default function Signup() { 
    const [formData, setFormData] = useState({
      userName: '',
      firstName: '',
      lastName: '',
      email: '',
      confirmEmail: '',
      password: '',
      confirmPassword: '',
      location: '',
      bio: '',
      birthDate: '',
      interestedTags: [], 
      acceptedTerms: false,
    });
    
    const [loading, setLoading] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [birthDateError, setBirthDateError] = useState('');
    const [showRulesDialog, setShowRulesDialog] = useState(false);
    const [rulesAccepted, setRulesAccepted] = useState(false);
    
    // Location autocomplete states
    const [locationInput, setLocationInput] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const locationTimeoutRef = useRef(null);
    
    const navigate = useNavigate();
    const { setUser } = useAuth();
  
    // Check for Turkish characters in username
    const hasTurkishCharacters = (text) => {
      const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
      return turkishChars.test(text);
    };

    const handleChange = (e) => {
      const { id, value } = e.target;
      setFormData(prev => ({ ...prev, [id]: value }));
      
      // Username validation - check for Turkish characters and minimum length
      if (id === 'userName') {
        if (value.length > 0 && value.length < 5) {
          setUsernameError('Username must be at least 5 characters long');
        } else if (hasTurkishCharacters(value)) {
          setUsernameError('Username cannot contain Turkish characters (ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü)');
        } else {
          setUsernameError('');
        }
      }
      
      // Email validation - check if emails match
      if (id === 'email' || id === 'confirmEmail') {
        if (id === 'email') {
          if (formData.confirmEmail && value !== formData.confirmEmail) {
            setEmailError('Emails do not match');
          } else {
            setEmailError('');
          }
        } else if (id === 'confirmEmail') {
          if (formData.email && value !== formData.email) {
            setEmailError('Emails do not match');
          } else {
            setEmailError('');
          }
        }
      }
      
      // Birth date validation - check if user is 18 or older
      if (id === 'birthDate') {
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age < 18) {
            setBirthDateError('You must be at least 18 years old to register.');
          } else {
            setBirthDateError('');
          }
        } else {
          setBirthDateError('');
        }
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
      setFormData(prev => ({ ...prev, location: value }));
      
      // Clear previous timeout
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
      
      // Debounce için timeout
      locationTimeoutRef.current = setTimeout(() => {
        searchLocation(value);
      }, 300);
    };

    const handleLocationSelect = (suggestion) => {
      setLocationInput(suggestion.display_name);
      setFormData(prev => ({ ...prev, location: suggestion.display_name }));
      setShowSuggestions(false);
      setLocationSuggestions([]);
    };

   
    useEffect(() => {
      return () => {
        if (locationTimeoutRef.current) {
          clearTimeout(locationTimeoutRef.current);
        }
      };
    }, []);
  
    const handleCheckboxChange = (checked) => {
      setFormData(prev => ({ ...prev, acceptedTerms: !!checked }));
    };

    const handleRulesDialogClose = () => {
      setShowRulesDialog(false);
      
      if (rulesAccepted) {
        setFormData(prev => ({ ...prev, acceptedTerms: true }));
        setRulesAccepted(false);
      }
    };

    const handleAcceptRules = () => {
      setRulesAccepted(true);
      setFormData(prev => ({ ...prev, acceptedTerms: true }));
      setShowRulesDialog(false);
    };

  
    const handleSubmit = async (e) => {
      e.preventDefault();
  
      // Username validation
      if (formData.userName.length < 5) {
        toast.error('Username must be at least 5 characters long.');
        return;
      }
      if (hasTurkishCharacters(formData.userName)) {
        toast.error('Username cannot contain Turkish characters.');
        return;
      }
      
      // Email validation
      if (formData.email !== formData.confirmEmail) {
        toast.error('Emails do not match.');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters.');
        return;
      }
      
      // Birth date validation - must be 18 or older
      if (!formData.birthDate) {
        toast.error('Please enter your birth date.');
        return;
      }
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        toast.error('You must be at least 18 years old to register.');
        setBirthDateError('You must be at least 18 years old to register.');
        return;
      }
      
      if (!formData.acceptedTerms) {
        toast.error('You must accept the community rules.');
        return;
      }
  
      setLoading(true);
      
      try {
        const response = await api.post('/register/', {
          username: formData.userName,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          password2: formData.confirmPassword,
          interested_tags: formData.interestedTags || [],
          location: formData.location,
          bio: formData.bio,
          birth_date: formData.birthDate,
        });
  
        setLoading(false);
        setUser(response.data); 
        toast.success('Your account has been created! Redirecting to home page...');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
        
      } catch (error) {
        if (error.response && error.response.data) {
          const errors = error.response.data;
          if (errors.username) toast.error(`Username: ${errors.username[0]}`);
          if (errors.email) toast.error(`Email: ${errors.email[0]}`);
          if (errors.password) toast.error(`Password: ${errors.password[0]}`);
          if (errors.general) toast.error(errors.general);
          
        } else {
          toast.error('An unknown error occurred. Please try again.');
        }
        setLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-secondary/30 via-background to-accent/20">
        <Card className="w-full max-w-2xl shadow-xl border-primary/20 my-8">
          <CardHeader className="space-y-4 text-center bg-gradient-to-br from-primary/5 to-secondary/20 rounded-t-xl">
            <div className="mx-auto w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-primary-foreground shadow-lg">
              <Leaf className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-primary">Join The Hive</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Create your account to start sharing
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <UserPlus className="w-5 h-5" />
                  <h3>Account Information</h3>
                </div>
                
                <div className="space-y-4 pl-7">
                  <div className="space-y-2">
                    <Label htmlFor="userName">User Name</Label>
                    <Input
                      id="userName"
                      type="text"
                      placeholder="Choose a visible name"
                      required
                      value={formData.userName}
                      onChange={handleChange}
                      className={`bg-card border-primary/20 focus:border-primary ${
                        usernameError ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {usernameError && (
                      <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Username must be at least 5 characters and cannot contain Turkish characters
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="bg-card border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="bg-card border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`bg-card border-primary/20 focus:border-primary ${
                        emailError ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirm Email</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder="Re-enter your email"
                      required
                      value={formData.confirmEmail}
                      onChange={handleChange}
                      className={`bg-card border-primary/20 focus:border-primary ${
                        emailError ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {emailError && (
                      <p className="text-xs text-red-500 mt-1">{emailError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Required for account verification
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      required
                      value={formData.birthDate}
                      onChange={handleChange}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      className={`bg-card border-primary/20 focus:border-primary ${
                        birthDateError ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {birthDateError && (
                      <p className="text-xs text-red-500 mt-1">{birthDateError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You must be at least 18 years old to register
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-card border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="bg-card border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="w-5 h-5" />
                  <h3>Personal Information</h3>
                </div>
                
                <div className="space-y-4 pl-7">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <Input
                        id="location"
                        type="text"
                        placeholder="Type location (e.g., Kadıköy, Istanbul...)"
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
                        className="bg-card border-primary/20 focus:border-primary"
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
                    <p className="text-xs text-muted-foreground">
                      Start typing to search for locations. Helps connect you with nearby community members.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">About You</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell the community about yourself, your interests, and what makes you unique..."
                      value={formData.bio}
                      onChange={handleChange}
                      className="bg-card border-primary/20 focus:border-primary min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be visible on your profile
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Interests (Tags) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Tag className="w-5 h-5" />
                  <h3>Interests</h3>
                </div>
                
                <div className="pl-7">
                  <p className="text-sm text-muted-foreground mb-4">
                    Select your areas of interest. These will appear on your profile.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Education & Tutoring",
                      "Home & Garden",
                      "Technology",
                      "Arts & Crafts Production",
                      "Health Lifestyle",
                      "Childcare",
                      "Language Exchange",
                      "Cooking & Food",
                      "Pet Care",
                      "Repairs & Maintenance",
                      "Event Planning"
                    ].map((tagName) => {
                      const isSelected = formData.interestedTags.some(
                        tag => (tag.name || tag.label || tag) === tagName
                      );
                      const tagId = `tag-${tagName.replace(/\s+/g, '-').toLowerCase()}`;
                      const handleTagToggle = (checked) => {
                        const currentTags = formData.interestedTags || [];
                        if (checked) {
                          // Check if already exists to prevent duplicates
                          if (!currentTags.some(tag => (tag.name || tag.label || tag) === tagName)) {
                            setFormData(prev => ({
                              ...prev,
                              interestedTags: [
                                ...currentTags,
                                { name: tagName, label: tagName }
                              ]
                            }));
                          }
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            interestedTags: currentTags.filter(
                              tag => (tag.name || tag.label || tag) !== tagName
                            )
                          }));
                        }
                      };

                      return (
                        <div
                          key={tagName}
                          className={`
                            flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${isSelected 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
                            }
                          `}
                        >
                          <Checkbox
                            id={tagId}
                            checked={isSelected}
                            onCheckedChange={handleTagToggle}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label 
                            htmlFor={tagId}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {tagName}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {formData.interestedTags && formData.interestedTags.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {formData.interestedTags.length} interest{formData.interestedTags.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Others */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="w-5 h-5" />
                  <h3>Others</h3>
                </div>
                
                <div className="pl-7">
                  <p className="text-sm text-muted-foreground mb-3">
                    Select your interests. You can search from existing tags or create new ones.
                  </p>
                  <TagSelector
                    value={formData.interestedTags}
                    onChange={(tags) => setFormData(prev => ({ ...prev, interestedTags: tags || [] }))}
                    placeholder="Search interests (e.g., cooking, gardening, coding, tutoring...)"
                    isMulti={true}
                    showAllTagsOnOpen={true}
                  />
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Terms & Conditions */}
              <div className="flex items-start space-x-3 pt-2 bg-secondary/20 p-3 rounded-lg border border-primary/20">
                <Checkbox 
                  id="terms" 
                  className="mt-0.5"
                  checked={formData.acceptedTerms}
                  onCheckedChange={handleCheckboxChange}
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowRulesDialog(true);
                      }}
                      className="text-primary hover:underline"
                    >
                      Community Rules
                    </button>
                  </Label>
                </div>
              </div>

              <Button type="submit" className="w-full shadow-md" size="lg" disabled={loading}>
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Community Rules Dialog */}
        <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <ScrollText className="w-6 h-6 text-primary" />
                The Hive Community Rules
              </DialogTitle>
              <DialogDescription>
                Please read and accept the community rules to continue
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <p className="text-gray-700 leading-relaxed">
                The Hive is a time exchange platform built on mutual respect, trust, and solidarity. These rules have been established to ensure that all members participate in a fair and sustainable ecosystem. Every user who completes the registration process is deemed to have accepted these rules in advance.
              </p>

              {/* Section I */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">I. TimeBank System and Financial Rules</h3>
                <p className="text-gray-700 leading-relaxed">
                  TimeBank is the core operating mechanism of our platform. All members are obligated to adhere to the following financial rules to ensure the fair use and distribution of time credits:
                </p>

                <div className="space-y-4 ml-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">1. Negative Balance Restriction (Minimum 0 Hours)</h4>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      No member's TimeBank balance may fall into the negative.
                    </p>
                    <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded ml-4">
                      <p className="font-medium text-gray-900 mb-1">0 Hour Rule:</p>
                      <p className="text-gray-700 text-sm">
                        When your balance reaches 0 (zero) hours, your authorization to request services is automatically suspended.
                      </p>
                      <p className="font-medium text-gray-900 mt-2 mb-1">Reactivation:</p>
                      <p className="text-gray-700 text-sm">
                        To regain the authority to receive services, you must first increase your balance by providing services to the community.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">2. Maximum Balance Restriction (Maximum 10 Hours)</h4>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      A maximum balance limit has been set to encourage the system to remain in an active cycle.
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded ml-4">
                      <p className="font-medium text-gray-900 mb-1">10 Hour Rule:</p>
                      <p className="text-gray-700 text-sm">
                        When your TimeBank balance reaches 10 hours, you are automatically prevented from earning additional credits by offering new services.
                      </p>
                      <p className="font-medium text-gray-900 mt-2 mb-1">Balancing Obligation:</p>
                      <p className="text-gray-700 text-sm">
                        To provide more services, you must use your accumulated time credit (to drop below 10 hours) by requesting services from the community.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">3. Credit Transfer Approval and Pending Credit</h4>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      The credit transfer process is based on transparency and mutual trust.
                    </p>
                    <div className="space-y-2 ml-4">
                      <div>
                        <p className="font-medium text-gray-900">Pending Credit:</p>
                        <p className="text-gray-700 text-sm">
                          When a service request is accepted by the service provider, the estimated duration of the service is immediately deducted from the requestor's balance and appears as "Pending Credit" on the service provider's profile. This credit cannot be used by the service provider until it is actually transferred.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Final Transfer:</p>
                        <p className="text-gray-700 text-sm">
                          The credit transfer is finalized with the mutual and separate approval of both the party requesting the service and the party providing the service, following the completion of the service. Until the approval process is complete, the service duration continues to be reserved in the requestor's account.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section II */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">II. Volunteering and Ethical Principles</h3>
                
                <div className="space-y-4 ml-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">4. Respect and Professionalism</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                      <li>A respectful, honest, and constructive language must be used in all interactions.</li>
                      <li>All offered or requested services must be fulfilled in accordance with the stated terms and the agreed-upon timeline.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">5. Service Quality and Feedback</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                      <li>Members are obligated to provide services with reasonable and conscientious care.</li>
                      <li>In case of detected abuse or attempted fraud, membership may be immediately and permanently terminated.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Acceptance Checkbox */}
              <div className="flex items-start space-x-3 pt-4 border-t border-gray-200">
                <Checkbox 
                  id="rules-accept" 
                  className="mt-0.5"
                  checked={rulesAccepted}
                  onCheckedChange={(checked) => setRulesAccepted(!!checked)}
                />
                <Label
                  htmlFor="rules-accept"
                  className="text-sm font-normal cursor-pointer"
                >
                  I have read, understood, and accept The Hive Community Rules and the operating principles of the TimeBank system above.
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRulesDialog(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleAcceptRules}
                disabled={!rulesAccepted}
                className="bg-primary hover:bg-primary/90"
              >
                Accept and Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }