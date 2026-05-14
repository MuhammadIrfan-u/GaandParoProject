import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { reportsService } from "../services/storage";

export default function Report() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const reportedItemId = (location.state as any)?.id || "unknown";
  const initialType = (location.state as any)?.type || "post";

  const [reportType, setReportType] = useState(initialType);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: "post", label: "Post" },
    { value: "event", label: "Event" },
    { value: "marketplace", label: "Market Item" },
    { value: "service", label: "Service" },
    { value: "message", label: "Message" },
    { value: "user", label: "User" },
  ];

  const reasons = [
    "Spam or Scam",
    "Harassment or Bullying",
    "Inappropriate Content",
    "False Information",
    "Safety Concern",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!reason || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await reportsService.submitReport({
        reportedItemId: Number(reportedItemId) || 0,
        reportedItemType: reportType as any,
        reason,
        description,
      });

      toast.success("Report submitted. Our team will review it shortly.");
      navigate(-1);
    } catch (err) {
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Report Issue</h1>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md shadow-red-200"
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5 mb-6 flex gap-4">
          <div className="bg-orange-200 p-2 rounded-2xl h-fit">
            <AlertTriangle className="w-6 h-6 text-orange-700" />
          </div>
          <div className="text-sm text-orange-900 leading-relaxed">
            <p className="font-bold mb-1">Report Responsibly</p>
            <p className="opacity-80">Our team takes every report seriously. False reporting may lead to account restrictions.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border-border border shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground/70 ml-1">What are you reporting?</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="h-12 rounded-2xl border-border bg-muted/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {reportTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="rounded-xl">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground/70 ml-1">Reason for report</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-12 rounded-2xl border-border bg-muted/20">
                <SelectValue placeholder="Select Reason" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {reasons.map((r) => (
                  <SelectItem key={r} value={r} className="rounded-xl">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground/70 ml-1">Details</label>
            <Textarea
              placeholder="Please provide more details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[180px] rounded-2xl border-border bg-muted/20 resize-none p-4"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            We review reports within 24 hours.
          </div>
        </div>
      </div>
    </div>
  );
}