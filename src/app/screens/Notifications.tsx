import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Bell, Heart, MessageCircle, Calendar, AlertCircle, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { notificationsService } from "../services/storage";
import { Notification } from "../services/mockData";
import { toast } from "sonner";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      await loadNotifications();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'like': return <Heart className="w-5 h-5 text-pink-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl flex-1">Notifications</h1>
            {unreadCount > 0 && (
              <Button variant="ghost" onClick={handleMarkAllAsRead} className="text-sm">
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No notifications</div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const NotificationContent = (
                <div
                  className={`flex gap-3 px-4 py-4 border-b border-border ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm mb-1">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleMarkAsRead(notification.id);
                      }}
                      className="flex-shrink-0 text-primary hover:bg-primary/10 rounded-full p-2"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );

              return notification.actionUrl ? (
                <Link key={notification.id} to={notification.actionUrl}>
                  {NotificationContent}
                </Link>
              ) : (
                <div key={notification.id}>{NotificationContent}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}