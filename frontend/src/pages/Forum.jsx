import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { MessageCircle, Send, Loader2, PenLine, X } from 'lucide-react';
import TagSelector from '../components/TagSelector';

export default function Forum() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    tag_ids: [],
    wikidata_ids: [],
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to create a topic');
      navigate('/login');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting form:');
      console.log('- title:', formData.title);
      console.log('- content:', formData.content);
      console.log('- tag_ids:', formData.tag_ids);
      console.log('- wikidata_ids:', formData.wikidata_ids);
      
      const response = await api.post('/forum-topics/', {
        title: formData.title,
        content: formData.content,
        image: formData.image || null,
        tag_ids: formData.tag_ids || [],
        wikidata_ids: formData.wikidata_ids || [],
      });
      
      console.log('Topic created successfully:', response.data);

      toast.success('Topic created successfully!');
      navigate(`/forum/${response.data.id}`);
    } catch (error) {
      console.error('Error creating topic:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create topic';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (tags) => {
    // TagSelector isMulti=true olduğunda tag array'i döner
    console.log('handleTagChange received:', tags);
    
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      console.log('No tags selected, clearing tag_ids');
      setSelectedTags([]);
      setFormData(prev => ({
        ...prev,
        tag_ids: [],
      }));
      return;
    }

    setSelectedTags(tags);
    
    
    const tagIds = tags
      .filter(tag => tag && (tag.id || tag.wikidata_id)) // Include tags with id or wikidata_id
      .map(tag => {
        // If tag has id, use it
        if (tag.id !== undefined && tag.id !== null) {
          const tagId = typeof tag.id === 'number' ? tag.id : parseInt(tag.id, 10);
          if (!isNaN(tagId) && tagId > 0) {
            return tagId;
          }
        }
        return null;
      })
      .filter(id => id !== null);
    
    // Collect wikidata_ids for tags without id
    const wikidataIds = tags
      .filter(tag => tag && tag.wikidata_id && !tag.id)
      .map(tag => tag.wikidata_id);
    
    console.log('Extracted tag_ids:', tagIds);
    console.log('Extracted wikidata_ids:', wikidataIds);
    console.log('Setting formData.tag_ids to:', tagIds);
    
    
    setFormData(prev => ({
      ...prev,
      tag_ids: tagIds,
      wikidata_ids: wikidataIds, 
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData(prev => ({ ...prev, image: base64String }));
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-md">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-primary font-normal text-lg">Create New Topic</h1>
            <p className="text-xs text-gray-500">Start a new discussion in the community</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title *
              </Label>
              <Input
                id="title"
                type="text"
                required
                placeholder="Enter topic title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="h-10 text-sm border-primary/20"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                Content *
              </Label>
              <Textarea
                id="content"
                required
                placeholder="Write your topic content..."
                rows={8}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="text-sm border-primary/20 resize-none"
              />
            </div>

            {/* Separator */}
            <div className="my-6 border-t border-gray-200"></div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Topic Image (Optional)
              </Label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Topic preview"
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

            {/* Semantic Tag */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Semantic Tag (Optional)
              </Label>
              <TagSelector
                value={selectedTags}
                onChange={handleTagChange}
                placeholder="Select tags for this topic (e.g., cooking, gardening, coding...)"
                isMulti={true}
                showAllTagsOnOpen={true}
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose a tag that best describes your topic. This helps others find and categorize your discussion.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                className="flex-1 h-10 text-sm shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Topic
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="h-10 text-sm shadow-sm"
                onClick={() => navigate('/forums')}
                disabled={loading}
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

