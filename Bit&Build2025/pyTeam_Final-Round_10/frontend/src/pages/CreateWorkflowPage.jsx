import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, X, Plus, DollarSign, Tag, Image as ImageIcon,
  FileText, Loader2, Check
} from 'lucide-react';
import Layout from '../components/Layout';
import BackgroundSpline from '../components/BackgroundSpline';

function CreateWorkflowPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'marketing',
    price: 0,
    author: '',
    author_email: '',
    thumbnail: '',
    images: [],
    workflow_data: {},
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [workflowFile, setWorkflowFile] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/marketplace/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (file, isThumbnail = false) => {
    try {
      setUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const response = await fetch('http://localhost:8000/api/marketplace/upload-image', {
        method: 'POST',
        body: uploadFormData
      });
      
      const data = await response.json();
      if (data.success) {
        if (isThumbnail) {
          setFormData(prev => ({ ...prev, thumbnail: data.url }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            images: [...prev.images, data.url]
          }));
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleWorkflowFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          setFormData(prev => ({ ...prev, workflow_data: jsonData }));
          setWorkflowFile(file);
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description || !formData.author) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!workflowFile && Object.keys(formData.workflow_data).length === 0) {
      alert('Please upload a workflow file');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/marketplace/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Workflow listed successfully!');
        navigate(`/marketplace/${data.workflow.id}`);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <BackgroundSpline />
      
  <div className="min-h-screen px-4 py-20 pt-28 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">List Your Workflow</h1>
            <p className="text-white/70">
              Share your workflow with the community and earn revenue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Complete Social Media Marketing Campaign"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what your workflow does, what problems it solves, and what makes it unique..."
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors resize-none"
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-gray-900">
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2 text-sm">
                      Price (USD) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-1">Set to 0 for free workflow</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Author Information */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Author Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="John Doe"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.author_email}
                    onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Workflow File */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Workflow File <span className="text-red-400">*</span>
              </h2>
              
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[rgb(173,248,45)]/50 transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleWorkflowFileUpload}
                  className="hidden"
                  id="workflow-file"
                />
                <label htmlFor="workflow-file" className="cursor-pointer">
                  {workflowFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <Check className="w-8 h-8 text-[rgb(173,248,45)]" />
                      <div>
                        <div className="text-white font-semibold">{workflowFile.name}</div>
                        <div className="text-sm text-white/60">Click to change file</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                      <div className="text-white/80 mb-1">Upload Workflow JSON</div>
                      <div className="text-sm text-white/60">
                        Click to browse or drag and drop your workflow file
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images & Screenshots
              </h2>
              
              {/* Thumbnail */}
              <div className="mb-6">
                <label className="block text-white/80 mb-2 text-sm">Thumbnail (Recommended)</label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-[rgb(173,248,45)]/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], true)}
                    className="hidden"
                    id="thumbnail"
                    disabled={uploadingImage}
                  />
                  <label htmlFor="thumbnail" className="cursor-pointer">
                    {formData.thumbnail ? (
                      <div className="relative inline-block">
                        <img 
                          src={formData.thumbnail} 
                          alt="Thumbnail" 
                          className="h-32 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, thumbnail: '' });
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-[rgb(173,248,45)] animate-spin mx-auto" />
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                        <div className="text-sm text-white/80">Upload Thumbnail</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Additional Images */}
              <div>
                <label className="block text-white/80 mb-2 text-sm">Additional Images</label>
                <div className="grid grid-cols-4 gap-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={img} 
                        alt={`Screenshot ${idx + 1}`} 
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.images.length < 8 && (
                    <div className="border-2 border-dashed border-white/20 rounded-lg h-24 flex items-center justify-center hover:border-[rgb(173,248,45)]/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], false)}
                        className="hidden"
                        id={`image-${formData.images.length}`}
                        disabled={uploadingImage}
                      />
                      <label htmlFor={`image-${formData.images.length}`} className="cursor-pointer p-4">
                        {uploadingImage ? (
                          <Loader2 className="w-6 h-6 text-[rgb(173,248,45)] animate-spin" />
                        ) : (
                          <Plus className="w-6 h-6 text-white/40" />
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </h2>
              
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tags (e.g., social media, automation)"
                  className="flex-1 p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 py-3 bg-[rgb(173,248,45)] text-black font-semibold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm text-white flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-8 py-4 bg-[rgb(173,248,45)] text-black font-bold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Publish Workflow
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="px-8 py-4 bg-white/5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default CreateWorkflowPage;
