import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import api from '../api'; 

export default function Login() {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
    });
  
    const handleChange = (e) => {
      const { id, value } = e.target;
      setFormData((prevData) => ({
        ...prevData,
        [id]: value,
      }));
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();
  
        // API endpoint'i (baseURL zaten 'api.js' içinde tanımlı)
        const API_URL = '/api/login/';
  
        try {
          // --- SİZİN İSTEDİĞİNİZ KOD ---
          // 'api' instance'ı kullanılır.
          // Backend 'username' beklediği için manuel eşleştirme yapılır.
          const response = await api.post(API_URL, {
            username: formData.userName, // React state'i (userName)
            password: formData.password,
          });
          // --- BİTTİ ---
          
          // BAŞARILI: Sunucudan 200 OK durumu geldi
          const user = response.data; // UserSerializer'dan gelen veri
          toast.success('Giriş başarılı! Hoş geldiniz.');
          console.log('Giriş yapan kullanıcı:', user);
  
          // TODO: Kullanıcıyı state'e kaydedin ve ana sayfaya yönlendirin
  
        } catch (error) {
          // HATALI: Sunucudan 4xx veya 5xx durumu geldi
          if (error.response && error.response.data) {
            // Django'dan gelen {"error": "..."} mesajı
            const errorMessage = error.response.data.error || 'Bilinmeyen bir hata oluştu.';
            toast.error(`Giriş Hatası: ${errorMessage}`);
            console.error('Login Error Data:', error.response.data);
  
          } else if (error.request) {
            toast.error('Sunucuya bağlanılamadı. (Backend çalışıyor mu?)');
          } else {
            toast.error('İstek gönderilirken bir hata oluştu.');
          }
          
          console.error('--- FULL LOGIN ERROR ---');
          console.error(error);
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
              <Label htmlFor="email">E-posta veya Kullanıcı Adı</Label>
              <Input
                id="email"
                type="text"
                placeholder="ornek@email.com veya kullaniciadi"
                required
                value={formData.email}
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