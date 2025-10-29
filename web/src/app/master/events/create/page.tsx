"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { CreateEventData } from "@/types/event";
import DatePickerScreen from "@/components/DatePickerScreen";
import { Badge } from "@/components/ui/badge";
import { MUSIC_GENRES } from "@/lib/constants";

interface Club {
  id: string;
  Name: string;
  Address: string;
}

function CreateEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);

  // Form state
  const [eventFormData, setEventFormData] = useState<CreateEventData>({
    title: "",
    caption: "",
    poster_url: "",
    ticket_link: "",
    guestlist_available: false,
    start_date: "",
    end_date: "",
    music_genres: [],
    club_id: "",
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("02:00");
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    fetchClubs();

    // Check if we're duplicating an event
    const duplicateId = searchParams.get("duplicate");
    if (duplicateId) {
      fetchEventToDuplicate(duplicateId);
    }
  }, [searchParams]);

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("Clubs")
        .select("*")
        .order("Name");
      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    }
  };

  const fetchEventToDuplicate = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      if (!data) return;

      // Pre-fill form with event data
      setEventFormData({
        title: `${data.title}`,
        caption: data.caption || "",
        poster_url: data.poster_url || "",
        ticket_link: data.ticket_link || "",
        guestlist_available: data.guestlist_available || false,
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        music_genres: data.music_genres || [],
        club_id: data.club_id || "",
      });

      // Set dates
      if (data.start_date) {
        setStartDate(new Date(data.start_date));
      }
      if (data.end_date) {
        setEndDate(new Date(data.end_date));
      }

      // Set club
      setSelectedClub(data.club_id || "");

      // Set music genres
      setSelectedGenres(data.music_genres || []);

      // Set times (extract from datetime if available)
      if (data.start_date) {
        const startDate = new Date(data.start_date);
        setStartTime(startDate.toTimeString().slice(0, 5));
      }
      if (data.end_date) {
        const endDate = new Date(data.end_date);
        setEndTime(endDate.toTimeString().slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching event to duplicate:", error);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres((prev) => prev.filter((g) => g !== genre));
  };

  const handleCreateEvent = async () => {
    if (!selectedClub || !startDate || !endDate || !eventFormData.title) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const startDateTime = new Date(startDate);
      const [startHour, startMinute] = startTime.split(":").map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(endDate);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const eventData = {
        club_id: selectedClub,
        title: eventFormData.title,
        caption: eventFormData.caption || null,
        poster_url: eventFormData.poster_url || null,
        ticket_link: eventFormData.ticket_link || null,
        guestlist_available: eventFormData.guestlist_available || false,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        music_genres: selectedGenres.length > 0 ? selectedGenres : null,
        created_by: null,
      };

      const { error } = await supabase.from("events").insert(eventData);
      if (error) throw error;

      alert("Event created successfully!");
      router.push("/master");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEventFormData({
      title: "",
      caption: "",
      poster_url: "",
      ticket_link: "",
      guestlist_available: false,
      start_date: "",
      end_date: "",
      music_genres: [],
      club_id: "",
    });
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime("20:00");
    setEndTime("02:00");
    setSelectedClub("");
    setSelectedGenres([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/master"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Master Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Create New Event
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="club">Club *</Label>
                <Select value={selectedClub} onValueChange={setSelectedClub}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={eventFormData.title}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter event title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Description</Label>
              <Textarea
                id="caption"
                value={eventFormData.caption}
                onChange={(e) =>
                  setEventFormData({
                    ...eventFormData,
                    caption: e.target.value,
                  })
                }
                placeholder="Event description"
                rows={4}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowStartDatePicker(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowEndDatePicker(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Links and Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ticketLink">Ticket Link</Label>
                <Input
                  id="ticketLink"
                  type="url"
                  value={eventFormData.ticket_link}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      ticket_link: e.target.value,
                    })
                  }
                  placeholder="https://example.com/tickets"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="posterUrl">Poster URL</Label>
                <Input
                  id="posterUrl"
                  type="url"
                  value={eventFormData.poster_url}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      poster_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com/poster.jpg"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="guestlist"
                checked={eventFormData.guestlist_available}
                onChange={(e) =>
                  setEventFormData({
                    ...eventFormData,
                    guestlist_available: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="guestlist">Guestlist Available</Label>
            </div>

            {/* Music Genres Selection */}
            <div className="space-y-4">
              <Label>Music Genres</Label>

              {/* Selected Genres */}
              {selectedGenres.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Selected genres:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGenres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => removeGenre(genre)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Genre Selection */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Click to select genres:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {MUSIC_GENRES.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedGenres.includes(genre)
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Picker Screens */}
      {showStartDatePicker && (
        <DatePickerScreen
          selectedDate={startDate}
          onDateSelect={(date) => {
            setStartDate(date);
            setShowStartDatePicker(false);
          }}
          onCancel={() => setShowStartDatePicker(false)}
          title="Select Start Date"
        />
      )}

      {showEndDatePicker && (
        <DatePickerScreen
          selectedDate={endDate}
          onDateSelect={(date) => {
            setEndDate(date);
            setShowEndDatePicker(false);
          }}
          onCancel={() => setShowEndDatePicker(false)}
          title="Select End Date"
        />
      )}
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CreateEventPageContent />
    </Suspense>
  );
}
