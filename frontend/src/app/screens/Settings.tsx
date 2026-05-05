import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Bell, Lock, Shield, Moon, Globe, HelpCircle, Home as HomeIcon, Settings2 } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { authService } from "../services/storage";
import { toast } from "sonner";

// Preferences stored in localStorage only (not in DB schema)
const PREFS_KEY = "neighborhub_prefs";
const getStoredPrefs = () => {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    authService.validateSession().catch(() => navigate("/login"));
  }, []);

  if (!currentUser) return null;

  const stored = getStoredPrefs();

  // REQ-9: privacy & notification preferences stored locally
  const [prefs, setPrefs] = useState({
    pushNotifications:  stored?.pushNotifications  ?? true,
    emailNotifications: stored?.emailNotifications ?? true,
    communityAlerts:    stored?.communityAlerts    ?? true,
    profileVisible:     stored?.profileVisible     ?? true,
    showPhone:          stored?.showPhone          ?? false,
  });

  const handleToggle = (key: keyof typeof prefs) => {
    const newValue = !prefs[key];
    const updated = { ...prefs, [key]: newValue };
    setPrefs(updated);
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    toast.success(`${newValue ? "Enabled" : "Disabled"} successfully`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Super Admin Dashboard */}
        {currentUser.isAdmin && (
          <div className="mb-6">
            <Link
              to="/super-admin-dashboard"
              className="block bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 mb-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Shield className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="text-xl mb-1">Super Admin Dashboard</div>
                  <div className="text-sm opacity-90">Review proposals & manage neighborhoods</div>
                </div>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        )}

        {/* Neighborhood Management */}
        {currentUser.isAdmin && (
          <div className="mb-6">
            <h3 className="text-sm px-4 mb-2 text-muted-foreground">Neighborhood Management</h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <Link to="/hub-settings" className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors border-b border-border">
                <Settings2 className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div>Hub Settings</div>
                  <div className="text-xs text-muted-foreground">Configure neighborhood settings</div>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link to="/neighborhoods" className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                <HomeIcon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div>All Neighborhoods</div>
                  <div className="text-xs text-muted-foreground">Browse and manage neighborhoods</div>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Notifications — REQ-9 */}
        <div className="mb-6">
          <h3 className="text-sm px-4 mb-2 text-muted-foreground">Notifications</h3>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {[
              { key: "pushNotifications"  as const, label: "Push Notifications" },
              { key: "emailNotifications" as const, label: "Email Notifications" },
              { key: "communityAlerts"    as const, label: "Community Alerts" },
            ].map((item, index, arr) => (
              <div key={item.key} className={`flex items-center justify-between p-4 ${index < arr.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                <Switch checked={prefs[item.key]} onCheckedChange={() => handleToggle(item.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Security — REQ-9 */}
        <div className="mb-6">
          <h3 className="text-sm px-4 mb-2 text-muted-foreground">Privacy & Security</h3>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {[
              { key: "profileVisible" as const, icon: Shield, label: "Profile Visibility" },
              { key: "showPhone"      as const, icon: Lock,   label: "Show Phone Number" },
            ].map((item, index, arr) => (
              <div key={item.key} className={`flex items-center justify-between p-4 ${index < arr.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                <Switch checked={prefs[item.key]} onCheckedChange={() => handleToggle(item.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="mb-6">
          <h3 className="text-sm px-4 mb-2 text-muted-foreground">Preferences</h3>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <span>Dark Mode</span>
              </div>
              <Switch checked={false} onCheckedChange={() => toast.info("Dark mode coming soon!")} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <span>Language</span>
              </div>
              <span className="text-muted-foreground text-sm">English</span>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => toast.info("Help center coming soon!")}
            className="flex items-center gap-3 p-4 w-full hover:bg-muted/30 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span>Help & Support</span>
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-8">
          NeighborHub v1.0.0
        </div>
      </div>
    </div>
  );
}
