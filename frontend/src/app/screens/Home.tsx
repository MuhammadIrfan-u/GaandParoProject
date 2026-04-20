import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Bell, Plus, Heart, MessageCircle, Share2, MoreVertical, AlertCircle, Calendar, ShoppingBag, MapPin, TrendingUp } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { postsService } from "../services/storage";
import { Post } from "../services/mockData";
import { toast } from "sonner";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await postsService.getPosts();
      setPosts(data);
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
    { icon: AlertCircle, label: "Alert", color: "text-red-600", bg: "bg-red-100", link: "/create-alert" },
    { icon: Calendar, label: "Event", color: "text-blue-600", bg: "bg-blue-100", link: "/create-event" },
    { icon: ShoppingBag, label: "Sell", color: "text-green-600", bg: "bg-green-100", link: "/create-marketplace-item" },
    { icon: MapPin, label: "Service", color: "text-purple-600", bg: "bg-purple-100", link: "/services" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl">NeighborHub</h1>
            <Link to="/neighborhoods" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Oak Valley Community
            </Link>
          </div>
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

        {/* Create Post */}
        <Link
          to="/create-post"
          className="bg-white rounded-2xl p-4 mb-4 border border-border flex items-center gap-3 hover:bg-muted/50 transition-colors"
        >
          <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-muted-foreground">Share with your neighbors...</span>
        </Link>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white">
                      {post.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{post.author}</span>
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
                  <p className="text-sm leading-relaxed">{post.content}</p>
                </Link>

                {/* Post Actions */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-around">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors py-2 px-4 rounded-xl ${
                      post.likedBy.includes('user-1') 
                        ? 'text-red-500 bg-red-50' 
                        : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.likedBy.includes('user-1') ? 'fill-current' : ''}`} />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <Link 
                    to={`/post/${post.id}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors py-2 px-4 rounded-xl hover:bg-blue-50"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments.length}</span>
                  </Link>
                  <button 
                    onClick={() => toast.success("Post shared!")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors py-2 px-4 rounded-xl hover:bg-green-50"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}