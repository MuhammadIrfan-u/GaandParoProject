import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MapPin, Users, Shield, Search, Plus } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { neighborhoodsService } from "../services/storage";
import { Neighborhood } from "../services/mockData";
import { toast } from "sonner";

export default function NeighborhoodDiscovery() {
  const navigate = useNavigate();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNeighborhoods();
  }, []);

  const loadNeighborhoods = async () => {
    try {
      const data = await neighborhoodsService.getNeighborhoods();
      setNeighborhoods(data);
    } catch (error) {
      toast.error("Failed to load neighborhoods");
    } finally {
      setLoading(false);
    }
  };

  const filteredNeighborhoods = neighborhoods.filter(n =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group neighborhoods by city
  const neighborhoodsByCity = filteredNeighborhoods.reduce((acc, n) => {
    const cityKey = `${n.city}, ${n.state}`;
    if (!acc[cityKey]) {
      acc[cityKey] = [];
    }
    acc[cityKey].push(n);
    return acc;
  }, {} as Record<string, Neighborhood[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <h1 className="text-2xl mb-2">Find Your Neighborhood</h1>
          <p className="text-sm opacity-90 mb-6">
            Join or create a neighborhood community
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : Object.keys(neighborhoodsByCity).length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "No neighborhoods found" : "No neighborhoods available"}
            </p>
            <Button
              onClick={() => navigate("/propose-neighborhood")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Propose New Neighborhood
            </Button>
          </div>
        ) : (
          <>
            {Object.entries(neighborhoodsByCity).map(([city, hoods]) => (
              <div key={city} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-lg">{city}</h2>
                  <span className="bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground">
                    {hoods.length} {hoods.length === 1 ? 'neighborhood' : 'neighborhoods'}
                  </span>
                </div>

                <div className="space-y-3">
                  {hoods.map((neighborhood) => (
                    <div
                      key={neighborhood.id}
                      onClick={() => navigate(`/neighborhood/${neighborhood.id}`)}
                      className="bg-white rounded-2xl border border-border p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl w-16 h-16 flex items-center justify-center text-white flex-shrink-0">
                          <MapPin className="w-8 h-8" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg truncate">{neighborhood.name}</h3>
                            {neighborhood.verified && (
                              <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {neighborhood.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{neighborhood.primaryLandmark}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>{neighborhood.population}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Propose New Neighborhood Card */}
            <div
              onClick={() => navigate("/propose-neighborhood")}
              className="bg-white rounded-2xl border-2 border-dashed border-primary/30 p-6 text-center hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <Plus className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg mb-1">Don't See Your Neighborhood?</h3>
              <p className="text-sm text-muted-foreground">
                Propose a new neighborhood and build your community
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
