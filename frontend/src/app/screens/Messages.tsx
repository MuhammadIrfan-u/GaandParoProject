import { useState, useEffect } from "react";
import { Link } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { Input } from "../components/ui/input";
import { messagesService, authService } from "../services/storage";
import { Conversation, User } from "../services/types";
import { toast } from "sonner";
import { Plus, X, Flag, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { ReportModal } from "../components/ReportModal";

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [neighborhoodMembers, setNeighborhoodMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messagesService.getConversations();
      setConversations(data);
    } catch (error) {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    const user = authService.getCurrentUser();
    if (!user.neighborhoodId) return;
    
    setMembersLoading(true);
    try {
      const members = await messagesService.getNeighborhoodMembers(user.neighborhoodId);
      setNeighborhoodMembers(members);
    } catch (error) {
      toast.error("Failed to load neighborhood members");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (showNewMessageModal) {
      loadMembers();
    }
  }, [showNewMessageModal]);

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.groupName && conv.groupName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl">Messages</h1>
            <button 
              onClick={() => setShowNewMessageModal(true)}
              className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No conversations found" : "No messages yet"}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/chat/${conversation.id}`}
                className="flex items-center gap-3 px-4 py-4 border-b border-border hover:bg-muted/30 transition-colors"
              >
                <div className="relative">
                  {conversation.isGroup ? (
                    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-14 h-14 flex items-center justify-center text-white">
                      {conversation.groupName?.charAt(0) || 'G'}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-14 h-14 flex items-center justify-center text-white">
                      {conversation.participantAvatars[0]}
                    </div>
                  )}
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm truncate">
                      {conversation.isGroup
                        ? conversation.groupName
                        : conversation.participants[0]}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {conversation.lastMessageTime}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${conversation.unreadCount > 0 ? '' : 'text-muted-foreground'}`}>
                    {conversation.lastMessage}
                  </p>
                </div>
                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="ml-2">
                  <ReportModal 
                    reportedItemId={conversation.id} 
                    reportedItemType="message"
                    trigger={
                      <button className="text-muted-foreground hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-muted">
                        <Flag className="w-4 h-4" />
                      </button>
                    }
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg">New Message</h2>
              <button onClick={() => setShowNewMessageModal(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto pr-1">
                {membersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading members...</div>
                ) : neighborhoodMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No other members found in your neighborhood</div>
                ) : (
                  <div className="space-y-1">
                    {neighborhoodMembers
                      .filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
                      .map((member) => (
                        <Link
                          key={member.id}
                          to={`/chat/new?recipientId=${member.id}&name=${encodeURIComponent(member.name)}`}
                          onClick={() => setShowNewMessageModal(false)}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors"
                        >
                          <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white">
                            {member.avatar || member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              {member.verified && (
                                <div className="bg-blue-500 rounded-full w-3 h-3 flex items-center justify-center">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">Community Member</div>
                          </div>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}