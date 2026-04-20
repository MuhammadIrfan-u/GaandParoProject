import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { alertsService } from "../services/storage";
import { toast } from "sonner";

export default function CreateAlert() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "announcement" as 'security' | 'emergency' | 'lost-found' | 'announcement',
    severity: "medium" as 'low' | 'medium' | 'high' | 'critical',
  });
  const [loading, setLoading] = useState(false);

  const types: Array<'security' | 'emergency' | 'lost-found' | 'announcement'> = ["security", "emergency", "lost-found", "announcement"];
  const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ["low", "medium", "high", "critical"];

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await alertsService.createAlert(formData);
      toast.success("Alert created successfully!");
      navigate("/alerts");
    } catch (error) {
      toast.error("Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Create Alert</h1>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800">
            <p className="mb-1"><strong>Important:</strong> Alerts notify all community members.</p>
            <p>Only create alerts for important community-wide information.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border space-y-4">
          <div>
            <label className="block text-sm mb-2">Alert Title</label>
            <Input
              placeholder="e.g., Suspicious Activity Reported"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Description</label>
            <Textarea
              placeholder="Provide details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[120px]"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Alert Type</label>
            <Select value={formData.type} onValueChange={(value: 'security' | 'emergency' | 'lost-found' | 'announcement') => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-2">Severity</label>
            <Select value={formData.severity} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setFormData({ ...formData, severity: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severities.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
