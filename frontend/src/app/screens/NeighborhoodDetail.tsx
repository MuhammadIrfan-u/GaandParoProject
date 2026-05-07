import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, MapPin, Users, Calendar, Shield, Settings as SettingsIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { neighborhoodsService, authService, postsService, alertsService, eventsService } from "../services/storage";
import { Neighborhood, Post, Alert, Event } from "../services/types";
import { toast } from "sonner";
import { Heart, MessageCircle, Share2, MoreVertical, Plus } from "lucide-react";
import { Link } from "react-router";

export default function NeighborhoodDetail() {
  const navigate = useNavigate();
  const { neighborhoodId } = useParams();
  const currentUser = authService.getCurrentUser();
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [loading, setLoading] = useState(true);
  const [userNeighborhood, setUserNeighborhood] = useState<Neighborhood | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'share' | 'alerts' | 'events'>('about');
  const [posts, setPosts] = useState<Post[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    loadNeighborhood();
  }, [neighborhoodId]);

  const loadNeighborhood = async () => {
    if (!neighborhoodId) return;
    try {
      const [data, userNbh] = await Promise.all([
        neighborhoodsService.getNeighborhood(neighborhoodId),
        neighborhoodsService.getUserNeighborhood(),
      ]);
      setNeighborhood(data || null);
      setUserNeighborhood(userNbh);
      
      // Load initial content if needed
      if (activeTab === 'share') loadPosts(neighborhoodId);
    } catch (error) {
      toast.error("Failed to load neighborhood");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!neighborhoodId) return;
    if (activeTab === 'share') loadPosts(neighborhoodId);
    else if (activeTab === 'alerts') loadAlerts();
    else if (activeTab === 'events') loadEvents(neighborhoodId);
  }, [activeTab, neighborhoodId]);

  const loadPosts = async (nbhId: string) => {
    setLoadingContent(true);
    try {
      const data = await postsService.getPosts(nbhId);
      setPosts(data);
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoadingContent(false);
    }
  };

  const loadAlerts = async () => {
    setLoadingContent(true);
    try {
      const data = await alertsService.getAlerts();
      // Backend doesn't support filtering alerts by neighborhoodId yet, 
      // but we filter locally if needed or assume global for now
      setAlerts(data);
    } catch (error) {
      toast.error("Failed to load alerts");
    } finally {
      setLoadingContent(false);
    }
  };

  const loadEvents = async (nbhId: string) => {
    setLoadingContent(true);
    try {
      const data = await eventsService.getEvents(nbhId);
      setEvents(data);
    } catch (error) {
      toast.error("Failed to load events");
    } finally {
      setLoadingContent(false);
    }
  };

  const handleJoinNeighborhood = async () => {
    if (!neighborhood) return;
    try {
      setIsJoining(true);
      await neighborhoodsService.joinNeighborhood(neighborhood.id);
      toast.success("Successfully joined neighborhood!");
      setUserNeighborhood(neighborhood);
    } catch (error: any) {
      toast.error(error.message || "Failed to join neighborhood");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveNeighborhood = async () => {
    if (!neighborhood) return;
    try {
      setIsJoining(true);
      await neighborhoodsService.leaveNeighborhood(neighborhood.id);
      toast.success("You have left the neighborhood");
      setUserNeighborhood(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to leave neighborhood");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!neighborhood) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Neighborhood not found</p>
          <Button onClick={() => navigate("/neighborhoods")}>Browse Neighborhoods</Button>
        </div>
      </div>
    );
  }

  const isLead = currentUser.id === neighborhood.leadId;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl flex-1">Neighborhood</h1>
          {isLead && (
            <Button onClick={() => navigate("/hub-settings")} variant="outline" size="sm">
              <SettingsIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Header Image */}
        <div className="h-48 bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center relative">
          {neighborhood.coverPhoto ? (
            <img src={neighborhood.coverPhoto} alt={neighborhood.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <MapPin className="w-16 h-16 text-primary/40 mx-auto" />
            </div>
          )}
          {neighborhood.verified && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-full px-4 py-2 text-sm flex items-center gap-2 shadow-lg">
              <Shield className="w-4 h-4" />
              Verified
            </div>
          )}
        </div>

        <div className="px-4 py-6">
          {/* Title */}
          <h1 className="text-3xl mb-3">{neighborhood.name}</h1>
          <p className="text-muted-foreground mb-6">{neighborhood.description}</p>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar sticky top-[73px] bg-background/80 backdrop-blur-md z-30 -mx-4 px-4">
            {[
              { id: 'about', label: 'About' },
              { id: 'share', label: 'Share' },
              { id: 'alerts', label: 'Alerts' },
              { id: 'events', label: 'Events' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'about' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-2xl p-4 border border-border text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl mb-1">{neighborhood.population}</div>
                  <div className="text-xs text-muted-foreground">Members</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-border text-center">
                  <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-sm mb-1 mt-2">{neighborhood.city}</div>
                  <div className="text-xs text-muted-foreground">City</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-border text-center">
                  <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-sm mb-1 mt-2">{new Date(neighborhood.createdDate).getFullYear()}</div>
                  <div className="text-xs text-muted-foreground">Est.</div>
                </div>
              </div>

              {/* Lead Info */}
              <div className="bg-white rounded-2xl p-4 border border-border mb-6">
                <div className="text-sm text-muted-foreground mb-2">Neighborhood Lead</div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white text-lg">
                    {(neighborhood.leadName && neighborhood.leadName.length > 0) ? neighborhood.leadName[0] : (neighborhood.leadName?.charAt(0) ?? '?')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{neighborhood.leadName ?? 'Unknown'}</span>
                      {isLead && (
                        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                          You
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Community Leader</div>
                  </div>
                </div>
              </div>

              {/* Primary Landmark */}
              <div className="bg-white rounded-2xl p-4 border border-border mb-6">
                <div className="text-sm text-muted-foreground mb-2">Primary Landmark</div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{neighborhood.primaryLandmark}</span>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl p-4 border border-border mb-6">
                <h3 className="text-sm mb-3">Active Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {neighborhood.settings.enableMarketplace && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                      ✓ Marketplace
                    </div>
                  )}
                  {neighborhood.settings.enableEvents && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                      ✓ Events
                    </div>
                  )}
                  {neighborhood.settings.enableServices && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                      ✓ Services
                    </div>
                  )}
                  {neighborhood.settings.enablePublicAlerts && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                      ✓ Public Alerts
                    </div>
                  )}
                  {neighborhood.settings.enableResourceExchange && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                      ✓ Resource Exchange
                    </div>
                  )}
                </div>
              </div>

              {/* Community Guidelines */}
              {neighborhood.guidelines && (
                <div className="bg-white rounded-2xl p-4 border border-border mb-6">
                  <h3 className="text-sm mb-3">Community Guidelines</h3>
                  <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
                    <pre className="whitespace-pre-wrap font-sans">{neighborhood.guidelines}</pre>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {userNeighborhood && userNeighborhood.id === neighborhood.id ? (
                  <>
                    <Button 
                      disabled={isJoining}
                      onClick={handleLeaveNeighborhood}
                      className="w-full" 
                      variant="outline"
                    >
                      {isJoining ? "Leaving..." : "Leave Neighborhood"}
                    </Button>
                    <Button 
                      onClick={() => navigate("/home")}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Go to Home
                    </Button>
                  </>
                ) : userNeighborhood ? (
                  <>
                    <Button 
                      disabled={isJoining}
                      onClick={handleJoinNeighborhood}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {isJoining ? "Switching..." : "Switch to This Neighborhood"}
                    </Button>
                    <Button 
                      onClick={() => navigate("/neighborhoods")}
                      variant="outline"
                      className="w-full"
                    >
                      Browse Other Neighborhoods
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      disabled={isJoining}
                      onClick={handleJoinNeighborhood}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isJoining ? "Joining..." : "Join This Neighborhood"}
                    </Button>
                    <Button 
                      onClick={() => navigate("/neighborhoods")}
                      variant="outline"
                      className="w-full"
                    >
                      Browse Other Neighborhoods
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === 'share' && (
            <div className="space-y-4">
              <Link
                to="/create-post"
                className="bg-white rounded-2xl p-4 border border-border flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Share with this neighborhood...</span>
              </Link>

              {loadingContent ? (
                <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-2xl border border-border">
                  No posts yet in this neighborhood.
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl border border-border overflow-hidden">
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

                    <Link to={`/post/${post.id}`} className="block px-4 pb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs mb-3 ${post.categoryColor || 'bg-blue-100 text-blue-700'}`}>
                        {post.category}
                      </span>
                      <p className="text-sm leading-relaxed">{post.content}</p>
                    </Link>

                    <div className="px-4 py-3 border-t border-border flex items-center justify-around">
                      <button className="flex items-center gap-2 text-muted-foreground py-2 px-4 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Heart className="w-5 h-5" />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <Link
                        to={`/post/${post.id}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors py-2 px-4 rounded-xl hover:bg-blue-50"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{post.comments?.length || 0}</span>
                      </Link>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors py-2 px-4 rounded-xl hover:bg-green-50">
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm">Share</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {loadingContent ? (
                <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-2xl border border-border">
                  No active alerts in this neighborhood.
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
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              {loadingContent ? (
                <div className="text-center py-8 text-muted-foreground">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-2xl border border-border">
                  No upcoming events in this neighborhood.
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
