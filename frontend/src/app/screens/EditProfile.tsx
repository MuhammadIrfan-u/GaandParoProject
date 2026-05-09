import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, User, Phone, MapPin, FileText,
  Lock, Eye, EyeOff, Save, Briefcase, Mail
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authService } from "../services/storage";
import { validatePassword, validatePhone, getPasswordStrength } from "../services/validation";
import { toast } from "sonner";

export default function EditProfile() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [formData, setFormData] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
    address: currentUser?.address ?? "",
    bio: currentUser?.bio ?? "",
    isServiceProvider: currentUser?.isProvider ?? false,
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

    const phoneError = validatePhone(formData.phone);
    if (phoneError) { toast.error(phoneError); return; }

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
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
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
                  placeholder="+92 300 1234567"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Include country code e.g. +92 for Pakistan, +1 for USA</p>
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

            {/* Service Provider toggle — maps to isServiceProvider in schema */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm">Local Business / Service Provider</div>
                  <div className="text-xs text-muted-foreground">Enable to offer services in the community</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isServiceProvider: !prev.isServiceProvider }))}
                className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${formData.isServiceProvider ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${formData.isServiceProvider ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
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


      </div>
    </div>
  );
}
