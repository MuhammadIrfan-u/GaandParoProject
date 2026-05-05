import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Home as HomeIcon, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authService } from "../services/storage";
import { validatePassword, getPasswordStrength } from "../services/validation";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If no token in URL, show invalid link state immediately
  const [invalidToken] = useState(!token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) { toast.error(passwordError); return; }

    setLoading(true);

    try {
      await authService.resetPassword(token!, password);
      toast.success("Password reset successfully!");
      navigate("/home");
    } catch (error: any) {
      toast.error(error?.message ?? "Reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-600 to-purple-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-white rounded-3xl p-4 inline-block mb-4 shadow-xl">
              <HomeIcon className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl">Invalid Reset Link</h2>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired. Please
              request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90">
                Request New Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & heading */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-3xl p-4 inline-block mb-4 shadow-xl">
            <HomeIcon className="w-12 h-12 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-white text-3xl mb-2">Reset Password</h1>
          <p className="text-indigo-100">Enter your new password below</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {password.length > 0 && (() => {
                const strength = getPasswordStrength(password);
                return (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Strength: <span className="font-medium">{strength.label}</span>
                      {" · "}min 8 chars, 1 letter, 1 number
                    </p>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
