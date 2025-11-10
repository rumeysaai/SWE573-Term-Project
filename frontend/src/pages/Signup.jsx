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
        toast.error('Parolalar eşleşmiyor.');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('Parola en az 8 karakter olmalıdır.');
        return;
      }
      if (!formData.acceptedTerms) {
        toast.error('Topluluk kurallarını kabul etmelisiniz.');
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
        toast.success('Hesabınız oluşturuldu! Ana sayfaya yönlendiriliyorsunuz...');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
        
      } catch (error) {
        if (error.response && error.response.data) {
          const errors = error.response.data;
          if (errors.username) toast.error(`Kullanıcı Adı: ${errors.username[0]}`);
          if (errors.email) toast.error(`Email: ${errors.email[0]}`);
          if (errors.password) toast.error(`Parola: ${errors.password[0]}`);
          if (errors.general) toast.error(errors.general);
          
        } else {
          toast.error('Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.');
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
            <h1 className="text-2xl font-bold mb-1">The Hive'a Katıl</h1>
            <p className="text-slate-600">Topluluk TimeBank Hesabı Oluştur</p>
          </CardHeader>
  
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <Label htmlFor="userName">Kullanıcı Adı (Görünür İsim)</Label>
              <Input
                id="userName"
                type="text"
                placeholder="Benzersiz kullanıcı adı"
                required
                value={formData.userName}
                onChange={handleChange}
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="password">Parola (min. 8 karakter)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Güçlü bir parola seçin"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Parola Tekrarı</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Parolanızı tekrar girin"
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
                  Topluluk Kurallarını
                </Link>{' '}
                okudum ve kabul ediyorum
              </label>
            </div>
  
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}
            </Button>
  
            <div className="text-center text-sm text-slate-600">
              Zaten hesabın var mı?{' '}
              {/* 'href=#' yerine 'Link to' kullanıldı */}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Giriş Yap
              </Link>
            </div>
          </form>
  
          <div className="mt-6 p-4 bg-secondary/20 rounded-lg border border-secondary/40">
            <p className="text-xs text-foreground">
              <strong>Başlangıç Bonusu:</strong> Yeni üyelere 5 saat TimeBank kredisi hediye edilir! 🎉
            </p>
          </div>
        </Card>
      </div>
    );
  }