import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Home as HomeIcon, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { authService } from "../services/storage";

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.login(email, password);

      if (!data.success) {
        throw new Error(data.error || "Login failed");
      }

      toast.success(data.message);
      if (data._devOtp) {
        toast.info(`DEV MODE: Your OTP is ${data._devOtp}`, { duration: 15000 });
      }
      setStep("otp");
      setTimer(600);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.verifyOtp(email, otpCode);

      if (!data.success) {
        throw new Error(data.error || "Verification failed");
      }

      toast.success("Welcome back!");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const data = await authService.resendOtp(email);
      if (data.success) {
        toast.success("New code sent!");
        if (data._devOtp) {
          toast.info(`DEV MODE: Your OTP is ${data._devOtp}`, { duration: 15000 });
        }
        setTimer(600);
        setOtp(["", "", "", "", "", ""]);
      } else {
        toast.error(data.error || "Failed to resend code");
      }
    } catch (err) {
      toast.error("Error resending code");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-white rounded-3xl p-4 inline-block mb-4 shadow-xl">
            {step === "credentials" ? (
              <HomeIcon className="w-12 h-12 text-primary" strokeWidth={1.5} />
            ) : (
              <ShieldCheck className="w-12 h-12 text-primary" strokeWidth={1.5} />
            )}
          </div>
          <h1 className="text-white text-3xl mb-2">
            {step === "credentials" ? "Welcome Back" : "Verify It's You"}
          </h1>
          <p className="text-indigo-100">
            {step === "credentials" 
              ? "Login to your NeighborHub account" 
              : `We've sent a code to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {step === "credentials" ? (
            <form onSubmit={handleLoginStep1} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-muted-foreground">Email</label>
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

              <div>
                <label className="block text-sm mb-2 text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 py-6 text-lg rounded-2xl"
                disabled={loading}
              >
                {loading ? "Checking..." : "Continue"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="text-center">
                <p className={`text-sm ${timer < 30 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                  Code expires in: {formatTime(timer)}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 py-6 text-lg rounded-2xl"
                  disabled={loading || timer === 0}
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={loading || timer > 540} // Only allow resend after 1 minute
                  className="w-full text-primary hover:text-primary/80"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Resend Code
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="w-full flex items-center justify-center text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Change Email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}