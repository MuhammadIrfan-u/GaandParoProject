import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, MapPin, Users, Check, Lock, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { authService } from "../services/storage";
import { getEvent, rsvpEvent, cancelRsvp, deleteEvent, getAttendees, getDemoUser, EventWithMeta } from "../services/eventsService";
import { toast } from "sonner";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [attendeeIds, setAttendeeIds] = useState<number[]>([]);

  // Use real user if logged in, otherwise fall back to demo user
  const authUser = authService.getCurrentUser();
  const currentUser = authUser?.id
    ? { id: authUser.id, name: authUser.name }
    : { id: getDemoUser().id, name: 'Alex Thompson' };

  useEffect(() => { loadEvent(); }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const data = await getEvent(parseInt(eventId), currentUser.id);
      setEvent(data);
      if (data) {
        const ids = await getAttendees(data.id);
        setAttendeeIds(ids);
      }
    } catch (error) {
      console.error("Failed to load event:", error);
      toast.error("Failed to load event");
    } finally { setLoading(false); }
  };

  const handleRSVP = async () => {
    if (!event) return;
    setRsvpLoading(true);
    try {
      if (event.isAttending) {
        await cancelRsvp(event.id, currentUser.id);
        toast.success("RSVP cancelled");
      } else {
        await rsvpEvent(event.id, currentUser.id);
        toast.success("RSVP confirmed! 🎉");
      }
      await loadEvent();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update RSVP";
      toast.error(message);
    } finally { setRsvpLoading(false); }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm("Are you sure you want to delete this event?")) return;
    setDeleteLoading(true);
    try {
      await deleteEvent(event.id, currentUser.id);
      toast.success("Event deleted");
      navigate("/events");
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event");
    } finally { setDeleteLoading(false); }
  };

  const isOrganizer = event?.organizer_id === currentUser.id;
  const isInvited = event?.meta.invitedUserIds.includes(currentUser.id) ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3" />
          <div className="text-muted-foreground text-sm">Loading event...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <div className="text-muted-foreground mb-4">Event not found</div>
        <Button variant="outline" onClick={() => navigate("/events")}>Back to Events</Button>
      </div>
    );
  }

  const isFull = event.max_attendees ? event.attendeeCount >= event.max_attendees : false;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1">Event Details</h1>
          {isOrganizer && (
            <button onClick={handleDelete} disabled={deleteLoading}
              className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="h-48 bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center relative">
          <Calendar className="w-24 h-24 text-primary/40" />
          {event.meta.isPrivate && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-amber-500/90 text-white border-0 shadow-sm">
                <Lock className="w-3 h-3 mr-1" /> Private Event
              </Badge>
            </div>
          )}
        </div>

        <div className="px-4 py-6">
          {/* Event Info Card */}
          <div className="bg-white rounded-2xl p-4 border border-border mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{event.category}</span>
              {event.isAttending && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Going
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold mb-3">{event.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{event.meta.text}</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">{formatDate(event.date)}</div>
                  <div className="text-sm text-muted-foreground">{event.time}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">{event.location}</div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  {event.attendeeCount} {event.attendeeCount === 1 ? "person" : "people"} attending
                  {event.max_attendees && ` (${event.max_attendees} max)`}
                  {isFull && <span className="text-red-500 ml-1 font-medium">— Full</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Invitation Notice */}
          {isInvited && !event.isAttending && !isOrganizer && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">You've been invited!</span>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                {event.organizerName} invited you to this event. Accept by joining below.
              </p>
            </div>
          )}

          {/* Organizer Card */}
          <div className="bg-white rounded-2xl p-4 border border-border mb-4">
            <h3 className="text-sm font-medium mb-3">Organizer</h3>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-medium">
                {event.organizerAvatar ? event.organizerAvatar.slice(0, 2).toUpperCase() : event.organizerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{event.organizerName}</div>
                <div className="text-sm text-muted-foreground">Event Organizer</div>
              </div>
            </div>
          </div>

          {/* Attendees Card */}
          {event.attendeeCount > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-border">
              <h3 className="text-sm font-medium mb-3">Attendees ({event.attendeeCount})</h3>
              <div className="flex -space-x-2">
                {attendeeIds.slice(0, 10).map((uid, index) => (
                  <div key={uid}
                    className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-10 h-10 flex items-center justify-center text-white text-sm border-2 border-white">
                    U{index + 1}
                  </div>
                ))}
                {event.attendeeCount > 10 && (
                  <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center text-sm border-2 border-white">
                    +{event.attendeeCount - 10}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RSVP Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          {isOrganizer ? (
            <div className="text-center text-sm text-muted-foreground py-2">You're the organizer of this event</div>
          ) : (
            <Button onClick={handleRSVP} disabled={rsvpLoading || (!event.isAttending && isFull)}
              className={`w-full ${event.isAttending ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"}`}>
              {rsvpLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : event.isAttending ? (
                <><X className="w-5 h-5 mr-2" /> Cancel RSVP</>
              ) : isFull ? "Event Full" : (
                <><Check className="w-5 h-5 mr-2" /> {isInvited ? "Accept Invitation" : "RSVP to Attend"}</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
