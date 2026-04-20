import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { eventsService } from "../services/storage";
import { Event } from "../services/mockData";
import { toast } from "sonner";

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsService.getEvents();
      setEvents(data);
    } catch (error) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

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
                    {event.attendees.includes('user-1') && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Going</span>
                    )}
                  </div>
                  <h3 className="text-lg mb-2">{event.title}</h3>
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