import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Bell, Plus, Heart, MessageCircle, Share2, MoreVertical, AlertCircle, Calendar, ShoppingBag, MapPin, TrendingUp, Star, Users, FileText } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { postsService, neighborhoodsService, alertsService, eventsService, authService } from "../services/storage";
import { Post, Neighborhood, Alert, Event } from "../services/types";
import { toast } from "sonner";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNeighborhood, setUserNeighborhood] = useState<Neighborhood | null>(null);
  const currentUser = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'for-you' | 'share' | 'alerts' | 'events'>('for-you');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (activeTab === 'alerts' && alerts.length === 0) loadAlerts();
    if (activeTab === 'events' && events.length === 0) loadEvents();
  }, [activeTab]);

  const loadAlerts = async () => {
    setLoadingContent(true);
    try {
      const data = await alertsService.getAlerts();
      setAlerts(data);
    } catch (error) {
      toast.error("Failed to load alerts");
    } finally {
      setLoadingContent(false);
    }
  };

  const loadEvents = async () => {
    setLoadingContent(true);
    try {
      const data = await eventsService.getEvents(userNeighborhood?.id);
      setEvents(data);
    } catch (error) {
      toast.error("Failed to load events");
    } finally {
      setLoadingContent(false);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await postsService.getPosts();
      setPosts(data);
      try {
        const nbh = await neighborhoodsService.getUserNeighborhood();
        setUserNeighborhood(nbh || null);
      } catch (e) {
        // ignore
      }
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await postsService.likePost(postId);
      await loadPosts();
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const quickActions = [
    { icon: AlertCircle, label: "Alert", color: "text-red-600", bg: "bg-red-100", link: "/alerts" },
    { icon: Calendar, label: "Event", color: "text-blue-600", bg: "bg-blue-100", link: "/events" },
    { icon: ShoppingBag, label: "Sell", color: "text-green-600", bg: "bg-green-100", link: "/marketplace" },
    { icon: MapPin, label: "Service", color: "text-purple-600", bg: "bg-purple-100", link: "/services" },
    { icon: Star, label: "Reviews", color: "text-orange-600", bg: "bg-orange-100", link: "/reputation" },
    { icon: Users, label: "Community", color: "text-yellow-800", bg: "bg-yellow-100", link: "/neighborhoods" },
    { icon: FileText, label: "Proposal", color: "text-cyan-600", bg: "bg-cyan-100", link: "/propose-neighborhood" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl">NeighborHub</h1>
            <Link
              to={userNeighborhood ? `/neighborhood/${userNeighborhood.id}` : "/neighborhoods"}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {userNeighborhood ? userNeighborhood.name : 'Oak Valley Community'}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/reputation" className="bg-orange-50 text-orange-600 rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:bg-orange-100 transition-colors">
              <Star className="w-4 h-4 fill-orange-600" />
              <span className="text-xs font-bold">{currentUser.reputation.toFixed(1)}</span>
            </Link>
            <Link to="/notifications" className="relative">
              <div className="bg-muted rounded-full p-2 hover:bg-muted/80 transition-colors">
                <Bell className="w-6 h-6" />
              </div>
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                3
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.link}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className={`${action.bg} ${action.color} rounded-full p-3`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-muted-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
            <TrendingUp className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl mb-1">248</div>
            <div className="text-xs opacity-90">Active Members</div>
          </div>
          <Link to="/events" className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white hover:opacity-90 transition-opacity">
            <Calendar className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl mb-1">12</div>
            <div className="text-xs opacity-90">This Week</div>
          </Link>
          <Link to="/alerts" className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white hover:opacity-90 transition-opacity">
            <AlertCircle className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl mb-1">2</div>
            <div className="text-xs opacity-90">Active Alerts</div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4 overflow-x-auto no-scrollbar sticky top-[73px] bg-background/80 backdrop-blur-md z-30 -mx-4 px-4">
          {[
            { id: 'for-you', label: 'For You' },
            { id: 'share', label: 'Share' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'events', label: 'Events' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Create Post */}
        {activeTab !== 'alerts' && activeTab !== 'events' && (
          <Link
            to="/create-post"
            className="bg-white rounded-2xl p-4 mb-4 border border-border flex items-center gap-3 hover:bg-muted/50 transition-colors"
          >
            <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="text-muted-foreground">Share with your neighbors...</span>
          </Link>
        )}

        {/* Feed */}
        {loading || loadingContent ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'for-you' || activeTab === 'share' ? (
              posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-2xl border border-border">
                  No posts yet in your neighborhood.
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                    {/* Post Header */}
                    <div className="p-4 flex items-start justify-between">
                      <div className="flex gap-3">
                        <Link
                          to={`/user-profile/${post.authorId}`}
                          className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white flex-shrink-0 transition-transform active:scale-95"
                        >
                          {post.avatar}
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/user-profile/${post.authorId}`}
                              className="font-semibold hover:text-primary transition-colors"
                            >
                              {post.author}
                            </Link>
                            {post.verified && (
                              <div className="bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{post.time}</div>
                        </div>
                      </div>

                      <button className="text-muted-foreground p-1 hover:bg-muted rounded-full">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <Link to={`/post/${post.id}`} className="block px-4 pb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs mb-3 ${post.categoryColor}`}>
                        {post.category}
                      </span>
                      <p className="text-sm leading-relaxed mb-3">{post.content}</p>
                      {post.image && (
                        <div className="rounded-xl overflow-hidden border border-border mb-3">
                          <img
                            src={post.image}
                            alt="Post content"
                            className="w-full h-auto object-cover max-h-[300px]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </Link>

                    {/* Post Actions */}
                    <div className="px-4 py-3 border-t gap-4 border-border flex items-center justify-right">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 transition-colors py-2 px-4 rounded-xl ${post.likedBy.includes(currentUser.id)
                          ? 'text-red-500 bg-red-50'
                          : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'
                          }`}
                      >
                        <Heart className={`w-5 h-5 ${post.likedBy.includes(currentUser.id) ? 'fill-current' : ''}`} />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <Link
                        to={`/post/${post.id}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors py-2 px-4 rounded-xl hover:bg-blue-50"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{post.comments.length}</span>
                      </Link>

                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'alerts' ? (
              alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-2xl border border-border">
                  No active alerts.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-2xl border ${alert.type === 'emergency' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${alert.type === 'emergency' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                        {alert.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                    </div>
                    <h4 className="font-medium mb-1">{alert.title}</h4>
                    <p className="text-sm mb-3">{alert.description}</p>
                    <div className="text-xs text-muted-foreground">Reported by {alert.author}</div>
                  </div>
                ))
              )
            ) : (
              events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-2xl border border-border">
                  No upcoming events.
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-indigo-100 flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-primary/40" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-primary font-medium">{event.date} • {event.time}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted uppercase font-bold">{event.category}</span>
                      </div>
                      <h4 className="font-bold mb-2">{event.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[10px]">
                              {String.fromCharCode(64 + i)}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{event.attendees.length} attending</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}