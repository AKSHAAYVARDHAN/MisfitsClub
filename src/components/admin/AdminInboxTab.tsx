import React, { useState, useEffect } from 'react';
import { 
  MessageSquareHeart, 
  Mail, 
  Search, 
  Filter, 
  Check, 
  Trash2, 
  Clock, 
  User, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Save
} from 'lucide-react';
import { FeedbackItem, ContactMessageItem, FeedbackStatus, ContactStatus, StaffMember } from '../../types';
import { feedbackService } from '../../services/feedbackService';
import { contactService } from '../../services/contactService';

interface AdminInboxTabProps {
  currentStaff: StaffMember;
  onRefreshMetrics: () => void;
}

export const AdminInboxTab: React.FC<AdminInboxTabProps> = ({
  currentStaff,
  onRefreshMetrics,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'feedback' | 'contact'>('feedback');
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [contactList, setContactList] = useState<ContactMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<{ [id: string]: string }>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const isElevated = currentStaff.role === 'OWNER' || currentStaff.role === 'ADMIN';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fb, ct] = await Promise.all([
        feedbackService.getAllFeedback(),
        contactService.getAllContactMessages(),
      ]);
      setFeedbackList(fb);
      setContactList(ct);
    } catch (err) {
      console.warn('Failed to load inbox items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateFeedbackStatus = async (item: FeedbackItem, newStatus: FeedbackStatus) => {
    try {
      await feedbackService.updateFeedbackStatus(item.id, newStatus);
      setFeedbackList((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: newStatus } : f))
      );
      onRefreshMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFeedbackNotes = async (item: FeedbackItem) => {
    const notes = noteDrafts[item.id] !== undefined ? noteDrafts[item.id] : item.adminNotes || '';
    setSavingNoteId(item.id);
    try {
      await feedbackService.updateFeedbackStatus(item.id, item.status, notes);
      setFeedbackList((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, adminNotes: notes } : f))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Delete this feedback submission permanently?')) return;
    try {
      await feedbackService.deleteFeedback(id);
      setFeedbackList((prev) => prev.filter((f) => f.id !== id));
      onRefreshMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateContactStatus = async (item: ContactMessageItem, newStatus: ContactStatus) => {
    try {
      await contactService.updateContactStatus(item.id, newStatus);
      setContactList((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, status: newStatus } : c))
      );
      onRefreshMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveContactNotes = async (item: ContactMessageItem) => {
    const notes = noteDrafts[item.id] !== undefined ? noteDrafts[item.id] : item.adminNotes || '';
    setSavingNoteId(item.id);
    try {
      await contactService.updateContactStatus(item.id, item.status, undefined, notes);
      setContactList((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, adminNotes: notes } : c))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Delete this inquiry record permanently?')) return;
    try {
      await contactService.deleteContactMessage(id);
      setContactList((prev) => prev.filter((c) => c.id !== id));
      onRefreshMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered collections
  const filteredFeedback = feedbackList.filter((item) => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.content.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredContact = contactList.filter((item) => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.message.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold';
      case 'in_review':
      case 'in_progress':
        return 'bg-blue-500/15 border-blue-500/40 text-blue-400';
      case 'resolved':
      case 'responded':
        return 'bg-[#D4FF3F]/15 border-[#D4FF3F]/40 text-[#D4FF3F]';
      case 'archived':
        return 'bg-neutral-800 border-neutral-700 text-neutral-400';
      default:
        return 'bg-neutral-800 border-neutral-700 text-neutral-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-editorial font-light text-[#F5F5F0]">
            Triage & Inquiries Inbox
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Review user feedback notes and direct contact inquiries stored in Firestore.
          </p>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="flex bg-[#121217] border border-[#22222A] p-1 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveSubTab('feedback');
              setFilterStatus('all');
            }}
            className={`px-4 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-2 ${
              activeSubTab === 'feedback'
                ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <MessageSquareHeart className="w-3.5 h-3.5" />
            <span>Feedback ({feedbackList.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('contact');
              setFilterStatus('all');
            }}
            className={`px-4 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-2 ${
              activeSubTab === 'contact'
                ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Inquiries ({contactList.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#64646E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'feedback'
                ? 'Search feedback content, email, category...'
                : 'Search message, sender name, email...'
            }
            className="w-full bg-[#0E0E12] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] pl-10 pr-4 py-2.5 outline-none placeholder-[#555560]"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#0E0E12] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] px-3.5 py-2.5 outline-none uppercase"
        >
          <option value="all">All Statuses</option>
          <option value="new">New (Needs Review)</option>
          <option value={activeSubTab === 'feedback' ? 'in_review' : 'in_progress'}>
            In Review / Progress
          </option>
          <option value={activeSubTab === 'feedback' ? 'resolved' : 'responded'}>
            Resolved / Responded
          </option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Content Stream */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono-code text-[#64646E] bg-[#0E0E12] border border-[#F5F5F0]/10">
          Syncing inbox from Firestore...
        </div>
      ) : activeSubTab === 'feedback' ? (
        filteredFeedback.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#969696] bg-[#0E0E12] border border-[#F5F5F0]/10">
            No feedback entries match your criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFeedback.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-[#0E0E12] border border-[#F5F5F0]/15 hover:border-[#F5F5F0]/25 transition-all text-xs font-mono-code"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase border ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5 uppercase">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-[#64646E]">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="font-sans-clean text-sm text-[#F5F5F0] line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>

                      {item.email && (
                        <div className="text-[11px] text-[#969696] flex items-center gap-1">
                          <span>From:</span>
                          <span className="text-[#F5F5F0]">{item.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[#969696]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-5 border-t border-[#F5F5F0]/10 bg-[#121217] space-y-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#64646E] mb-1">
                          Full Feedback Submission
                        </div>
                        <div className="p-3 bg-[#0A0A0E] border border-[#22222A] text-sm font-sans-clean text-[#F5F5F0] whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </div>
                      </div>

                      {/* Status Selector & Internal Notes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#64646E] mb-1">
                            Update Triage Status
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {(['new', 'in_review', 'resolved', 'archived'] as FeedbackStatus[]).map(
                              (st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateFeedbackStatus(item, st)}
                                  className={`px-3 py-1 text-[10px] uppercase border transition-colors ${
                                    item.status === st
                                      ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                                      : 'bg-[#14141A] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
                                  }`}
                                >
                                  {st.replace('_', ' ')}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#64646E] mb-1">
                            Internal Staff Notes
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={
                                noteDrafts[item.id] !== undefined
                                  ? noteDrafts[item.id]
                                  : item.adminNotes || ''
                              }
                              onChange={(e) =>
                                setNoteDrafts({ ...noteDrafts, [item.id]: e.target.value })
                              }
                              placeholder="Add triage note or follow-up assignee..."
                              className="flex-1 bg-[#0A0A0E] border border-[#262630] text-xs font-mono-code text-[#F5F5F0] p-2 outline-none"
                            />
                            <button
                              onClick={() => handleSaveFeedbackNotes(item)}
                              disabled={savingNoteId === item.id}
                              className="px-3 py-1.5 bg-[#14141A] hover:bg-[#1E1E28] border border-[#262630] text-[#D4FF3F] text-xs uppercase"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {isElevated && (
                        <div className="pt-2 flex justify-end border-t border-[#F5F5F0]/5">
                          <button
                            onClick={() => handleDeleteFeedback(item.id)}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 uppercase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Record</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : filteredContact.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono-code text-[#969696] bg-[#0E0E12] border border-[#F5F5F0]/10">
          No contact inquiries match your criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContact.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-[#0E0E12] border border-[#F5F5F0]/15 hover:border-[#F5F5F0]/25 transition-all text-xs font-mono-code"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="font-sans-clean font-medium text-[#F5F5F0] text-sm">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-[#969696]">({item.email})</span>
                      <span className="text-[11px] text-[#64646E]">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="font-sans-clean text-sm text-[#F5F5F0] line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[#969696]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-[#F5F5F0]/10 bg-[#121217] space-y-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#64646E] mb-1">
                        Full Inquiry Message
                      </div>
                      <div className="p-3 bg-[#0A0A0E] border border-[#22222A] text-sm font-sans-clean text-[#F5F5F0] whitespace-pre-wrap leading-relaxed">
                        {item.message}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#64646E] mb-1">
                          Update Inquiry Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(['new', 'in_progress', 'responded', 'archived'] as ContactStatus[]).map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateContactStatus(item, st)}
                                className={`px-3 py-1 text-[10px] uppercase border transition-colors ${
                                  item.status === st
                                    ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                                    : 'bg-[#14141A] text-[#969696] border-[#262630] hover:text-[#F5F5F0]'
                                }`}
                              >
                                {st.replace('_', ' ')}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#64646E] mb-1">
                          Direct Reply Link
                        </label>
                        <a
                          href={`mailto:${item.email}?subject=Misfits Club Support & Response`}
                          className="inline-flex items-center gap-2 text-xs text-[#D4FF3F] hover:underline pt-2 font-mono-code"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Open email draft to {item.email}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {isElevated && (
                      <div className="pt-2 flex justify-end border-t border-[#F5F5F0]/5">
                        <button
                          onClick={() => handleDeleteContact(item.id)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 uppercase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Inquiry</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
