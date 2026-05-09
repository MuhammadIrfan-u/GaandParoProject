import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Bell, Lock, Shield, Moon, Globe, HelpCircle, MapPin, Home as HomeIcon, Settings2 } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { authService, settingsService } from "../services/storage";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    push_notifications: true,
    community_alerts: true,
    profile_visibility: true,
    show_phone_number: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings(currentUser.id);
      if (data) {
        setSettings({
          push_notifications: data.push_notifications ?? true,
          community_alerts: data.community_alerts ?? true,
          profile_visibility: data.profile_visibility ?? true,
          show_phone_number: data.show_phone_number ?? false
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: keyof typeof settings, label: string) => {
    const newValue = !settings[field];
    
    // Optimistic update
    setSettings(prev => ({ ...prev, [field]: newValue }));

    try {
      await settingsService.updateSettings(currentUser.id, {
        [field]: newValue
      });
      toast.success(`${label} ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      // Revert on error
      setSettings(prev => ({ ...prev, [field]: !newValue }));
      toast.error(`Failed to update ${label}`);
    }
  };

  const settingsSections = [
    {
      title: "Notifications",
      items: [
        { 
          icon: Bell, 
          label: "Push Notifications", 
          field: "push_notifications" as const,
          value: settings.push_notifications 
        },
        { 
          icon: Bell, 
          label: "Community Alerts", 
          field: "community_alerts" as const,
          value: settings.community_alerts 
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { 
          icon: Shield, 
          label: "Profile Visibility", 
          field: "profile_visibility" as const,
          value: settings.profile_visibility 
        },
        { 
          icon: Lock, 
          label: "Show Phone Number", 
          field: "show_phone_number" as const,
          value: settings.show_phone_number 
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Moon, label: "Dark Mode", value: false },
        { icon: Globe, label: "Language", value: "English" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Super Admin Dashboard (for Super Admins) */}
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

        {/* Neighborhood Management (for Moderators/Admins) */}
        {currentUser.isAdmin && (
          <div className="mb-6">
            <h3 className="text-sm px-4 mb-2 text-muted-foreground">Neighborhood Management</h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <Link
                to="/hub-settings"
                className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors border-b border-border"
              >
                <Settings2 className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div>Hub Settings</div>
                  <div className="text-xs text-muted-foreground">Configure neighborhood settings</div>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/neighborhoods"
                className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
              >
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

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
        ) : (
          settingsSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="text-sm px-4 mb-2 text-muted-foreground">{section.title}</h3>
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                {section.items.map((item, index) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-4 ${index < section.items.length - 1 ? 'border-b border-border' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.value === 'boolean' ? (
                      <Switch
                        checked={item.value}
                        onCheckedChange={() => {
                          if ('field' in item) {
                            handleToggle(item.field, item.label);
                          } else {
                            toast.success(`${item.label} changed`);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

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