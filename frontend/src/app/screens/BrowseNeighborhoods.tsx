import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, MapPin, Users, Shield, Home as HomeIcon } from "lucide-react";
import { Input } from "../components/ui/input";
import { neighborhoodsService } from "../services/storage";
import { Neighborhood } from "../services/mockData";
import { toast } from "sonner";

export default function BrowseNeighborhoods() {
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
    n.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl mb-4">All Neighborhoods</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search neighborhoods..."
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
        ) : filteredNeighborhoods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No neighborhoods found" : "No neighborhoods available"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNeighborhoods.map((neighborhood) => (
              <Link
                key={neighborhood.id}
                to={`/neighborhood/${neighborhood.id}`}
                className="block bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-32 bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center">
                  <HomeIcon className="w-16 h-16 text-primary/40" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg">{neighborhood.name}</h3>
                    {neighborhood.verified && (
                      <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{neighborhood.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{neighborhood.primaryLandmark}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{neighborhood.population}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Link to="/propose-neighborhood" className="block mt-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-primary/30 text-center hover:bg-primary/5 transition-colors">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Don't see your neighborhood?
            </p>
            <p className="text-primary mt-1">Propose a new one</p>
          </div>
        </Link>
      </div>
    </div>
  );
}