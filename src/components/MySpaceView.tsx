import React, { useState, useEffect, useMemo } from 'react';
import { 
  Connection, 
  Space, 
  UserProfile, 
  PublicProfile, 
  CuriousBoardPost, 
  ConnectionIntent 
} from '../types';
import { spaceService } from '../services/spaceService';
import { sparkService } from '../services/sparkService';
import { connectionService } from '../services/connectionService';
import { CreateSpaceModal } from './CreateSpaceModal';
import { EditSpaceModal } from './EditSpaceModal';
import { ManageHubMembersModal } from './ManageHubMembersModal';
import { CreateSparkModal } from './CreateSparkModal';
import { 
  LayoutGrid, 
  Users, 
  Layers, 
  Crown, 
  Sparkles, 
  Plus, 
  Search, 
  MessageSquare, 
  ExternalLink, 
  LogOut, 
  MapPin, 
  GraduationCap, 
  Compass, 
  Tag, 
  Check, 
  X,
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserMinus,
  Building2,
  BookOpen,
  Calendar,
  Clock,
  Send,
  Inbox,
  Filter,
  Edit3,
  Globe2,
  Trash2,
  HelpCircle,
  Radio
} from 'lucide-react';

export type MySpaceTab = 'overview' | 'connections' | 'hosted' | 'joined' | 'sparks';
export type ConnectionsSubTab = 'all' | 'requests' | 'sent';

interface MySpaceViewProps {
  currentUser: UserProfile;
  connections: Connection[];
  onOpenProfile?: () => void;
  onOpenChat: (connectionId: string) => void;
  onSelectProfile: (profile: PublicProfile | UserProfile) => void;
  onOpenSpace: (spaceId: string) => void;
  onExploreMembers: () => void;
  onExploreSpaces: () => void;
  onOpenSpark?: (sparkId?: string) => void;
  onUpdateProfile?: (updated: UserProfile) => Promise<void> | void;
  onOpenOrb?: () => void;
  onOpenMessages?: () => void;
  onOpenOnboarding?: () => void;
  onAcceptRequest?: (connectionId: string) => Promise<void> | void;
  onDeclineRequest?: (connectionId: string) => Promise<void> | void;
  onCancelRequest?: (connectionId: string) => Promise<void> | void;
  onRemoveConnection?: (connectionId: string) => Promise<void> | void;
}

export const MySpaceView: React.FC<MySpaceViewProps> = ({
  currentUser,
  connections = [],
  onOpenProfile,
  onOpenChat,
  onSelectProfile,
  onOpenSpace,
  onExploreMembers,
  onExploreSpaces,
  onOpenSpark,
  onUpdateProfile,
  onOpenOrb,
  onOpenMessages,
  onOpenOnboarding,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveConnection,
}) => {
  const currentUserId = currentUser.uid || currentUser.id;

  const [activeTab, setActiveTab] = useState<MySpaceTab>('overview');
  const [connectionsSubTab, setConnectionsSubTab] = useState<ConnectionsSubTab>('all');
  
  // Spaces state
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState<boolean>(true);
  
  // Sparks state
  const [sparks, setSparks] = useState<CuriousBoardPost[]>([]);
  const [isLoadingSparks, setIsLoadingSparks] = useState<boolean>(true);
  
  // Modals state
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState<boolean>(false);
  const [isCreateSparkModalOpen, setIsCreateSparkModalOpen] = useState<boolean>(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [managingMembersSpace, setManagingMembersSpace] = useState<Space | null>(null);
  const [deletingSparkId, setDeletingSparkId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>('All');
  
  // Confirmation state
  const [leavingSpaceId, setLeavingSpaceId] = useState<string | null>(null);
  const [confirmLeaveSpaceId, setConfirmLeaveSpaceId] = useState<string | null>(null);
  const [confirmRemoveConnId, setConfirmRemoveConnId] = useState<string | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Subscribe to real-time spaces
  useEffect(() => {
    setIsLoadingSpaces(true);
    const unsubscribe = spaceService.subscribeSpaces((liveSpaces) => {
      setSpaces(liveSpaces);
      setIsLoadingSpaces(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time sparks
  useEffect(() => {
    setIsLoadingSparks(true);
    const unsubscribe = sparkService.subscribeSparks((liveSparks) => {
      setSparks(liveSparks);
      setIsLoadingSparks(false);
    });
    return () => unsubscribe();
  }, []);

  // Safe connections partition
  const safeConns = connections || [];

  // Active Connected Misfits
  const myConnectedList = useMemo(() => {
    return safeConns.filter((c) => c.status === 'connected');
  }, [safeConns]);

  // Incoming Connection Requests (target is current user)
  const incomingRequestsList = useMemo(() => {
    return safeConns.filter(
      (c) => c.status === 'pending' && (c.targetId === currentUserId || (!c.requesterId && c.profileId !== currentUserId))
    );
  }, [safeConns, currentUserId]);

  // Outgoing Sent Connection Requests (requester is current user)
  const outgoingSentList = useMemo(() => {
    return safeConns.filter(
      (c) => c.status === 'pending' && (c.requesterId === currentUserId || (c.participants && c.participants[0] === currentUserId))
    );
  }, [safeConns, currentUserId]);

  // Derive Hubs I Host (spaces where ownerId === currentUserId)
  const hubsIHost = useMemo(() => {
    return spaces.filter((s) => s.ownerId === currentUserId);
  }, [spaces, currentUserId]);

  // Derive Hubs I Joined (spaces where memberIds includes currentUserId AND ownerId !== currentUserId)
  const hubsIJoined = useMemo(() => {
    return spaces.filter(
      (s) => (s.memberIds || []).includes(currentUserId) && s.ownerId !== currentUserId
    );
  }, [spaces, currentUserId]);

  // Derive My Sparks (sparks where authorId === currentUserId)
  const mySparks = useMemo(() => {
    return sparks.filter((s) => s.authorId === currentUserId);
  }, [sparks, currentUserId]);

  // Helper to extract counterpart profile for any connection document
  const getCounterpartProfile = (conn: Connection, subTab: ConnectionsSubTab) => {
    if (subTab === 'requests') {
      return conn.requesterSummary || (conn.profileId !== currentUserId ? conn.profile : conn.targetSummary) || conn.profile;
    }
    if (subTab === 'sent') {
      return conn.targetSummary || (conn.profileId !== currentUserId ? conn.profile : conn.requesterSummary) || conn.profile;
    }
    if (currentUserId && conn.requesterId === currentUserId) {
      return conn.targetSummary || conn.profile;
    }
    return conn.requesterSummary || conn.profile;
  };

  // Active Connections List based on sub-tab
  const currentSubTabList = useMemo(() => {
    switch (connectionsSubTab) {
      case 'all':
        return myConnectedList;
      case 'requests':
        return incomingRequestsList;
      case 'sent':
        return outgoingSentList;
      default:
        return myConnectedList;
    }
  }, [connectionsSubTab, myConnectedList, incomingRequestsList, outgoingSentList]);

  // Filtered Connections by Search & Intent
  const filteredConnections = useMemo(() => {
    return currentSubTabList.filter((conn) => {
      // Intent filter
      if (selectedIntentFilter !== 'All') {
        const hasIntent = (conn.sharedIntents || []).includes(selectedIntentFilter as ConnectionIntent);
        if (!hasIntent) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const p = getCounterpartProfile(conn, connectionsSubTab);
        if (!p) return false;
        const nameMatch = p.name?.toLowerCase().includes(q);
        const roleMatch = p.role?.toLowerCase().includes(q);
        const collegeMatch = p.college?.toLowerCase().includes(q);
        const locationMatch = p.location?.toLowerCase().includes(q);
        const introMatch = conn.introNote?.toLowerCase().includes(q);
        const skillMatch = p.skills?.some((s) => s.toLowerCase().includes(q));
        const interestMatch = p.interests?.some((i) => i.toLowerCase().includes(q));
        return nameMatch || roleMatch || collegeMatch || locationMatch || introMatch || skillMatch || interestMatch;
      }

      return true;
    });
  }, [currentSubTabList, selectedIntentFilter, searchQuery, connectionsSubTab]);

  // Filtered Hosted Hubs for Search
  const filteredHostedHubs = useMemo(() => {
    if (!searchQuery.trim()) return hubsIHost;
    const q = searchQuery.toLowerCase().trim();
    return hubsIHost.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [hubsIHost, searchQuery]);

  // Filtered Joined Hubs for Search
  const filteredJoinedHubs = useMemo(() => {
    if (!searchQuery.trim()) return hubsIJoined;
    const q = searchQuery.toLowerCase().trim();
    return hubsIJoined.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [hubsIJoined, searchQuery]);

  // Filtered My Sparks for Search
  const filteredMySparks = useMemo(() => {
    if (!searchQuery.trim()) return mySparks;
    const q = searchQuery.toLowerCase().trim();
    return mySparks.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        s.content.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [mySparks, searchQuery]);

  // Handle Accept Connection Request
  const handleAccept = async (connId: string, memberName: string) => {
    setActionInProgressId(connId);
    try {
      if (onAcceptRequest) {
        await onAcceptRequest(connId);
      } else {
        await connectionService.acceptConnection(connId, currentUserId, currentUser);
      }
      setActionSuccessMsg(`Connected with ${memberName}.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error accepting connection:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Decline Connection Request
  const handleDecline = async (connId: string) => {
    setActionInProgressId(connId);
    try {
      if (onDeclineRequest) {
        await onDeclineRequest(connId);
      } else {
        await connectionService.declineConnection(connId, currentUserId);
      }
      setActionSuccessMsg('Connection request declined.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error declining connection:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Cancel Outgoing Connection Request
  const handleCancelRequest = async (connId: string) => {
    setActionInProgressId(connId);
    try {
      if (onCancelRequest) {
        await onCancelRequest(connId);
      } else {
        await connectionService.cancelConnectionRequest(connId, currentUserId);
      }
      setActionSuccessMsg('Connection request cancelled.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error cancelling connection request:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Remove Existing Connection
  const handleRemove = async (connId: string, memberName: string) => {
    setActionInProgressId(connId);
    try {
      if (onRemoveConnection) {
        await onRemoveConnection(connId);
      } else {
        await connectionService.removeConnection(connId, currentUserId);
      }
      setConfirmRemoveConnId(null);
      setActionSuccessMsg(`Removed connection with ${memberName}.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error removing connection:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Leave Space
  const handleLeaveSpace = async (spaceId: string) => {
    if (!currentUserId) return;
    setLeavingSpaceId(spaceId);
    try {
      await spaceService.leaveSpace(spaceId, currentUserId);
      setConfirmLeaveSpaceId(null);
      setActionSuccessMsg('Successfully left the Hub.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Error leaving space:', err);
    } finally {
      setLeavingSpaceId(null);
    }
  };

  // Handle Delete Spark
  const handleDeleteSpark = async (sparkId: string) => {
    if (!currentUserId || !sparkId) return;
    try {
      await sparkService.deleteSpark(sparkId, currentUserId);
      setDeletingSparkId(null);
      setActionSuccessMsg('Spark post removed successfully.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Error deleting spark:', err);
    }
  };

  const handleSpaceCreated = (newSpace: Space) => {
    setIsCreateSpaceModalOpen(false);
    setActionSuccessMsg(`Hub "${newSpace.name}" created successfully.`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
    onOpenSpace(newSpace.id);
  };

  const handleSparkCreated = (newSpark: CuriousBoardPost) => {
    setIsCreateSparkModalOpen(false);
    setActionSuccessMsg('Spark posted to the Curiosity Board.');
    setTimeout(() => setActionSuccessMsg(null), 3500);
    if (onOpenSpark) {
      onOpenSpark(newSpark.id);
    }
  };

  return (
    <div id="my-space-dashboard" className="flex-1 bg-[#080808] text-[#F2F2ED] min-h-[calc(100vh-4rem)] pb-16">
      
      {/* 1. Header Banner & Profile Snapshot */}
      <section className="border-b border-[#242424] bg-[#0E0E10] px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            
            {/* User Identity & Subheading */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div 
                className={`relative group ${onOpenProfile ? 'cursor-pointer' : ''}`}
                onClick={onOpenProfile}
                title={onOpenProfile ? "View / Edit Profile" : undefined}
              >
                <img
                  src={
                    currentUser.profilePhoto ||
                    currentUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover border-2 border-[#D4FF3F]/70 rounded-sm group-hover:border-[#D4FF3F] transition-colors"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#D4FF3F] border-2 border-[#080808]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold px-2 py-0.5 bg-[#D4FF3F]/10 border border-[#D4FF3F]/30">
                    PERSONAL CONTROL CENTER
                  </span>
                  {currentUser.roleEmoji && <span>{currentUser.roleEmoji}</span>}
                </div>

                <h1 className="text-2xl sm:text-3xl font-editorial text-[#F2F2ED] mt-1 font-light tracking-wide flex items-center gap-3">
                  <span>{currentUser.name}</span>
                  {onOpenProfile && (
                    <button
                      onClick={onOpenProfile}
                      className="text-xs font-mono-code text-[#888] hover:text-[#D4FF3F] inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141416] border border-[#2A2A2A] hover:border-[#D4FF3F]/40 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </h1>

                <p className="text-xs text-[#8A8A8A] font-mono-code mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{currentUser.role || 'Explorer & Builder'}</span>
                  {currentUser.location && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#777]" />
                        {currentUser.location}
                      </span>
                    </>
                  )}
                  {currentUser.college && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-[#777]" />
                        {currentUser.college}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Action Button Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="my-space-create-spark-btn"
                onClick={() => setIsCreateSparkModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#17171C] hover:bg-[#22222A] border border-[#333] hover:border-[#D4FF3F]/50 text-[#F2F2ED] font-mono-code text-xs uppercase font-bold tracking-wider transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span>Post Spark</span>
              </button>

              <button
                id="my-space-create-hub-header-btn"
                onClick={() => setIsCreateSpaceModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D4FF3F] text-[#080808] font-mono-code text-xs uppercase font-bold tracking-widest hover:bg-[#c2ed2e] transition-transform active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#080808]" />
                <span>Create a Hub</span>
              </button>
            </div>
          </div>

          {/* Toast / Notification Banner */}
          {actionSuccessMsg && (
            <div className="mt-4 p-3 bg-[#D4FF3F]/10 border border-[#D4FF3F]/40 flex items-center justify-between text-xs font-mono-code text-[#D4FF3F] animate-fadeIn">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {actionSuccessMsg}
              </span>
              <button
                onClick={() => setActionSuccessMsg(null)}
                className="text-[#8A8A8A] hover:text-[#F2F2ED]"
              >
                ×
              </button>
            </div>
          )}

          {/* Pending Requests Alert Banner (if incoming requests exist) */}
          {incomingRequestsList.length > 0 && activeTab !== 'connections' && (
            <div className="mt-4 p-3 bg-[#1B1B14] border border-[#D4FF3F]/40 flex items-center justify-between text-xs font-mono-code text-[#D4FF3F] gap-3">
              <span className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#D4FF3F] shrink-0" />
                <span>You have <strong>{incomingRequestsList.length}</strong> pending connection request{incomingRequestsList.length > 1 ? 's' : ''} awaiting your response.</span>
              </span>
              <button
                onClick={() => {
                  setActiveTab('connections');
                  setConnectionsSubTab('requests');
                }}
                className="px-2.5 py-1 bg-[#D4FF3F] text-[#080808] font-bold uppercase tracking-wider text-[10px] hover:bg-[#c2ed2e] transition-colors shrink-0"
              >
                Review Requests
              </button>
            </div>
          )}

          {/* 4 Quick Summary Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            
            {/* Metric 1: My Connections */}
            <button
              id="my-space-metric-connections-btn"
              onClick={() => {
                setActiveTab('connections');
                setConnectionsSubTab('all');
              }}
              className={`p-4 border transition-all text-left group ${
                activeTab === 'connections'
                  ? 'border-[#D4FF3F] bg-[#141416]'
                  : 'border-[#242424] bg-[#111113] hover:border-[#383838] hover:bg-[#141416]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] group-hover:text-[#D4FF3F] transition-colors">
                  Connections
                </span>
                <Users className="w-4 h-4 text-[#8A8A8A] group-hover:text-[#D4FF3F] transition-colors" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-mono-code font-bold text-[#F2F2ED]">
                  {myConnectedList.length}
                </span>
                <span className="text-[10px] text-[#7A7A7A] font-mono-code uppercase">
                  Active
                </span>
                {incomingRequestsList.length > 0 && (
                  <span className="ml-auto text-[10px] font-mono-code bg-[#D4FF3F]/20 text-[#D4FF3F] px-1.5 py-0.5 border border-[#D4FF3F]/40 font-bold">
                    +{incomingRequestsList.length}
                  </span>
                )}
              </div>
            </button>

            {/* Metric 2: Hubs I Host */}
            <button
              id="my-space-metric-hosted-btn"
              onClick={() => setActiveTab('hosted')}
              className={`p-4 border transition-all text-left group ${
                activeTab === 'hosted'
                  ? 'border-[#D4FF3F] bg-[#141416]'
                  : 'border-[#242424] bg-[#111113] hover:border-[#383838] hover:bg-[#141416]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] group-hover:text-[#D4FF3F] transition-colors">
                  Hubs I Host
                </span>
                <Crown className="w-4 h-4 text-[#D4FF3F]" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-mono-code font-bold text-[#F2F2ED]">
                  {hubsIHost.length}
                </span>
                <span className="text-[10px] text-[#7A7A7A] font-mono-code uppercase">
                  Hosted
                </span>
              </div>
            </button>

            {/* Metric 3: Hubs I Joined */}
            <button
              id="my-space-metric-joined-btn"
              onClick={() => setActiveTab('joined')}
              className={`p-4 border transition-all text-left group ${
                activeTab === 'joined'
                  ? 'border-[#D4FF3F] bg-[#141416]'
                  : 'border-[#242424] bg-[#111113] hover:border-[#383838] hover:bg-[#141416]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] group-hover:text-[#D4FF3F] transition-colors">
                  Hubs I Joined
                </span>
                <Layers className="w-4 h-4 text-[#8A8A8A] group-hover:text-[#D4FF3F] transition-colors" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-mono-code font-bold text-[#F2F2ED]">
                  {hubsIJoined.length}
                </span>
                <span className="text-[10px] text-[#7A7A7A] font-mono-code uppercase">
                  Member
                </span>
              </div>
            </button>

            {/* Metric 4: My Sparks */}
            <button
              id="my-space-metric-sparks-btn"
              onClick={() => setActiveTab('sparks')}
              className={`p-4 border transition-all text-left group ${
                activeTab === 'sparks'
                  ? 'border-[#D4FF3F] bg-[#141416]'
                  : 'border-[#242424] bg-[#111113] hover:border-[#383838] hover:bg-[#141416]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] group-hover:text-[#D4FF3F] transition-colors">
                  My Sparks
                </span>
                <Sparkles className="w-4 h-4 text-[#D4FF3F]" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-mono-code font-bold text-[#F2F2ED]">
                  {mySparks.length}
                </span>
                <span className="text-[10px] text-[#7A7A7A] font-mono-code uppercase">
                  Inquiries
                </span>
              </div>
            </button>

          </div>

        </div>
      </section>

      {/* 2. Navigation Tabs Bar */}
      <section className="border-b border-[#242424] bg-[#0B0B0D] sticky top-16 z-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          
          {/* Tab buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="my-space-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 sm:px-4 py-3.5 text-xs font-mono-code uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
                activeTab === 'overview'
                  ? 'text-[#D4FF3F] border-[#D4FF3F] font-bold bg-[#D4FF3F]/5'
                  : 'text-[#8A8A8A] border-transparent hover:text-[#F2F2ED] hover:bg-[#141416]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              id="my-space-tab-connections"
              onClick={() => setActiveTab('connections')}
              className={`px-3.5 sm:px-4 py-3.5 text-xs font-mono-code uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
                activeTab === 'connections'
                  ? 'text-[#D4FF3F] border-[#D4FF3F] font-bold bg-[#D4FF3F]/5'
                  : 'text-[#8A8A8A] border-transparent hover:text-[#F2F2ED] hover:bg-[#141416]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Connections</span>
              <span className="px-1.5 py-0.2 bg-[#222] text-[#AAA] text-[10px] rounded-none">
                {myConnectedList.length}
              </span>
              {incomingRequestsList.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#D4FF3F] inline-block ml-0.5" />
              )}
            </button>

            <button
              id="my-space-tab-hosted"
              onClick={() => setActiveTab('hosted')}
              className={`px-3.5 sm:px-4 py-3.5 text-xs font-mono-code uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
                activeTab === 'hosted'
                  ? 'text-[#D4FF3F] border-[#D4FF3F] font-bold bg-[#D4FF3F]/5'
                  : 'text-[#8A8A8A] border-transparent hover:text-[#F2F2ED] hover:bg-[#141416]'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-[#D4FF3F]" />
              <span>Hubs I Host</span>
              <span className="px-1.5 py-0.2 bg-[#222] text-[#AAA] text-[10px] rounded-none">
                {hubsIHost.length}
              </span>
            </button>

            <button
              id="my-space-tab-joined"
              onClick={() => setActiveTab('joined')}
              className={`px-3.5 sm:px-4 py-3.5 text-xs font-mono-code uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
                activeTab === 'joined'
                  ? 'text-[#D4FF3F] border-[#D4FF3F] font-bold bg-[#D4FF3F]/5'
                  : 'text-[#8A8A8A] border-transparent hover:text-[#F2F2ED] hover:bg-[#141416]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hubs I Joined</span>
              <span className="px-1.5 py-0.2 bg-[#222] text-[#AAA] text-[10px] rounded-none">
                {hubsIJoined.length}
              </span>
            </button>

            <button
              id="my-space-tab-sparks"
              onClick={() => setActiveTab('sparks')}
              className={`px-3.5 sm:px-4 py-3.5 text-xs font-mono-code uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
                activeTab === 'sparks'
                  ? 'text-[#D4FF3F] border-[#D4FF3F] font-bold bg-[#D4FF3F]/5'
                  : 'text-[#8A8A8A] border-transparent hover:text-[#F2F2ED] hover:bg-[#141416]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>My Sparks</span>
              <span className="px-1.5 py-0.2 bg-[#222] text-[#AAA] text-[10px] rounded-none">
                {mySparks.length}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          {activeTab !== 'overview' && (
            <div className="relative my-2 w-48 sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#141416] border border-[#242424] focus:border-[#D4FF3F] pl-8 pr-3 py-1.5 text-xs font-mono-code text-[#F2F2ED] placeholder-[#666] outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#777] hover:text-[#F2F2ED]"
                >
                  Clear
                </button>
              )}
            </div>
          )}

        </div>
      </section>

      {/* 3. Main Body Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW (The True Personal Command Center) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-10">
            
            {/* Section 1: Pending Inquiries & Requests (Action Required) */}
            {incomingRequestsList.length > 0 && (
              <section id="my-space-overview-action-items">
                <div className="flex items-center justify-between mb-4 border-b border-[#2A2A20] pb-2">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-[#D4FF3F]" />
                    <h2 className="text-sm font-mono-code uppercase tracking-wider text-[#D4FF3F] font-bold">
                      Action Required: Incoming Connection Requests ({incomingRequestsList.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('connections');
                      setConnectionsSubTab('requests');
                    }}
                    className="text-xs font-mono-code text-[#AAA] hover:text-[#D4FF3F] flex items-center gap-1 uppercase tracking-wider"
                  >
                    <span>Manage all</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {incomingRequestsList.slice(0, 2).map((conn) => {
                    const profile = getCounterpartProfile(conn, 'requests');
                    if (!profile) return null;
                    const isOperating = actionInProgressId === conn.id;

                    return (
                      <div
                        key={conn.id}
                        className="p-4 border border-[#D4FF3F]/30 bg-[#121210] flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={profile.avatarUrl || profile.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt={profile.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-cover border border-[#444] rounded-sm shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-[#F2F2ED] truncate">
                              {profile.name}
                            </h4>
                            <p className="text-xs text-[#D4FF3F] font-mono-code truncate">
                              {profile.role || 'Member'}
                            </p>
                            {conn.introNote && (
                              <p className="text-xs text-[#BBB] italic font-editorial line-clamp-2 mt-1">
                                “{conn.introNote}”
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#202020]">
                          <button
                            onClick={() => handleAccept(conn.id, profile.name)}
                            disabled={isOperating}
                            className="flex-1 py-1.5 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleDecline(conn.id)}
                            disabled={isOperating}
                            className="px-3 py-1.5 border border-[#333] hover:border-red-500/50 text-[#888] hover:text-red-400 text-xs font-mono-code uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => onSelectProfile(profile)}
                            className="px-2.5 py-1.5 border border-[#333] text-[#888] hover:text-[#FFF] text-xs font-mono-code"
                            title="View Profile"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section 2: My Connections Preview */}
            <section id="my-space-overview-connections">
              <div className="flex items-center justify-between mb-4 border-b border-[#1E1E20] pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D4FF3F]" />
                  <h2 className="text-base font-mono-code uppercase tracking-wider text-[#F2F2ED] font-bold">
                    My Connections ({myConnectedList.length})
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('connections');
                      setConnectionsSubTab('all');
                    }}
                    className="text-xs font-mono-code text-[#8A8A8A] hover:text-[#D4FF3F] flex items-center gap-1 uppercase tracking-wider transition-colors"
                  >
                    <span>View all ({myConnectedList.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {myConnectedList.length === 0 ? (
                <div className="p-8 border border-[#242424] bg-[#111113] text-center space-y-3">
                  <Users className="w-8 h-8 text-[#555] mx-auto" />
                  <h3 className="text-sm font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                    You haven't connected with any Misfits yet
                  </h3>
                  <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                    Explore fellow explorers, students, builders, and thinkers worldwide to start exchanging ideas and building together.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={onExploreMembers}
                      className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors"
                    >
                      Discover Members
                    </button>
                    {onOpenOrb && (
                      <button
                        onClick={onOpenOrb}
                        className="px-4 py-2 border border-[#333] text-[#F2F2ED] text-xs font-mono-code uppercase tracking-wider hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-colors"
                      >
                        Explore Orb
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {myConnectedList.slice(0, 3).map((conn) => {
                    const profile = getCounterpartProfile(conn, 'all');
                    if (!profile) return null;
                    return (
                      <div
                        key={conn.id}
                        className="p-4 border border-[#242424] bg-[#111113] hover:border-[#383838] flex flex-col justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={profile.avatarUrl || profile.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt={profile.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 object-cover border border-[#333] rounded-sm shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-[#F2F2ED] truncate">
                              {profile.name}
                            </h4>
                            <p className="text-[11px] text-[#D4FF3F] font-mono-code uppercase tracking-wider truncate">
                              {profile.role || 'Member'}
                            </p>
                            {profile.college && (
                              <p className="text-[10px] text-[#777] font-mono-code truncate mt-0.5">
                                {profile.college}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#1C1C1F]">
                          <button
                            onClick={() => onOpenChat(conn.id)}
                            className="flex-1 py-1.5 bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 hover:bg-[#D4FF3F]/20 text-[#D4FF3F] text-[11px] font-mono-code uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Message</span>
                          </button>
                          <button
                            onClick={() => onSelectProfile(profile)}
                            className="px-2.5 py-1.5 border border-[#333] hover:border-[#555] text-[#8A8A8A] hover:text-[#F2F2ED] text-[11px] font-mono-code uppercase tracking-wider transition-colors"
                            title="View Profile"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 3: Hubs I Host & Manage */}
            <section id="my-space-overview-hosted">
              <div className="flex items-center justify-between mb-4 border-b border-[#1E1E20] pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#D4FF3F]" />
                  <h2 className="text-base font-mono-code uppercase tracking-wider text-[#F2F2ED] font-bold">
                    Hubs I Host ({hubsIHost.length})
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCreateSpaceModalOpen(true)}
                    className="text-xs font-mono-code text-[#D4FF3F] hover:underline flex items-center gap-1 uppercase tracking-wider font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Hub</span>
                  </button>
                  {hubsIHost.length > 0 && (
                    <button
                      onClick={() => setActiveTab('hosted')}
                      className="text-xs font-mono-code text-[#8A8A8A] hover:text-[#D4FF3F] flex items-center gap-1 uppercase tracking-wider transition-colors"
                    >
                      <span>Manage All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {hubsIHost.length === 0 ? (
                <div className="p-8 border border-[#242424] bg-[#111113] text-center space-y-3">
                  <Crown className="w-8 h-8 text-[#555] mx-auto" />
                  <h3 className="text-sm font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                    You haven't created any Hubs yet
                  </h3>
                  <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                    Host a Space around a shared interest, unusual project, craft, skill, or curiosity to gather fellow misfits.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsCreateSpaceModalOpen(true)}
                      className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create a Hub</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hubsIHost.slice(0, 2).map((space) => (
                    <div
                      key={space.id}
                      className="p-5 border border-[#242424] bg-[#111113] hover:border-[#383838] flex flex-col justify-between gap-4 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5">
                            {space.category}
                          </span>
                          <span className="text-[11px] font-mono-code text-[#8A8A8A] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#D4FF3F]" />
                            <span>{space.memberCount || space.memberIds?.length || 1} members</span>
                          </span>
                        </div>

                        <h3 className="text-lg font-medium text-[#F2F2ED] font-editorial">
                          {space.name}
                        </h3>

                        <p className="text-xs text-[#8A8A8A] font-sans-clean mt-1.5 line-clamp-2 leading-relaxed">
                          {space.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#1C1C1F] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingSpace(space)}
                            className="px-2.5 py-1 text-xs font-mono-code uppercase text-[#888] hover:text-[#D4FF3F] border border-[#333] hover:border-[#D4FF3F] transition-colors"
                          >
                            Edit Hub
                          </button>
                          <button
                            onClick={() => setManagingMembersSpace(space)}
                            className="px-2.5 py-1 text-xs font-mono-code uppercase text-[#888] hover:text-[#FFF] border border-[#333] hover:border-[#666] transition-colors"
                          >
                            Members
                          </button>
                        </div>
                        <button
                          onClick={() => onOpenSpace(space.id)}
                          className="px-3.5 py-1.5 bg-[#1C1C20] hover:bg-[#D4FF3F] hover:text-[#080808] border border-[#333] hover:border-[#D4FF3F] text-[#F2F2ED] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-1.5 font-bold"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 4: Hubs I Joined */}
            <section id="my-space-overview-joined">
              <div className="flex items-center justify-between mb-4 border-b border-[#1E1E20] pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#D4FF3F]" />
                  <h2 className="text-base font-mono-code uppercase tracking-wider text-[#F2F2ED] font-bold">
                    Hubs I Joined ({hubsIJoined.length})
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onExploreSpaces}
                    className="text-xs font-mono-code text-[#D4FF3F] hover:underline flex items-center gap-1 uppercase tracking-wider font-bold"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Browse All Hubs</span>
                  </button>
                  {hubsIJoined.length > 0 && (
                    <button
                      onClick={() => setActiveTab('joined')}
                      className="text-xs font-mono-code text-[#8A8A8A] hover:text-[#D4FF3F] flex items-center gap-1 uppercase tracking-wider transition-colors"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {hubsIJoined.length === 0 ? (
                <div className="p-8 border border-[#242424] bg-[#111113] text-center space-y-3">
                  <Layers className="w-8 h-8 text-[#555] mx-auto" />
                  <h3 className="text-sm font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                    You haven't joined any Hubs yet
                  </h3>
                  <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                    Find interest groups and communities that align with your passions and start engaging.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={onExploreSpaces}
                      className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors inline-flex items-center gap-2"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Explore Hub Catalog</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hubsIJoined.slice(0, 2).map((space) => (
                    <div
                      key={space.id}
                      className="p-5 border border-[#242424] bg-[#111113] hover:border-[#383838] flex flex-col justify-between gap-4 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5">
                            {space.category}
                          </span>
                          <span className="text-[11px] font-mono-code text-[#8A8A8A] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#D4FF3F]" />
                            <span>{space.memberCount || space.memberIds?.length || 1} members</span>
                          </span>
                        </div>

                        <h3 className="text-lg font-medium text-[#F2F2ED] font-editorial">
                          {space.name}
                        </h3>

                        <p className="text-xs text-[#8A8A8A] font-sans-clean mt-1.5 line-clamp-2 leading-relaxed">
                          {space.description}
                        </p>

                        {space.ownerName && (
                          <p className="text-[11px] font-mono-code text-[#666] mt-2">
                            Hosted by <span className="text-[#AAA]">{space.ownerName}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#1C1C1F] flex items-center justify-between gap-2">
                        <button
                          onClick={() => setConfirmLeaveSpaceId(space.id)}
                          className="px-2.5 py-1 text-xs font-mono-code uppercase text-[#777] hover:text-[#FF5C5C] border border-[#262626] hover:border-[#FF5C5C]/40 transition-colors"
                          title="Leave Hub"
                        >
                          Leave
                        </button>
                        <button
                          onClick={() => onOpenSpace(space.id)}
                          className="px-3.5 py-1.5 bg-[#1C1C20] hover:bg-[#D4FF3F] hover:text-[#080808] border border-[#333] hover:border-[#D4FF3F] text-[#F2F2ED] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-1.5 font-bold"
                        >
                          <span>Open Hub</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 5: My Sparks & Questions */}
            <section id="my-space-overview-sparks">
              <div className="flex items-center justify-between mb-4 border-b border-[#1E1E20] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4FF3F]" />
                  <h2 className="text-base font-mono-code uppercase tracking-wider text-[#F2F2ED] font-bold">
                    My Sparks & Rabbit Holes ({mySparks.length})
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCreateSparkModalOpen(true)}
                    className="text-xs font-mono-code text-[#D4FF3F] hover:underline flex items-center gap-1 uppercase tracking-wider font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post Spark</span>
                  </button>
                  {mySparks.length > 0 && (
                    <button
                      onClick={() => setActiveTab('sparks')}
                      className="text-xs font-mono-code text-[#8A8A8A] hover:text-[#D4FF3F] flex items-center gap-1 uppercase tracking-wider transition-colors"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {mySparks.length === 0 ? (
                <div className="p-8 border border-[#242424] bg-[#111113] text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-[#555] mx-auto" />
                  <h3 className="text-sm font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                    You haven't posted any Sparks yet
                  </h3>
                  <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                    Share an open question, unusual concept, or discussion starter on the community Curiosity Board.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsCreateSparkModalOpen(true)}
                      className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Post a Question / Spark</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mySparks.slice(0, 2).map((spark) => (
                    <div
                      key={spark.id}
                      className="p-5 border border-[#242424] bg-[#111113] hover:border-[#383838] flex flex-col justify-between gap-4 transition-colors"
                    >
                      <div>
                        {spark.tags && spark.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {spark.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-mono-code uppercase text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {spark.title && (
                          <h3 className="text-base font-medium text-[#F2F2ED] font-editorial mb-1">
                            {spark.title}
                          </h3>
                        )}

                        <p className="text-xs text-[#CCC] font-sans-clean line-clamp-3 leading-relaxed">
                          {spark.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#1C1C1F] flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono-code text-[#888] flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3 text-[#D4FF3F]" />
                          <span>{spark.repliesCount || 0} replies</span>
                        </span>

                        <button
                          onClick={() => {
                            if (onOpenSpark) {
                              onOpenSpark(spark.id);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-[#1C1C20] hover:bg-[#D4FF3F] hover:text-[#080808] border border-[#333] hover:border-[#D4FF3F] text-[#F2F2ED] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-1.5 font-bold"
                        >
                          <span>Open Discussion</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 6: Quick Exploration Shortcuts */}
            <section id="my-space-overview-shortcuts" className="p-6 bg-[#111114] border border-[#222228]">
              <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#8A8A8A] font-bold mb-4">
                Explore Misfits Club
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {onOpenOrb && (
                  <button
                    onClick={onOpenOrb}
                    className="p-3.5 bg-[#16161A] border border-[#24242A] hover:border-[#D4FF3F]/50 text-left group transition-all"
                  >
                    <Radio className="w-4 h-4 text-[#D4FF3F] mb-1.5" />
                    <span className="text-xs font-mono-code uppercase tracking-wider font-bold text-[#F2F2ED] block group-hover:text-[#D4FF3F]">
                      The Orb
                    </span>
                    <span className="text-[10px] text-[#777] font-mono-code">
                      Living globe of connections
                    </span>
                  </button>
                )}

                <button
                  onClick={onExploreMembers}
                  className="p-3.5 bg-[#16161A] border border-[#24242A] hover:border-[#D4FF3F]/50 text-left group transition-all"
                >
                  <Compass className="w-4 h-4 text-[#D4FF3F] mb-1.5" />
                  <span className="text-xs font-mono-code uppercase tracking-wider font-bold text-[#F2F2ED] block group-hover:text-[#D4FF3F]">
                    Discover
                  </span>
                  <span className="text-[10px] text-[#777] font-mono-code">
                    Directory of members
                  </span>
                </button>

                <button
                  onClick={onExploreSpaces}
                  className="p-3.5 bg-[#16161A] border border-[#24242A] hover:border-[#D4FF3F]/50 text-left group transition-all"
                >
                  <Layers className="w-4 h-4 text-[#D4FF3F] mb-1.5" />
                  <span className="text-xs font-mono-code uppercase tracking-wider font-bold text-[#F2F2ED] block group-hover:text-[#D4FF3F]">
                    Hubs
                  </span>
                  <span className="text-[10px] text-[#777] font-mono-code">
                    Browse all communities
                  </span>
                </button>

                {onOpenMessages && (
                  <button
                    onClick={onOpenMessages}
                    className="p-3.5 bg-[#16161A] border border-[#24242A] hover:border-[#D4FF3F]/50 text-left group transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-[#D4FF3F] mb-1.5" />
                    <span className="text-xs font-mono-code uppercase tracking-wider font-bold text-[#F2F2ED] block group-hover:text-[#D4FF3F]">
                      Messages
                    </span>
                    <span className="text-[10px] text-[#777] font-mono-code">
                      Direct private conversations
                    </span>
                  </button>
                )}
              </div>
            </section>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY CONNECTIONS (Full Management View) */}
        {/* ========================================================================= */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            
            {/* Header & Sub-tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#242424] pb-4">
              <div>
                <h2 className="text-xl font-editorial font-light text-[#F2F2ED] flex items-center gap-2">
                  <span>My Connections</span>
                </h2>
                <p className="text-xs font-mono-code text-[#8A8A8A] uppercase tracking-wider mt-0.5">
                  Manage your network of fellow explorers, collaborators, and builders
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onExploreMembers}
                  className="px-3.5 py-2 border border-[#333] hover:border-[#D4FF3F] text-[#F2F2ED] hover:text-[#D4FF3F] text-xs font-mono-code uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Discover Members</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs: All / Requests / Sent */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E20] pb-2">
              <div className="flex items-center gap-2">
                
                {/* Sub-tab 1: All Connected */}
                <button
                  id="my-connections-subtab-all"
                  onClick={() => setConnectionsSubTab('all')}
                  className={`px-3.5 py-2 text-xs font-mono-code uppercase tracking-wider transition-all flex items-center gap-2 border ${
                    connectionsSubTab === 'all'
                      ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] font-bold shadow-sm'
                      : 'bg-[#121214] text-[#8A8A8A] border-[#262626] hover:text-[#F2F2ED] hover:border-[#383838]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>All Connections</span>
                  <span className={`text-[10px] px-1.5 py-0.2 ${connectionsSubTab === 'all' ? 'bg-[#080808]/20 text-[#080808]' : 'bg-[#1C1C1F] text-[#888]'}`}>
                    {myConnectedList.length}
                  </span>
                </button>

                {/* Sub-tab 2: Requests (Incoming) */}
                <button
                  id="my-connections-subtab-requests"
                  onClick={() => setConnectionsSubTab('requests')}
                  className={`px-3.5 py-2 text-xs font-mono-code uppercase tracking-wider transition-all flex items-center gap-2 border relative ${
                    connectionsSubTab === 'requests'
                      ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] font-bold shadow-sm'
                      : 'bg-[#121214] text-[#8A8A8A] border-[#262626] hover:text-[#F2F2ED] hover:border-[#383838]'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Incoming Requests</span>
                  <span className={`text-[10px] px-1.5 py-0.2 font-bold ${connectionsSubTab === 'requests' ? 'bg-[#080808] text-[#D4FF3F]' : (incomingRequestsList.length > 0 ? 'bg-[#D4FF3F]/20 text-[#D4FF3F] border border-[#D4FF3F]/30' : 'bg-[#1C1C1F] text-[#888]')}`}>
                    {incomingRequestsList.length}
                  </span>
                </button>

                {/* Sub-tab 3: Sent (Outgoing) */}
                <button
                  id="my-connections-subtab-sent"
                  onClick={() => setConnectionsSubTab('sent')}
                  className={`px-3.5 py-2 text-xs font-mono-code uppercase tracking-wider transition-all flex items-center gap-2 border ${
                    connectionsSubTab === 'sent'
                      ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] font-bold shadow-sm'
                      : 'bg-[#121214] text-[#8A8A8A] border-[#262626] hover:text-[#F2F2ED] hover:border-[#383838]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Sent Requests</span>
                  <span className={`text-[10px] px-1.5 py-0.2 ${connectionsSubTab === 'sent' ? 'bg-[#080808]/20 text-[#080808]' : 'bg-[#1C1C1F] text-[#888]'}`}>
                    {outgoingSentList.length}
                  </span>
                </button>

              </div>

              {/* Intent Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <span className="text-[10px] font-mono-code uppercase text-[#666] flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" />
                  <span>Intent:</span>
                </span>
                {['All', 'Build Together', 'Exchange Ideas', 'Collaborate', 'Learn Together'].map((intent) => (
                  <button
                    key={intent}
                    onClick={() => setSelectedIntentFilter(intent)}
                    className={`px-2 py-0.5 text-[10px] font-mono-code uppercase tracking-wider transition-colors whitespace-nowrap ${
                      selectedIntentFilter === intent
                        ? 'bg-[#222] text-[#D4FF3F] border border-[#D4FF3F]/40'
                        : 'bg-[#141416] text-[#777] border border-[#222] hover:text-[#AAA]'
                    }`}
                  >
                    {intent}
                  </button>
                ))}
              </div>
            </div>

            {/* List Content */}
            {filteredConnections.length === 0 ? (
              <div className="p-12 border border-[#242424] bg-[#111113] text-center space-y-4">
                {connectionsSubTab === 'all' && <UserCheck className="w-10 h-10 text-[#555] mx-auto" />}
                {connectionsSubTab === 'requests' && <Inbox className="w-10 h-10 text-[#555] mx-auto" />}
                {connectionsSubTab === 'sent' && <Send className="w-10 h-10 text-[#555] mx-auto" />}
                
                {searchQuery || selectedIntentFilter !== 'All' ? (
                  <>
                    <h3 className="text-base font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                      No connections match your filters
                    </h3>
                    <p className="text-xs text-[#8A8A8A]">
                      Try clearing search query or resetting intent filter.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-3 py-1.5 border border-[#333] text-xs font-mono-code text-[#F2F2ED] uppercase"
                        >
                          Clear Search
                        </button>
                      )}
                      {selectedIntentFilter !== 'All' && (
                        <button
                          onClick={() => setSelectedIntentFilter('All')}
                          className="px-3 py-1.5 border border-[#333] text-xs font-mono-code text-[#F2F2ED] uppercase"
                        >
                          Reset Intent
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                      {connectionsSubTab === 'all' && "You haven't connected with any Misfits yet"}
                      {connectionsSubTab === 'requests' && "No incoming connection requests"}
                      {connectionsSubTab === 'sent' && "No outgoing connection requests pending"}
                    </h3>
                    <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                      {connectionsSubTab === 'all' && "Explore the Orb or Discovery directory to find like-minded people and send requests."}
                      {connectionsSubTab === 'requests' && "When other misfits reach out to connect with you, their requests will appear here for you to accept or decline."}
                      {connectionsSubTab === 'sent' && "When you send a connection request from Discovery or Spark, you can track and manage pending requests here."}
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        onClick={onExploreMembers}
                        className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors"
                      >
                        Discover Members
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConnections.map((conn) => {
                  const profile = getCounterpartProfile(conn, connectionsSubTab);
                  if (!profile) return null;
                  const isOperating = actionInProgressId === conn.id;
                  const isConfirmingRemoval = confirmRemoveConnId === conn.id;

                  return (
                    <div
                      key={conn.id}
                      className="p-5 border border-[#242424] bg-[#111113] hover:border-[#383838] flex flex-col justify-between gap-4 transition-all relative"
                    >
                      {/* Top Profile Card */}
                      <div>
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={profile.avatarUrl || profile.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                              alt={profile.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 object-cover border border-[#333] rounded-sm"
                            />
                            {connectionsSubTab === 'all' && (
                              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#D4FF3F] border-2 border-[#111113]" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-medium text-[#F2F2ED] truncate">
                                {profile.name}
                              </h3>
                              {profile.roleEmoji && <span className="text-xs">{profile.roleEmoji}</span>}
                            </div>
                            <p className="text-xs text-[#D4FF3F] font-mono-code uppercase tracking-wider truncate">
                              {profile.role || 'Member'}
                            </p>
                            {conn.connectedAt && connectionsSubTab === 'all' && (
                              <p className="text-[10px] text-[#666] font-mono-code mt-0.5 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Connected</span>
                              </p>
                            )}
                            {connectionsSubTab === 'requests' && (
                              <p className="text-[10px] text-[#AAA] font-mono-code mt-0.5 flex items-center gap-1">
                                <Inbox className="w-2.5 h-2.5 text-[#D4FF3F]" />
                                <span>Incoming request</span>
                              </p>
                            )}
                            {connectionsSubTab === 'sent' && (
                              <p className="text-[10px] text-[#AAA] font-mono-code mt-0.5 flex items-center gap-1">
                                <Send className="w-2.5 h-2.5 text-[#777]" />
                                <span>Sent request</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Location / College */}
                        {(profile.location || profile.college) && (
                          <div className="mt-3 text-[11px] font-mono-code text-[#8A8A8A] space-y-1">
                            {profile.location && (
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3 h-3 text-[#666] shrink-0" />
                                <span className="truncate">{profile.location}</span>
                              </div>
                            )}
                            {profile.college && (
                              <div className="flex items-center gap-1.5 truncate">
                                <GraduationCap className="w-3 h-3 text-[#666] shrink-0" />
                                <span className="truncate">{profile.college}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Intro Note (if present) */}
                        {conn.introNote && (
                          <div className="mt-3 p-2.5 bg-[#17171A] border border-[#262626] rounded-none">
                            <span className="text-[9px] font-mono-code uppercase text-[#777] tracking-wider block mb-1">
                              Intro Note:
                            </span>
                            <p className="text-xs text-[#DDD] italic font-editorial line-clamp-3">
                              “{conn.introNote}”
                            </p>
                          </div>
                        )}

                        {/* Shared Intents */}
                        {conn.sharedIntents && conn.sharedIntents.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {conn.sharedIntents.map((intent) => (
                              <span
                                key={intent}
                                className="text-[9px] font-mono-code uppercase text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-1.5 py-0.2"
                              >
                                {intent}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Skills / Interests */}
                        {profile.interests && profile.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {profile.interests.slice(0, 3).map((item) => (
                              <span
                                key={item}
                                className="text-[9px] font-mono-code uppercase text-[#777] bg-[#18181A] px-2 py-0.5 border border-[#242424]"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Area */}
                      <div className="pt-3 border-t border-[#1C1C1F]">
                        
                        {/* 1. All Connections Actions (Message + Profile + Remove) */}
                        {connectionsSubTab === 'all' && (
                          <>
                            {isConfirmingRemoval ? (
                              <div className="p-2.5 bg-[#1C1212] border border-[#FF5C5C]/40 space-y-2 animate-fadeIn">
                                <p className="text-[11px] font-mono-code text-[#FF5C5C]">
                                  Remove connection with {profile.name}?
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleRemove(conn.id, profile.name)}
                                    disabled={isOperating}
                                    className="flex-1 py-1 bg-[#FF5C5C] text-[#080808] text-[10px] font-mono-code uppercase font-bold hover:bg-[#ff4040]"
                                  >
                                    {isOperating ? 'Removing...' : 'Yes, Remove'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmRemoveConnId(null)}
                                    className="px-2 py-1 border border-[#444] text-[#AAA] text-[10px] font-mono-code uppercase hover:text-[#FFF]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  id={`my-conn-msg-btn-${conn.id}`}
                                  onClick={() => onOpenChat(conn.id)}
                                  className="flex-1 py-2 bg-[#D4FF3F]/10 border border-[#D4FF3F]/40 hover:bg-[#D4FF3F] hover:text-[#080808] text-[#D4FF3F] text-xs font-mono-code uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors font-medium"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Message</span>
                                </button>
                                <button
                                  onClick={() => onSelectProfile(profile)}
                                  className="px-3 py-2 border border-[#333] hover:border-[#666] text-[#8A8A8A] hover:text-[#F2F2ED] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-1"
                                  title="View Public Profile"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Profile</span>
                                </button>
                                <button
                                  onClick={() => setConfirmRemoveConnId(conn.id)}
                                  className="p-2 border border-[#2A2A2E] hover:border-[#FF5C5C]/50 text-[#666] hover:text-[#FF5C5C] text-xs font-mono-code transition-colors"
                                  title="Remove Connection"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* 2. Requests Actions (Accept + Decline + Profile) */}
                        {connectionsSubTab === 'requests' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <button
                                id={`my-conn-accept-btn-${conn.id}`}
                                onClick={() => handleAccept(conn.id, profile.name)}
                                disabled={isOperating}
                                className="flex-1 py-2 bg-[#D4FF3F] hover:bg-[#c2ed2e] text-[#080808] text-xs font-mono-code uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isOperating ? 'Accepting...' : 'Accept'}</span>
                              </button>
                              <button
                                id={`my-conn-decline-btn-${conn.id}`}
                                onClick={() => handleDecline(conn.id)}
                                disabled={isOperating}
                                className="px-3 py-2 border border-[#333] hover:border-[#FF5C5C]/60 text-[#888] hover:text-[#FF5C5C] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </div>
                            <button
                              onClick={() => onSelectProfile(profile)}
                              className="w-full py-1.5 border border-[#222] hover:border-[#444] text-[#888] hover:text-[#EEE] text-[11px] font-mono-code uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Profile</span>
                            </button>
                          </div>
                        )}

                        {/* 3. Sent Requests Actions (Cancel + Profile) */}
                        {connectionsSubTab === 'sent' && (
                          <div className="flex items-center gap-2">
                            <button
                              id={`my-conn-cancel-btn-${conn.id}`}
                              onClick={() => handleCancelRequest(conn.id)}
                              disabled={isOperating}
                              className="flex-1 py-2 border border-[#333] hover:border-[#FF5C5C]/60 text-[#888] hover:text-[#FF5C5C] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{isOperating ? 'Cancelling...' : 'Cancel Request'}</span>
                            </button>
                            <button
                              onClick={() => onSelectProfile(profile)}
                              className="px-3 py-2 border border-[#333] hover:border-[#666] text-[#8A8A8A] hover:text-[#F2F2ED] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-1"
                              title="View Public Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Profile</span>
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: HUBS I HOST (Full Management & Editing) */}
        {/* ========================================================================= */}
        {activeTab === 'hosted' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-4">
              <div>
                <h2 className="text-xl font-editorial font-light text-[#F2F2ED]">
                  Hubs I Host
                </h2>
                <p className="text-xs font-mono-code text-[#8A8A8A] uppercase tracking-wider mt-0.5">
                  Hubs you created and curate ({filteredHostedHubs.length} total)
                </p>
              </div>

              <button
                onClick={() => setIsCreateSpaceModalOpen(true)}
                className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-widest hover:bg-[#c2ed2e] transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create a Hub</span>
              </button>
            </div>

            {filteredHostedHubs.length === 0 ? (
              <div className="p-12 border border-[#242424] bg-[#111113] text-center space-y-4">
                <Crown className="w-10 h-10 text-[#555] mx-auto" />
                {searchQuery ? (
                  <>
                    <h3 className="text-base font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                      No hosted hubs match "{searchQuery}"
                    </h3>
                    <p className="text-xs text-[#8A8A8A]">Try adjusting your search query.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 border border-[#333] text-xs font-mono-code text-[#F2F2ED] uppercase"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                      You haven't created any Hubs yet
                    </h3>
                    <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                      Bring people together around an obscure topic, collaborative project, or specialized passion.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setIsCreateSpaceModalOpen(true)}
                        className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors inline-flex items-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create a Hub</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHostedHubs.map((space) => (
                  <div
                    key={space.id}
                    className="p-6 border border-[#242424] bg-[#111113] hover:border-[#383838] flex flex-col justify-between gap-5 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {space.profilePhoto && (
                            <img
                              src={space.profilePhoto}
                              alt={space.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 object-cover border border-[#D4FF3F]/30"
                            />
                          )}
                          <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2.5 py-0.5 font-bold">
                            {space.category}
                          </span>
                        </div>
                        <span className="text-xs font-mono-code text-[#8A8A8A] flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#D4FF3F]" />
                          <span>{space.memberCount || space.memberIds?.length || 1} members</span>
                        </span>
                      </div>

                      <h3 className="text-xl font-medium text-[#F2F2ED] font-editorial">
                        {space.name}
                      </h3>

                      <p className="text-xs text-[#8A8A8A] font-sans-clean mt-2 line-clamp-3 leading-relaxed">
                        {space.description}
                      </p>

                      {space.tags && space.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {space.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono-code uppercase text-[#888] bg-[#161618] px-2 py-0.5 border border-[#282828]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#1C1C1F] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingSpace(space)}
                          className="px-3 py-1.5 border border-[#333] hover:border-[#D4FF3F] text-[#CCC] hover:text-[#D4FF3F] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Hub</span>
                        </button>

                        <button
                          onClick={() => setManagingMembersSpace(space)}
                          className="px-3 py-1.5 border border-[#333] hover:border-[#666] text-[#CCC] hover:text-[#FFF] text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                          <Users className="w-3 h-3" />
                          <span>Members</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenSpace(space.id)}
                        className="px-4 py-2 bg-[#D4FF3F] text-[#080808] hover:bg-[#c2ed2e] text-xs font-mono-code uppercase tracking-wider font-bold transition-all flex items-center gap-1.5"
                      >
                        <span>Open Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: HUBS I JOINED (Full List & Leave Action) */}
        {/* ========================================================================= */}
        {activeTab === 'joined' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-4">
              <div>
                <h2 className="text-xl font-editorial font-light text-[#F2F2ED]">
                  Hubs I Joined
                </h2>
                <p className="text-xs font-mono-code text-[#8A8A8A] uppercase tracking-wider mt-0.5">
                  Hubs you are a member of ({filteredJoinedHubs.length} total)
                </p>
              </div>

              <button
                onClick={onExploreSpaces}
                className="px-3.5 py-2 border border-[#333] hover:border-[#D4FF3F] text-[#F2F2ED] hover:text-[#D4FF3F] text-xs font-mono-code uppercase tracking-wider transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore More Hubs</span>
              </button>
            </div>

            {filteredJoinedHubs.length === 0 ? (
              <div className="p-12 border border-[#242424] bg-[#111113] text-center space-y-4">
                <Layers className="w-10 h-10 text-[#555] mx-auto" />
                {searchQuery ? (
                  <>
                    <h3 className="text-base font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                      No joined hubs match "{searchQuery}"
                    </h3>
                    <p className="text-xs text-[#8A8A8A]">Try adjusting your search query.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 border border-[#333] text-xs font-mono-code text-[#F2F2ED] uppercase"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                      You haven't joined any Hubs yet
                    </h3>
                    <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                      Explore active hubs to join discussions, share ideas, and connect with people who share your passions.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={onExploreSpaces}
                        className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors"
                      >
                        Explore Hubs
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJoinedHubs.map((space) => {
                  const isConfirmingLeave = confirmLeaveSpaceId === space.id;
                  const isLeaving = leavingSpaceId === space.id;

                  return (
                    <div
                      key={space.id}
                      className="p-6 border border-[#242424] bg-[#111113] hover:border-[#383838] flex flex-col justify-between gap-5 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#8A8A8A] bg-[#18181A] border border-[#262626] px-2.5 py-0.5">
                            {space.category}
                          </span>
                          <span className="text-xs font-mono-code text-[#8A8A8A] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#D4FF3F]" />
                            <span>{space.memberCount || space.memberIds?.length || 1} members</span>
                          </span>
                        </div>

                        <h3 className="text-xl font-medium text-[#F2F2ED] font-editorial">
                          {space.name}
                        </h3>

                        <p className="text-xs text-[#8A8A8A] font-sans-clean mt-2 line-clamp-3 leading-relaxed">
                          {space.description}
                        </p>

                        <div className="flex items-center gap-2 mt-4 text-xs font-mono-code text-[#8A8A8A]">
                          <img
                            src={space.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={space.ownerName}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover border border-[#444]"
                          />
                          <span>Hosted by <strong className="text-[#F2F2ED] font-normal">{space.ownerName}</strong></span>
                        </div>

                        {space.tags && space.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {space.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono-code uppercase text-[#888] bg-[#161618] px-2 py-0.5 border border-[#282828]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-[#1C1C1F]">
                        {isConfirmingLeave ? (
                          <div className="flex items-center justify-between gap-2 p-2 bg-[#1C1212] border border-[#FF5C5C]/40">
                            <span className="text-[11px] font-mono-code text-[#FF5C5C]">
                              Leave this Hub?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLeaveSpace(space.id)}
                                disabled={isLeaving}
                                className="px-2.5 py-1 bg-[#FF5C5C] text-[#080808] text-[10px] font-mono-code uppercase font-bold hover:bg-[#ff4040]"
                              >
                                {isLeaving ? 'Leaving...' : 'Yes, Leave'}
                              </button>
                              <button
                                onClick={() => setConfirmLeaveSpaceId(null)}
                                className="px-2 py-1 border border-[#444] text-[#AAA] text-[10px] font-mono-code uppercase hover:text-[#FFF]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => setConfirmLeaveSpaceId(space.id)}
                              className="text-[11px] font-mono-code uppercase tracking-wider text-[#777] hover:text-[#FF5C5C] transition-colors flex items-center gap-1"
                              title="Leave this Space"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Leave Hub</span>
                            </button>

                            <button
                              onClick={() => onOpenSpace(space.id)}
                              className="px-4 py-2 bg-[#D4FF3F] text-[#080808] hover:bg-[#c2ed2e] text-xs font-mono-code uppercase tracking-wider font-bold transition-all flex items-center gap-1.5"
                            >
                              <span>Open Hub</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: MY SPARKS (Inquiries, Questions, Rabbit Holes Created by User) */}
        {/* ========================================================================= */}
        {activeTab === 'sparks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-4">
              <div>
                <h2 className="text-xl font-editorial font-light text-[#F2F2ED]">
                  My Sparks & Questions
                </h2>
                <p className="text-xs font-mono-code text-[#8A8A8A] uppercase tracking-wider mt-0.5">
                  Curiosity inquiries and philosophical questions you posted ({filteredMySparks.length} total)
                </p>
              </div>

              <button
                onClick={() => setIsCreateSparkModalOpen(true)}
                className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-widest hover:bg-[#c2ed2e] transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Post New Spark</span>
              </button>
            </div>

            {filteredMySparks.length === 0 ? (
              <div className="p-12 border border-[#242424] bg-[#111113] text-center space-y-4">
                <Sparkles className="w-10 h-10 text-[#555] mx-auto" />
                {searchQuery ? (
                  <>
                    <h3 className="text-base font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                      No sparks match "{searchQuery}"
                    </h3>
                    <p className="text-xs text-[#8A8A8A]">Try adjusting your search query.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 border border-[#333] text-xs font-mono-code text-[#F2F2ED] uppercase"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-mono-code font-bold text-[#F2F2ED] uppercase tracking-wider">
                      You haven't posted any Sparks yet
                    </h3>
                    <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                      Post an open thought, question, or rabbit hole on the Curiosity Board to start thoughtful conversations.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setIsCreateSparkModalOpen(true)}
                        className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code uppercase font-bold tracking-wider hover:bg-[#c2ed2e] transition-colors inline-flex items-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Post a Spark</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMySparks.map((spark) => {
                  const isConfirmingDelete = deletingSparkId === spark.id;

                  return (
                    <div
                      key={spark.id}
                      className="p-6 border border-[#242424] bg-[#111113] hover:border-[#383838] flex flex-col justify-between gap-5 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          {spark.tags && spark.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {spark.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-mono-code uppercase text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <span className="text-[11px] font-mono-code text-[#777]">
                            {spark.timestamp || 'Recently'}
                          </span>
                        </div>

                        {spark.title && (
                          <h3 className="text-lg font-medium text-[#F2F2ED] font-editorial mb-1.5">
                            {spark.title}
                          </h3>
                        )}

                        <p className="text-xs text-[#CCC] font-sans-clean leading-relaxed line-clamp-4">
                          {spark.content}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#1C1C1F]">
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-between gap-2 p-2 bg-[#1C1212] border border-[#FF5C5C]/40">
                            <span className="text-[11px] font-mono-code text-[#FF5C5C]">
                              Delete this spark?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteSpark(spark.id)}
                                className="px-2.5 py-1 bg-[#FF5C5C] text-[#080808] text-[10px] font-mono-code uppercase font-bold hover:bg-[#ff4040]"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setDeletingSparkId(null)}
                                className="px-2 py-1 border border-[#444] text-[#AAA] text-[10px] font-mono-code uppercase hover:text-[#FFF]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => setDeletingSparkId(spark.id)}
                              className="text-[11px] font-mono-code uppercase tracking-wider text-[#777] hover:text-[#FF5C5C] transition-colors flex items-center gap-1"
                              title="Delete Spark"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>

                            <button
                              onClick={() => {
                                if (onOpenSpark) {
                                  onOpenSpark(spark.id);
                                }
                              }}
                              className="px-4 py-2 bg-[#D4FF3F] text-[#080808] hover:bg-[#c2ed2e] text-xs font-mono-code uppercase tracking-wider font-bold transition-all flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Discussion ({spark.repliesCount || 0})</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Create Space / Hub Modal */}
      <CreateSpaceModal
        isOpen={isCreateSpaceModalOpen}
        onClose={() => setIsCreateSpaceModalOpen(false)}
        currentUser={currentUser}
        onSpaceCreated={handleSpaceCreated}
      />

      {/* Create Spark Modal */}
      <CreateSparkModal
        isOpen={isCreateSparkModalOpen}
        onClose={() => setIsCreateSparkModalOpen(false)}
        currentUser={currentUser}
        onSparkCreated={handleSparkCreated}
      />

      {/* Edit Hosted Hub Modal */}
      {editingSpace && (
        <EditSpaceModal
          space={editingSpace}
          hostId={currentUserId}
          isOpen={!!editingSpace}
          onClose={() => setEditingSpace(null)}
          onSpaceUpdated={(updated) => {
            setSpaces((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setEditingSpace(null);
            setActionSuccessMsg(`Hub "${updated.name}" updated successfully.`);
            setTimeout(() => setActionSuccessMsg(null), 3500);
          }}
        />
      )}

      {/* Manage Hosted Hub Members Modal */}
      {managingMembersSpace && (
        <ManageHubMembersModal
          space={managingMembersSpace}
          hostId={currentUserId}
          isOpen={!!managingMembersSpace}
          onClose={() => setManagingMembersSpace(null)}
          onSelectProfile={onSelectProfile}
          onSpaceUpdated={(updated) => {
            setSpaces((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          }}
        />
      )}

    </div>
  );
};
