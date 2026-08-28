import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  Mail, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  X, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw,
  Eye,
  Globe,
  Share2,
  Layers,
  Activity,
  Check,
  AlertTriangle,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { UserProfile, StaffMember, AdminConnectionItem, CuriousBoardPost, Space } from '../../types';
import { adminService } from '../../services/adminService';
import { useRouter } from '../../context/RouterContext';

interface AdminMembersTabProps {
  currentStaff: StaffMember;
  onRefreshMetrics: () => void;
}

export const AdminMembersTab: React.FC<AdminMembersTabProps> = ({
  currentStaff,
  onRefreshMetrics,
}) => {
  const { navigate } = useRouter();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contextual data for selected member
  const [memberDetailTab, setMemberDetailTab] = useState<'profile' | 'connections' | 'sparks_spaces' | 'governance'>('profile');
  const [memberConnections, setMemberConnections] = useState<AdminConnectionItem[]>([]);
  const [memberSparks, setMemberSparks] = useState<CuriousBoardPost[]>([]);
  const [memberSpaces, setMemberSpaces] = useState<Space[]>([]);
  const [isLoadingContextualData, setIsLoadingContextualData] = useState(false);

  const isElevatedStaff = currentStaff.role === 'OWNER' || currentStaff.role === 'ADMIN';

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllMembers();
      setMembers(data);
    } catch (err) {
      console.warn('Failed to load members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // When a member is selected, load their contextual connections, sparks, and spaces
  useEffect(() => {
    if (!selectedMember) {
      setMemberConnections([]);
      setMemberSparks([]);
      setMemberSpaces([]);
      setMemberDetailTab('profile');
      return;
    }

    const uid = selectedMember.uid || selectedMember.id;
    if (!uid) return;

    let isMounted = true;
    const fetchMemberContext = async () => {
      setIsLoadingContextualData(true);
      try {
        const [conns, spks, spcs] = await Promise.all([
          adminService.getMemberConnections(uid),
          adminService.getMemberSparks(uid),
          adminService.getMemberSpaces(uid),
        ]);
        if (isMounted) {
          setMemberConnections(conns);
          setMemberSparks(spks);
          setMemberSpaces(spcs);
        }
      } catch (err) {
        console.warn('Failed to fetch contextual member details:', err);
      } finally {
        if (isMounted) {
          setIsLoadingContextualData(false);
        }
      }
    };

    fetchMemberContext();

    return () => {
      isMounted = false;
    };
  }, [selectedMember]);

  // Compute unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    members.forEach((m) => {
      if (m.location && m.location.trim()) {
        locSet.add(m.location.trim());
      } else if (m.city && m.city.trim()) {
        locSet.add(m.city.trim());
      }
    });
    return Array.from(locSet).sort();
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.name?.toLowerCase().includes(q);
        const matchesEmail = m.email?.toLowerCase().includes(q);
        const matchesHandle = m.handle?.toLowerCase().includes(q);
        const matchesRole = m.role?.toLowerCase().includes(q);
        const matchesLocation = m.location?.toLowerCase().includes(q) || m.city?.toLowerCase().includes(q);
        const matchesCollege = m.college?.toLowerCase().includes(q);
        const matchesSkills = m.skills?.some((s) => s.toLowerCase().includes(q));
        const matchesInterests = m.interests?.some((i) => i.toLowerCase().includes(q));

        if (!matchesName && !matchesEmail && !matchesHandle && !matchesRole && !matchesLocation && !matchesCollege && !matchesSkills && !matchesInterests) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'completed' && !m.onboardingCompleted) return false;
      if (statusFilter === 'pending' && m.onboardingCompleted) return false;

      // 3. Location Filter
      if (locationFilter !== 'all') {
        const loc = m.location || m.city || '';
        if (loc.trim() !== locationFilter) return false;
      }

      return true;
    });
  }, [members, searchQuery, statusFilter, locationFilter]);

  const handleDeleteMember = async (member: UserProfile) => {
    if (!isElevatedStaff) {
      alert('Only Club Owners and Admins have permission to delete member records.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete member account "${member.name}" (${member.email || member.id})?\n\nThis action will remove their profile and is logged in the permanent audit trail.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await adminService.deleteMember(
        { uid: currentStaff.uid, email: currentStaff.email, role: currentStaff.role },
        { uid: member.uid || member.id, email: member.email, name: member.name }
      );
      setMembers((prev) => prev.filter((m) => (m.uid || m.id) !== (member.uid || member.id)));
      if (selectedMember && (selectedMember.uid || selectedMember.id) === (member.uid || member.id)) {
        setSelectedMember(null);
      }
      onRefreshMetrics();
    } catch (err: any) {
      console.error('Delete member error:', err);
      alert(err.message || 'Failed to delete member account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#D4FF3F]" />
            <h2 className="text-xl font-editorial font-light text-[#F5F5F0]">
              REGISTERED MEMBERS
            </h2>
            <span className="text-xs font-mono-code text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5 ml-2">
              {members.length} TOTAL
            </span>
          </div>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Authoritative member population directory across all global Misfits Club hubs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadMembers}
            disabled={isLoading}
            className="px-3 py-2 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code text-[#F5F5F0] uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D4FF3F]' : 'text-[#969696]'}`} />
            <span>Refresh Roster</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-[#64646E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, skill, college..."
              className="w-full bg-[#14141A] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] pl-9 pr-3 py-2 outline-none placeholder-[#555560]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64646E] hover:text-[#F5F5F0]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-code text-[#64646E] uppercase whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#14141A] border border-[#262630] text-xs font-mono-code text-[#F5F5F0] px-2.5 py-2 outline-none focus:border-[#D4FF3F]/60"
            >
              <option value="all">All Members ({members.length})</option>
              <option value="completed">Active / Onboarded</option>
              <option value="pending">Pending Onboarding</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-code text-[#64646E] uppercase whitespace-nowrap">Location:</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-[#14141A] border border-[#262630] text-xs font-mono-code text-[#F5F5F0] px-2.5 py-2 outline-none focus:border-[#D4FF3F]/60"
            >
              <option value="all">All Hubs & Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Metrics */}
        {(searchQuery || statusFilter !== 'all' || locationFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-[#F5F5F0]/5 text-[11px] font-mono-code text-[#969696]">
            <span>Showing {filteredMembers.length} of {members.length} members</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setLocationFilter('all');
              }}
              className="text-[#D4FF3F] hover:underline uppercase"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Roster View */}
      {isLoading ? (
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-16 text-center text-xs font-mono-code text-[#64646E] space-y-3">
          <div className="w-6 h-6 border-2 border-[#D4FF3F] border-t-transparent animate-spin mx-auto" />
          <p className="uppercase tracking-widest text-[#969696]">Loading Member Roster...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-12 text-center text-xs font-mono-code text-[#969696] space-y-2">
          <Users className="w-8 h-8 text-[#64646E] mx-auto mb-2" />
          <p className="text-sm font-editorial text-[#F5F5F0]">No registered members match the active criteria.</p>
          <p className="text-[11px] text-[#64646E]">Try clearing your search query or reset the filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#0E0E12] border border-[#F5F5F0]/15 overflow-hidden">
            <table className="w-full text-left text-xs font-mono-code">
              <thead>
                <tr className="border-b border-[#F5F5F0]/10 bg-[#121217] text-[#969696] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-normal">Member</th>
                  <th className="py-3 px-4 font-normal">Email (Staff Protected)</th>
                  <th className="py-3 px-4 font-normal">Role / Title</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Joined</th>
                  <th className="py-3 px-4 font-normal">Location</th>
                  <th className="py-3 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F0]/5">
                {filteredMembers.map((member) => {
                  const uid = member.uid || member.id;
                  const isComplete = member.onboardingCompleted !== false;
                  return (
                    <tr
                      key={uid}
                      className="hover:bg-[#14141A] transition-colors group cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none bg-[#1A1A24] border border-[#262630] flex items-center justify-center overflow-hidden shrink-0">
                            {member.avatarUrl || member.profilePhoto ? (
                              <img
                                src={member.avatarUrl || member.profilePhoto}
                                alt={member.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[11px] font-bold text-[#D4FF3F]">
                                {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-sans-clean font-medium text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors flex items-center gap-1.5">
                              <span>{member.name}</span>
                            </div>
                            {member.handle && (
                              <div className="text-[10px] text-[#64646E]">
                                @{member.handle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-[#969696]">
                        {member.email ? (
                          <span className="text-[#F5F5F0]">{member.email}</span>
                        ) : (
                          <span className="text-[#64646E] italic">Private / Not set</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className="text-[#D4FF3F] font-sans-clean font-light">
                          {member.role || 'Member'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Onboarding</span>
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-[#64646E] whitespace-nowrap">
                        {formatJoinedDate(member.joinedDate || member.createdAt)}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-[#969696] max-w-[150px] truncate">
                        {member.location || member.city || member.college || 'Worldwide'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedMember(member)}
                            title="Inspect full member profile"
                            className="p-1.5 text-[#969696] hover:text-[#D4FF3F] bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isElevatedStaff && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              title="Delete member record"
                              className="p-1.5 text-[#969696] hover:text-red-400 bg-[#14141A] hover:bg-red-500/10 border border-[#262630] hover:border-red-500/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Responsive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
            {filteredMembers.map((member) => {
              const uid = member.uid || member.id;
              const isComplete = member.onboardingCompleted !== false;
              return (
                <div
                  key={uid}
                  onClick={() => setSelectedMember(member)}
                  className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 flex flex-col justify-between space-y-3 hover:border-[#F5F5F0]/25 transition-all cursor-pointer group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-none bg-[#1A1A24] border border-[#262630] flex items-center justify-center overflow-hidden shrink-0">
                          {member.avatarUrl || member.profilePhoto ? (
                            <img
                              src={member.avatarUrl || member.profilePhoto}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[#D4FF3F]">
                              {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-sans-clean font-medium text-sm text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors">
                            {member.name}
                          </div>
                          {member.handle && (
                            <div className="text-[10px] font-mono-code text-[#64646E]">
                              @{member.handle}
                            </div>
                          )}
                        </div>
                      </div>

                      {isComplete ? (
                        <span className="text-[9px] font-mono-code uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono-code uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5">
                          Onboarding
                        </span>
                      )}
                    </div>

                    {member.email && (
                      <div className="text-xs font-mono-code text-[#969696] truncate">
                        {member.email}
                      </div>
                    )}

                    <div className="text-xs font-sans-clean text-[#D4FF3F] truncate">
                      {member.role || 'Member'}
                    </div>

                    {(member.location || member.city || member.college) && (
                      <div className="flex items-center gap-1 text-[11px] font-mono-code text-[#64646E] truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{member.location || member.city || member.college}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#F5F5F0]/10 flex items-center justify-between text-[11px] font-mono-code text-[#64646E]">
                    <span>Joined: {formatJoinedDate(member.joinedDate || member.createdAt)}</span>
                    <span className="text-[#D4FF3F] flex items-center gap-1 group-hover:underline">
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Member Detail Slide-over / Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0E0E12] border border-[#F5F5F0]/20 w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#F5F5F0]/10 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-none bg-[#1A1A24] border border-[#262630] flex items-center justify-center overflow-hidden shrink-0">
                  {selectedMember.avatarUrl || selectedMember.profilePhoto ? (
                    <img
                      src={selectedMember.avatarUrl || selectedMember.profilePhoto}
                      alt={selectedMember.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xl font-bold text-[#D4FF3F]">
                      {selectedMember.name ? selectedMember.name.charAt(0).toUpperCase() : 'M'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-editorial font-light text-[#F5F5F0]">
                      {selectedMember.name}
                    </h3>
                    {selectedMember.onboardingCompleted !== false ? (
                      <span className="text-[10px] font-mono-code uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono-code uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5">
                        Pending Onboarding
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono-code text-[#64646E] flex items-center gap-2 mt-0.5">
                    <span>@{selectedMember.handle || 'member'}</span>
                    <span>·</span>
                    <span className="text-[#D4FF3F]">{selectedMember.role || 'Member'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 text-[#969696] hover:text-[#F5F5F0] bg-[#14141A] border border-[#262630] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 border-b border-[#F5F5F0]/10 pb-2 overflow-x-auto text-xs font-mono-code">
              <button
                onClick={() => setMemberDetailTab('profile')}
                className={`px-3 py-1.5 border uppercase transition-colors whitespace-nowrap ${
                  memberDetailTab === 'profile'
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                    : 'bg-[#14141A] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
                }`}
              >
                Profile & Narrative
              </button>

              <button
                onClick={() => setMemberDetailTab('connections')}
                className={`px-3 py-1.5 border uppercase transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  memberDetailTab === 'connections'
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                    : 'bg-[#14141A] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
                }`}
              >
                <Share2 className="w-3 h-3" />
                <span>Connections ({memberConnections.length})</span>
              </button>

              <button
                onClick={() => setMemberDetailTab('sparks_spaces')}
                className={`px-3 py-1.5 border uppercase transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  memberDetailTab === 'sparks_spaces'
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                    : 'bg-[#14141A] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Sparks & Spaces ({memberSparks.length + memberSpaces.length})</span>
              </button>

              <button
                onClick={() => setMemberDetailTab('governance')}
                className={`px-3 py-1.5 border uppercase transition-colors whitespace-nowrap ${
                  memberDetailTab === 'governance'
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                    : 'bg-[#14141A] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
                }`}
              >
                Account & Governance
              </button>
            </div>

            {/* Sub-tab 1: Profile & Narrative */}
            {memberDetailTab === 'profile' && (
              <div className="space-y-5 animate-in fade-in duration-100">
                {/* Basic Administrative Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-code">
                  <div className="bg-[#121217] p-3 border border-[#22222A] space-y-1">
                    <span className="text-[10px] text-[#64646E] uppercase block">UID / Identifier</span>
                    <span className="text-[#F5F5F0] select-all break-all">{selectedMember.uid || selectedMember.id}</span>
                  </div>
                  <div className="bg-[#121217] p-3 border border-[#22222A] space-y-1">
                    <span className="text-[10px] text-[#64646E] uppercase block">Email (Staff Protected)</span>
                    <span className="text-[#F5F5F0] select-all break-all">{selectedMember.email || 'None registered'}</span>
                  </div>
                  <div className="bg-[#121217] p-3 border border-[#22222A] space-y-1">
                    <span className="text-[10px] text-[#64646E] uppercase block">Joined Date</span>
                    <span className="text-[#F5F5F0]">{formatJoinedDate(selectedMember.joinedDate || selectedMember.createdAt)}</span>
                  </div>
                  <div className="bg-[#121217] p-3 border border-[#22222A] space-y-1">
                    <span className="text-[10px] text-[#64646E] uppercase block">Location / College</span>
                    <span className="text-[#F5F5F0]">{selectedMember.location || selectedMember.city || selectedMember.college || 'Worldwide'}</span>
                  </div>
                </div>

                {/* Bio & Narrative */}
                {selectedMember.bio && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono-code uppercase text-[#969696] tracking-wider">Bio & Narrative</span>
                    <p className="text-xs sm:text-sm font-sans-clean text-[#F5F5F0] bg-[#121217] p-4 border border-[#22222A] leading-relaxed">
                      {selectedMember.bio}
                    </p>
                  </div>
                )}

                {/* Current Focus / Building / Learning */}
                {(selectedMember.building || selectedMember.learning || selectedMember.openQuestion) && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono-code uppercase text-[#969696] tracking-wider">Current Focus & Projects</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {selectedMember.building && (
                        <div className="bg-[#121217] p-3 border border-[#22222A] space-y-1">
                          <span className="text-[10px] font-mono-code text-[#D4FF3F] uppercase block">🔨 Building</span>
                          <p className="text-[#F5F5F0] font-sans-clean">{selectedMember.building}</p>
                        </div>
                      )}
                      {selectedMember.learning && (
                        <div className="bg-[#121217] p-3 border border-[#22222A] space-y-1">
                          <span className="text-[10px] font-mono-code text-amber-400 uppercase block">📚 Learning</span>
                          <p className="text-[#F5F5F0] font-sans-clean">{selectedMember.learning}</p>
                        </div>
                      )}
                      {selectedMember.openQuestion && (
                        <div className="bg-[#121217] p-3 border border-[#22222A] space-y-1 sm:col-span-2">
                          <span className="text-[10px] font-mono-code text-sky-400 uppercase block">❓ Open Question</span>
                          <p className="text-[#F5F5F0] font-sans-clean">{selectedMember.openQuestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills & Interests */}
                {((selectedMember.skills && selectedMember.skills.length > 0) || (selectedMember.interests && selectedMember.interests.length > 0)) && (
                  <div className="space-y-3">
                    {selectedMember.skills && selectedMember.skills.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono-code uppercase text-[#64646E] block mb-1.5">Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMember.skills.map((skill) => (
                            <span key={skill} className="text-[11px] font-mono-code text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedMember.interests && selectedMember.interests.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono-code uppercase text-[#64646E] block mb-1.5">Interests</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMember.interests.map((interest) => (
                            <span key={interest} className="text-[11px] font-mono-code text-[#969696] bg-[#14141A] border border-[#262630] px-2 py-0.5">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 2: Contextual Connections */}
            {memberDetailTab === 'connections' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="flex items-center justify-between text-xs font-mono-code text-[#969696] border-b border-[#F5F5F0]/5 pb-2">
                  <span>Contextual member connections query</span>
                  <span>{memberConnections.length} Total</span>
                </div>

                {isLoadingContextualData ? (
                  <div className="p-8 text-center bg-[#121217] border border-[#22222A]">
                    <div className="w-5 h-5 border-2 border-[#D4FF3F] border-t-transparent animate-spin mx-auto mb-2" />
                    <span className="text-xs font-mono-code text-[#969696]">Loading member connections...</span>
                  </div>
                ) : memberConnections.length === 0 ? (
                  <div className="p-8 text-center bg-[#121217] border border-[#22222A] space-y-2">
                    <Share2 className="w-6 h-6 text-[#64646E] mx-auto" />
                    <p className="text-xs font-mono-code text-[#969696]">
                      No connection records found for this member.
                    </p>
                    <p className="text-[11px] font-sans-clean text-[#64646E]">
                      When this builder sends or receives connection requests, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {memberConnections.map((conn) => {
                      const uid = selectedMember.uid || selectedMember.id;
                      const isRequester = conn.requesterId === uid;
                      const otherName = isRequester ? conn.targetName : conn.requesterName;
                      const otherAvatar = isRequester ? conn.targetAvatar : conn.requesterAvatar;
                      const otherRole = isRequester ? conn.targetRole : conn.requesterRole;
                      const status = (conn.status || 'pending').toUpperCase();

                      const statusColor = 
                        status === 'ACCEPTED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                        status === 'DECLINED' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                        'text-amber-400 bg-amber-500/10 border-amber-500/30';

                      return (
                        <div key={conn.id} className="p-3.5 bg-[#121217] border border-[#22222A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-code">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-none bg-[#1A1A24] border border-[#262630] flex items-center justify-center overflow-hidden shrink-0">
                              {otherAvatar ? (
                                <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-xs font-bold text-[#D4FF3F]">{otherName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="text-[#F5F5F0] font-sans-clean font-medium">
                                {otherName}
                              </div>
                              <div className="text-[10px] text-[#64646E]">
                                {otherRole || 'Builder'} · {isRequester ? 'Sent Request' : 'Received Request'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className={`text-[9px] uppercase px-2 py-0.5 border ${statusColor}`}>
                              {status}
                            </span>
                            <span className="text-[10px] text-[#64646E]">
                              {formatJoinedDate(conn.updatedAt || conn.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 3: Sparks & Spaces */}
            {memberDetailTab === 'sparks_spaces' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* Member Sparks */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono-code uppercase text-[#969696] tracking-wider block">
                    Public Sparks Authored ({memberSparks.length})
                  </span>
                  {memberSparks.length === 0 ? (
                    <div className="p-4 text-center bg-[#121217] border border-[#22222A] text-xs font-mono-code text-[#64646E]">
                      No sparks authored by this member yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {memberSparks.map((spark) => (
                        <div key={spark.id} className="p-3 bg-[#121217] border border-[#22222A] space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[10px] font-mono-code text-[#64646E]">
                            <span className="text-[#D4FF3F] uppercase">#{spark.tag || 'SPARK'}</span>
                            <span>{formatJoinedDate(spark.createdAt || (spark as any).timestamp)}</span>
                          </div>
                          <p className="text-[#F5F5F0] font-sans-clean line-clamp-2">
                            {spark.content || (spark as any).title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Member Spaces */}
                <div className="space-y-2 pt-2 border-t border-[#F5F5F0]/5">
                  <span className="text-[11px] font-mono-code uppercase text-[#969696] tracking-wider block">
                    Spaces Affiliated ({memberSpaces.length})
                  </span>
                  {memberSpaces.length === 0 ? (
                    <div className="p-4 text-center bg-[#121217] border border-[#22222A] text-xs font-mono-code text-[#64646E]">
                      No spaces affiliated with this member.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {memberSpaces.map((space) => (
                        <div key={space.id} className="p-3 bg-[#121217] border border-[#22222A] space-y-1 text-xs">
                          <div className="text-[#F5F5F0] font-sans-clean font-medium truncate">
                            {space.name}
                          </div>
                          <div className="text-[10px] font-mono-code text-[#64646E] truncate">
                            {space.description || 'Community Space'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 4: Account & Governance */}
            {memberDetailTab === 'governance' && (
              <div className="space-y-5 animate-in fade-in duration-100">
                {/* Account Status Control */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121217] p-4 border border-[#22222A]">
                  <div className="text-xs font-mono-code">
                    <span className="text-[#64646E] uppercase block text-[10px]">Account Access Status</span>
                    <span className="text-[#F5F5F0] font-bold uppercase text-sm">
                      {(selectedMember as any).accountStatus || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(['active', 'restricted', 'suspended'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={async () => {
                          if (!isElevatedStaff) {
                            alert('Only Admins/Owners can modify account status.');
                            return;
                          }
                          const reason = window.prompt(`Reason for setting status to ${st.toUpperCase()}?`, 'Administrative review');
                          if (reason === null) return;
                          try {
                            await adminService.updateMemberStatus(
                              { uid: currentStaff.uid, email: currentStaff.email, role: currentStaff.role },
                              { uid: selectedMember.uid || selectedMember.id, name: selectedMember.name, email: selectedMember.email },
                              st,
                              reason
                            );
                            setSelectedMember((prev) => prev ? { ...prev, accountStatus: st } as any : null);
                            setMembers((prev) =>
                              prev.map((m) =>
                                (m.uid || m.id) === (selectedMember.uid || selectedMember.id)
                                  ? ({ ...m, accountStatus: st } as any)
                                  : m
                              )
                            );
                          } catch (err: any) {
                            alert(err?.message || 'Failed to update status.');
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-mono-code uppercase tracking-wider border transition-colors ${
                          ((selectedMember as any).accountStatus || 'active') === st
                            ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                            : 'bg-[#14141A] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#121217] p-4 border border-[#22222A] space-y-2 text-xs font-mono-code text-[#969696]">
                  <div className="text-[10px] uppercase text-[#64646E]">Audit Trail Policy</div>
                  <p className="text-[11px] font-sans-clean leading-relaxed">
                    All account status modifications, permission updates, and account deletions are permanently written to the immutable cryptographic audit trail with staff identifier.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Global Actions */}
            <div className="pt-4 border-t border-[#F5F5F0]/10 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  navigate(`/profile/${selectedMember.uid || selectedMember.id}`);
                }}
                className="px-4 py-2 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code text-[#F5F5F0] uppercase tracking-wider transition-colors inline-flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span>View in App Profile</span>
              </button>

              {isElevatedStaff && (
                <button
                  onClick={() => handleDeleteMember(selectedMember)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-mono-code text-red-400 uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Member Record'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
