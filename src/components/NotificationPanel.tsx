import React, { useRef, useEffect } from 'react';
import { AppNotification } from '../types';
import { 
  Bell, 
  CheckCheck, 
  UserPlus, 
  UserCheck, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  X,
  ArrowUpRight
} from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: AppNotification) => void;
  isLoading?: boolean;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications = [],
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  isLoading = false,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatRelativeTime = (isoString?: string): string => {
    if (!isoString) return 'Just now';
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffSec < 45) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CONNECTION_REQUEST':
        return <UserPlus className="w-3.5 h-3.5 text-[#D4FF3F]" />;
      case 'CONNECTION_ACCEPTED':
        return <UserCheck className="w-3.5 h-3.5 text-[#D4FF3F]" />;
      case 'SPARK_INTERACTION':
        return <Sparkles className="w-3.5 h-3.5 text-[#D4FF3F]" />;
      case 'MESSAGE':
        return <MessageSquare className="w-3.5 h-3.5 text-[#D4FF3F]" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[#D4FF3F]" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'CONNECTION_REQUEST':
        return 'Connection Request';
      case 'CONNECTION_ACCEPTED':
        return 'Connection Accepted';
      case 'SPARK_INTERACTION':
        return 'Spark Update';
      case 'MESSAGE':
        return 'Direct Message';
      default:
        return 'Update';
    }
  };

  return (
    <div
      ref={panelRef}
      id="notifications-dropdown-panel"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[500px] bg-[#0E0E10] border border-[#242424] shadow-2xl rounded-none z-50 flex flex-col font-sans-clean text-[#F5F5F0] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#242424] bg-[#121214]">
        <div className="flex items-center gap-2">
          <span className="font-mono-code text-xs font-bold uppercase tracking-wider text-[#F5F5F0]">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-[#D4FF3F] text-[#080808] text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded-none">
              {unreadCount} NEW
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              id="mark-all-read-btn"
              onClick={onMarkAllAsRead}
              className="text-[11px] font-mono-code text-[#8A8A8A] hover:text-[#D4FF3F] transition-colors flex items-center gap-1 focus:outline-none"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark read</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-[#F5F5F0] transition-colors p-1 focus:outline-none"
            aria-label="Close notification panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1C] max-h-[400px]">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F] animate-ping mb-3" />
            <span className="text-xs font-mono-code text-[#8A8A8A] uppercase tracking-wider">
              Fetching updates...
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-6">
            <div className="w-10 h-10 rounded-full bg-[#141416] border border-[#242424] flex items-center justify-center mb-3 text-[#8A8A8A]">
              <Bell className="w-4 h-4 text-[#8A8A8A]" />
            </div>
            <p className="text-sm font-medium text-[#F5F5F0] mb-1">You're all caught up.</p>
            <p className="text-xs text-[#8A8A8A] max-w-[220px]">
              Connection requests and collaborative sparks will appear here.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.read;

            return (
              <div
                key={item.id}
                id={`notification-item-${item.id}`}
                onClick={() => onNotificationClick(item)}
                className={`group p-4 flex items-start gap-3 transition-colors cursor-pointer text-left relative ${
                  isUnread
                    ? 'bg-[#151518] hover:bg-[#1A1A1E]'
                    : 'bg-[#0E0E10] hover:bg-[#141416] opacity-80 hover:opacity-100'
                }`}
              >
                {/* Visual Type Icon & Sender Avatar */}
                <div className="relative flex-shrink-0 mt-0.5">
                  {item.senderAvatar ? (
                    <img
                      src={item.senderAvatar}
                      alt={item.senderName || 'Member'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-sm object-cover border border-[#242424]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-sm bg-[#1A1A1C] border border-[#2A2A2E] flex items-center justify-center text-xs font-mono-code text-[#D4FF3F]">
                      {(item.senderName || 'M').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#080808] border border-[#242424] rounded-full flex items-center justify-center">
                    {getNotificationIcon(item.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#D4FF3F] font-semibold truncate">
                      {getNotificationTypeLabel(item.type)}
                    </span>
                    <span className="text-[10px] font-mono-code text-[#8A8A8A] flex-shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed ${isUnread ? 'text-[#F5F5F0] font-medium' : 'text-[#A0A0A0]'}`}>
                    {item.message}
                  </p>

                  {item.senderRole && (
                    <span className="text-[10px] text-[#8A8A8A] font-mono-code block mt-1 truncate">
                      {item.senderRole}
                    </span>
                  )}
                </div>

                {/* Unread Indicator & Arrow */}
                <div className="flex flex-col items-center justify-between self-stretch flex-shrink-0">
                  {isUnread && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#D4FF3F] shadow-[0_0_8px_#D4FF3F]"
                      title="Unread notification"
                    />
                  )}
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#555] group-hover:text-[#D4FF3F] transition-colors mt-auto" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-[#1F1F22] bg-[#0A0A0C] flex items-center justify-between text-[10px] font-mono-code text-[#666]">
        <span>MISFITS CLUB ALERTS</span>
        <span className="text-[#888]">{notifications.length} TOTAL</span>
      </div>
    </div>
  );
};
