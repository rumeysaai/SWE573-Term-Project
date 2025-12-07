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
import { Leaf, UserPlus, MapPin, FileText, Tag, Loader2 } from 'lucide-react';
import TagSelector from '../components/TagSelector'; 

export default function Signup() { 
    const [formData, setFormData] = useState({
      userName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      location: '',
      bio: '',
      interestedTags: [], // TagSelector format for interests/tags
      acceptedTerms: false,
    });
    
    const [loading, setLoading] = useState(false);
    
    // Location autocomplete states
    const [locationInput, setLocationInput] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const locationTimeoutRef = useRef(null);
    
    const navigate = useNavigate();
    const { setUser } = useAuth();
  
    const handleChange = (e) => {
      const { id, value } = e.target;
      setFormData(prev => ({ ...prev, [id]: value }));
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

    // Cleanup timeout on unmount
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

  
    const handleSubmit = async (e) => {
      e.preventDefault();
  
      
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters.');
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
                      className="bg-card border-primary/20 focus:border-primary"
                    />
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
                      placeholder="For verification purposes"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-card border-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for account verification
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
                    <Link to="/terms" className="text-primary hover:underline">
                      Community Rules
                    </Link>
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
      </div>
    );
  }