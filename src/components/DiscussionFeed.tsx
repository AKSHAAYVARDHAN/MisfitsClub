import React, { useState, useEffect, useMemo } from 'react';
import { SpacePost, UserProfile, PublicProfile, DiscussionPostType } from '../types';
import { discussionService } from '../services/discussionService';
import { CreatePostComposer } from './CreatePostComposer';
import { DiscussionPostCard } from './DiscussionPostCard';
import { 
  MessageSquare, 
  HelpCircle, 
  Lightbulb, 
  Loader2, 
  Sparkles, 
  ArrowUpDown, 
  Filter,
  Plus
} from 'lucide-react';

interface DiscussionFeedProps {
  spaceId: string;
  spaceOwnerId: string;
  currentUser: UserProfile | null;
  isMember: boolean;
  onSelectAuthor?: (author: PublicProfile) => void;
  onPromptJoin?: () => void;
}

type SortOption = 'newest' | 'most-discussed';
type FilterOption = 'all' | 'Discussion' | 'Question' | 'Idea';

export const DiscussionFeed: React.FC<DiscussionFeedProps> = ({
  spaceId,
  spaceOwnerId,
  currentUser,
  isMember,
  onSelectAuthor,
  onPromptJoin,
}) => {
  const [posts, setPosts] = useState<SpacePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterType, setFilterType] = useState<FilterOption>('all');
  const [userReactedPostIds, setUserReactedPostIds] = useState<Set<string>>(new Set());

  const currentUserId = currentUser?.uid || currentUser?.id;

  // Real-time subscription to posts in this space
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = discussionService.subscribePosts(spaceId, (fetchedPosts) => {
      setPosts(fetchedPosts);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [spaceId]);

  // Subscribe to user's reactions in this space
  useEffect(() => {
    if (!currentUserId || posts.length === 0) {
      setUserReactedPostIds(new Set());
      return;
    }

    const postIds = posts.map((p) => p.id);
    const unsubscribe = discussionService.subscribeUserReactionsForSpace(
      spaceId,
      currentUserId,
      postIds,
      (reactedSet) => {
        setUserReactedPostIds(reactedSet);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [spaceId, currentUserId, posts]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((p) => p.type === filterType);
    }

    // Sort
    if (sortOption === 'most-discussed') {
      result.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    } else {
      // Newest first (default)
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [posts, filterType, sortOption]);

  const handleScrollToComposer = () => {
    const composer = document.getElementById('discussion-composer-collapsed') || document.getElementById('discussion-composer-expanded');
    if (composer) {
      composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      composer.click();
    }
  };

  return (
    <div id="space-discussion-feed" className="space-y-6">
      {/* Discussion Composer */}
      <CreatePostComposer
        spaceId={spaceId}
        currentUser={currentUser}
        isMember={isMember}
        onPromptJoin={onPromptJoin}
      />

      {/* Feed Filter & Sort Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#202028]">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-mono-code transition-all ${
              filterType === 'all'
                ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                : 'text-[#888] hover:text-[#CCC] bg-[#121216] border border-[#24242C]'
            }`}
          >
            All Discussions ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Discussion')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-mono-code transition-all ${
              filterType === 'Discussion'
                ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                : 'text-[#888] hover:text-[#CCC] bg-[#121216] border border-[#24242C]'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Discussions
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Question')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-mono-code transition-all ${
              filterType === 'Question'
                ? 'bg-[#FFB84C] text-[#080808] font-bold'
                : 'text-[#888] hover:text-[#CCC] bg-[#121216] border border-[#24242C]'
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            Questions
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Idea')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-mono-code transition-all ${
              filterType === 'Idea'
                ? 'bg-[#4CC9F0] text-[#080808] font-bold'
                : 'text-[#888] hover:text-[#CCC] bg-[#121216] border border-[#24242C]'
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            Ideas
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-mono-code text-[#777]">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort:</span>
          </div>
          <div className="flex items-center bg-[#121216] border border-[#24242C] p-0.5">
            <button
              type="button"
              onClick={() => setSortOption('newest')}
              className={`px-2.5 py-1 text-xs font-mono-code transition-all ${
                sortOption === 'newest'
                  ? 'bg-[#22222A] text-[#F5F5F0] font-bold'
                  : 'text-[#777] hover:text-[#BBB]'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSortOption('most-discussed')}
              className={`px-2.5 py-1 text-xs font-mono-code transition-all ${
                sortOption === 'most-discussed'
                  ? 'bg-[#22222A] text-[#F5F5F0] font-bold'
                  : 'text-[#777] hover:text-[#BBB]'
              }`}
            >
              Most Discussed
            </button>
          </div>
        </div>
      </div>

      {/* Main Posts Feed */}
      {isLoading ? (
        <div className="py-16 text-center font-mono-code text-xs text-[#8A8A8A]">
          <Loader2 className="w-6 h-6 animate-spin text-[#D4FF3F] mx-auto mb-2" />
          Loading discussions...
        </div>
      ) : filteredAndSortedPosts.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center bg-[#0C0C0F] border border-[#202026] p-8">
          <div className="w-12 h-12 bg-[#141418] border border-[#2A2A32] flex items-center justify-center text-[#D4FF3F] mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-mono-code text-[#F5F5F0] mb-1">
            No discussions yet.
          </h3>
          <p className="text-xs text-[#888] max-w-sm mx-auto mb-6 leading-relaxed font-sans-clean">
            Start a thought, question, or idea.
          </p>

          {isMember ? (
            <button
              type="button"
              onClick={handleScrollToComposer}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4FF3F] hover:bg-[#b8e62f] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Start a discussion
            </button>
          ) : (
            onPromptJoin && (
              <button
                type="button"
                onClick={onPromptJoin}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4FF3F] hover:bg-[#b8e62f] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                Join Hub to Discuss
              </button>
            )
          )}
        </div>
      ) : (
        /* Posts List */
        <div className="space-y-4">
          {filteredAndSortedPosts.map((post) => (
            <DiscussionPostCard
              key={post.id}
              post={post}
              spaceId={spaceId}
              spaceOwnerId={spaceOwnerId}
              currentUser={currentUser}
              isMember={isMember}
              hasReacted={userReactedPostIds.has(post.id)}
              onSelectAuthor={onSelectAuthor}
              onPromptJoin={onPromptJoin}
            />
          ))}
        </div>
      )}
    </div>
  );
};
