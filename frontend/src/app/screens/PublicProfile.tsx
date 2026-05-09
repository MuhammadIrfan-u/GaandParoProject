import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Shield, Star, Mail, Phone, MapPin,
  MessageCircle, Calendar, AlertCircle, User,
  Lock, TrendingUp, Award
} from "lucide-react";
import { Button } from "../components/ui/button";
import { authService, usersService, settingsService, reviewsService } from "../services/storage";
import { User as UserType, Review } from "../services/types";
import { toast } from "sonner";

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [user, setUser] = useState<UserType | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Fetch user info
      const userData = await usersService.getUser(userId!);
      setUser(userData);

      // Fetch user settings to check visibility
      const userSettings = await settingsService.getSettings(userId!);
      setSettings(userSettings);

      // If profile is visible, fetch reviews too
      if (userSettings?.profile_visibility !== false) {
        const reviewsData = await reviewsService.getReviews(undefined, 'all', userId);
        setReviews(reviewsData);
      }
    } catch (err: any) {
      console.error("Error loading user profile:", err);
      setError("Failed to load profile. This user might not exist or there's a connection issue.");
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center">
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 mb-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Profile Unavailable</h2>
          <p className="text-red-700 max-w-xs">{error || "User not found"}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  // Check visibility setting
  const isProfileVisible = settings?.profile_visibility !== false;
  const showPhone = settings?.show_phone_number === true;

  if (!isProfileVisible && user.id !== currentUser.id) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4 flex items-center gap-4 border-b border-border bg-white">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Private Profile</h2>
          <p className="text-muted-foreground max-w-xs mb-8">
            This user has chosen to keep their profile private from the community.
          </p>
          <Button onClick={() => navigate(-1)} className="w-full max-w-xs rounded-xl h-12">
            Return to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header / Banner Area */}
      <div className="bg-gradient-to-br from-primary via-indigo-600 to-purple-600 pt-8 pb-20 relative">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="bg-white/20 backdrop-blur-md rounded-full p-2 hover:bg-white/30 transition-colors text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="relative mb-4">
              <div className="bg-white rounded-full w-28 h-28 flex items-center justify-center text-primary text-4xl shadow-2xl font-bold overflow-hidden border-4 border-white/30">
                {user.avatar && user.avatar.length > 2 ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.avatar || user.name.charAt(0).toUpperCase()
                )}
              </div>
              {user.verified && (
                <div className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1.5 border-2 border-white">
                  <Shield className="w-4 h-4 fill-white text-blue-500" />
                </div>
              )}
            </div>

            <h1 className="text-white text-3xl font-black mb-1 drop-shadow-md">{user.name}</h1>

            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-white text-xs font-bold border border-white/20">
                Member since {new Date(user.joinedDate || Date.now()).getFullYear()}
              </div>
              {user.isProvider && (
                <div className="bg-yellow-400 text-yellow-900 rounded-full px-4 py-1 text-xs font-bold shadow-lg flex items-center gap-1">
                  <Award className="w-3 h-3" /> Service Provider
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Curved bottom effect */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background rounded-t-[32px]"></div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 relative z-10">
        {/* Stats Card */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-xl mb-6 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-2xl font-black text-primary mb-1">{(user.reputation || 0).toFixed(1)}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center justify-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Reputation
            </div>
          </div>
          <div className="w-px h-10 bg-border mx-auto my-auto" />
          <div className="text-center">
            <div className="text-2xl font-black text-foreground mb-1">{reviews.length}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center justify-center gap-1">
              <MessageCircle className="w-3 h-3 text-blue-500" /> Reviews
            </div>
          </div>
        </div>

        {/* Action Bar */}
        {user.id !== currentUser.id && (
          <div className="flex gap-3 mb-6">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 shadow-lg shadow-primary/20 font-bold"
              onClick={() => navigate(`/chat/new?recipientId=${user.id}`)}
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Message
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl h-14 w-14 border-border hover:bg-muted"
              onClick={() => {
                navigator.share?.({
                  title: `${user.name}'s Profile`,
                  url: window.location.href
                }).catch(() => toast.info("Link copied!"));
              }}
            >
              <TrendingUp className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Info Sections */}
        <div className="space-y-4">
          {user.bio && (
            <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> About
              </h3>
              <p className="text-foreground/80 leading-relaxed italic">"{user.bio}"</p>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contact Details</h3>
            </div>
            <div className="divide-y divide-border">
              <div className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</div>
                  <div className="text-sm font-semibold">{user.email}</div>
                </div>
              </div>

              {showPhone && user.phone && (
                <div className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                  <div className="bg-green-50 p-2 rounded-xl">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number</div>
                    <div className="text-sm font-semibold">{user.phone}</div>
                  </div>
                </div>
              )}

              <div className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                <div className="bg-purple-50 p-2 rounded-xl">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Location</div>
                  <div className="text-sm font-semibold">{user.address || "Oak Valley Resident"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Feedback</h3>
              {avgRating > 0 && (
                <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold">
                  <Star className="w-3 h-3 fill-yellow-600" /> {avgRating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="divide-y divide-border">
              {reviews.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground italic">
                  No community reviews yet.
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="p-5 hover:bg-muted/5 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary rounded-full w-9 h-9 flex items-center justify-center text-xs font-black shadow-sm">
                          {review.reviewerAvatar}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{review.reviewer}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
                    <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                      "{review.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="text-center py-10 opacity-30">
          <Shield className="w-8 h-8 mx-auto mb-2" />
          <p className="text-[10px] uppercase font-black tracking-widest">Gaand Paro Verified Profile</p>
        </div>
      </div>
    </div>
  );
}
