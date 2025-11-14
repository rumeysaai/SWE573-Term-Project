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
  const { id } = useParams();
  const isEditing = Boolean(id); 
  const navigate = useNavigate();
  const { user } = useAuth();


  const [post, setPost] = useState({
    title: '',
    description: '',
    post_type: 'offer',
    location: '',
    duration: '', 
    tags: [] 
  });


  const [estimatedHours, setEstimatedHours] = useState(3);
  const [date, setDate] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [frequency, setFrequency] = useState('one-time');
  const [isGroupActivity, setIsGroupActivity] = useState(false);

  const [allTags, setAllTags] = useState([]); 
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tagInput, setTagInput] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    api.get('/tags/')
      .then(res => setAllTags(res.data))
      .catch(err => console.error("Etiketler çekilemedi:", err));

    if (isEditing) {
      setLoading(true);
      api.get(`/posts/${id}/`)
        .then(response => {
          const { title, description, post_type, location, duration, tags, frequency, participant_count, date } = response.data;
          
          setPost({ 
            title, 
            description, 
            post_type, 
            location, 
            duration,
            tags: tags 
          });
          
          const hoursMatch = duration.match(/(\d+)/);
          if (hoursMatch) {
            setEstimatedHours(parseInt(hoursMatch[1]));
          }
          
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


  const handleAddTag = async () => {
    if (tagInput.trim()) {
      
      const existingTag = allTags.find(t => t.name.toLowerCase() === tagInput.trim().toLowerCase());
      
      if (existingTag) {
       
        if (!selectedTagIds.includes(existingTag.id)) {
          setSelectedTagIds([...selectedTagIds, existingTag.id]);
          setPost(prev => ({ ...prev, tags: [...prev.tags, existingTag.id] }));
        }
      } else {
       
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

  const handleRemoveTag = (tagIdToRemove) => {
    setSelectedTagIds(selectedTagIds.filter(id => id !== tagIdToRemove));
    setPost(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(id => id !== tagIdToRemove) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const durationString = `${estimatedHours} hours`;

    const dataToSend = {
      title: post.title,
      description: post.description,
      post_type: post.post_type,
      location: post.location,
      duration: durationString,
      tags_ids: post.tags, 
      frequency: frequency || null,
      participant_count: participantCount || null,
      date: date || null,
    };

    try {
      if (isEditing) {
       
        await api.put(`/posts/${id}/`, dataToSend);
        toast.success('İlan başarıyla güncellendi!');
      } else {
   
        await api.post('/posts/', dataToSend);
        toast.success('İlan başarıyla yayınlandı!');
      }
      setLoading(false);
      navigate("/"); 
    } catch (err) {
      console.error("İlan kaydedilemedi:", err.response ? err.response.data : err);
      
      let errorMsg = "İlan kaydedilirken bir hata oluştu. Lütfen tüm alanları kontrol edin.";
      
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string' && err.response.data.includes('IntegrityError')) {
          if (err.response.data.includes('posted_by_id')) {
            errorMsg = "Backend Hatası: 'posted_by_id' alanı boş bırakılamaz.";
          } else {
            errorMsg = "Backend Bütünlük Hatası (IntegrityError)";
          }
        } 
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
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="ml-4 text-lg text-gray-700">İlan Yükleniyor...</p>
      </div>
    );
  }

  const getTagNameById = (tagId) => {
    const tag = allTags.find(t => t.id === tagId);
    return tag ? tag.name : '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-md">
            <PenLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-primary font-normal text-lg">{isEditing ? 'Edit Post' : 'Create Post'}</h1>
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
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-primary/20 bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      post.post_type === 'offer' ? 'border-primary' : 'border-gray-400'
                    }`}>
                      {post.post_type === 'offer' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
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
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-primary/20 bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      post.post_type === 'need' ? 'border-primary' : 'border-gray-400'
                    }`}>
                      {post.post_type === 'need' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
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
                className="h-10 text-sm border-primary/20"
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
                className="text-sm border-primary/20 resize-none"
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
                  className="h-10 text-sm border-primary/20"
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
                  <Clock className="w-4 h-4 text-primary" />
                  Duration (Hours)
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  className="h-10 text-sm border-primary/20"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 text-sm border-primary/20"
                />
              </div>

              {/* Participants Count */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Participants Count
                </Label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="1"
                    value={participantCount}
                    onChange={(e) => setParticipantCount(parseInt(e.target.value) || 1)}
                    className="h-10 text-sm border-primary/20"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="group-activity"
                      type="checkbox"
                      checked={isGroupActivity}
                      onChange={(e) => setIsGroupActivity(e.target.checked)}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
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
                <RefreshCw className="w-4 h-4 text-primary" />
                Service Frequency
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFrequency('one-time')}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    frequency === 'one-time'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-primary/20 bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      frequency === 'one-time' ? 'border-primary' : 'border-gray-400'
                    }`}>
                      {frequency === 'one-time' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
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
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-primary/20 bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      frequency === 'weekly' ? 'border-primary' : 'border-gray-400'
                    }`}>
                      {frequency === 'weekly' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
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
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-primary/20 bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      frequency === 'monthly' ? 'border-primary' : 'border-gray-400'
                    }`}>
                      {frequency === 'monthly' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
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
                <SelectTrigger className="h-10 text-sm border-primary/20">
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
