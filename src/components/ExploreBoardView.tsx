import React, { useState } from 'react';
import { CuriousBoardPost, UserProfile, ConnectionIntent } from '../types';
import { Sparkles, MessageCircle, Plus, Send, X, ArrowRight, Tag, Lightbulb, MapPin } from 'lucide-react';

interface ExploreBoardViewProps {
  posts: CuriousBoardPost[];
  onAddPost: (newPost: CuriousBoardPost) => void;
  currentUser: UserProfile | null;
  onConnectWithAuthor: (authorId: string, contextPostText: string) => void;
  onOpenOnboarding: () => void;
}

export const ExploreBoardView: React.FC<ExploreBoardViewProps> = ({
  posts = [],
  onAddPost,
  currentUser,
  onConnectWithAuthor,
  onOpenOnboarding,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isPostingModalOpen, setIsPostingModalOpen] = useState<boolean>(false);
  const [postContent, setPostContent] = useState<string>('');
  const [postTagsInput, setPostTagsInput] = useState<string>('Philosophy, AI');

  const allTags = ['All', 'AI', 'Philosophy', 'Hardware', 'Design', 'Architecture', 'Books', 'Psychology', 'Film'];

  const filteredPosts = (posts || []).filter((p) => {
    if (selectedTag === 'All') return true;
    return (p.tags || []).includes(selectedTag);
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const tags = postTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newPost: CuriousBoardPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser?.id || 'me',
      authorName: currentUser?.name || 'Alex Rivera',
      authorLocation: currentUser?.location || 'San Francisco',
      authorRole: currentUser?.role || 'Builder',
      authorAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      content: postContent.trim(),
      intents: currentUser?.intents || ['Exchange Ideas'],
      tags: tags.length ? tags : ['Curiosity', 'Ideas'],
      timestamp: 'Just now',
      repliesCount: 0,
    };

    onAddPost(newPost);
    setPostContent('');
    setIsPostingModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F0] py-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-24 selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#F5F5F0]/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-[#D4FF3F]" />
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-bold">
              Live Curiosity Spark
            </span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
            Questions & Rabbit Holes
          </h1>
          <p className="font-sans-clean text-sm text-[#969696] mt-1.5 max-w-xl">
            Unfiltered thoughts, active inquiries, and strange ideas posted by members around the globe.
          </p>
        </div>

        <button
          id="post-curious-thought-btn"
          onClick={() => (currentUser ? setIsPostingModalOpen(true) : onOpenOnboarding())}
          className="flex items-center gap-2 bg-[#D4FF3F] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#F5F5F0] transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post a Thought / Question</span>
        </button>
      </div>

      {/* Tag Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold pr-2 whitespace-nowrap">
          Topic:
        </span>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
              selectedTag === tag
                ? 'bg-[#F5F5F0] text-[#0B0B0C]'
                : 'bg-[#151516] text-[#969696] border border-[#F5F5F0]/10 hover:border-[#D4FF3F] hover:text-[#F5F5F0]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="border border-[#F5F5F0]/10 bg-[#151516] p-6 sm:p-7 flex flex-col justify-between hover:border-[#D4FF3F]/50 transition-all"
          >
            <div>
              {/* Author bar */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                    alt={post.authorName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover border border-[#F5F5F0]/10"
                  />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0]">
                      {post.authorName}
                    </h3>
                    <p className="text-[10px] text-[#969696] uppercase tracking-widest">
                      {post.authorLocation} · {post.authorRole}
                    </p>
                  </div>
                </div>

                <span className="text-[9px] text-[#969696] uppercase tracking-widest">
                  {post.timestamp}
                </span>
              </div>

              {/* Content */}
              <p className="font-editorial text-xl sm:text-2xl text-[#F5F5F0] leading-relaxed mb-6 font-light">
                “{post.content}”
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(post.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-[#969696] bg-[#0B0B0C] border border-[#F5F5F0]/5 px-2.5 py-0.5 uppercase tracking-wider"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#F5F5F0]/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#969696]">
                <MessageCircle className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span className="text-[10px] uppercase tracking-widest">{post.repliesCount} thinkers exploring this</span>
              </div>

              <button
                id={`reply-thought-${post.id}`}
                onClick={() => onConnectWithAuthor(post.authorId, post.content)}
                className="inline-flex items-center gap-1.5 bg-[#F5F5F0] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#D4FF3F] transition-all"
              >
                <span>Talk about this</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Post Modal */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0C]/90 backdrop-blur-md p-4 selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
          <div className="relative w-full max-w-lg border border-[#F5F5F0]/10 bg-[#151516] p-6 sm:p-8 shadow-2xl text-[#F5F5F0]">
            
            <button
              onClick={() => setIsPostingModalOpen(false)}
              className="absolute right-5 top-5 p-2 text-[#969696] hover:text-[#F5F5F0]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <Lightbulb className="w-5 h-5 text-[#D4FF3F]" />
              <h3 className="font-editorial text-2xl text-[#F5F5F0] font-light">
                Share a Question or Rabbit Hole
              </h3>
            </div>

            <p className="text-xs text-[#969696] mb-5 leading-relaxed">
              Post an unfiltered thought, an open thesis, or a question you'd love to discuss with someone interesting.
            </p>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                  What's on your mind?
                </label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="e.g. Looking for someone obsessed with biomimicry robotics to explore passive flight dynamics..."
                  className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] p-3.5 text-xs sm:text-sm text-[#F5F5F0] placeholder-[#969696]/60 focus:border-[#D4FF3F] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                  Topic Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={postTagsInput}
                  onChange={(e) => setPostTagsInput(e.target.value)}
                  placeholder="e.g. AI, Philosophy, Robotics"
                  className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2.5 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F0]/10">
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="text-xs font-bold uppercase tracking-widest text-[#969696] hover:text-[#F5F5F0]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!postContent.trim()}
                  className="flex items-center gap-2 bg-[#D4FF3F] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#F5F5F0] disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Spark</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
