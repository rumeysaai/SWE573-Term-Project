import React, { useState, useEffect } from "react";
import api from "../api";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Clock,
  Leaf,
  Loader2,
  MapPin,
  Package,
} from "lucide-react";

// --- PostPage için Gerekli Bileşenler ---
// Normalde bu bileşenler 'components/ui.jsx' gibi paylaşılan bir dosyada
// olmalı, ancak isteğiniz üzerine PostPage içinde tanımlanıyorlar.

const Button = ({ children, variant = "default", size = "default", className = "", ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-600/90 shadow-md",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    lg: "h-11 rounded-md px-8",
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

// Yeni Textarea Bileşeni
const Textarea = ({ className = "", ...props }) => (
  <textarea
    className={`flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Select = ({ children, onValueChange, value, ...props }) => (
  <select
    onChange={(e) => onValueChange(e.target.value)}
    value={value}
    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  >
    {children}
  </select>
);

const SelectItem = ({ children, value }) => (
  <option value={value}>{children}</option>
);

const Separator = () => <hr className="my-6 border-gray-200" />;

// --- Ana PostPage Bileşeni ---

export default function Post() {
  const { id } = useParams(); // URL'den /:id'yi alır
  const isEditing = Boolean(id); // ID varsa, düzenleme modundayız
  const navigate = useNavigate(); // Form gönderildikten sonra yönlendirmek için

  const [post, setPost] = useState({
    title: "",
    description: "",
    post_type: "offer",
    location: "",
    duration: "",
    tags: [] // Backend 'tags' alanı için bir ID listesi bekler.
  });
  
  const [allTags, setAllTags] = useState([]); // Tüm etiketleri çekmek için
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Düzenleme modundaysak, mevcut ilanın verilerini çek
  useEffect(() => {
    // Etiketleri her zaman çek
    api.get('/tags/')
      .then(res => setAllTags(res.data))
      .catch(err => console.error("Etiketler çekilemedi:", err));

    if (isEditing) {
      setLoading(true);
      api.get(`/posts/${id}/`)
        .then(response => {
          // Backend'den gelen veriyi form state'ine set et
          const { title, description, post_type, location, duration, tags } = response.data;
          
          // Backend'den gelen tags listesi string'lerden oluşuyor ("Gardening")
          // Bizim ise POST/PUT için ID listesine ihtiyacımız var.
          // Bu örnekte, 'tags' alanını düzenleme için doldurmayı basitleştiriyoruz.
          // İdeal bir senaryoda, backend'den ID'ler gelmeli veya 
          // string'leri ID'lere eşleştirmeliyiz.
          
          setPost({ 
            title, 
            description, 
            post_type, 
            location, 
            duration, 
            tags: [] // Düzenleme için etiket seçimini şimdilik basitleştiriyoruz
                     // Backend (PostSerializer) tags alanı read_only olduğu için
                     // ve string listesi döndürdüğü için.
          });
          setLoading(false);
        })
        .catch(err => {
          console.error("İlan detayı çekilemedi:", err);
          setError("İlan verisi yüklenemedi.");
          setLoading(false);
        });
    }
  }, [id, isEditing]);

  // Formdaki değişiklikleri state'e kaydet
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPost(prevPost => ({
      ...prevPost,
      [name]: value
    }));
  };

  // Etiket seçimi (Çoklu seçim)
  const handleTagChange = (e) => {
    // Seçilen option'lardan value'larını (ID) al ve bir diziye dönüştür
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setPost(prevPost => ({
      ...prevPost,
      tags: selectedOptions
    }));
  };
  
  // Formu gönder (Oluştur veya Güncelle)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dataToSend = {
      title: post.title,
      description: post.description,
      post_type: post.post_type,
      location: post.location,
      duration: post.duration,
      tags: post.tags, // Seçilen etiket ID'lerinin listesi [1, 2]
      
      // --- HATA DÜZELTMESİ (IntegrityError) ---
      // Backend, ilanı kimin oluşturduğunu bilmek zorunda (IntegrityError).
      // Henüz bir giriş (login) sistemimiz olmadığı için, 
      // geliştirme amacıyla ilanı 1 ID'li kullanıcının (admin) oluşturduğunu varsayıyoruz.
      // Django'da 'manage.py createsuperuser' ile bir kullanıcı oluşturduysanız, onun ID'si muhtemelen 1'dir.
      posted_by: 1 
      // Not: Backend Serializer'ınız 'posted_by_id' bekliyorsa burayı 'posted_by_id: 1' olarak değiştirin.
      // 'posted_by: 1' (PK) genellikle DRF için yeterlidir.
    };

    try {
      if (isEditing) {
        // Düzenleme -> PUT isteği
        await api.put(`/posts/${id}/`, dataToSend);
      } else {
        // Yeni -> POST isteği
        await api.post('/posts/', dataToSend);
      }
      setLoading(false);
      navigate("/"); // Başarılı olunca ana sayfaya dön
    } catch (err) {
      console.error("İlan kaydedilemedi:", err.response ? err.response.data : err);
      
      let errorMsg = "İlan kaydedilirken bir hata oluştu. Lütfen tüm alanları kontrol edin.";
      
      if (err.response && err.response.data) {
        // Hata HTML olarak geldiyse (Django'nun debug sayfası)
        if (typeof err.response.data === 'string' && err.response.data.includes('IntegrityError')) {
          if (err.response.data.includes('posted_by_id')) {
            errorMsg = "Backend Hatası: 'posted_by_id' alanı boş bırakılamaz. (Geliştirme için 1 ID'li kullanıcı varsayıldı, lütfen backend'de böyle bir kullanıcı olduğundan emin olun.)";
          } else {
            errorMsg = "Backend Bütünlük Hatası (IntegrityError)";
          }
        } 
        // Hata JSON olarak geldiyse (DRF'in normal validation hatası)
        else if (typeof err.response.data === 'object') {
          const errors = err.response.data;
          const messages = Object.keys(errors).map(key => {
            const errorList = Array.isArray(errors[key]) ? errors[key].join(' ') : errors[key];
            return `${key}: ${errorList}`;
          }).join(" ");
          if(messages) errorMsg = messages;
        }
      }
      
      setError(errorMsg);
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="ml-4 text-lg text-gray-700">İlan Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-blue-600 font-bold text-lg">The Hive</h3>
          </div>
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">
          {isEditing ? "İlanı Düzenle" : "Yeni İlan Oluştur"}
        </h1>
        <div className="w-24"></div> {/* Başlığı ortalamak için boşluk */}
      </div>

      {/* Form Alanı */}
      <div className="flex-grow flex items-center justify-center p-4 md:p-8">
        <form 
          onSubmit={handleSubmit} 
          className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-xl border border-gray-200"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center text-sm">
              {error}
            </div>
          )}

          {/* İlan Tipi (Teklif/İhtiyaç) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İlan Tipi
            </label>
            <Select
              name="post_type"
              value={post.post_type}
              onValueChange={(value) => setPost(p => ({ ...p, post_type: value }))}
            >
              <SelectItem value="offer">
                Teklif (Hizmet/Ürün Sunuyorum)
              </SelectItem>
              <SelectItem value="need">
                İhtiyaç (Hizmet/Ürün Arıyorum)
              </SelectItem>
            </Select>
          </div>
          
          {/* Başlık */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Başlık
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Örn: Bahçe işleri için yardım"
              value={post.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Açıklama */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Açıklama
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="İlanınız hakkında detaylı bilgi verin..."
              value={post.description}
              onChange={handleChange}
              required
            />
          </div>

          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Konum */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4 inline-block mr-1 text-gray-500" />
                Konum
              </label>
              <Input
                id="location"
                name="location"
                type="text"
                placeholder="Örn: Kadıköy, İstanbul"
                value={post.location}
                onChange={handleChange}
                required
              />
            </div>
            
            {/* Süre */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 inline-block mr-1 text-gray-500" />
                Tahmini Süre
              </label>
              <Input
                id="duration"
                name="duration"
                type="text"
                placeholder="Örn: 2 saat"
                value={post.duration}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {/* Etiket Seçimi (Tags) */}
          <div className="mb-4">
             <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Kategoriler (Birden fazla seçmek için Command/Ctrl tuşuna basın)
            </label>
            <select
              id="tags"
              name="tags"
              multiple={true}
              value={post.tags} // post.tags bir ID dizisi olmalı: [1, 3]
              onChange={handleTagChange}
              className="flex h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allTags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          {/* Eylem Butonları */}
          <div className="flex items-center justify-end gap-4 mt-8">
            <Link to="/">
              <Button type="button" variant="outline" disabled={loading}>
                İptal
              </Button>
            </Link>
            <Button type="submit" variant="default" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                isEditing ? "Güncelle" : "Yayınla"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}