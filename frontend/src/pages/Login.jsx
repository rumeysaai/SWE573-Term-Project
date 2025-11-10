import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../App'; 

export default function Login() {
    const [formData, setFormData] = useState({
      userName: '',
      password: '',
    });
    const { login } = useAuth();
    const navigate = useNavigate();
  
    const handleChange = (e) => {
      const { id, value } = e.target;
      setFormData((prevData) => ({
        ...prevData,
        [id]: value,
      }));
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();
  
        try {
          const success = await login(formData.userName, formData.password);
          
          if (success) {
            toast.success('Login successful! Welcome.');
            navigate('/');
          } else {
            toast.error('Login failed. Username or password is incorrect.');
          }
        } catch (error) {
          console.error('Login error:', error);
          toast.error('An error occurred while logging in.');
        }
      };
  
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4 text-blue-600">
              <span className="text-3xl">🐝</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">The Hive</h1>
            <p className="text-sm text-gray-500">Community TimeBank Platform</p>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                type="text"
                placeholder="username"
                required
                value={formData.userName}
                onChange={handleChange}
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
  
            <Button type="submit" className="w-full">
              Sign In
            </Button>
  
            <div className="text-center space-y-3 text-sm">
              <a href="#" className="text-blue-600 hover:text-blue-700 block transition-colors duration-150">
                Forgot Password
              </a>
              
              <div className="text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 transition-colors duration-150">
                  Sign Up
                </Link>
              </div>
            </div>
          </form>
  
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>For demo purposes, you can log in with any email and password</p>
          </div>
        </Card>
      </div>
    );
  }