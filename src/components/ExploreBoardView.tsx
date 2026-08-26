import React, { useState } from 'react';
import { CuriousBoardPost, UserProfile, PublicProfile, SparkThinker } from '../types';
import { Sparkles, MessageCircle, Plus, Send, X, ArrowRight, Tag, Lightbulb, Users, Compass } from 'lucide-react';
import { sparkService } from '../services/sparkService';

interface ExploreBoardViewProps {
  posts: CuriousBoardPost[];
  onAddPost: (newPost: CuriousBoardPost) => void;
  currentUser: UserProfile | null;
  onOpenSpark: (sparkId: string) => void;
  onSelectProfile?: (profile: PublicProfile) => void;
  allProfiles?: (UserProfile | PublicProfile)[];
  onOpenOnboarding: () => void;
}

export const ExploreBoardView: React.FC<ExploreBoardViewProps> = ({
  posts = [],
  onAddPost,
  currentUser,
  onOpenSpark,
  onSelectProfile,
  allProfiles = [],
  onOpenOnboarding,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isPostingModalOpen, setIsPostingModalOpen] = useState<boolean>(false);
  const [postContent, setPostContent] = useState<string>('');
  const [postTagsInput, setPostTagsInput] = useState<string>('Philosophy, AI');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const allTags = ['All', 'AI', 'Philosophy', 'Hardware', 'Design', 'Architecture', 'Books', 'Psychology', 'Film', 'Optics'];

  const filteredPosts = (posts || []).filter((p) => {
    if (selectedTag === 'All') return true;
    return (p.tags || []).includes(selectedTag);
  });

  const findProfile = (userId: string): PublicProfile | null => {
    if (!userId || !allProfiles) return null;
    const found = allProfiles.find((p) => (p as any).uid === userId || p.id === userId);
    return (found as PublicProfile) || null;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || isSubmitting) return;

    if (!currentUser) {
      onOpenOnboarding();
      return;
    }

    setIsSubmitting(true);
    const tags = postTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const currentUserId = currentUser.uid || currentUser.id || 'me';

    try {
      const created = await sparkService.createSpark({
        authorId: currentUserId,
        authorName: currentUser.name || 'Alex Rivera',
        authorLocation: currentUser.location || currentUser.city || 'Worldwide',
        authorRole: currentUser.role || 'Thinker',
        authorAvatar: currentUser.avatarUrl || currentUser.profilePhoto,
        content: postContent.trim(),
        tags: tags.length ? tags : ['Curiosity', 'Ideas'],
        intents: currentUser.intents || ['Exchange Ideas'],
      });

      onAddPost(created);
      setPostContent('');
      setIsPostingModalOpen(false);
      // Automatically open the newly created spark discussion
      onOpenSpark(created.id);
    } catch (err) {
      console.error('Failed to create spark:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F5F0] py-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-28 selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#1E1E24]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono-code">
            <Sparkles className="w-4 h-4 text-[#D4FF3F]" />
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-bold">
              Live Curiosity Spark
            </span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
            Questions & Rabbit Holes
          </h1>
          <p className="font-sans-clean text-sm text-[#8E8E93] mt-1.5 max-w-xl">
            Public ideas, questions, and philosophical rabbit holes. Dive into the open discussion or share your inquiry.
          </p>
        </div>

        <button
          id="post-curious-thought-btn"
          onClick={() => (currentUser ? setIsPostingModalOpen(true) : onOpenOnboarding())}
          className="btn-primary self-start md:self-auto flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Post Thought / Question</span>
        </button>
      </div>

      {/* 2. Tag Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none font-mono-code">
        <span className="text-[10px] text-[#777780] uppercase tracking-widest font-bold pr-2 whitespace-nowrap">
          Topic:
        </span>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all border ${
              selectedTag === tag
                ? 'bg-lime-grained text-[#080808] border-[#D4FF3F] font-bold'
                : 'bg-[#101014] text-[#8E8E93] border-[#222228] hover:border-[#383844] hover:text-[#F5F5F0]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 3. Posts Feed */}
      {filteredPosts.length === 0 ? (
        <div className="border border-dashed border-[#222228] bg-[#0E0E12] p-12 text-center text-[#8E8E93]">
          <Compass className="w-10 h-10 text-[#555560] mx-auto mb-3" />
          <h3 className="font-editorial text-2xl text-[#F5F5F0] font-light mb-2">
            No sparks under #{selectedTag}
          </h3>
          <p className="text-xs text-[#8E8E93] max-w-md mx-auto mb-6">
            Be the first mind to start a discussion in this topic.
          </p>
          <button
            onClick={() => setIsPostingModalOpen(true)}
            className="btn-primary text-xs"
          >
            Start #{selectedTag} Discussion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => {
            const thinkersCount = post.repliesCount || 0;
            const thinkersList: SparkThinker[] = post.thinkersSummary
              ? (Object.values(post.thinkersSummary) as SparkThinker[]).slice(0, 3)
              : [];

            return (
              <article
                key={post.id}
                className="border border-[#1E1E24] bg-[#0E0E12] p-6 sm:p-7 flex flex-col justify-between hover:border-[#3A3A48] transition-all group"
              >
                <div>
                  {/* Author bar */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt={post.authorName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover border border-[#26262E] cursor-pointer hover:border-[#D4FF3F] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const profile = findProfile(post.authorId);
                          if (profile && onSelectProfile) onSelectProfile(profile);
                        }}
                      />
                      <div>
                        <h3
                          onClick={(e) => {
                            e.stopPropagation();
                            const profile = findProfile(post.authorId);
                            if (profile && onSelectProfile) onSelectProfile(profile);
                          }}
                          className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0] font-sans-clean hover:text-[#D4FF3F] cursor-pointer transition-colors"
                        >
                          {post.authorName}
                        </h3>
                        <p className="text-[10px] text-[#7A7A82] uppercase tracking-widest font-mono-code">
                          {post.authorLocation} · {post.authorRole}
                        </p>
                      </div>
                    </div>

                    <span className="text-[9px] text-[#7A7A82] uppercase tracking-widest font-mono-code">
                      {post.timestamp}
                    </span>
                  </div>

                  {/* Content (Clickable -> Opens Spark Discussion) */}
                  <div
                    onClick={() => onOpenSpark(post.id)}
                    className="cursor-pointer"
                  >
                    <p className="font-editorial text-xl sm:text-2xl text-[#F5F5F0] leading-relaxed mb-6 font-light group-hover:text-[#FFFFFF] transition-colors">
                      “{post.content}”
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(post.tags || []).map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(tag);
                        }}
                        className="text-[10px] font-mono-code text-[#8E8E93] bg-[#121216] border border-[#202026] hover:border-[#D4FF3F]/40 hover:text-[#D4FF3F] px-2.5 py-0.5 cursor-pointer transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-4 border-t border-[#1C1C22] flex items-center justify-between">
                  <div
                    onClick={() => onOpenSpark(post.id)}
                    className="flex items-center gap-2 text-xs text-[#8E8E93] font-mono-code cursor-pointer hover:text-[#F5F5F0] transition-colors"
                  >
                    {/* Avatars mini stack */}
                    {thinkersList.length > 0 && (
                      <div className="flex -space-x-2">
                        {thinkersList.map((t, idx) => (
                          <img
                            key={t.id || idx}
                            src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80'}
                            alt={t.name}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full border border-[#0E0E12] object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-[#666670]" />
                      <span className="text-[10px] uppercase tracking-widest">
                        {thinkersCount} {thinkersCount === 1 ? 'thinker' : 'thinkers'} exploring
                      </span>
                    </div>
                  </div>

                  <button
                    id={`reply-thought-${post.id}`}
                    onClick={() => onOpenSpark(post.id)}
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                  >
                    <span>Talk about this</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </article>
            );
          })}
        </div>
      )}

      {/* 4. Post Thought Modal */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md p-4 selection:bg-[#D4FF3F] selection:text-[#080808]">
          <div className="relative w-full max-w-lg border border-[#24242C] bg-[#101014] p-6 sm:p-8 shadow-2xl text-[#F5F5F0]">
            
            <button
              onClick={() => setIsPostingModalOpen(false)}
              className="absolute right-5 top-5 p-2 text-[#8E8E93] hover:text-[#F5F5F0]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <Lightbulb className="w-5 h-5 text-[#D4FF3F]" />
              <h3 className="font-editorial text-2xl text-[#F5F5F0] font-light">
                Share a Question or Rabbit Hole
              </h3>
            </div>

            <p className="text-xs text-[#8E8E93] mb-5 leading-relaxed">
              Post an unfiltered thought, an open thesis, or a question you'd love to discuss with someone interesting in the public forum.
            </p>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-mono-code font-bold block mb-1">
                  What's on your mind?
                </label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="e.g. Looking for someone obsessed with biomimicry robotics to explore passive flight dynamics..."
                  className="w-full border border-[#24242C] bg-[#09090B] p-3.5 text-xs sm:text-sm text-[#F5F5F0] placeholder-[#64646E] focus:border-[#D4FF3F]/60 focus:outline-none leading-relaxed font-sans-clean"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-mono-code font-bold block mb-1">
                  Topic Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={postTagsInput}
                  onChange={(e) => setPostTagsInput(e.target.value)}
                  placeholder="e.g. AI, Philosophy, Robotics"
                  className="w-full border border-[#24242C] bg-[#09090B] px-3.5 py-2.5 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#1E1E24]">
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!postContent.trim() || isSubmitting}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish to Spark'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
