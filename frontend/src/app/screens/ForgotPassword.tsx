import { useState } from "react";
import { Link } from "react-router";
import { Home as HomeIcon, Mail, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authService } from "../services/storage";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
      setSubmitted(true);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & heading */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-3xl p-4 inline-block mb-4 shadow-xl">
            <HomeIcon className="w-12 h-12 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-white text-3xl mb-2">Forgot Password?</h1>
          <p className="text-indigo-100">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            /* Success state */
            <div className="text-center space-y-4 py-2">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl">Check your inbox</h2>
              <p className="text-sm text-muted-foreground">
                If an account exists for{" "}
                <span className="text-foreground">{email}</span>, a password
                reset link has been sent. Check your spam folder if you don't
                see it.
              </p>
              {devResetUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                  <p className="text-xs text-amber-700 mb-1">Dev mode — email not configured. Use this link to test:</p>
                  <a
                    href={devResetUrl}
                    className="text-xs text-primary break-all hover:underline"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}
              <Link to="/login">
                <Button
                  variant="outline"
                  className="w-full mt-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
