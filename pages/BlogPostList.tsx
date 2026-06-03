import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBlogPosts } from '../services/supabaseService';
import { BlogPost } from '../types';
import { BookOpen, Calendar, ChevronRight, Clock, Search, Tag, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BlogPostList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const res = await getBlogPosts();
        // Return only published posts for users
        setPosts(res.filter(p => p.published));
      } catch (e) {
        console.error('Error loading blog posts:', e);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          <p className="text-sm font-medium text-slate-500">Retrieving articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-brand-600 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
            <BookOpen size={12} /> CALIBERDESK CHRONICLES
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Market Insights & Life Tips
          </h1>
          <p className="text-slate-650 text-sm sm:text-base max-w-2xl mx-auto font-medium">
            Stay ahead of commercial real estate peaks, dynamic mortgage strategies, and master workspace design models.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          {/* Categories Tab */}
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Featured Post (First element when unfiltered) */}
        {filteredPosts.length > 0 && searchTerm === '' && selectedCategory === 'All' && (
          <div className="mb-12 bg-white rounded-3xl overflow-hidden border border-slate-150 shadow-sm grid grid-cols-1 md:grid-cols-12 hover:shadow-md transition-shadow">
            <div className="md:col-span-7 h-64 sm:h-80 md:h-full relative overflow-hidden bg-slate-100">
              <img 
                src={filteredPosts[0].coverImage || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"}
                alt={filteredPosts[0].title}
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-4 left-4 bg-brand-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                FEATURED STORY
              </span>
            </div>
            <div className="md:col-span-5 p-6 sm:p-10 flex flex-col justify-center">
              <span className="text-brand-600 text-xs font-bold uppercase tracking-wider mb-2">
                {filteredPosts[0].category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                <Link to={`/blog/${filteredPosts[0].slug}`} className="hover:text-brand-600 transition-colors">
                  {filteredPosts[0].title}
                </Link>
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                {filteredPosts[0].excerpt}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mb-6">
                <div className="flex items-center gap-1">
                  <User size={14} className="text-slate-400" />
                  <span>{filteredPosts[0].authorName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-400" />
                  <span>{filteredPosts[0].readTime}</span>
                </div>
              </div>

              <Link
                to={`/blog/${filteredPosts[0].slug}`}
                className="inline-flex items-center gap-2 text-brand-600 font-bold hover:gap-3 transition-all text-sm group"
              >
                Read Full Analysis <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {/* Regular list / grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">No Articles Found</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              We couldn't find any documents matching your filters. Try selecting another category or typing another keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts
              .slice(searchTerm === '' && selectedCategory === 'All' ? 1 : 0)
              .map((post, idx) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                >
                  <div className="h-48 relative overflow-hidden bg-slate-100 group">
                    <img 
                      src={post.coverImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 shadow-sm">
                      {post.category}
                    </span>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{new Date(post.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight line-clamp-2 hover:text-brand-600 transition-colors">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-slate-500 text-xs mb-4 line-clamp-3 font-medium leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-mono border border-slate-200">
                          {post.authorName.charAt(0)}
                        </span>
                        {post.authorName}
                      </span>
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="text-brand-600 text-xs font-bold hover:text-brand-700 transition-colors flex items-center gap-1"
                      >
                        Read <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default BlogPostList;
