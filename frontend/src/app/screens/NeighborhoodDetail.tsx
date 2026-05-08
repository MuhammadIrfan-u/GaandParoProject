import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, MapPin, Users, Calendar, Shield, Settings as SettingsIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { neighborhoodsService, authService } from "../services/storage";
import { Neighborhood } from "../services/types";
import { toast } from "sonner";

export default function NeighborhoodDetail() {
  const navigate = useNavigate();
  const { neighborhoodId } = useParams();
  const currentUser = authService.getCurrentUser();
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [loading, setLoading] = useState(true);
  const [userNeighborhood, setUserNeighborhood] = useState<Neighborhood | null>(null);
  const [isJoining, setIsJoining] = useState(false);

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
    } catch (error) {
      toast.error("Failed to load neighborhood");
    } finally {
      setLoading(false);
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
        </div>
      </div>
    </div>
  );
}
