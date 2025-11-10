import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
            toast.success('Giriş başarılı! Hoş geldiniz.');
            navigate('/');
          } else {
            toast.error('Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
          }
        } catch (error) {
          console.error('Login error:', error);
          toast.error('Giriş yapılırken bir hata oluştu.');
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
            <p className="text-sm text-gray-500">Topluluk TimeBank Platformu</p>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="userName">Kullanıcı Adı</Label>
              <Input
                id="userName"
                type="text"
                placeholder="kullaniciadi"
                required
                value={formData.userName}
                onChange={handleChange}
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="password">Parola</Label>
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
              Giriş Yap
            </Button>
  
            <div className="text-center space-y-3 text-sm">
              <a href="#" className="text-blue-600 hover:text-blue-700 block transition-colors duration-150">
                Şifremi Unuttum
              </a>
              
              <div className="text-gray-500">
                Hesabın yok mu?{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors duration-150">
                  Kayıt Ol
                </a>
              </div>
            </div>
          </form>
  
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Demo için herhangi bir e-posta ve şifre ile giriş yapabilirsiniz</p>
          </div>
        </Card>
      </div>
    );
  }