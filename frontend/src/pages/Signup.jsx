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
import { Leaf, AlertCircle } from 'lucide-react'; 

export default function Signup() { 
    const [formData, setFormData] = useState({
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 md:p-8">
          <CardHeader className="text-center mb-6 p-0">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-2xl mb-4">
              <Leaf className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Join The Hive</h1>
            <p className="text-slate-600">Create a Community TimeBank Account</p>
          </CardHeader>
  
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <Label htmlFor="userName">Username (Display Name)</Label>
              <Input
                id="userName"
                type="text"
                placeholder="Unique username"
                required
                value={formData.userName}
                onChange={handleChange}
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="password">Password (min. 8 characters)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a strong password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
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
              />
            </div>
  
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.acceptedTerms}
                onCheckedChange={handleCheckboxChange}
              />
              <label
                htmlFor="terms"
                className="text-sm text-slate-600 leading-tight cursor-pointer"
              >
                {/* 'href=#' yerine 'Link to' kullanıldı */}
                <Link to="/terms" className="text-primary hover:underline">
                  Community Rules
                </Link>{' '}
                I have read and accept
              </label>
            </div>
  
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
  
            <div className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              {/* 'href=#' yerine 'Link to' kullanıldı */}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </form>
  
          <div className="mt-6 p-4 bg-secondary/20 rounded-lg border border-secondary/40">
            <p className="text-xs text-foreground">
              <strong>Welcome Bonus:</strong> New members receive 5 hours of TimeBank credit as a gift! 🎉
            </p>
          </div>
        </Card>
      </div>
    );
  }