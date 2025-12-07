import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
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
import TagSelector from '../components/TagSelector';

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
    latitude: null,
    longitude: null,
    duration: '', 
    tags: [],
    image: ''
  });


  const [estimatedHours, setEstimatedHours] = useState(3);
  const [date, setDate] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [frequency, setFrequency] = useState('one-time');
  const [isGroupActivity, setIsGroupActivity] = useState(false);

  const [selectedTags, setSelectedTags] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Location autocomplete states
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      api.get(`/posts/${id}/`)
        .then(response => {
          const { title, description, post_type, location, duration, tags, frequency, participant_count, date, latitude, longitude, image } = response.data;
          
          // Convert tags from API (string array) to TagSelector format
          const tagObjects = Array.isArray(tags) ? tags.map(tagName => ({
            name: tagName,
            label: tagName,
            // Note: IDs will be resolved when TagSelector loads options
          })) : [];
          
          setSelectedTags(tagObjects);
          
          setPost({ 
            title, 
            description, 
            post_type, 
            location, 
            latitude: latitude || null,
            longitude: longitude || null,
            duration,
            tags: tags, // Keep as array for now
            image: image || ''
          });
          
          setLocationInput(location || '');
          setImagePreview(image || null);
          
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


  const handleTagsChange = (tags) => {
    // TagSelector returns array of tag objects like [{id: 1}, {name: "new tag", is_custom: true}, ...]
    setSelectedTags(tags || []);
    
    // Convert to array of IDs for backend
    const tagIds = (tags || []).map(tag => {
      if (tag.id) {
        return tag.id;
      } else {
        // For new custom tags, we'll send the full object and let backend create them
        // But for now, we'll just track them separately
        return tag;
      }
    });
    
    // Filter out non-ID items and extract IDs
    const idsOnly = tagIds.filter(item => typeof item === 'number');
    setPost(prev => ({ ...prev, tags: idsOnly.length > 0 ? idsOnly : tagIds }));
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
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
    setPost(prev => ({ ...prev, location: value }));
    
    // Debounce için timeout
    const timeoutId = setTimeout(() => {
      searchLocation(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleLocationSelect = (suggestion) => {
    setLocationInput(suggestion.display_name);
    setPost(prev => ({
      ...prev,
      location: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPost(prev => ({ ...prev, image: base64String }));
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPost(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const durationString = `${estimatedHours} hours`;

    // Prepare tags_data: convert to format expected by backend (IDs or tag objects)
    const tags_data = selectedTags.map(tag => {
      if (tag.id) {
        return { id: tag.id };
      } else {
        // Custom tag (no ID yet) - send as object with name
        return {
          name: tag.name || tag.label || tag.value,
          is_custom: true,
          wikidata_id: tag.wikidata_id || null,
          description: tag.description || ''
        };
      }
    });

    const dataToSend = {
      title: post.title,
      description: post.description,
      post_type: post.post_type,
      location: post.location,
      latitude: post.latitude,
      longitude: post.longitude,
      duration: durationString,
      tags_data: tags_data,
      frequency: frequency || null,
      participant_count: participantCount || null,
      date: date || null,
      image: post.image || null,
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Post Image (Optional)</Label>
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Post preview" 
                    className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-white hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label 
                    htmlFor="image-upload" 
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <PenLine className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-600">Click to upload image</span>
                    <span className="text-xs text-gray-400">JPG, PNG, GIF (Max 5MB)</span>
                  </Label>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Tags (Minimum 1 Required)</Label>
              <TagSelector
                value={selectedTags}
                onChange={handleTagsChange}
                placeholder="Search or create tags (e.g., cooking, gardening, coding...)"
                isMulti={true}
              />
              <p className="text-xs text-gray-500 mt-1">
                Search from existing tags or create new ones. You can select multiple tags.
              </p>
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

            {/* Location with Autocomplete */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Location</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type location (e.g., Kadıköy, Beşiktaş...)"
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
                  className="h-10 text-sm border-primary/20"
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
              {post.latitude && post.longitude && (
                <p className="text-xs text-gray-500">
                  Coordinates: {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                className="h-10 text-sm shadow-md"
                disabled={loading || selectedTags.length === 0}
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
