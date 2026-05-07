import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Star, Clock, DollarSign, Calendar, ShieldCheck, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { servicesService, messagesService } from "../services/storage";
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
    if (!service || !requestDescription.trim()) {
      toast.error("Please provide a description");
      return;
    }

    try {
      // 1. Create the service request record in DB
      await servicesService.requestService(serviceId!, requestDescription, scheduledDate);
      
      // 2. Start a conversation with the provider
      const providerId = `provider-${service.provider.replace(/\s+/g, '-').toLowerCase()}`;
      const conversation = await messagesService.getOrCreateConversation(
        providerId,
        service.provider,
        service.providerAvatar
      );
      
      // 3. Send the description as the initial message
      await messagesService.sendMessage(conversation.id, `Service Request: ${service.title}\n\n${requestDescription}`);
      
      toast.success("Service request sent and message delivered!");
      setShowRequestDialog(false);
      setRequestDescription("");
      setScheduledDate("");
      
      // 4. Navigate to the chat page
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error("Failed to process request:", error);
      toast.error("Failed to request service. Please check if the service exists in the database.");
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
    <div className="min-h-screen bg-background pb-32">
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold"
          >
            Service Details
          </motion.h1>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 py-6"
      >
        <div className="glass-card rounded-3xl p-6 mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold mb-2">{service.title}</h1>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                {service.category}
              </span>
              {service.verified && (
                <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            <p className="text-base text-muted-foreground leading-relaxed mb-8">{service.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-muted/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <div className="text-center">
                  <div className="font-bold">{service.rating}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{service.reviewCount} Reviews</div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="font-bold">{service.price.split('/')[0]}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{service.price.split('/')[1] || 'Fixed'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-foreground/80">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm">{service.availability}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-sm">Local Area Delivery</span>
              </div>
            </div>
          </motion.div>

          <div className="pt-6 border-t border-border/50">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Service Provider</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl w-14 h-14 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {service.providerAvatar}
                  </div>
                  {service.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                      <ShieldCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-lg">{service.provider}</div>
                  <div className="text-sm text-muted-foreground">Community Member</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-primary/20 text-primary"
                onClick={() => navigate('/profile')}
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-0 left-0 right-0 glass-header p-6 pb-10">
        <div className="max-w-lg mx-auto">
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg shadow-primary/20">
                  <Calendar className="w-6 h-6 mr-2" />
                  Request Service
                </Button>
              </motion.div>
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
