import { useState } from "react";
import { Plus, Clock, DollarSign, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { motion } from "motion/react";
import { toast } from "sonner";
import { servicesService } from "../services/storage";

interface AddServiceDialogProps {
  onServiceAdded: () => void;
  disabled?: boolean;
}

export function AddServiceDialog({ onServiceAdded, disabled }: AddServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    availability: "",
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await servicesService.createService(formData as any);
      toast.success("Service listing created successfully!");
      setOpen(false);
      onServiceAdded();
      setFormData({ title: "", description: "", price: "", availability: "", category: "" });
    } catch (error) {
      toast.error("Failed to create service listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          disabled={disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-primary text-white shadow-lg flex items-center justify-center z-50 transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl bg-white border-white/20 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Add New Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Listing Name</label>
            <Input 
              placeholder="e.g. Professional Plumbing" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="rounded-xl border-border/50 bg-muted/30 focus:bg-white transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Category</label>
            <Select onValueChange={(val) => setFormData({ ...formData, category: val })}>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl border-border/50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
              {loading ? "Creating..." : "OK"}
            </Button>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-xl text-blue-700 text-[11px] font-medium border border-blue-100">
            <Info className="w-4 h-4 flex-shrink-0" />
            <p>Verification required. You can have a maximum of 5 active service listings.</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
