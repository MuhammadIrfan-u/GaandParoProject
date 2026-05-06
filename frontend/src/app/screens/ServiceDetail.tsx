import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Star, Clock, DollarSign, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { servicesService } from "../services/storage";
import { Service } from "../services/types";
import { toast } from "sonner";

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestDescription, setRequestDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    if (!serviceId) return;
    try {
      const data = await servicesService.getService(serviceId);
      setService(data || null);
    } catch (error) {
      toast.error("Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async () => {
    if (!serviceId || !requestDescription.trim()) {
      toast.error("Please provide a description");
      return;
    }

    try {
      await servicesService.requestService(serviceId, requestDescription, scheduledDate);
      toast.success("Service request sent!");
      setShowRequestDialog(false);
      setRequestDescription("");
      setScheduledDate("");
    } catch (error) {
      toast.error("Failed to request service");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Service not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Service Details</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-4 border border-border mb-4">
          <h1 className="text-2xl mb-2">{service.title}</h1>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">{service.category}</span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>

          <div className="space-y-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span>{service.rating} ({service.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <span>{service.price}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <span>{service.availability}</span>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-sm mb-3">Service Provider</h3>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white">
                {service.providerAvatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>{service.provider}</span>
                  {service.verified && (
                    <div className="bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Verified Provider</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Calendar className="w-5 h-5 mr-2" />
                Request Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request {service.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm mb-2">Describe your needs</label>
                  <Textarea
                    placeholder="What do you need help with?"
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Preferred Date (Optional)</label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleRequestService}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Send Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
