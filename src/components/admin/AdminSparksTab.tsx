import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Trash2, 
  Search, 
  ShieldAlert, 
  ExternalLink,
  MessageSquare,
  Users,
  RefreshCw,
  Eye,
  Filter,
  Tag
} from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CuriousBoardPost, Space, StaffMember } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminSparksTabProps {
  currentStaff: StaffMember;
  onRefreshMetrics: () => void;
}

export const AdminSparksTab: React.FC<AdminSparksTabProps> = ({
  currentStaff,
  onRefreshMetrics,
}) => {
  const [subTab, setSubTab] = useState<'sparks' | 'spaces'>('sparks');
  const [sparks, setSparks] = useState<CuriousBoardPost[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [inspectingSpark, setInspectingSpark] = useState<CuriousBoardPost | null>(null);

  const canModerate = currentStaff.role === 'OWNER' || currentStaff.role === 'ADMIN' || currentStaff.role === 'MODERATOR';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sparksSnap, spacesSnap] = await Promise.all([
        getDocs(collection(db, 'boardPosts')),
        getDocs(collection(db, 'spaces')),
      ]);

      const sparkItems: CuriousBoardPost[] = [];
      sparksSnap.forEach((d) => {
        sparkItems.push({ id: d.id, ...(d.data() as any) });
      });

      const spaceItems: Space[] = [];
      spacesSnap.forEach((d) => {
        spaceItems.push({ id: d.id, ...(d.data() as any) });
      });

      // Sort newest first
      sparkItems.sort((a, b) => (b.createdAt || b.timestamp || '').localeCompare(a.createdAt || a.timestamp || ''));
      spaceItems.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      setSparks(sparkItems);
      setSpaces(spaceItems);
    } catch (err) {
      console.warn('Failed to load sparks/spaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSpark = async (spark: CuriousBoardPost) => {
    if (!window.confirm(`Permanently remove spark by ${spark.authorName}? This action will be recorded in the audit trail.`)) return;
    try {
      await deleteDoc(doc(db, 'boardPosts', spark.id));
      await adminService.createAuditLog({
        actorId: currentStaff.uid,
        actorEmail: currentStaff.email,
        actorRole: currentStaff.role,
        action: 'SPARK_MODERATED_DELETE',
        targetType: 'SPARK',
        targetId: spark.id,
        details: `Moderated spark: "${spark.content.slice(0, 60)}..." by author ${spark.authorName}`,
      });
      setSparks((prev) => prev.filter((s) => s.id !== spark.id));
      if (inspectingSpark?.id === spark.id) setInspectingSpark(null);
      onRefreshMetrics();
    } catch (err) {
      console.error('Delete spark error:', err);
    }
  };

  const handleDeleteSpace = async (space: Space) => {
    if (!window.confirm(`Permanently remove space "${space.name}"? This action will be recorded in the audit trail.`)) return;
    try {
      await deleteDoc(doc(db, 'spaces', space.id));
      await adminService.createAuditLog({
        actorId: currentStaff.uid,
        actorEmail: currentStaff.email,
        actorRole: currentStaff.role,
        action: 'SPACE_MODERATED_DELETE',
        targetType: 'SPACE',
        targetId: space.id,
        details: `Moderated space: "${space.name}"`,
      });
      setSpaces((prev) => prev.filter((s) => s.id !== space.id));
      onRefreshMetrics();
    } catch (err) {
      console.error('Delete space error:', err);
    }
  };

  // Collect all unique tags for filter
  const allTags = Array.from(
    new Set(sparks.flatMap((s) => (s.tags ? s.tags : [])))
  ).slice(0, 10);

  const filteredSparks = sparks.filter((s) => {
    if (selectedTag !== 'ALL' && (!s.tags || !s.tags.includes(selectedTag))) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.content.toLowerCase().includes(q) ||
      s.authorName.toLowerCase().includes(q) ||
      (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const filteredSpaces = spaces.filter((sp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sp.name.toLowerCase().includes(q) ||
      sp.description.toLowerCase().includes(q) ||
      sp.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-editorial font-light text-[#F5F5F0]">
            Sparks & Community Content Management
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Browse, inspect, and moderate public sparks, collaborative inquiries, and space discussions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#0E0E12] border border-[#22222A] p-1">
            <button
              onClick={() => setSubTab('sparks')}
              className={`px-4 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-2 ${
                subTab === 'sparks'
                  ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                  : 'text-[#969696] hover:text-[#F5F5F0]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sparks ({sparks.length})</span>
            </button>
            <button
              onClick={() => setSubTab('spaces')}
              className={`px-4 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-2 ${
                subTab === 'spaces'
                  ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                  : 'text-[#969696] hover:text-[#F5F5F0]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Spaces ({spaces.length})</span>
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-[#F5F5F0] transition-colors"
            title="Refresh Content"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64646E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              subTab === 'sparks'
                ? 'Search sparks by keywords, author, or tag...'
                : 'Search spaces by name, category, or description...'
            }
            className="w-full bg-[#0E0E12] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] pl-10 pr-4 py-2.5 outline-none placeholder-[#555560]"
          />
        </div>

        {subTab === 'sparks' && allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedTag('ALL')}
              className={`px-2.5 py-1.5 text-[11px] font-mono-code uppercase transition-colors whitespace-nowrap border ${
                selectedTag === 'ALL'
                  ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                  : 'bg-[#0E0E12] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1.5 text-[11px] font-mono-code uppercase transition-colors whitespace-nowrap border ${
                  selectedTag === tag
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                    : 'bg-[#0E0E12] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono-code text-[#64646E] bg-[#0E0E12] border border-[#F5F5F0]/10">
          Loading content records from Firestore...
        </div>
      ) : subTab === 'sparks' ? (
        filteredSparks.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#969696] bg-[#0E0E12] border border-[#F5F5F0]/10">
            No sparks match the search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSparks.map((spark) => (
              <div
                key={spark.id}
                className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-5 flex flex-col justify-between space-y-4 hover:border-[#F5F5F0]/25 transition-all text-xs font-mono-code"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-sans-clean font-medium text-[#F5F5F0] truncate max-w-[60%]">
                      {spark.authorName}
                    </span>
                    <span className="text-[#64646E]">
                      {spark.createdAt || spark.timestamp
                        ? new Date(spark.createdAt || spark.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : 'Recent'}
                    </span>
                  </div>

                  <p className="font-sans-clean text-xs sm:text-sm text-[#F5F5F0] leading-relaxed line-clamp-4">
                    {spark.content}
                  </p>

                  {spark.tags && spark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {spark.tags.map((t) => (
                        <span key={t} className="text-[10px] text-[#969696] bg-[#14141A] px-1.5 py-0.5 border border-[#22222A]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F5F5F0]/10 flex items-center justify-between">
                  <div className="text-[11px] text-[#64646E] flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{spark.repliesCount || 0}</span>
                    </span>
                    {spark.thinkerIds && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{spark.thinkerIds.length} thinkers</span>
                      </span>
                    )}
                  </div>

                  {canModerate && (
                    <button
                      onClick={() => handleDeleteSpark(spark)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 uppercase text-[10px] px-2 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Moderate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredSpaces.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono-code text-[#969696] bg-[#0E0E12] border border-[#F5F5F0]/10">
          No community spaces found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpaces.map((space) => (
            <div
              key={space.id}
              className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-5 flex flex-col justify-between space-y-4 hover:border-[#F5F5F0]/25 transition-all text-xs font-mono-code"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[10px] uppercase text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5 font-bold">
                    {space.category}
                  </span>
                  <span className="text-[#64646E] uppercase">{space.visibility}</span>
                </div>

                <h4 className="font-editorial text-lg text-[#F5F5F0] font-light">
                  {space.name}
                </h4>

                <p className="font-sans-clean text-xs text-[#969696] leading-relaxed line-clamp-3">
                  {space.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F5F5F0]/10 flex items-center justify-between">
                <div className="text-[11px] text-[#64646E] flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{space.memberCount || space.memberIds?.length || 1} members</span>
                </div>

                {canModerate && (
                  <button
                    onClick={() => handleDeleteSpace(space)}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 uppercase text-[10px] px-2 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Space</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
