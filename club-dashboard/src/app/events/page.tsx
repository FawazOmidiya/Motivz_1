"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Music,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types/event";
import Link from "next/link";

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");

  const [events, setEvents] = useState<Event[]>([]);
  const [clubHours, setClubHours] = useState<any>(null);
  const [musicSchedules, setMusicSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Test club ID for development
  const CLUB_ID = "test-123";

  useEffect(() => {
    fetchEvents();
    fetchClubHours();
    fetchMusicSchedules();
  }, [filter]);

  const fetchClubHours = async () => {
    try {
      const { data, error } = await supabase
        .from("test-clubs")
        .select("hours")
        .eq("id", CLUB_ID)
        .single();

      if (error) {
        console.error("Error fetching club hours:", error);
        return;
      }

      setClubHours(data?.hours);
    } catch (error) {
      console.error("Error fetching club hours:", error);
    }
  };

  const fetchMusicSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("ClubMusicSchedules")
        .select("*")
        .eq("club_id", "ChIJHUs0vJ01K4gRys6H5F8MkGY");

      if (error) {
        console.error("Error fetching music schedules:", error);
        return;
      }

      setMusicSchedules(data || []);
    } catch (error) {
      console.error("Error fetching music schedules:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from("events")
        .select("*")
        .eq("club_id", "ChIJHUs0vJ01K4gRys6H5F8MkGY")
        .order("start_date", { ascending: true });

      if (filter === "upcoming") {
        query = query.gte("start_date", new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        throw error;
      }

      alert("Event deleted successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    }
  };

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { status: "upcoming", color: "bg-blue-100 text-blue-800" };
    } else if (now >= start && now <= end) {
      return { status: "ongoing", color: "bg-green-100 text-green-800" };
    } else {
      return { status: "past", color: "bg-gray-100 text-gray-800" };
    }
  };

  const isEventOutsideHours = (event: Event) => {
    if (!clubHours?.periods) return false;

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    // Check if event time falls within any operating period
    for (const period of clubHours.periods) {
      const periodStart = new Date(startDate);
      periodStart.setHours(period.open.hour, period.open.minute, 0, 0);

      let periodEnd = new Date(startDate);
      periodEnd.setHours(period.close.hour, period.close.minute, 0, 0);

      // Handle overnight periods
      if (period.close.day !== period.open.day) {
        periodEnd.setDate(periodEnd.getDate() + 1);
      }

      if (startDate >= periodStart && endDate <= periodEnd) {
        return false; // Event is within hours
      }
    }

    return true; // Event is outside hours
  };

  const isEventOverridingGenres = (event: Event) => {
    if (!event.music_genres || event.music_genres.length === 0) return false;
    if (!musicSchedules.length) return false;

    const startDate = new Date(event.start_date);
    const dayOfWeek = startDate.getDay();

    // Find the regular music schedule for this day
    const daySchedule = musicSchedules.find(
      (schedule) => parseInt(schedule.day_of_week) === dayOfWeek
    );

    if (
      !daySchedule ||
      !daySchedule.genres ||
      daySchedule.genres.length === 0
    ) {
      return true; // No regular schedule, so event is overriding
    }

    // Check if event has different genres than regular schedule
    const regularGenres = new Set(daySchedule.genres as string[]);
    const eventGenres = new Set(event.music_genres);

    // If event has any genres not in regular schedule, it's overriding
    for (const genre of eventGenres) {
      if (!regularGenres.has(genre)) {
        return true;
      }
    }

    // If event is missing any regular genres, it's also overriding
    for (const genre of regularGenres) {
      if (!eventGenres.has(genre)) {
        return true;
      }
    }

    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {filter === "upcoming" ? "Upcoming Events" : "All Events"}
              </h1>
              <p className="text-gray-600 mt-2">
                {filter === "upcoming"
                  ? "Events happening soon"
                  : "Manage all your club events"}
              </p>
            </div>
            <Link href="/events/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === "upcoming"
                  ? "No upcoming events scheduled"
                  : "Get started by creating your first event"}
              </p>
              <Link href="/events/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => {
              const status = getEventStatus(event.start_date, event.end_date);
              return (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        {event.caption && (
                          <CardDescription className="mt-2">
                            {event.caption}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={status.color}>{status.status}</Badge>
                        {isEventOutsideHours(event) && (
                          <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Overrides Hours
                          </Badge>
                        )}
                        {isEventOverridingGenres(event) && (
                          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            Overrides Music
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/events/${event.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {format(new Date(event.start_date), "PPP")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {format(new Date(event.start_date), "p")} -{" "}
                          {format(new Date(event.end_date), "p")}
                        </span>
                      </div>
                    </div>

                    {event.music_genres && event.music_genres.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Music className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Event Music:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {event.music_genres.map((genre) => (
                            <Badge
                              key={genre}
                              variant="outline"
                              className="text-xs"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {event.poster_url && (
                      <div className="mt-4">
                        <img
                          src={event.poster_url}
                          alt={event.title}
                          className="w-full max-w-xs h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
