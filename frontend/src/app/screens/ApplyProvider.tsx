import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { providerApplicationsService } from "../services/storage";

export default function ApplyProvider() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    experience: "",
    category: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.experience || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await providerApplicationsService.submitApplication({
        fullName: formData.fullName,
        experience: formData.experience,
        category: formData.category,
        description: formData.description,
      });
      setIsSuccess(true);
    } catch (error) {
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4 max-w-sm"
        >
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Application Submitted!</h2>
          <p className="text-muted-foreground mb-8">
            Your application to become a provider has been sent to the neighborhood admin. We'll notify you once it's reviewed.
          </p>
          <button
            onClick={() => navigate('/services')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors w-full"
          >
            Back to Services
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/services" className="p-2 -ml-2 rounded-full hover:bg-white/50 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Apply for Provider</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="glass-card rounded-3xl p-6 mb-6">
          <p className="text-muted-foreground mb-6">
            Join our network of trusted local providers. Your application will be sent to the neighborhood admin for review.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <Input
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Service Category *</label>
              <Input
                placeholder="e.g. Plumbing, Landscaping, Pet Care"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Experience *</label>
              <Input
                placeholder="e.g. 5 years of professional plumbing"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Why do you want to join?</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                placeholder="Briefly describe your services..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-xl font-semibold shadow-sm transition-colors mt-4 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
