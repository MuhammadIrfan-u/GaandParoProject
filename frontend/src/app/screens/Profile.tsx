import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Shield, Award, Settings as SettingsIcon, Bell, MessageCircle, ChevronRight, MapPin, AlertCircle, TrendingUp, Star, User, Mail, Phone, LogOut, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { BottomNav } from "../components/BottomNav";
import { authService, reviewsService, postsService } from "../services/storage";
import { Review } from "../services/types";

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch reviews for this user in their current neighborhood
      const reviewsData = await reviewsService.getReviews(currentUser.neighborhoodId, 'all', currentUser.id);
      setReviews(reviewsData);

      // Fetch posts count
      if (currentUser.neighborhoodId) {
        const count = await postsService.getPostsCount(currentUser.id, currentUser.neighborhoodId);
        setPostsCount(count);
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  const combinedReputation = reviews.length > 0
    ? (currentUser.reputation + avgRating) / 2
    : currentUser.reputation;

  const stats = [
    { icon: TrendingUp, label: "Posts", value: postsCount.toString(), color: "text-blue-600" },
    { icon: Star, label: "Reputation", value: combinedReputation.toFixed(1), color: "text-yellow-600" },
    { icon: Shield, label: "Status", value: currentUser.verified ? "Verified" : "Unverified", color: currentUser.verified ? "text-green-600" : "text-amber-600" },
  ];

  const menuItems = [
    { icon: User, label: "Edit Profile", link: "/edit-profile" },
    { icon: SettingsIcon, label: "Settings", link: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-primary via-indigo-600 to-purple-600 pt-8 pb-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-end mb-4">
            <Link to="/settings">
              <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                <SettingsIcon className="w-6 h-6 text-white" />
              </button>
            </Link>
          </div>

          <div className="text-center">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center text-primary text-3xl mx-auto mb-4 shadow-xl font-bold overflow-hidden">
              {currentUser.avatar && currentUser.avatar.length > 2 ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.avatar
              )}
            </div>
            <h1 className="text-white text-2xl mb-1 font-bold">{currentUser.name}</h1>
            <div className="flex flex-col items-center gap-2">
              {currentUser.verified ? (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                  <Shield className="w-4 h-4 fill-white text-primary" />
                  Verified Member
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm rounded-full px-3 py-1 text-amber-200 text-sm border border-amber-500/30">
                  <AlertCircle className="w-4 h-4" />
                  Unverified
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl p-4 border border-border shadow-lg mb-4">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-white rounded-xl border border-border p-1 mb-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'info' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted'
              }`}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'reviews' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted'
              }`}
          >
            Reputation & Reviews
          </button>
        </div>

        {activeTab === 'info' ? (
          <>
            <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="text-sm font-semibold">Contact Information</h3>
              </div>
              <div className="divide-y divide-border">
                <div className="p-4 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="text-sm font-medium">{currentUser.email}</div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="text-sm font-medium">{currentUser.phone}</div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Address</div>
                    <div className="text-sm font-medium">{currentUser.address}</div>
                  </div>
                </div>
              </div>
            </div>

            {currentUser.bio && (
              <div className="bg-white rounded-2xl border border-border p-4 mb-4">
                <h3 className="text-sm font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{currentUser.bio}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
              {menuItems.map((item, index) => (
                <Link
                  key={item.label}
                  to={item.link}
                  className={`flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors ${index < menuItems.length - 1 ? 'border-b border-border' : ''
                    }`}
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Community Reputation</h3>
              <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold">
                <Star className="w-3 h-3 fill-yellow-600" />
                {avgRating.toFixed(1)} ({reviews.length} Reviews)
              </div>
            </div>
            <div className="p-6 border-b border-border bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-black text-yellow-600">{combinedReputation.toFixed(1)}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-yellow-700">Combined Score</div>
                </div>
                <div className="w-px h-12 bg-yellow-200" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(combinedReputation) ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-200'}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-yellow-800 font-medium">Based on activity & reviews</div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No community feedback yet.</div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                          {review.reviewerAvatar}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{review.reviewer}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">"{review.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Super Admin Dashboard Link */}
        {currentUser.isAdmin && (
          <Link to="/super-admin-dashboard" className="block mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-xl transition-shadow">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold mb-0.5">Super Admin Dashboard</div>
                <div className="text-sm opacity-90">Manage neighborhoods & proposals</div>
              </div>
              <div className="bg-yellow-400 text-purple-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                1
              </div>
            </div>
          </Link>
        )}

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 h-12 rounded-xl"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>

        <div className="text-center py-6 text-sm text-muted-foreground">
          Member since {new Date(currentUser.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
