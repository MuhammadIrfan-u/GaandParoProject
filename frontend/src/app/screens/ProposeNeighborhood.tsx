import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { proposalsService, authService } from "../services/storage";
import { toast } from "sonner";

export default function ProposeNeighborhood() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [primaryLandmark, setPrimaryLandmark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !city.trim() || !state.trim() || !description.trim() || !primaryLandmark.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await proposalsService.createProposal({
        proposerId: currentUser.id,
        proposerName: currentUser.name,
        name: name.trim(),
        city: city.trim(),
        state: state.trim(),
        description: description.trim(),
        primaryLandmark: primaryLandmark.trim(),
      });

      toast.success("Proposal submitted successfully!");
      navigate("/proposal-status");
    } catch (error) {
      toast.error("Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl mb-1">Propose Neighborhood</h1>
              <p className="text-sm opacity-90">Submit your neighborhood for approval</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="mb-2">
              Your proposal will be reviewed by community administrators. Make sure all information is accurate.
            </p>
            <p className="text-xs text-blue-700">
              Typically reviewed within 2-3 business days
            </p>
          </div>
        </div>

        {/* Proposal Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Neighborhood Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Oak Valley Community"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Springfield"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., NY"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">2-letter code</p>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Describe your neighborhood, its character, and what makes it unique..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Primary Landmark <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Oak Valley Park, Main Street Plaza"
                    value={primaryLandmark}
                    onChange={(e) => setPrimaryLandmark(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  A well-known location that helps identify your neighborhood
                </p>
              </div>
            </div>
          </div>

          {/* Proposer Information */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg mb-4">Your Information</h2>
            
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white text-lg">
                  {currentUser.name[0]}
                </div>
                <div>
                  <div className="font-medium">{currentUser.name}</div>
                  <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                You will be listed as the proposer of this neighborhood
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Proposal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}