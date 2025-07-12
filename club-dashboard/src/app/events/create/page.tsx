"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  CalendarIcon,
  ArrowLeft,
  Clock,
  Music,
  AlertTriangle,
} from "lucide-react";
import {
  format,
  setHours,
  setMinutes,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import { CreateEventData, Event } from "@/types/event";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [existingEvents, setExistingEvents] = useState<Event[]>([]);
  const [clubHours, setClubHours] = useState<any>(null);
  const [hoursWarning, setHoursWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    caption: "",
    poster_url: "",
    start_date: "",
    end_date: "",
    music_genres: [],
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

  // Fetch existing events and club hours for validation
  useEffect(() => {
    fetchExistingEvents();
    fetchClubHours();
  }, []);

  // Check if event time is within club hours
  useEffect(() => {
    if (startDate && endDate && clubHours) {
      checkEventHours();
    }
  }, [startDate, endDate, startTime, endTime, clubHours]);

  const fetchClubHours = async () => {
    try {
      const { data, error } = await supabase
        .from("Clubs")
        .select("hours")
        .eq("id", "ChIJHUs0vJ01K4gRys6H5F8MkGY")
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
      (period: any) => period.open.day === dayOfWeek
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

      let periodEnd = new Date(startDate);
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

  const fetchExistingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("club_id", "ChIJHUs0vJ01K4gRys6H5F8MkGY")
        .gte("start_date", new Date().toISOString());

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setExistingEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
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

  // Check for time overlaps
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

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);

    try {
      const startDateTime = createDateTime(startDate!, startTime);
      const endDateTime = createDateTime(endDate!, endTime);

      // Debug logging
      console.log("Start Date:", startDate);
      console.log("Start Time:", startTime);
      console.log("Start DateTime:", startDateTime);
      console.log("Start ISO:", startDateTime.toISOString());

      console.log("End Date:", endDate);
      console.log("End Time:", endTime);
      console.log("End DateTime:", endDateTime);
      console.log("End ISO:", endDateTime.toISOString());

      const eventData = {
        club_id: "ChIJHUs0vJ01K4gRys6H5F8MkGY", // Hardcoded club ID
        title: formData.title,
        caption: formData.caption || null,
        poster_url: formData.poster_url || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        music_genres:
          formData.music_genres && formData.music_genres.length > 0
            ? formData.music_genres
            : null,
        created_by: null, // Set to null for now since we don't have user authentication
      };

      console.log("Event Data:", eventData);

      const { error } = await supabase.from("events").insert(eventData);

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      alert("Event created successfully!");
      router.push("/events");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-2">Add a new event to your club</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Fill in the details for your new event
            </CardDescription>
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
                        You can still create this event, but it will be marked
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
                  disabled={
                    loading || !formData.title || !startDate || !endDate
                  }
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
