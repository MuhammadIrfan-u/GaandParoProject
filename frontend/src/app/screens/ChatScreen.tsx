import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { ArrowLeft, Send, Flag } from "lucide-react";
import { ReportModal } from "../components/ReportModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { messagesService, authService } from "../services/storage";
import { Message } from "../services/types";
import { toast } from "sonner";

export default function ChatScreen() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const recipientId = searchParams.get('recipientId');
  const recipientName = searchParams.get('name') || 'User';

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(conversationId !== 'new');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      loadMessages();
      // Only mark the last message as read if it's from the other person
      // For simplicity, we mark the whole conversation as read in the backend if possible,
      // but the current API marks by messageId. We'll handle this later or mark specific messages.
    } else {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!conversationId || conversationId === 'new') return;
    try {
      const data = await messagesService.getMessages(conversationId);
      setMessages(data);
      
      // Mark unread messages as read
      const unreadMessages = data.filter(m => !m.read && m.senderId !== currentUser.id);
      unreadMessages.forEach(m => messagesService.markAsRead(m.id));
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const data: any = {
        content: newMessage
      };

      if (conversationId === 'new' && recipientId) {
        data.recipientId = recipientId;
      } else {
        data.conversationId = conversationId;
      }

      const result = await messagesService.sendMessage(data);
      setNewMessage("");
      
      if (conversationId === 'new') {
        navigate(`/chat/${result.conversationId}`, { replace: true });
      } else {
        await loadMessages();
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-10 h-10 flex items-center justify-center text-white">
              {conversationId === 'new' ? recipientName.charAt(0) : (messages.find(m => m.senderId !== currentUser.id)?.senderAvatar || 'U')}
            </div>
            <div>
              <h1 className="text-lg">
                {conversationId === 'new' ? recipientName : (messages.find(m => m.senderId !== currentUser.id)?.sender || 'Chat')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No messages yet. Start the conversation!</div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs flex-shrink-0">
                    {message.senderAvatar}
                  </div>
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {!isOwnMessage && (
                      <span className="text-xs text-muted-foreground mb-1">{message.sender}</span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-white rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isOwnMessage && (
                        <ReportModal 
                          reportedItemId={message.id} 
                          reportedItemType="message"
                          trigger={
                            <button className="text-muted-foreground hover:text-orange-500 transition-colors">
                              <Flag className="w-3 h-3" />
                            </button>
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-border sticky bottom-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
