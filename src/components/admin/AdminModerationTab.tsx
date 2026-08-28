import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Trash2, 
  Search, 
  ShieldAlert, 
  ExternalLink,
  MessageSquare,
  Users
} from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CuriousBoardPost, Space, StaffMember } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminModerationTabProps {
  currentStaff: StaffMember;
  onRefreshMetrics: () => void;
}

export const AdminModerationTab: React.FC<AdminModerationTabProps> = ({
  currentStaff,
  onRefreshMetrics,
}) => {
  const [subTab, setSubTab] = useState<'sparks' | 'spaces'>('sparks');
  const [sparks, setSparks] = useState<CuriousBoardPost[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const canDelete = currentStaff.role === 'OWNER' || currentStaff.role === 'ADMIN' || currentStaff.role === 'MODERATOR';

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

      setSparks(sparkItems);
      setSpaces(spaceItems);
    } catch (err) {
      console.warn('Failed to load moderation content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSpark = async (spark: CuriousBoardPost) => {
    if (!window.confirm(`Permanently remove spark by ${spark.authorName}?`)) return;
    try {
      await deleteDoc(doc(db, 'boardPosts', spark.id));
      await adminService.createAuditLog({
        actorId: currentStaff.uid,
        actorEmail: currentStaff.email,
        actorRole: currentStaff.role,
        action: 'SPARK_DELETED_MODERATION',
        targetType: 'SPARK',
        targetId: spark.id,
        details: `Deleted spark: "${spark.content.slice(0, 50)}..." by author ${spark.authorName}`,
      });
      setSparks((prev) => prev.filter((s) => s.id !== spark.id));
      onRefreshMetrics();
    } catch (err) {
      console.error('Delete spark error:', err);
    }
  };

  const handleDeleteSpace = async (space: Space) => {
    if (!window.confirm(`Permanently remove space "${space.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'spaces', space.id));
      await adminService.createAuditLog({
        actorId: currentStaff.uid,
        actorEmail: currentStaff.email,
        actorRole: currentStaff.role,
        action: 'SPACE_DELETED_MODERATION',
        targetType: 'SPACE',
        targetId: space.id,
        details: `Deleted space: "${space.name}"`,
      });
      setSpaces((prev) => prev.filter((s) => s.id !== space.id));
      onRefreshMetrics();
    } catch (err) {
      console.error('Delete space error:', err);
    }
  };

  const filteredSparks = sparks.filter((s) => {
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
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-editorial font-light text-[#F5F5F0]">
            Content Moderation & Oversight
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Maintain community safety and high-signal quality across all public spaces and sparks.
          </p>
        </div>

        <div className="flex bg-[#121217] border border-[#22222A] p-1 self-start sm:self-auto">
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
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#64646E] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            subTab === 'sparks'
              ? 'Filter sparks by content, author, tag...'
              : 'Filter spaces by name, category, description...'
          }
          className="w-full bg-[#0E0E12] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] pl-10 pr-4 py-2.5 outline-none placeholder-[#555560]"
        />
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono-code text-[#64646E] bg-[#0E0E12] border border-[#F5F5F0]/10">
          Loading moderation records...
        </div>
      ) : subTab === 'sparks' ? (
        filteredSparks.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#969696] bg-[#0E0E12] border border-[#F5F5F0]/10">
            No sparks found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSparks.map((spark) => (
              <div
                key={spark.id}
                className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-5 flex flex-col justify-between space-y-4 hover:border-[#F5F5F0]/25 transition-all text-xs font-mono-code"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-sans-clean font-medium text-[#F5F5F0]">
                      {spark.authorName}
                    </span>
                    <span className="text-[#64646E]">
                      {spark.createdAt ? new Date(spark.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <p className="font-sans-clean text-sm text-[#F5F5F0] leading-relaxed line-clamp-3">
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
                  <div className="text-[11px] text-[#64646E] flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{spark.repliesCount || 0} replies</span>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteSpark(spark)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1.5 uppercase text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredSpaces.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono-code text-[#969696] bg-[#0E0E12] border border-[#F5F5F0]/10">
          No spaces found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSpaces.map((space) => (
            <div
              key={space.id}
              className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-5 flex flex-col justify-between space-y-4 hover:border-[#F5F5F0]/25 transition-all text-xs font-mono-code"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[10px] uppercase text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5">
                    {space.category}
                  </span>
                  <span className="text-[#64646E] uppercase">{space.visibility}</span>
                </div>

                <h4 className="font-editorial text-lg text-[#F5F5F0] font-light">
                  {space.name}
                </h4>

                <p className="font-sans-clean text-xs text-[#969696] leading-relaxed line-clamp-2">
                  {space.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F5F5F0]/10 flex items-center justify-between">
                <div className="text-[11px] text-[#64646E] flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{space.memberCount || space.memberIds?.length || 1} members</span>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDeleteSpace(space)}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1.5 uppercase text-[11px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
