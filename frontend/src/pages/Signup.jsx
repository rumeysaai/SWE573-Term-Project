// src/pages/SignupPage.jsx

import { useState } from 'react';
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
import { Leaf, UserPlus, MapPin, Briefcase, Heart, FileText } from 'lucide-react'; 

export default function Signup() { 
    const [formData, setFormData] = useState({
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
      location: '',
      bio: '',
      skills: [],
      needs: [],
      additionalInfo: '',
      acceptedTerms: false,
    });
    
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { setUser } = useAuth();
  
    const handleChange = (e) => {
      const { id, value } = e.target;
      setFormData(prev => ({ ...prev, [id]: value }));
    };
  
    const handleCheckboxChange = (checked) => {
      setFormData(prev => ({ ...prev, acceptedTerms: !!checked }));
    };

    const handleSkillToggle = (skill) => {
      setFormData(prev => {
        const skills = prev.skills.includes(skill)
          ? prev.skills.filter(s => s !== skill)
          : [...prev.skills, skill];
        return { ...prev, skills };
      });
    };

    const handleNeedToggle = (need) => {
      setFormData(prev => {
        const needs = prev.needs.includes(need)
          ? prev.needs.filter(n => n !== need)
          : [...prev.needs, need];
        return { ...prev, needs };
      });
    };

    const skillsList = [
      "Education & Tutoring",
      "Home & Garden",
      "Technology & IT",
      "Arts & Crafts",
      "Health & Wellness",
      "Transportation",
      "Childcare",
      "Language Exchange",
      "Cooking & Food",
      "Pet Care",
      "Repairs & Maintenance",
      "Event Planning"
    ];
  
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
          email: formData.email,
          password: formData.password,
          password2: formData.confirmPassword,
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
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., Kadıköy, Istanbul"
                      value={formData.location}
                      onChange={handleChange}
                      className="bg-card border-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      Helps connect you with nearby community members
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

              {/* Skills & Interests */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Briefcase className="w-5 h-5" />
                  <h3>Skills I Can Offer</h3>
                </div>
                
                <div className="pl-7">
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the services you can provide to the community
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {skillsList.map((skill) => (
                      <div key={skill} className="flex items-center space-x-2 bg-secondary/10 p-2 rounded-lg border border-primary/10 hover:bg-secondary/20 transition-colors">
                        <Checkbox 
                          id={`skill-${skill}`}
                          checked={formData.skills.includes(skill)}
                          onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <Label
                          htmlFor={`skill-${skill}`}
                          className="text-sm cursor-pointer"
                        >
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Interests & Needs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Heart className="w-5 h-5" />
                  <h3>Services I'm Looking For</h3>
                </div>
                
                <div className="pl-7">
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the services you'd like to receive from the community
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {skillsList.map((need) => (
                      <div key={need} className="flex items-center space-x-2 bg-secondary/10 p-2 rounded-lg border border-primary/10 hover:bg-secondary/20 transition-colors">
                        <Checkbox 
                          id={`need-${need}`}
                          checked={formData.needs.includes(need)}
                          onCheckedChange={() => handleNeedToggle(need)}
                        />
                        <Label
                          htmlFor={`need-${need}`}
                          className="text-sm cursor-pointer"
                        >
                          {need}
                        </Label>
                      </div>
                    ))}
                  </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo">Additional Information</Label>
                    <Textarea
                      id="additionalInfo"
                      placeholder="Is there anything else you'd like to share with the community?"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      className="bg-card border-primary/20 focus:border-primary min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Share any additional information, special requests, or preferences
                    </p>
                  </div>
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