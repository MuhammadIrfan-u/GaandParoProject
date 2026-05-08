import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

  const [reportType, setReportType] = useState("post");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: "post", label: "Post" },
    { value: "user", label: "User" },
    { value: "message", label: "Message" },
    { value: "marketplace", label: "Marketplace Item" },
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
        reportedItemId,
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
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h1 className="text-xl">Report Issue</h1>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="text-sm text-orange-800">
            <p className="font-semibold">Report Responsibly</p>
            <p>False reports may result in action against your account.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border space-y-4">
          <div>
            <label className="text-sm mb-2 block">What are you reporting?</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm mb-2 block">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm mb-2 block">Details</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the issue..."
              className="min-h-[150px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}