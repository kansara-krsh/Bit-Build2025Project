import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, Search, Filter, Star, Download, DollarSign, 
  TrendingUp, Grid, List, ChevronDown, Eye, Heart
} from 'lucide-react';
import Layout from '../components/Layout';
import BackgroundSpline from '../components/BackgroundSpline';

function MarketplacePage() {
  const [workflows, setWorkflows] = useState([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all'); // all, free, paid
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, popular, rating, price_low, price_high
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  useEffect(() => {
    fetchCategories();
    fetchWorkflows();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [workflows, selectedCategory, priceFilter, searchQuery, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/marketplace/categories');
      const data = await response.json();
      if (data.success) {
        setCategories([{ id: 'all', name: 'All Workflows', icon: '🌟' }, ...data.categories]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(priceFilter !== 'all' && { price_type: priceFilter }),
        ...(searchQuery && { search: searchQuery }),
        sort_by: sortBy
      });
      
      const response = await fetch(`http://localhost:8000/api/marketplace/workflows?${params}`);
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.workflows);
        setFilteredWorkflows(data.workflows);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...workflows];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(w => w.category === selectedCategory);
    }
    
    // Apply price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(w => w.price === 0);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(w => w.price > 0);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.title?.toLowerCase().includes(query) ||
        w.description?.toLowerCase().includes(query) ||
        w.author?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.downloads || 0) - (a.downloads || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    
    setFilteredWorkflows(filtered);
  };

  const WorkflowCard = ({ workflow }) => (
    <Link to={`/marketplace/${workflow.id}`}>
      <div className="group bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
        {/* Thumbnail */}
        <div className="relative h-48 bg-gradient-to-br from-[rgb(173,248,45)]/20 to-purple-500/20 overflow-hidden">
          {workflow.thumbnail ? (
            <img 
              src={workflow.thumbnail} 
              alt={workflow.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {categories.find(c => c.id === workflow.category)?.icon || '📦'}
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            {workflow.price === 0 ? (
              <span className="px-3 py-1 bg-[rgb(173,248,45)] text-black text-xs font-bold rounded-full">
                FREE
              </span>
            ) : (
              <span className="px-3 py-1 bg-white/90 text-black text-xs font-bold rounded-full">
                ${workflow.price}
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[rgb(173,248,45)] transition-colors">
            {workflow.title}
          </h3>
          <p className="text-sm text-white/70 mb-3 line-clamp-2">
            {workflow.description}
          </p>
          
          {/* Author */}
          <div className="text-xs text-white/60 mb-3">
            by <span className="text-white/80 font-semibold">{workflow.author}</span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-[rgb(173,248,45)] text-[rgb(173,248,45)]" />
                <span>{workflow.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{workflow.downloads || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-1 hover:text-[rgb(173,248,45)] transition-colors">
                <Heart className="w-4 h-4" />
              </button>
              <button className="p-1 hover:text-[rgb(173,248,45)] transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <Layout>
      <BackgroundSpline />
      
      <div style={{ marginTop: '100px' }} className="min-h-screen px-4 py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-[rgb(173,248,45)]/20 rounded-2xl">
                <ShoppingBag className="w-8 h-8 text-[rgb(173,248,45)]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Workflow Marketplace</h1>
                <p className="text-white/70 mt-1">
                  Discover, share, and monetize campaign workflows
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{workflows.length}</div>
                <div className="text-xs text-white/70">Total Workflows</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {workflows.filter(w => w.price === 0).length}
                </div>
                <div className="text-xs text-white/70">Free Workflows</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {workflows.reduce((sum, w) => sum + (w.downloads || 0), 0)}
                </div>
                <div className="text-xs text-white/70">Total Downloads</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {categories.length - 1}
                </div>
                <div className="text-xs text-white/70">Categories</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                />
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/20 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-gray-900">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
              </div>
              
              {/* Price Filter */}
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/20 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                >
                  <option value="all" className="bg-gray-900">All Prices</option>
                  <option value="free" className="bg-gray-900">Free Only</option>
                  <option value="paid" className="bg-gray-900">Paid Only</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
              </div>
            </div>
            
            {/* Sort and View Options */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                >
                  <option value="newest" className="bg-gray-900">Newest</option>
                  <option value="popular" className="bg-gray-900">Most Popular</option>
                  <option value="rating" className="bg-gray-900">Highest Rated</option>
                  <option value="price_low" className="bg-gray-900">Price: Low to High</option>
                  <option value="price_high" className="bg-gray-900">Price: High to Low</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-[rgb(173,248,45)] text-black' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-[rgb(173,248,45)] text-black' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-white/70">
              Showing <span className="text-white font-semibold">{filteredWorkflows.length}</span> workflow{filteredWorkflows.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Workflows Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[rgb(173,248,45)] border-t-transparent"></div>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center">
              <ShoppingBag className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No workflows found</h3>
              <p className="text-white/70 mb-6">Try adjusting your filters or search query</p>
              <Link 
                to="/marketplace/create"
                className="inline-block px-6 py-3 bg-[rgb(173,248,45)] text-black font-semibold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all hover:scale-105"
              >
                Create First Workflow
              </Link>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredWorkflows.map(workflow => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          )}

          {/* Create Workflow CTA */}
          <div className="mt-12 bg-gradient-to-br from-[rgb(173,248,45)]/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-8 border border-[rgb(173,248,45)]/30 text-center">
            <TrendingUp className="w-12 h-12 text-[rgb(173,248,45)] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Share Your Workflow</h3>
            <p className="text-white/70 mb-6 max-w-2xl mx-auto">
              Have an amazing workflow? Share it with the community and earn revenue!
            </p>
            <Link 
              to="/marketplace/create"
              className="inline-block px-8 py-3 bg-[rgb(173,248,45)] text-black font-semibold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all hover:scale-105"
            >
              List Your Workflow
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MarketplacePage;
