import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Calendar, MapPin, Users, Trash2, Edit } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { eventsService, authService } from "../services/storage";
import { Event } from "../services/types";
import { toast } from "sonner";
import { useNavigate } from "react-router";
export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      console.log('DEBUG: Current User ID:', currentUser.id);
      console.log('DEBUG: Neighborhood ID:', currentUser.neighborhoodId);

      if (!currentUser.neighborhoodId) {
        console.warn('DEBUG: No neighborhood ID found for user');
        setEvents([]);
        setLoading(false);
        return;
      }
      const data = await eventsService.getEvents(currentUser.neighborhoodId);
      setEvents(data);
    } catch (error) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault(); // Prevent navigation to detail page
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await eventsService.deleteEvent(eventId);
      toast.success("Event deleted successfully");
      loadEvents(); // Refresh list
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleEdit = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit-event/${eventId}`);
  };

  const currentUser = authService.getCurrentUser();

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Community': 'bg-blue-100 text-blue-700',
      'Social': 'bg-purple-100 text-purple-700',
      'Family': 'bg-pink-100 text-pink-700',
      'Sports': 'bg-green-100 text-green-700',
      'Education': 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl">Events</h1>
            <Link to="/create-event">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No events scheduled</div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="block bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-32 bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-primary/40" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    {event.attendees.includes(currentUser.id) && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Going</span>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg mb-2">{event.title}</h3>
                    <div className="flex items-center gap-1">
                      {String(event.organizerId) === String(currentUser.id) && (
                        <>
                          <button
                            onClick={(e) => handleEdit(e, event.id)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, event.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.attendees.length} attending
                        {event.maxAttendees && ` / ${event.maxAttendees} max`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs">
                      {event.organizerAvatar}
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">Organized by</div>
                      <div>{event.organizer}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}