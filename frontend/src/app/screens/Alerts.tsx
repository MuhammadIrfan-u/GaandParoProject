import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, AlertTriangle, Check } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { alertsService } from "../services/storage";
import { Alert } from "../services/types";
import { toast } from "sonner";

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await alertsService.getAlerts();
      setAlerts(data);
    } catch (error) {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await alertsService.resolveAlert(alertId);
      await loadAlerts();
      toast.success("Alert marked as resolved");
    } catch (error) {
      toast.error("Failed to resolve alert");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-900';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      default: return 'bg-blue-100 border-blue-300 text-blue-900';
    }
  };

  const getTypeIcon = (type: string) => {
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl">Community Alerts</h1>
            <Link to="/create-alert">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5 mr-2" />
                Create Alert
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No alerts</div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-2xl border-2 p-4 ${getSeverityColor(alert.severity)} ${alert.resolved ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {getTypeIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3>{alert.title}</h3>
                      {alert.resolved && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Resolved</span>
                      )}
                    </div>
                    <p className="text-sm mb-2">{alert.description}</p>
                    <div className="text-xs opacity-75">
                      Posted by {alert.author} • {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {!alert.resolved && (
                  <Button
                    onClick={() => handleResolve(alert.id)}
                    variant="outline"
                    size="sm"
                    className="w-full bg-white/50"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}