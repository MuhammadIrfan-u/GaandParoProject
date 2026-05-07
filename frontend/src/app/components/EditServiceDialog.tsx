import { useState, useEffect } from "react";
import { Clock, DollarSign, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { servicesService } from "../services/storage";
import { Service } from "../services/types";

interface EditServiceDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceUpdated: () => void;
}

export function EditServiceDialog({ service, open, onOpenChange, onServiceUpdated }: EditServiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    availability: "",
    category: "",
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        description: service.description,
        price: String(service.price).replace(/[^\d-]/g, ''),
        availability: service.availability,
        category: service.category,
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await servicesService.updateService(service.id, {
        ...formData,
        price: `$${formData.price}/hr`
      });
      toast.success("Service listing updated successfully!");
      onOpenChange(false);
      onServiceUpdated();
    } catch (error) {
      toast.error("Failed to update service listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl bg-white border-white/20 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Edit Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Listing Name</label>
            <Input 
              placeholder="Listing Name" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="rounded-xl border-border/50 bg-muted/30 focus:bg-white transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Category</label>
            <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
              <SelectTrigger className="rounded-xl border-border/50 bg-muted/30 focus:bg-white transition-colors">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Plumbing">Plumbing</SelectItem>
                <SelectItem value="Landscaping">Landscaping</SelectItem>
                <SelectItem value="Pet Care">Pet Care</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea 
              placeholder="Describe your service..." 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-xl border-border/50 bg-muted/30 focus:bg-white transition-colors min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Hourly Rate</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="80-150" 
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="pl-9 rounded-xl border-border/50 bg-muted/30 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Timing</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Mon-Fri, 9-5" 
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="pl-9 rounded-xl border-border/50 bg-muted/30 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-xl border-border/50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
