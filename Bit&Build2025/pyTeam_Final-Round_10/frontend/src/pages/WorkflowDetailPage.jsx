import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, Star, Calendar, User, DollarSign, 
  Tag, Share2, Heart, ShoppingCart, Edit, Trash2, Eye
} from 'lucide-react';
import Layout from '../components/Layout';
import BackgroundSpline from '../components/BackgroundSpline';

function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchWorkflowDetail();
  }, [id]);

  const fetchWorkflowDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/marketplace/workflows/${id}`);
      const data = await response.json();
      if (data.success) {
        setWorkflow(data.workflow);
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/marketplace/workflows/${id}/download`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Download the workflow data
        const blob = new Blob([JSON.stringify(data.workflow_data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workflow.title.replace(/\s+/g, '-').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Refresh to show updated download count
        fetchWorkflowDetail();
        
        alert('Workflow downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading workflow:', error);
      alert('Failed to download workflow');
    }
  };

  const handleSubmitReview = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/marketplace/workflows/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: 'Anonymous', // TODO: Get from auth
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowReviewForm(false);
        setReviewData({ rating: 5, comment: '' });
        fetchWorkflowDetail();
        alert('Review submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  if (loading) {
    return (
      <Layout>
        <BackgroundSpline />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[rgb(173,248,45)] border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!workflow) {
    return (
      <Layout>
        <BackgroundSpline />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Workflow not found</h2>
            <Link 
              to="/marketplace"
              className="inline-block px-6 py-3 bg-[rgb(173,248,45)] text-black font-semibold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const images = workflow.images && workflow.images.length > 0 
    ? workflow.images 
    : workflow.thumbnail 
    ? [workflow.thumbnail] 
    : [];

  return (
    <Layout>
      <BackgroundSpline />
      
      <div style={{ marginTop: '100px' }} className="min-h-screen px-4 py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Marketplace</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Image */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {images.length > 0 ? (
                  <img 
                    src={images[selectedImage]} 
                    alt={workflow.title}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-[rgb(173,248,45)]/20 to-purple-500/20 flex items-center justify-center text-8xl">
                    📦
                  </div>
                )}
                
                {/* Thumbnail Gallery */}
                {images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx 
                            ? 'border-[rgb(173,248,45)]' 
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">About This Workflow</h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-line">
                  {workflow.description}
                </p>
              </div>

              {/* Tags */}
              {workflow.tags && workflow.tags.length > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {workflow.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-white/5 border border-white/20 rounded-full text-sm text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-[rgb(173,248,45)]" />
                    Reviews ({workflow.reviews?.length || 0})
                  </h2>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-4 py-2 bg-[rgb(173,248,45)] text-black font-semibold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all text-sm"
                  >
                    Write Review
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="mb-4">
                      <label className="block text-white/80 mb-2 text-sm">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                            className="transition-colors"
                          >
                            <Star 
                              className={`w-6 h-6 ${
                                star <= reviewData.rating 
                                  ? 'fill-[rgb(173,248,45)] text-[rgb(173,248,45)]' 
                                  : 'text-white/30'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-white/80 mb-2 text-sm">Comment</label>
                      <textarea
                        value={reviewData.comment}
                        onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                        placeholder="Share your experience..."
                        className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors resize-none"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSubmitReview}
                        className="px-4 py-2 bg-[rgb(173,248,45)] text-black font-semibold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all text-sm"
                      >
                        Submit Review
                      </button>
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 bg-white/5 text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {workflow.reviews && workflow.reviews.length > 0 ? (
                    workflow.reviews.map(review => (
                      <div key={review.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-white">{review.user}</div>
                            <div className="flex gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating 
                                      ? 'fill-[rgb(173,248,45)] text-[rgb(173,248,45)]' 
                                      : 'text-white/30'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-white/60">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-white/60">
                      No reviews yet. Be the first to review!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Purchase Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 sticky top-24">
                <h1 className="text-2xl font-bold text-white mb-2">{workflow.title}</h1>
                
                {/* Price */}
                <div className="mb-6">
                  {workflow.price === 0 ? (
                    <div className="text-3xl font-bold text-[rgb(173,248,45)]">FREE</div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">${workflow.price}</span>
                      <span className="text-white/60">one-time</span>
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-4 bg-[rgb(173,248,45)] text-black font-bold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all hover:scale-105 flex items-center justify-center gap-2 mb-4"
                >
                  <Download className="w-5 h-5" />
                  {workflow.price === 0 ? 'Download Free' : 'Purchase & Download'}
                </button>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-white text-sm">
                    <Heart className="w-4 h-4" />
                    Save
                  </button>
                  <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-white text-sm">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                {/* Stats */}
                <div className="space-y-3 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70 flex items-center gap-2">
                      <Star className="w-4 h-4 text-[rgb(173,248,45)]" />
                      Rating
                    </span>
                    <span className="text-white font-semibold">
                      {workflow.rating?.toFixed(1) || '0.0'} / 5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Downloads
                    </span>
                    <span className="text-white font-semibold">{workflow.downloads || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Published
                    </span>
                    <span className="text-white font-semibold">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Author
                    </span>
                    <span className="text-white font-semibold">{workflow.author}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default WorkflowDetailPage;
