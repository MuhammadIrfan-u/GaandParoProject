import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Search, MapPin, Users, Shield, Home as HomeIcon, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { JoinNeighborhoodModal } from "../components/JoinNeighborhoodModal";
import { neighborhoodsService, proposalsService, authService } from "../services/storage";
import { Neighborhood, NeighborhoodProposal } from "../services/types";
import { toast } from "sonner";

// Read real user ID from localStorage (set by actual login), fall back to mock
const getRealUserId = () =>
  localStorage.getItem("user_id") || authService.getCurrentUser().id;

export default function BrowseNeighborhoods() {
  const navigate = useNavigate();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [proposals, setProposals] = useState<NeighborhoodProposal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMyProposals, setViewMyProposals] = useState(false);
  const [userNeighborhood, setUserNeighborhood] = useState<Neighborhood | null>(null);
  const [joiningNeighborhoodId, setJoiningNeighborhoodId] = useState<number | string | null>(null);
  // Modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingJoinId, setPendingJoinId] = useState<number | null>(null);
  const [pendingJoinName, setPendingJoinName] = useState<string>("");

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = getRealUserId();
      const [neighborhoodsData, proposalsData, userNeighborhoodData] = await Promise.all([
        neighborhoodsService.getNeighborhoods(),
        proposalsService.getProposals(),
        neighborhoodsService.getUserNeighborhood(userId),
      ]);
      setNeighborhoods(neighborhoodsData);
      setProposals(proposalsData);
      setUserNeighborhood(userNeighborhoodData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const userProposals = proposals.filter(p => p.proposerId === currentUser.id);

  const displayNeighborhoods = viewMyProposals
    ? neighborhoods.filter(n => n.leadId === currentUser.id)
    : neighborhoods;

  const filteredNeighborhoods = displayNeighborhoods.filter(n =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayItems = viewMyProposals
    ? [
      ...filteredNeighborhoods.map(n => ({ type: 'neighborhood' as const, data: n })),
      ...userProposals
        .filter(p => p.status !== 'approved')
        .filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(p => ({ type: 'proposal' as const, data: p })),
    ]
    : filteredNeighborhoods.map(n => ({ type: 'neighborhood' as const, data: n }));

  const getStatusIcon = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  // Open the location-capture modal instead of joining directly
  const handleJoinClick = (neighborhoodId: number | string, neighborhoodName: string) => {
    const id = typeof neighborhoodId === 'string' ? parseInt(neighborhoodId) : neighborhoodId;
    setPendingJoinId(id);
    setPendingJoinName(neighborhoodName);
    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    const joined = neighborhoods.find(n => String(n.id) === String(pendingJoinId));
    if (joined) setUserNeighborhood(joined);
    toast.success("Successfully joined neighbourhood!");
    loadData();
  };

  const handleLeaveNeighborhood = async () => {
    if (!userNeighborhood) return;
    try {
      setJoiningNeighborhoodId(userNeighborhood.id);
      await neighborhoodsService.leaveNeighborhood(parseInt(String(userNeighborhood.id)) as any);
      toast.success("You have left the neighbourhood");
      setUserNeighborhood(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to leave neighbourhood");
    } finally {
      setJoiningNeighborhoodId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate("/home")}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              title="Back to home"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-xl">{viewMyProposals ? "My Proposed Neighborhoods" : "All Neighborhoods"}</h1>
              <Button
                onClick={() => setViewMyProposals(!viewMyProposals)}
                variant={viewMyProposals ? "default" : "outline"}
                size="sm"
                className={viewMyProposals ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              >
                {viewMyProposals ? `My Proposals (${userProposals.length})` : "View My Proposals"}
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={viewMyProposals ? "Search your proposals..." : "Search neighborhoods..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {viewMyProposals ? (
              <>
                <p>You haven't proposed any neighborhoods yet.</p>
                <Link to="/propose-neighborhood" className="text-primary mt-2 inline-block">
                  Propose a neighborhood
                </Link>
              </>
            ) : (
              <>
                <p>{searchQuery ? "No neighborhoods found" : "No neighborhoods available"}</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayItems.map((item) => {
              if (item.type === 'proposal') {
                const proposal = item.data;
                return (
                  <div
                    key={`proposal-${proposal.id}`}
                    className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-32 bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
                      <Clock className="w-16 h-16 text-yellow-400" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg">{proposal.name}</h3>
                        <div className="flex items-center gap-1 ml-auto text-xs px-2 py-1 rounded-full bg-yellow-100">
                          {getStatusIcon(proposal.status)}
                          <span className="capitalize">{proposal.status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{proposal.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{proposal.city}, {proposal.state}</span>
                        </div>
                      </div>

                      <Link to="/proposal-status" className="text-sm text-primary hover:underline">
                        View status details →
                      </Link>
                    </div>
                  </div>
                );
              } else {
                const neighborhood = item.data;
                const isAdmin = neighborhood.leadId === currentUser.id;

                return (
                  <div
                    key={`neighborhood-${neighborhood.id}`}
                    className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {!isAdmin && (
                      <Link to={`/neighborhood/${neighborhood.id}`} className="block">
                        <div
                          className="h-32 bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center bg-cover bg-center"
                          style={neighborhood.coverPhoto ? { backgroundImage: `url(${neighborhood.coverPhoto})` } : {}}
                        >
                          {!neighborhood.coverPhoto && (
                            <HomeIcon className="w-16 h-16 text-primary/40" />
                          )}
                        </div>
                      </Link>
                    )}
                    {isAdmin && (
                      <div
                        className="h-32 bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center cursor-pointer hover:from-primary/30 hover:to-indigo-200 transition-colors bg-cover bg-center"
                        style={neighborhood.coverPhoto ? { backgroundImage: `url(${neighborhood.coverPhoto})` } : {}}
                        onClick={() => navigate(`/hub-settings/${neighborhood.id}`)}
                      >
                        {!neighborhood.coverPhoto && (
                          <HomeIcon className="w-16 h-16 text-primary/40" />
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg">{neighborhood.name}</h3>
                        {neighborhood.verified && (
                          <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {isAdmin && (
                          <div className="bg-purple-500 rounded-full w-5 h-5 flex items-center justify-center ml-1">
                            <span className="text-xs text-white font-bold">A</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 ml-auto text-xs px-2 py-1 rounded-full bg-green-100">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Approved</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{neighborhood.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{neighborhood.primaryLandmark}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{neighborhood.population}</span>
                        </div>
                      </div>

                      {isAdmin && (
                        <Button
                          onClick={() => navigate(`/hub-settings/${neighborhood.id}`)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          ⚙️ Manage Settings
                        </Button>
                      )}
                      {!isAdmin && (
                        <>
                          {userNeighborhood && userNeighborhood.id === neighborhood.id ? (
                            <div className="space-y-2">
                              <Link to={`/neighborhood/${neighborhood.id}`} className="block">
                                <Button className="w-full" variant="default">
                                  View My Neighborhood
                                </Button>
                              </Link>
                              <Button
                                onClick={handleLeaveNeighborhood}
                                disabled={joiningNeighborhoodId === neighborhood.id}
                                className="w-full"
                                variant="outline"
                              >
                                {joiningNeighborhoodId === neighborhood.id ? "Leaving..." : "Leave Neighborhood"}
                              </Button>
                            </div>
                          ) : userNeighborhood ? (
                            <Button
                              onClick={() => handleJoinClick(neighborhood.id, neighborhood.name)}
                              disabled={joiningNeighborhoodId !== null}
                              className="w-full bg-orange-600 hover:bg-orange-700"
                            >
                              Switch Neighborhood
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleJoinClick(neighborhood.id, neighborhood.name)}
                              disabled={joiningNeighborhoodId !== null}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              Join Neighborhood
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}

        {!viewMyProposals && (
          <Link to="/propose-neighborhood" className="block mt-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-primary/30 text-center hover:bg-primary/5 transition-colors">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Don't see your neighborhood?
              </p>
              <p className="text-primary mt-1">Propose a new one</p>
            </div>
          </Link>
        )}
      </div>

      {/* Location verification modal */}
      {pendingJoinId !== null && (
        <JoinNeighborhoodModal
          isOpen={showJoinModal}
          onOpenChange={setShowJoinModal}
          neighborhoodId={pendingJoinId}
          neighborhoodName={pendingJoinName}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
}