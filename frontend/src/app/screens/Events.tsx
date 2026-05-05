import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Calendar, MapPin, Users, Lock, Globe } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { authService } from "../services/storage";
import {
  getEvents,
  getAllEvents,
  getDemoUser,
  EventWithMeta,
} from "../services/eventsService";
import { toast } from "sonner";

export default function Events() {
  const [events, setEvents] = useState<EventWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Use real user if logged in, otherwise fall back to demo user
  const authUser = authService.getCurrentUser();
  const currentUser = authUser?.id
    ? { id: authUser.id, neighborhoodId: authUser.neighborhoodId }
    : getDemoUser();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      let data: EventWithMeta[];
      if (currentUser.neighborhoodId) {
        data = await getEvents(currentUser.neighborhoodId, currentUser.id);
      } else {
        // If user is not in a neighborhood, show all public events
        data = await getAllEvents(currentUser.id);
      }
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Community: "bg-blue-100 text-blue-700",
      Social: "bg-purple-100 text-purple-700",
      Family: "bg-pink-100 text-pink-700",
      Sports: "bg-green-100 text-green-700",
      Education: "bg-orange-100 text-orange-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Events</h1>
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
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3" />
            <div className="text-muted-foreground text-sm">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No events scheduled</h3>
            <p className="text-sm text-muted-foreground/70 mb-4">
              Be the first to organize something for your community!
            </p>
            <Link to="/create-event">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create an Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="block bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="h-32 bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center relative">
                  <Calendar className="w-16 h-16 text-primary/40" />
                  {/* Privacy badge */}
                  {event.meta.isPrivate && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-amber-500/90 text-white border-0 shadow-sm">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                        event.category
                      )}`}
                    >
                      {event.category}
                    </span>
                    {event.isAttending && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Going
                      </span>
                    )}
                    {!event.meta.isPrivate && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-500">
                        <Globe className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />
                        Public
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {event.meta.text}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(event.date)} at {event.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.attendeeCount} attending
                        {event.max_attendees && ` / ${event.max_attendees} max`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs">
                      {event.organizerAvatar
                        ? event.organizerAvatar.slice(0, 2).toUpperCase()
                        : event.organizerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">Organized by</div>
                      <div className="font-medium">{event.organizerName}</div>
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