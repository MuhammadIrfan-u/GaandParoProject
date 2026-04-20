import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Save, AlertTriangle, Trash2, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { neighborhoodsService } from "../services/storage";
import { Neighborhood } from "../services/mockData";
import { toast } from "sonner";

export default function GeofenceEditor() {
  const navigate = useNavigate();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vertices, setVertices] = useState<Array<{ lat: number; lng: number }>>([]);
  const [metadata, setMetadata] = useState({
    name: "",
    city: "",
    population: 0,
  });
  const [hasOverlap, setHasOverlap] = useState(false);

  useEffect(() => {
    loadNeighborhoods();
  }, []);

  const loadNeighborhoods = async () => {
    try {
      const data = await neighborhoodsService.getNeighborhoods();
      setNeighborhoods(data);
    } catch (error) {
      toast.error("Failed to load neighborhoods");
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const lat = 40.70 + (y / 100) * 0.02;
    const lng = -74.02 + (x / 100) * 0.02;

    setVertices([...vertices, { lat, lng }]);
    
    // Check for overlap (simplified)
    checkOverlap(lat, lng);
  };

  const checkOverlap = (lat: number, lng: number) => {
    const overlapping = neighborhoods.some(n => {
      if (n.id === selectedId) return false;
      const coords = n.boundary.coordinates;
      const lats = coords.map(c => c.lat);
      const lngs = coords.map(c => c.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });
    
    setHasOverlap(overlapping);
  };

  const handleVertexDrag = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    // Simulated drag functionality
    toast.info("Drag functionality simulated");
  };

  const handleDeleteVertex = (index: number) => {
    setVertices(vertices.filter((_, i) => i !== index));
    toast.success("Vertex removed");
  };

  const handleSave = () => {
    if (!metadata.name || vertices.length < 3) {
      toast.error("Please provide name and at least 3 vertices");
      return;
    }

    if (hasOverlap) {
      toast.error("Boundary overlaps with existing neighborhood");
      return;
    }

    toast.success("Geofence saved successfully!");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Geofence Editor</h1>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="w-5 h-5 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Metadata Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-border">
              <h3 className="text-sm mb-4">Metadata</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1 text-muted-foreground">Neighborhood Name</label>
                  <Input
                    value={metadata.name}
                    onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-muted-foreground">City</label>
                  <Input
                    value={metadata.city}
                    onChange={(e) => setMetadata({ ...metadata, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-muted-foreground">Population</label>
                  <Input
                    type="number"
                    value={metadata.population}
                    onChange={(e) => setMetadata({ ...metadata, population: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-border">
              <h3 className="text-sm mb-3">Vertices ({vertices.length})</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {vertices.map((vertex, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                    <span>
                      {index + 1}: {vertex.lat.toFixed(4)}, {vertex.lng.toFixed(4)}
                    </span>
                    <button
                      onClick={() => handleDeleteVertex(index)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => {
                  setVertices([]);
                  toast.info("All vertices cleared");
                }}
              >
                Clear All
              </Button>
            </div>

            {hasOverlap && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="text-xs text-red-800">
                  <strong>Collision Warning!</strong>
                  <p>This boundary overlaps with an existing neighborhood.</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Editor */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm">Polygon Drawing Tool</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Draw
                  </Button>
                  <Button variant="outline" size="sm">
                    Snap to Roads
                  </Button>
                </div>
              </div>

              {/* Interactive Map */}
              <div
                onClick={handleMapClick}
                className="relative aspect-[4/3] bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-xl border-2 border-border cursor-crosshair overflow-hidden"
              >
                {/* Grid */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-10">
                  {[...Array(48)].map((_, i) => (
                    <div key={i} className="border border-primary"></div>
                  ))}
                </div>

                {/* Existing Neighborhoods */}
                {neighborhoods.map((n) => (
                  <svg key={n.id} className="absolute inset-0 w-full h-full pointer-events-none">
                    <polygon
                      points={n.boundary.coordinates.map((p) => 
                        `${((p.lng + 74.02) / 0.02) * 100}%,${((p.lat - 40.70) / 0.02) * 100}%`
                      ).join(' ')}
                      fill={n.id === selectedId ? "rgba(99, 102, 241, 0.1)" : "rgba(156, 163, 175, 0.1)"}
                      stroke={n.id === selectedId ? "rgba(99, 102, 241, 0.5)" : "rgba(156, 163, 175, 0.3)"}
                      strokeWidth="2"
                    />
                  </svg>
                ))}

                {/* New Vertices */}
                {vertices.map((vertex, index) => (
                  <div
                    key={index}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move"
                    style={{
                      left: `${((vertex.lng + 74.02) / 0.02) * 100}%`,
                      top: `${((vertex.lat - 40.70) / 0.02) * 100}%`,
                    }}
                    onMouseDown={(e) => handleVertexDrag(index, e)}
                  >
                    <div className={`${hasOverlap ? 'bg-red-500' : 'bg-primary'} rounded-full w-3 h-3 border-2 border-white shadow-lg`}></div>
                  </div>
                ))}

                {/* New Polygon */}
                {vertices.length >= 3 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <polygon
                      points={vertices.map((p) => 
                        `${((p.lng + 74.02) / 0.02) * 100}%,${((p.lat - 40.70) / 0.02) * 100}%`
                      ).join(' ')}
                      fill={hasOverlap ? "rgba(239, 68, 68, 0.1)" : "rgba(99, 102, 241, 0.1)"}
                      stroke={hasOverlap ? "rgba(239, 68, 68, 0.5)" : "rgba(99, 102, 241, 0.5)"}
                      strokeWidth="2"
                    />
                  </svg>
                )}

                {vertices.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Click to add vertices</p>
                      <p className="text-xs mt-1">Drag vertices to adjust</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Click on the map to add vertices. Drag vertices to adjust the boundary.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
