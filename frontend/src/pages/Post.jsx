import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  PenLine, 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  RefreshCw,
  Send,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function Post() {
  const { id } = useParams(); // URL'den /:id'yi alır
  const isEditing = Boolean(id); // ID varsa, düzenleme modundayız
  const navigate = useNavigate();
  const { user } = useAuth();

  // Backend API'ye uygun state yapısı
  const [post, setPost] = useState({
    title: '',
    description: '',
    post_type: 'offer',
    location: '',
    duration: '', // Backend string bekliyor
    tags: [] // Backend ID listesi bekliyor
  });

  // UI için ekstra state'ler (backend'de yok, sadece UI için)
  const [estimatedHours, setEstimatedHours] = useState(3);
  const [date, setDate] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [frequency, setFrequency] = useState('one-time');
  const [isGroupActivity, setIsGroupActivity] = useState(false);

  const [allTags, setAllTags] = useState([]); // Tüm etiketleri çekmek için
  const [selectedTagIds, setSelectedTagIds] = useState([]); // Seçilen tag ID'leri
  const [tagInput, setTagInput] = useState(''); // Tag input için
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
          const { title, description, post_type, location, duration, tags, frequency, participant_count, date } = response.data;
          
          // Tags string array olarak geliyor, önce string olarak sakla
          // Sonra allTags yüklendiğinde ID'lere çevrilecek
          setPost({ 
            title, 
            description, 
            post_type, 
            location, 
            duration,
            tags: tags // Geçici olarak string array olarak sakla
          });
          
          // Duration'dan estimatedHours'ı parse et (örn: "3 hours" -> 3)
          const hoursMatch = duration.match(/(\d+)/);
          if (hoursMatch) {
            setEstimatedHours(parseInt(hoursMatch[1]));
          }
          
          // Ekstra alanları set et
          if (frequency) setFrequency(frequency);
          if (participant_count) setParticipantCount(participant_count);
          if (date) setDate(date);
          
          setLoading(false);
        })
        .catch(err => {
          console.error("İlan detayı çekilemedi:", err);
          setError("İlan verisi yüklenemedi.");
          setLoading(false);
        });
    }
  }, [id, isEditing]);

  // allTags yüklendiğinde ve post.tags string array ise, ID'lere çevir
  useEffect(() => {
    if (allTags.length > 0 && isEditing && Array.isArray(post.tags) && post.tags.length > 0 && typeof post.tags[0] === 'string') {
      const tagIds = post.tags.map(tagName => {
        const tag = allTags.find(t => t.name === tagName);
        return tag ? tag.id : null;
      }).filter(id => id !== null);
      
      setSelectedTagIds(tagIds);
      setPost(prev => ({ ...prev, tags: tagIds }));
    }
  }, [allTags, isEditing, post.tags]);

  // Tag ekleme (Input'tan tag ekleme)
  const handleAddTag = async () => {
    if (tagInput.trim()) {
      // Önce mevcut tag'lerde var mı kontrol et
      const existingTag = allTags.find(t => t.name.toLowerCase() === tagInput.trim().toLowerCase());
      
      if (existingTag) {
        // Tag zaten varsa, ID'sini ekle
        if (!selectedTagIds.includes(existingTag.id)) {
          setSelectedTagIds([...selectedTagIds, existingTag.id]);
          setPost(prev => ({ ...prev, tags: [...prev.tags, existingTag.id] }));
        }
      } else {
        // Yeni tag oluştur
        try {
          const response = await api.post('/tags/', { name: tagInput.trim() });
          const newTag = response.data;
          setAllTags([...allTags, newTag]);
          setSelectedTagIds([...selectedTagIds, newTag.id]);
          setPost(prev => ({ ...prev, tags: [...prev.tags, newTag.id] }));
        } catch (err) {
          console.error("Tag oluşturulamadı:", err);
          toast.error('Tag oluşturulamadı. Lütfen tekrar deneyin.');
        }
      }
      setTagInput('');
    }
  };

  // Tag kaldırma
  const handleRemoveTag = (tagIdToRemove) => {
    setSelectedTagIds(selectedTagIds.filter(id => id !== tagIdToRemove));
    setPost(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(id => id !== tagIdToRemove) 
    }));
  };

  // Formu gönder (Oluştur veya Güncelle)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // estimatedHours'ı duration string'ine çevir
    const durationString = `${estimatedHours} hours`;

    const dataToSend = {
      title: post.title,
      description: post.description,
      post_type: post.post_type,
      location: post.location,
      duration: durationString,
      tags_ids: post.tags, // Seçilen etiket ID'lerinin listesi [1, 2]
      frequency: frequency || null,
      participant_count: participantCount || null,
      date: date || null,
      // posted_by backend'de perform_create'de otomatik atanıyor, göndermemize gerek yok
    };

    try {
      if (isEditing) {
        // Düzenleme -> PUT isteği
        await api.put(`/posts/${id}/`, dataToSend);
        toast.success('İlan başarıyla güncellendi!');
      } else {
        // Yeni -> POST isteği
        await api.post('/posts/', dataToSend);
        toast.success('İlan başarıyla yayınlandı!');
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
            errorMsg = "Backend Hatası: 'posted_by_id' alanı boş bırakılamaz.";
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
      toast.error(errorMsg);
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

  // Seçili tag'lerin isimlerini al (ID'ye göre eşleştir)
  const getTagNameById = (tagId) => {
    const tag = allTags.find(t => t.id === tagId);
    return tag ? tag.name : '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <PenLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-blue-600 font-bold text-lg">{isEditing ? 'Edit Post' : 'Create Post'}</h1>
            <p className="text-xs text-gray-500">Fill in the details for your offer or need</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Post Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Post Type</Label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPost({ ...post, post_type: 'offer' })}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg border transition-all ${
                    post.post_type === 'offer'
                      ? 'border-blue-600 bg-blue-600/5 ring-2 ring-blue-600/20'
                      : 'border-blue-500/20 bg-white hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      post.post_type === 'offer' ? 'border-blue-600' : 'border-gray-400'
                    }`}>
                      {post.post_type === 'offer' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-sm">Offer - I can provide this service</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPost({ ...post, post_type: 'need' })}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg border transition-all ${
                    post.post_type === 'need'
                      ? 'border-blue-600 bg-blue-600/5 ring-2 ring-blue-600/20'
                      : 'border-blue-500/20 bg-white hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      post.post_type === 'need' ? 'border-blue-600' : 'border-gray-400'
                    }`}>
                      {post.post_type === 'need' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-sm">Need - I'm looking for this service</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Title</Label>
              <Input
                required
                placeholder="Enter post title"
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
                className="h-10 text-sm border-blue-500/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea
                required
                placeholder="Describe your offer or need"
                rows={4}
                value={post.description}
                onChange={(e) => setPost({ ...post, description: e.target.value })}
                className="text-sm border-blue-500/20 resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Tags (Minimum 1 Required)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="h-10 text-sm border-blue-500/20"
                />
                <Button 
                  type="button" 
                  onClick={handleAddTag}
                  className="h-10 px-4"
                >
                  Add
                </Button>
              </div>
              
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTagIds.map((tagId) => {
                    const tagName = getTagNameById(tagId);
                    if (!tagName) return null;
                    return (
                      <Badge 
                        key={tagId} 
                        className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {tagName}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tagId)}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Duration, Date, Participants */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Duration (Hours)
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  className="h-10 text-sm border-blue-500/20"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 text-sm border-blue-500/20"
                />
              </div>

              {/* Participants Count */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Participants Count
                </Label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="1"
                    value={participantCount}
                    onChange={(e) => setParticipantCount(parseInt(e.target.value) || 1)}
                    className="h-10 text-sm border-blue-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="group-activity"
                      type="checkbox"
                      checked={isGroupActivity}
                      onChange={(e) => setIsGroupActivity(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="group-activity" className="text-xs text-gray-500">
                      Group Activity
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Frequency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                Service Frequency
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFrequency('one-time')}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    frequency === 'one-time'
                      ? 'border-blue-600 bg-blue-600/5 ring-2 ring-blue-600/20'
                      : 'border-blue-500/20 bg-white hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      frequency === 'one-time' ? 'border-blue-600' : 'border-gray-400'
                    }`}>
                      {frequency === 'one-time' && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-xs">One-time</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFrequency('weekly')}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    frequency === 'weekly'
                      ? 'border-blue-600 bg-blue-600/5 ring-2 ring-blue-600/20'
                      : 'border-blue-500/20 bg-white hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      frequency === 'weekly' ? 'border-blue-600' : 'border-gray-400'
                    }`}>
                      {frequency === 'weekly' && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-xs">Weekly</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFrequency('monthly')}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    frequency === 'monthly'
                      ? 'border-blue-600 bg-blue-600/5 ring-2 ring-blue-600/20'
                      : 'border-blue-500/20 bg-white hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      frequency === 'monthly' ? 'border-blue-600' : 'border-gray-400'
                    }`}>
                      {frequency === 'monthly' && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-xs">Monthly</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Location</Label>
              <Select 
                value={post.location} 
                onValueChange={(value) => setPost({ ...post, location: value })}
              >
                <SelectTrigger className="h-10 text-sm border-blue-500/20">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kadıköy">Kadıköy</SelectItem>
                  <SelectItem value="Beşiktaş">Beşiktaş</SelectItem>
                  <SelectItem value="Üsküdar">Üsküdar</SelectItem>
                  <SelectItem value="Şişli">Şişli</SelectItem>
                  <SelectItem value="Bakırköy">Bakırköy</SelectItem>
                  <SelectItem value="Fatih">Fatih</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                className="h-10 text-sm shadow-md"
                disabled={loading || post.tags.length === 0}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Update' : 'Publish'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="h-10 text-sm shadow-sm"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
