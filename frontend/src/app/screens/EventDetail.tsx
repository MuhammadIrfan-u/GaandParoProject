import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, MapPin, Users, Check, Trash2, Edit } from "lucide-react";
import { Button } from "../components/ui/button";
import { eventsService, authService } from "../services/storage";
import { Event } from "../services/types";
import { toast } from "sonner";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;
    try {
      const data = await eventsService.getEvent(eventId);
      setEvent(data || null);
    } catch (error) {
      toast.error("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!eventId) return;
    try {
      const response = await eventsService.rsvpEvent(eventId);
      await loadEvent();
      toast.success(response.rsvp ? "RSVP confirmed!" : "RSVP cancelled");
    } catch (error) {
      toast.error("Failed to RSVP");
    }
  };

  const handleDelete = async () => {
    if (!eventId || !window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await eventsService.deleteEvent(eventId);
      toast.success("Event deleted successfully");
      navigate("/events");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Event not found</div>
      </div>
    );
  }

  const isAttending = event.attendees.includes(currentUser.id);
  const isFull = event.maxAttendees ? event.attendees.length >= event.maxAttendees : false;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl flex-1">Event Details</h1>
          {String(event.organizerId) === String(currentUser.id) && (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => navigate(`/edit-event/${event.id}`)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit Event"
              >
                <Edit className="w-6 h-6" />
              </button>
              <button 
                onClick={handleDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Event"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="h-48 bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center">
          <Calendar className="w-24 h-24 text-primary/40" />
        </div>

        <div className="px-4 py-6">
          <div className="bg-white rounded-2xl p-4 border border-border mb-4">
            <h1 className="text-2xl mb-3">{event.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{event.description}</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
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
                  {event.attendees.length} {event.attendees.length === 1 ? 'person' : 'people'} attending
                  {event.maxAttendees && ` (${event.maxAttendees} max)`}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border mb-4">
            <h3 className="text-sm mb-3">Organizer</h3>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white">
                {event.organizerAvatar}
              </div>
              <div>
                <div>{event.organizer}</div>
                <div className="text-sm text-muted-foreground">Event Organizer</div>
              </div>
            </div>
          </div>

          {event.attendees.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-border">
              <h3 className="text-sm mb-3">Attendees ({event.attendees.length})</h3>
              <div className="flex -space-x-2">
                {event.attendees.slice(0, 10).map((attendeeId, index) => (
                  <div
                    key={attendeeId}
                    className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-10 h-10 flex items-center justify-center text-white text-sm border-2 border-white"
                  >
                    U{index + 1}
                  </div>
                ))}
                {event.attendees.length > 10 && (
                  <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center text-sm border-2 border-white">
                    +{event.attendees.length - 10}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleRSVP}
            disabled={!isAttending && isFull}
            className={`w-full ${isAttending ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isAttending ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                You're Going
              </>
            ) : isFull ? (
              "Event Full"
            ) : (
              "RSVP to Attend"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
