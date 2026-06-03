import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogPostBySlug, getBlogPosts } from '../services/supabaseService';
import { BlogPost } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { ArrowLeft, BookOpen, Calendar, Clock, Share2, Tag, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BlogPostDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [recommendations, setRecommendations] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        if (slug) {
          const res = await getBlogPostBySlug(slug);
          setPost(res);

          const allBlogs = await getBlogPosts();
          // Filter recommendations to other active items
          const related = allBlogs
            .filter(b => b.published && b.slug !== slug)
            .slice(0, 2);
          setRecommendations(related);
        }
      } catch (e) {
        console.error('Error loading blog post details:', e);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          <p className="text-sm font-medium text-slate-500">Retrieving article body...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-md text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Article Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">
            The article you are trying to view does not exist on this server, or has been temporarily unlisted by moderation.
          </p>
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all text-sm"
          >
            <ArrowLeft size={16} /> Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back navigation */}
        <div className="mb-6 flex justify-between items-center text-sm">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-600 font-bold transition-colors"
          >
            <ArrowLeft size={16} /> All Articles
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors shadow-sm"
          >
            <Share2 size={13} />
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Article Core */}
        <article className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-12">
          {/* Cover image banner */}
          {post.coverImage && (
            <div className="h-64 sm:h-96 w-full relative bg-slate-200">
              <img 
                src={post.coverImage} 
                alt={post.title} 
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Article Container Padding */}
          <div className="p-6 sm:p-10 md:p-14">
            
            {/* Metadata and Title */}
            <div className="border-b border-slate-100 pb-6 mb-8">
              <div className="flex gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-[10px] font-black tracking-wider uppercase">
                  <Tag size={10} /> {post.category}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black tracking-wider uppercase">
                  {post.readTime}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                {post.title}
              </h1>

              {/* Author & Date Card */}
              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User size={16} className="text-slate-400" />
                  <span className="font-semibold text-slate-700">{post.authorName}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-slate-400" />
                  <span>{new Date(post.createdAt).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}</span>
                </div>
              </div>
            </div>

            {/* Markdown rendered document */}
            <div className="prose max-w-none prose-slate">
              <MarkdownRenderer content={post.content} />
            </div>

          </div>
        </article>

        {/* Read More Section */}
        {recommendations.length > 0 && (
          <div className="pt-8 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">
              You Might Also Enjoy
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {recommendations.map(blog => (
                <div 
                  key={blog.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className="text-brand-600 text-[10px] font-black uppercase tracking-wider block mb-2">
                      {blog.category}
                    </span>
                    <h4 className="font-bold text-slate-900 tracking-tight hover:text-brand-600 transition-colors mb-2 line-clamp-2">
                      <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h4>
                    <p className="text-slate-550 text-xs line-clamp-2 mb-4 font-medium leading-relaxed">
                      {blog.excerpt}
                    </p>
                  </div>
                  <Link 
                    to={`/blog/${blog.slug}`}
                    className="text-brand-600 text-xs font-bold hover:text-brand-700 transition-colors flex items-center gap-1 mt-2"
                  >
                    Read Story →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BlogPostDetails;
