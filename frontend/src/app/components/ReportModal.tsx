import { useState } from "react";
import { AlertTriangle, Flag } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { reportsService } from "../services/storage";

interface ReportModalProps {
  reportedItemId: string | number;
  reportedItemType: "post" | "event" | "marketplace" | "service" | "message";
  trigger?: React.ReactNode;
}

export function ReportModal({ reportedItemId, reportedItemType, trigger }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
        reportedItemId: Number(reportedItemId),
        reportedItemType,
        reason,
        description,
      });

      toast.success("Report submitted. Our team will review it shortly.");
      setOpen(false);
      setReason("");
      setDescription("");
    } catch (err) {
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="text-muted-foreground p-1 hover:bg-muted rounded-full transition-colors">
            <Flag className="w-4 h-4" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this {reportedItemType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for report</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select Reason" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {reasons.map((r) => (
                  <SelectItem key={r} value={r} className="rounded-lg">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Details</label>
            <Textarea
              placeholder="Please provide more details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] rounded-xl resize-none"
            />
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 flex gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
            <p className="text-[10px] text-orange-800 leading-tight">
              <strong>Note:</strong> False reports may result in account restrictions.
              Our moderation team reviews all reports within 24 hours.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
