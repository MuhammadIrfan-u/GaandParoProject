import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Input } from "../components/ui/input";
import { messagesService } from "../services/storage";
import { Conversation } from "../services/types";
import { toast } from "sonner";

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.groupName && conv.groupName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl mb-4">Messages</h1>
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
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}