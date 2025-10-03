"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Save, ArrowLeft, Music } from "lucide-react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

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

interface DaySchedule {
  day: number;
  label: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  closeDay: number; // For midnight spanning
  musicGenres: string[];
}

export default function ClubSchedulePage() {
  const { club } = useAuth();
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  const CLUB_ID = club?.id;

  useEffect(() => {
    if (CLUB_ID) {
      loadSchedule();
    }
  }, [CLUB_ID, loadSchedule]);

  const loadSchedule = useCallback(async () => {
    try {
      const [hoursData, musicData] = await Promise.all([
        supabase.from("Clubs").select("hours").eq("id", CLUB_ID).single(),
        supabase
          .from("ClubMusicSchedules")
          .select("*")
          .eq("club_id", CLUB_ID)
          .order("day_of_week"),
      ]);

      if (hoursData.error) {
        console.error("Error loading club hours:", hoursData.error);
      }

      if (musicData.error) {
        console.error("Error loading music schedules:", musicData.error);
      }

      const hours = hoursData.data?.hours || {
        periods: [],
        weekdayDescriptions: [],
      };
      const musicSchedules = musicData.data || [];

      // Initialize day schedules
      const schedules: DaySchedule[] = DAYS_OF_WEEK.map((day) => {
        const dayPeriod = hours.periods.find(
          (p: { open: { day: number } }) => p.open.day === day.value
        );
        const musicSchedule = musicSchedules.find(
          (m: { day_of_week: string }) => parseInt(m.day_of_week) === day.value
        );

        // Extract selected genres from individual genre columns
        const selectedGenres: string[] = [];
        if (musicSchedule) {
          MUSIC_GENRES.forEach((genre) => {
            if (musicSchedule[genre] === 10) {
              selectedGenres.push(genre);
            }
          });
        }

        return {
          day: day.value,
          label: day.label,
          isOpen: !!dayPeriod,
          openTime: dayPeriod
            ? `${dayPeriod.open.hour
                .toString()
                .padStart(2, "0")}:${dayPeriod.open.minute
                .toString()
                .padStart(2, "0")}`
            : "09:00",
          closeTime: dayPeriod
            ? `${dayPeriod.close.hour
                .toString()
                .padStart(2, "0")}:${dayPeriod.close.minute
                .toString()
                .padStart(2, "0")}`
            : "17:00",
          closeDay: dayPeriod ? dayPeriod.close.day : day.value,
          musicGenres: selectedGenres,
        };
      });

      setDaySchedules(schedules);
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setLoading(false);
    }
  }, [CLUB_ID]);

  const updateDaySchedule = (
    dayValue: number,
    updates: Partial<DaySchedule>
  ) => {
    setDaySchedules((prev) =>
      prev.map((schedule) =>
        schedule.day === dayValue ? { ...schedule, ...updates } : schedule
      )
    );
  };

  const toggleDayOpen = (dayValue: number) => {
    const schedule = daySchedules.find((s) => s.day === dayValue);
    if (!schedule) return;

    updateDaySchedule(dayValue, { isOpen: !schedule.isOpen });
  };

  const toggleGenre = (dayValue: number, genre: string) => {
    const schedule = daySchedules.find((s) => s.day === dayValue);
    if (!schedule) return;

    const isSelected = schedule.musicGenres.includes(genre);
    const newGenres = isSelected
      ? schedule.musicGenres.filter((g) => g !== genre)
      : [...schedule.musicGenres, genre];

    updateDaySchedule(dayValue, { musicGenres: newGenres });
  };

  const isValidPeriod = (schedule: DaySchedule): boolean => {
    if (!schedule.isOpen) return true;

    const [openHour, openMinute] = schedule.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = schedule.closeTime.split(":").map(Number);

    // Check if close day is valid (current day or next day only)
    const validCloseDays = [schedule.day, (schedule.day + 1) % 7];
    if (!validCloseDays.includes(schedule.closeDay)) {
      return false;
    }

    // Handle overnight periods (next day)
    if (schedule.closeDay !== schedule.day) {
      const totalMinutes =
        24 * 60 + // 24 hours for the day transition
        (closeHour * 60 + closeMinute) -
        (openHour * 60 + openMinute);
      return totalMinutes <= 24 * 60; // Must be 24 hours or less
    }

    // Same day
    const totalMinutes =
      closeHour * 60 + closeMinute - (openHour * 60 + openMinute);
    return totalMinutes > 0 && totalMinutes <= 24 * 60;
  };

  const getPeriodValidationMessage = (schedule: DaySchedule): string | null => {
    if (!schedule.isOpen) return null;

    const [openHour, openMinute] = schedule.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = schedule.closeTime.split(":").map(Number);

    // Check if close day is valid (current day or next day only)
    const validCloseDays = [schedule.day, (schedule.day + 1) % 7];
    if (!validCloseDays.includes(schedule.closeDay)) {
      return "Close day must be the same day or next day";
    }

    // Handle overnight periods (next day)
    if (schedule.closeDay !== schedule.day) {
      const totalMinutes =
        24 * 60 + // 24 hours for the day transition
        (closeHour * 60 + closeMinute) -
        (openHour * 60 + openMinute);
      if (totalMinutes > 24 * 60) {
        return "Period cannot exceed 24 hours";
      }
    }

    // Same day
    const totalMinutes =
      closeHour * 60 + closeMinute - (openHour * 60 + openMinute);
    if (totalMinutes <= 0) {
      return "Close time must be after open time";
    }
    if (totalMinutes > 24 * 60) {
      return "Period cannot exceed 24 hours";
    }

    return null;
  };

  const hasValidationErrors = (): boolean => {
    return daySchedules.some((schedule) => {
      if (!schedule.isOpen) return false;
      return !isValidPeriod(schedule);
    });
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      // Convert to hours format
      const periods = daySchedules
        .filter((schedule) => schedule.isOpen)
        .map((schedule) => {
          const [openHour, openMinute] = schedule.openTime
            .split(":")
            .map(Number);
          const [closeHour, closeMinute] = schedule.closeTime
            .split(":")
            .map(Number);

          return {
            open: { day: schedule.day, hour: openHour, minute: openMinute },
            close: {
              day: schedule.closeDay,
              hour: closeHour,
              minute: closeMinute,
            },
          };
        });

      const weekdayDescriptions = daySchedules.map((schedule) => {
        if (!schedule.isOpen) return `${schedule.label}: Closed`;

        // Convert 24-hour format to 12-hour format with AM/PM
        const formatTime = (timeString: string) => {
          const [hour, minute] = timeString.split(":").map(Number);
          const period = hour >= 12 ? "PM" : "AM";
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${displayHour}:${minute
            .toString()
            .padStart(2, "0")} ${period}`;
        };

        const openTime = formatTime(schedule.openTime);
        const closeTime = formatTime(schedule.closeTime);

        if (schedule.closeDay === schedule.day) {
          return `${schedule.label}: ${openTime} – ${closeTime}`;
        } else {
          return `${schedule.label}: ${openTime} – ${closeTime}`;
        }
      });

      // Save hours
      const { error: hoursError } = await supabase
        .from("Clubs")
        .update({
          hours: { periods, weekdayDescriptions },
        })
        .eq("id", CLUB_ID);

      if (hoursError) {
        console.error("Error saving hours:", hoursError);
        throw hoursError;
      }

      // Save music schedules
      const musicSchedules = daySchedules
        .filter(
          (schedule) => schedule.isOpen && schedule.musicGenres.length > 0
        )
        .map((schedule) => ({
          club_id: CLUB_ID,
          day_of_week: schedule.day.toString(),
          music_genres: schedule.musicGenres,
          ...MUSIC_GENRES.reduce(
            (acc, genre) => ({
              ...acc,
              [genre]: schedule.musicGenres.includes(genre) ? 10 : 0,
            }),
            {}
          ),
        }));

      // Delete existing music schedules for this club
      await supabase.from("ClubMusicSchedules").delete().eq("club_id", CLUB_ID);

      // Insert new music schedules
      console.log("Saving music schedules payload:", musicSchedules);
      if (musicSchedules.length > 0) {
        const { error: musicError } = await supabase
          .from("ClubMusicSchedules")
          .insert(musicSchedules);

        if (musicError) {
          console.error("Error saving music schedules:", musicError);
          alert(
            "Failed to save music schedules: " + JSON.stringify(musicError)
          );
          throw musicError;
        }
      } else {
        console.log("No music schedules to save.");
      }

      alert("Schedule saved successfully!");
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p>Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Club Schedule</h1>
        <p className="text-muted-foreground">
          Set operating hours and music genres for each day
        </p>
      </div>

      <div className="mb-6">
        <Button
          onClick={saveSchedule}
          disabled={saving || hasValidationErrors()}
          className="w-full md:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
        {hasValidationErrors() && (
          <p className="text-red-600 text-sm mt-2 font-medium">
            ⚠️ Please fix validation errors before saving
          </p>
        )}
      </div>

      <Tabs
        value={activeDay.toString()}
        onValueChange={(value: string) => setActiveDay(parseInt(value))}
      >
        <TabsList className="grid w-full grid-cols-7">
          {DAYS_OF_WEEK.map((day) => {
            const schedule = daySchedules.find((s) => s.day === day.value);
            const isOpen = schedule?.isOpen || false;
            return (
              <TabsTrigger
                key={day.value}
                value={day.value.toString()}
                className={!isOpen ? "opacity-50" : ""}
              >
                <div className="flex flex-col items-center">
                  <span>{day.label.slice(0, 3)}</span>
                  {!isOpen && (
                    <span className="text-xs text-muted-foreground">
                      Closed
                    </span>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {DAYS_OF_WEEK.map((day) => {
          const schedule = daySchedules.find((s) => s.day === day.value);
          if (!schedule) return null;

          const validationMessage = getPeriodValidationMessage(schedule);
          const isValid = isValidPeriod(schedule);

          return (
            <TabsContent key={day.value} value={day.value.toString()}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{day.label} Schedule</span>
                    <div className="flex gap-2">
                      {schedule.isOpen ? (
                        <Button
                          variant="outline"
                          onClick={() => toggleDayOpen(day.value)}
                          size="sm"
                        >
                          Close Day
                        </Button>
                      ) : (
                        <Button
                          onClick={() => toggleDayOpen(day.value)}
                          size="sm"
                        >
                          Open Schedule
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {schedule.isOpen
                      ? `Set operating hours and music for ${day.label.toLowerCase()}`
                      : `${day.label} is closed - click "Open Schedule" to configure`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {schedule.isOpen ? (
                    <>
                      {/* Operating Hours */}
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Operating Hours
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Open Time
                            </label>
                            <input
                              type="time"
                              value={schedule.openTime}
                              onChange={(e) =>
                                updateDaySchedule(day.value, {
                                  openTime: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Close Time
                            </label>
                            <div className="space-y-2">
                              <input
                                type="time"
                                value={schedule.closeTime}
                                onChange={(e) =>
                                  updateDaySchedule(day.value, {
                                    closeTime: e.target.value,
                                  })
                                }
                                className="w-full p-2 border rounded-md"
                              />
                              <select
                                value={schedule.closeDay}
                                onChange={(e) =>
                                  updateDaySchedule(day.value, {
                                    closeDay: parseInt(e.target.value),
                                  })
                                }
                                className="w-full p-2 border rounded-md text-sm"
                              >
                                <option value={schedule.day}>
                                  {
                                    DAYS_OF_WEEK.find(
                                      (d) => d.value === schedule.day
                                    )?.label
                                  }{" "}
                                  (Same Day)
                                </option>
                                <option value={(schedule.day + 1) % 7}>
                                  {
                                    DAYS_OF_WEEK.find(
                                      (d) => d.value === (schedule.day + 1) % 7
                                    )?.label
                                  }{" "}
                                  (Next Day)
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                        {validationMessage && !isValid && (
                          <div className="mt-2 p-3 rounded-md border bg-red-50 border-red-200">
                            <p className="text-sm font-medium text-red-700">
                              ⚠️ {validationMessage}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Music Genres */}
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Music Genres
                        </h3>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {MUSIC_GENRES.map((genre) => {
                            const isSelected =
                              schedule.musicGenres.includes(genre);
                            return (
                              <Badge
                                key={genre}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : ""
                                }`}
                                onClick={() => toggleGenre(day.value, genre)}
                              >
                                {genre}
                              </Badge>
                            );
                          })}
                        </div>
                        {schedule.musicGenres.length > 0 && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">
                              Selected for {day.label}:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {schedule.musicGenres.map((genre) => (
                                <Badge key={genre} variant="secondary">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No schedule needed - {day.label} is closed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
