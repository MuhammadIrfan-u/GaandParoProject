import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Shield, Settings as SettingsIcon, TrendingUp, Star, User, Mail, Phone, MapPin, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { BottomNav } from "../components/BottomNav";
import { authService } from "../services/storage";
import type { User as UserType } from "../services/types";


export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserType | null>(authService.getCurrentUser());

  useEffect(() => {
    // Re-hydrate from API to get latest profile data
    authService.validateSession()
      .then((user) => {
        if (user) setCurrentUser(user);
        else navigate("/login");
      })
      .catch(() => navigate("/login"));
  }, []);

  if (!currentUser) return null;

  const handleLogout = () => {
    authService.logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const stats = [
    { icon: TrendingUp, label: "Posts", value: "24", color: "text-blue-600" },
    { icon: Star, label: "Reputation", value: currentUser.reputation.toFixed(1), color: "text-yellow-600" },
    { icon: Shield, label: "Status", value: currentUser.verified ? "Verified" : "Pending", color: "text-green-600" },
  ];

  const menuItems = [
    { icon: User, label: "Edit Profile", link: "/edit-profile" },
    { icon: Shield, label: "Verification Status", link: "/verification-status" },
    { icon: Star, label: "Reputation & Reviews", link: "/reputation" },
    { icon: SettingsIcon, label: "Settings", link: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-primary via-indigo-600 to-purple-600 pt-8 pb-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-end mb-4">
            <Link to="/settings">
              <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                <SettingsIcon className="w-6 h-6 text-white" />
              </button>
            </Link>
          </div>

          <div className="text-center">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center text-primary text-3xl mx-auto mb-4 shadow-xl">
              {currentUser.avatar}
            </div>
            <h1 className="text-white text-2xl mb-1">{currentUser.name}</h1>
            {currentUser.verified && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                <Shield className="w-4 h-4" />
                Verified Member
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl p-4 border border-border shadow-lg mb-4">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm">Contact Information</h3>
          </div>
          <div className="divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm">{currentUser.email}</div>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="text-sm">{currentUser.phone}</div>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Address</div>
                <div className="text-sm">{currentUser.address}</div>
              </div>
            </div>
          </div>
        </div>

        {currentUser.bio && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-4">
            <h3 className="text-sm mb-2">About</h3>
            <p className="text-sm text-muted-foreground">{currentUser.bio}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              to={item.link}
              className={`flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors ${
                index < menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1">{item.label}</span>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Super Admin Dashboard Link */}
        {currentUser.isAdmin && (
          <Link to="/super-admin-dashboard" className="block mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-xl transition-shadow">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-lg mb-0.5">Super Admin Dashboard</div>
                <div className="text-sm opacity-90">Manage neighborhoods & proposals</div>
              </div>
              <div className="bg-yellow-400 text-purple-900 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                1
              </div>
            </div>
          </Link>
        )}

        {currentUser.isAdmin && (
          <Link to="/analytics" className="block mb-4">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
              <TrendingUp className="w-5 h-5 mr-2" />
              View Analytics Dashboard
            </Button>
          </Link>
        )}

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>

        <div className="text-center py-4 text-sm text-muted-foreground">
          Member since {new Date(currentUser.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}