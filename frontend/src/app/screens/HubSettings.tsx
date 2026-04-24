import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Upload, Shield, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { neighborhoodsService, authService } from "../services/storage";
import { Neighborhood, NeighborhoodSettings } from "../services/types";
import { toast } from "sonner";

export default function HubSettings() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [settings, setSettings] = useState<NeighborhoodSettings | null>(null);
  const [guidelines, setGuidelines] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNeighborhood();
  }, []);

  const loadNeighborhood = async () => {
    try {
      // Get neighborhood where current user is the lead
      const neighborhoods = await neighborhoodsService.getNeighborhoods();
      const userNeighborhood = neighborhoods.find(n => n.leadId === currentUser.id);
      
      if (userNeighborhood) {
        setNeighborhood(userNeighborhood);
        setSettings(userNeighborhood.settings);
        setGuidelines(userNeighborhood.guidelines);
      } else {
        toast.error("You don't manage any neighborhoods");
        navigate(-1);
      }
    } catch (error) {
      toast.error("Failed to load neighborhood");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!neighborhood || !settings) return;

    setSaving(true);
    try {
      await neighborhoodsService.updateSettings(neighborhood.id, settings);
      await neighborhoodsService.updateGuidelines(neighborhood.id, guidelines);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NeighborhoodSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!neighborhood || !settings) {
    return null;
  }

  const features = [
    { key: 'enableMarketplace' as keyof NeighborhoodSettings, label: 'Marketplace', description: 'Allow buying/selling items' },
    { key: 'enableResourceExchange' as keyof NeighborhoodSettings, label: 'Resource Exchange', description: 'Share tools and resources' },
    { key: 'enablePublicAlerts' as keyof NeighborhoodSettings, label: 'Public Alerts', description: 'Community safety alerts' },
    { key: 'enableEvents' as keyof NeighborhoodSettings, label: 'Events', description: 'Community events and gatherings' },
    { key: 'enableServices' as keyof NeighborhoodSettings, label: 'Services Directory', description: 'Local service providers' },
    { key: 'requireVerification' as keyof NeighborhoodSettings, label: 'Require Verification', description: 'Members must verify identity' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Hub Settings</h1>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl">{neighborhood.name}</h2>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Verified
            </div>
          </div>
          <p className="opacity-90 text-sm mb-2">{neighborhood.description}</p>
          <p className="text-sm opacity-75">{neighborhood.population} members</p>
        </div>

        {/* Branding Section */}
        <div className="bg-white rounded-2xl p-4 border border-border mb-6">
          <h3 className="text-lg mb-4">Branding</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Cover Photo</label>
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-indigo-100 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/30">
                {neighborhood.coverPhoto ? (
                  <div className="text-sm text-muted-foreground">Cover photo loaded</div>
                ) : (
                  <Button variant="outline" onClick={() => toast.info("Image upload simulated")}>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Cover Photo
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Logo</label>
              <div className="aspect-square max-w-[150px] bg-gradient-to-br from-primary/10 to-indigo-100 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/30">
                {neighborhood.logo ? (
                  <div className="text-sm text-muted-foreground">Logo loaded</div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => toast.info("Logo upload simulated")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-2xl border border-border mb-6 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg">Features</h3>
          </div>
          <div className="divide-y divide-border">
            {features.map((feature) => (
              <div key={feature.key} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm mb-1">{feature.label}</div>
                  <div className="text-xs text-muted-foreground">{feature.description}</div>
                </div>
                <Switch
                  checked={settings[feature.key]}
                  onCheckedChange={() => handleToggle(feature.key)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="text-lg mb-3">Community Guidelines</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Set rules and expectations for your community members
          </p>
          <Textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            placeholder="Enter community guidelines (Markdown supported)..."
          />
        </div>
      </div>
    </div>
  );
}
