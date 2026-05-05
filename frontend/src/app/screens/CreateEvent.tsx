import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin as MapPinIcon, Lock, Globe } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { NeighborhoodMemberPicker } from "../components/NeighborhoodMemberPicker";
import { authService } from "../services/storage";
import { createEvent, getDemoUser } from "../services/eventsService";
import { toast } from "sonner";

export default function CreateEvent() {
  const navigate = useNavigate();

  // Use real user if logged in, otherwise fall back to demo user
  const authUser = authService.getCurrentUser();
  const currentUser = authUser?.id
    ? { id: authUser.id, name: authUser.name, neighborhoodId: authUser.neighborhoodId }
    : { ...getDemoUser(), name: 'Alex Thompson' };

  const [formData, setFormData] = useState({
    title: "", description: "", date: "", time: "",
    location: "", category: "Community", maxAttendees: "",
  });
  const [isPrivate, setIsPrivate] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const categories = ["Community", "Social", "Family", "Sports", "Education", "Other"];

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location) {
      toast.error("Please fill in all required fields"); return;
    }
    if (isPrivate && invitedUserIds.length === 0) {
      toast.error("Please invite at least one member for a private event"); return;
    }
    setLoading(true);
    try {
      await createEvent({
        title: formData.title, description: formData.description,
        date: formData.date, time: formData.time, location: formData.location,
        category: formData.category,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        isPrivate, invitedUserIds,
        neighborhoodId: currentUser.neighborhoodId || 4,
      }, { id: currentUser.id, name: currentUser.name });
      toast.success("Event created successfully! 🎉");
      navigate("/events");
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error("Failed to create event. Check console for details.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-semibold">Create Event</h1>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-4 border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Title</label>
            <Input placeholder="e.g., Community BBQ" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea placeholder="Describe your event..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[120px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="pl-10" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="e.g., Oak Valley Park" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="pl-10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Attendees (Optional)</label>
            <Input type="number" placeholder="Leave blank for unlimited" value={formData.maxAttendees} onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })} />
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white rounded-2xl p-4 border border-border mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <div className="bg-amber-100 rounded-full p-2"><Lock className="w-5 h-5 text-amber-600" /></div>
              ) : (
                <div className="bg-green-100 rounded-full p-2"><Globe className="w-5 h-5 text-green-600" /></div>
              )}
              <div>
                <div className="text-sm font-medium">{isPrivate ? "Private Event" : "Public Event"}</div>
                <div className="text-xs text-muted-foreground">
                  {isPrivate ? "Only invited members can see & join" : "Visible to all neighborhood members"}
                </div>
              </div>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
          {isPrivate && (
            <div className="pt-2 border-t border-border">
              <NeighborhoodMemberPicker
                neighborhoodId={currentUser.neighborhoodId || 4}
                currentUserId={currentUser.id}
                selectedUserIds={invitedUserIds}
                onSelectionChange={setInvitedUserIds}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
