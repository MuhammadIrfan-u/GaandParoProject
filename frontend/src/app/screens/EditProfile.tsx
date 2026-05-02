import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authService } from "../services/storage";
import { toast } from "sonner";
import type { UserRole } from "../services/types";

const ROLE_LABELS: Record<UserRole, string> = {
  resident: "Resident",
  business_owner: "Local Business Owner",
  moderator: "Community Moderator",
};

export default function EditProfile() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [formData, setFormData] = useState({
    name: currentUser?.name ?? "",
    phone: currentUser?.phone ?? "",
    address: currentUser?.address ?? "",
    bio: currentUser?.bio ?? "",
    role: (currentUser?.role ?? "resident") as UserRole,
  });

  // Change password section
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSavingProfile(true);
    try {
      await authService.updateProfile(formData);
      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to change password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Edit Profile</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Avatar preview */}
        <div className="bg-white rounded-2xl border border-border p-6 flex flex-col items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-20 h-20 flex items-center justify-center text-white text-2xl shadow-lg">
            {formData.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?"}
          </div>
          <p className="text-sm text-muted-foreground">
            Avatar is generated from your name
          </p>
        </div>

        {/* Profile info form */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm">Personal Information</h3>
          </div>
          <form onSubmit={handleSaveProfile} className="p-4 space-y-4">

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="123 Main St, Oak Valley"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                Bio
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <textarea
                  placeholder="Tell your neighbors a little about yourself..."
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Role selector — REQ-5 */}
            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                Account Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleChange("role", role)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      formData.role === role
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        formData.role === role
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    />
                    <span className="text-sm">{ROLE_LABELS[role]}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90"
              disabled={savingProfile}
            >
              <Save className="w-4 h-4 mr-2" />
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>

        {/* Change password form */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm">Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword} className="p-4 space-y-4">

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPasswords ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPasswords ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPasswords ? "text" : "password"}
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPasswords ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={savingPassword}
            >
              <Lock className="w-4 h-4 mr-2" />
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
