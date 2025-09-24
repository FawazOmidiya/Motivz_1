"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ArrowLeft, Music, AlertTriangle } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";

import { supabase } from "@/lib/supabase";
import { CreateEventData, Event } from "@/types/event";
import { RecurringConfig } from "../../../../../../shared-types/recurring-events";
import { useAuth } from "@/contexts/AuthContext";
import RecurringEventConfig from "@/components/RecurringEventConfig";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { club } = useAuth();

  // Use authenticated club ID
  const CLUB_ID = club?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [existingEvents, setExistingEvents] = useState<Event[]>([]);
  const [clubHours, setClubHours] = useState<{
    periods: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
  } | null>(null);

  const [hoursWarning, setHoursWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    caption: "",
    poster_url: "",
    ticket_link: "",
    guestlist_available: false,
    start_date: "",
    end_date: "",
    music_genres: [],
  });

  // Recurring event state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState<RecurringConfig>({
    active: true,
    frequency: "weekly",
    days_of_week: [],
    end_date: undefined,
    max_occurrences: 12,
  });

  const MUSIC_GENRES = [
    "HipHop",
    "Pop",
    "Soul",
    "Rap",
    "House",
    "Latin",
    "EDM",
    "Jazz",
    "Country",
    "Blues",
    "DanceHall",
    "Afrobeats",
    "Top 40",
    "Amapiano",
    "90's",
    "2000's",
    "2010's",
    "R&B",
  ];

  // Fetch event data, existing events, and club hours
  useEffect(() => {
    fetchEventData();
    fetchExistingEvents();
    fetchClubHours();
  }, [eventId]);

  // Check if event time is within club hours
  useEffect(() => {
    if (startDate && endDate && clubHours) {
      checkEventHours();
    }
  }, [startDate, endDate, startTime, endTime, clubHours]);

  const fetchEventData = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) {
        console.error("Error fetching event:", error);
        alert("Event not found");
        router.push("/events");
        return;
      }

      if (data) {
        const event = data as Event;
        setFormData({
          title: event.title,
          caption: event.caption || "",
          poster_url: event.poster_url || "",
          ticket_link: event.ticket_link || "",
          guestlist_available: event.guestlist_available || false,
          start_date: event.start_date,
          end_date: event.end_date,
          music_genres: event.music_genres || [],
        });

        // Parse dates and times
        const startDateTime = parseISO(event.start_date);
        const endDateTime = parseISO(event.end_date);

        setStartDate(startDateTime);
        setEndDate(endDateTime);
        setStartTime(format(startDateTime, "HH:mm"));
        setEndTime(format(endDateTime, "HH:mm"));

        // Load recurring config if it exists
        if (event.recurring_config) {
          setIsRecurring(true);
          setRecurringConfig(event.recurring_config);
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      alert("Failed to load event");
      router.push("/events");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("club_id", CLUB_ID)
        .gte("start_date", new Date().toISOString())
        .neq("id", eventId); // Exclude current event from overlap check

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setExistingEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchClubHours = async () => {
    try {
      const { data, error } = await supabase
        .from("Clubs")

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

  const checkEventHours = () => {
    if (!startDate || !endDate || !clubHours?.periods) {
      setHoursWarning(null);
      return;
    }

    const startDateTime = createDateTime(startDate, startTime);
    const endDateTime = createDateTime(endDate, endTime);
    const dayOfWeek = startDate.getDay();

    // Find operating periods for this day
    const dayPeriods = clubHours.periods.filter(
      (period: { open: { day: number } }) => period.open.day === dayOfWeek
    );

    if (dayPeriods.length === 0) {
      setHoursWarning(
        "⚠️ Club is normally closed on this day. This will be a special event."
      );
      return;
    }

    // Check if event time falls within any operating period
    let isWithinHours = false;
    for (const period of dayPeriods) {
      const periodStart = new Date(startDate);
      periodStart.setHours(period.open.hour, period.open.minute, 0, 0);

      const periodEnd = new Date(startDate);

      periodEnd.setHours(period.close.hour, period.close.minute, 0, 0);

      // Handle midnight spanning
      if (periodEnd <= periodStart) {
        periodEnd.setDate(periodEnd.getDate() + 1);
      }

      if (startDateTime >= periodStart && endDateTime <= periodEnd) {
        isWithinHours = true;
        break;
      }
    }

    if (!isWithinHours) {
      setHoursWarning(
        "⚠️ Event time is outside normal operating hours. This will be a special event."
      );
    } else {
      setHoursWarning(null);
    }
  };

  // Create date-time objects from date and time
  const createDateTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(":").map(Number);
    // Create a new date object to avoid mutating the original
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  // Check for time overlaps (excluding current event)
  const checkForOverlaps = (newStart: Date, newEnd: Date): string | null => {
    for (const event of existingEvents) {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);

      // Check if the new event overlaps with existing events
      if (
        (newStart >= eventStart && newStart < eventEnd) || // New start is during existing event
        (newEnd > eventStart && newEnd <= eventEnd) || // New end is during existing event
        (newStart <= eventStart && newEnd >= eventEnd) // New event completely contains existing event
      ) {
        return `This event overlaps with "${event.title}" (${format(
          eventStart,
          "PPP 'at' p"
        )} - ${format(eventEnd, "p")})`;
      }
    }
    return null;
  };

  // Validate form data
  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return "Event title is required";
    }

    if (!startDate || !endDate) {
      return "Please select both start and end dates";
    }

    const startDateTime = createDateTime(startDate, startTime);
    const endDateTime = createDateTime(endDate, endTime);

    // Check if end time is after start time
    if (!isAfter(endDateTime, startDateTime)) {
      return "End time must be after start time";
    }

    // Check if start time is in the future
    if (!isAfter(startDateTime, new Date())) {
      return "Start time must be in the future";
    }

    // Check for overlaps
    const overlapError = checkForOverlaps(startDateTime, endDateTime);
    if (overlapError) {
      return overlapError;
    }

    // Validate recurring event settings
    if (isRecurring) {
      if (
        recurringConfig.frequency === "weekly" &&
        (!recurringConfig.days_of_week ||
          recurringConfig.days_of_week.length === 0)
      ) {
        return "Please select at least one day of the week for weekly recurring events";
      }
      if (
        (recurringConfig.max_occurrences || 12) < 1 ||
        (recurringConfig.max_occurrences || 12) > 100
      ) {
        return "Maximum occurrences must be between 1 and 100";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);

    try {
      const startDateTime = createDateTime(startDate!, startTime);
      const endDateTime = createDateTime(endDate!, endTime);

      const updateData = {
        title: formData.title,
        caption: formData.caption || null,
        poster_url: formData.poster_url || null,
        ticket_link: formData.ticket_link || null,
        guestlist_available: formData.guestlist_available || false,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        music_genres:
          formData.music_genres && formData.music_genres.length > 0
            ? formData.music_genres
            : null,
        recurring_config: isRecurring ? recurringConfig : null,
      };

      const { error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", eventId);

      if (error) {
        throw error;
      }

      alert("Event updated successfully!");
      router.push("/events");
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Generate time options (every 30 minutes)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const toggleGenre = (genre: string) => {
    const currentGenres = formData.music_genres || [];
    const isSelected = currentGenres.includes(genre);

    const newGenres = isSelected
      ? currentGenres.filter((g) => g !== genre)
      : [...currentGenres, genre];

    setFormData({ ...formData, music_genres: newGenres });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/events"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-2">Update event details</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Update the details for your event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Description</Label>
                <Textarea
                  id="caption"
                  value={formData.caption}
                  onChange={(e) =>
                    setFormData({ ...formData, caption: e.target.value })
                  }
                  placeholder="Add a description for your event"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="poster_url">Poster Image URL</Label>
                <Input
                  id="poster_url"
                  type="url"
                  value={formData.poster_url}
                  onChange={(e) =>
                    setFormData({ ...formData, poster_url: e.target.value })
                  }
                  placeholder="https://example.com/poster.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_link">Ticket Purchase Link</Label>
                <Input
                  id="ticket_link"
                  type="url"
                  value={formData.ticket_link}
                  onChange={(e) =>
                    setFormData({ ...formData, ticket_link: e.target.value })
                  }
                  placeholder="https://example.com/tickets"
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Add a link where users can purchase tickets for this
                  event
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Music Genres
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select the music genres for this event. This will override
                    the regular daily schedule.
                  </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {MUSIC_GENRES.map((genre) => {
                    const isSelected =
                      formData.music_genres?.includes(genre) || false;
                    return (
                      <Badge
                        key={genre}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer ${
                          isSelected ? "bg-primary text-primary-foreground" : ""
                        }`}
                        onClick={() => toggleGenre(genre)}
                      >
                        {genre}
                      </Badge>
                    );
                  })}
                </div>

                {formData.music_genres && formData.music_genres.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Selected Genres:</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.music_genres.map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recurring Event Section */}
              <RecurringEventConfig
                isRecurring={isRecurring}
                onRecurringChange={setIsRecurring}
                recurringConfig={recurringConfig}
                onConfigChange={setRecurringConfig}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview of selected date-time */}
              {startDate && endDate && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Event Schedule Preview:
                  </h4>
                  <div className="text-sm text-blue-800">
                    <p>
                      <strong>Start:</strong>{" "}
                      {format(
                        createDateTime(startDate, startTime),
                        "PPP 'at' p"
                      )}
                    </p>
                    <p>
                      <strong>End:</strong>{" "}
                      {format(createDateTime(endDate, endTime), "PPP 'at' p")}
                    </p>
                  </div>
                </div>
              )}

              {/* Hours Warning */}
              {hoursWarning && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">
                        Special Event Notice
                      </h4>
                      <p className="text-sm text-yellow-700">{hoursWarning}</p>
                      <p className="text-xs text-yellow-600 mt-2">
                        You can still update this event, but it will be marked
                        as a special event outside normal hours.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/events")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.title || !startDate || !endDate}
                  className="flex-1"
                >
                  {saving ? "Saving..." : "Update Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
