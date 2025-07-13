import { supabase } from "./supabase";

export interface MusicSchedule {
  id?: string;
  club_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  genres: string[];
  [key: string]: any; // For individual genre columns
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  start_date: string;
  end_date: string;
  music_genres?: string[];
}

export interface ClubHours {
  periods: {
    open: { day: number; hour: number; minute: number };
    close: { day: number; hour: number; minute: number };
  }[];
  weekdayDescriptions: string[];
}

export interface CurrentScheduleResult {
  type: "event" | "regular" | "closed";
  data: MusicSchedule | Event | null;
  period?: {
    open: { day: number; hour: number; minute: number };
    close: { day: number; hour: number; minute: number };
  };
}

/**
 * Get the current music schedule based on the current time and club operating hours
 * This properly handles overnight operations and event overrides
 */
export async function getCurrentMusicSchedule(
  clubId: string,
  currentTime: Date = new Date()
): Promise<CurrentScheduleResult> {
  try {
    // 1. Get club hours
    const { data: club, error: clubError } = await supabase
      .from("Clubs")
      .select("hours")
      .eq("id", clubId)
      .single();

    if (clubError) {
      console.error("Error fetching club hours:", clubError);
      return { type: "closed", data: null };
    }

    const hours: ClubHours = club?.hours || {
      periods: [],
      weekdayDescriptions: [],
    };
    const periods = hours.periods;

    // 2. Check if club is currently open by finding an active operating period
    for (const period of periods) {
      const periodStart = new Date(currentTime);
      periodStart.setHours(period.open.hour, period.open.minute, 0, 0);

      let periodEnd = new Date(currentTime);
      periodEnd.setHours(period.close.hour, period.close.minute, 0, 0);

      // Handle overnight periods
      if (period.close.day !== period.open.day) {
        periodEnd.setDate(periodEnd.getDate() + 1);
      }

      // Check if current time falls within this operating period
      if (currentTime >= periodStart && currentTime <= periodEnd) {
        // Club is currently open! Now check for event overrides

        // 3. Check for events during this operating period
        const { data: events, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("club_id", clubId)
          .gte("start_date", periodStart.toISOString())
          .lte("end_date", periodEnd.toISOString())
          .not("music_genres", "is", null)
          .limit(1);

        if (eventError) {
          console.error("Error checking for events:", eventError);
        }

        if (events && events.length > 0) {
          // Event override takes precedence
          return {
            type: "event",
            data: events[0] as Event,
            period,
          };
        } else {
          // Get regular music schedule for the day the period started
          const { data: musicSchedule, error: scheduleError } = await supabase
            .from("ClubMusicSchedules")
            .select("*")
            .eq("club_id", clubId)
            .eq("day_of_week", period.open.day.toString())
            .single();

          if (scheduleError) {
            console.error("Error fetching music schedule:", scheduleError);
            return { type: "closed", data: null, period };
          }

          return {
            type: "regular",
            data: musicSchedule,
            period,
          };
        }
      }
    }

    // Club is not currently open
    return { type: "closed", data: null };
  } catch (error) {
    console.error("Error getting current music schedule:", error);
    return { type: "closed", data: null };
  }
}

/**
 * Get the effective music schedule for a specific date and time
 * This function checks for events first, then falls back to regular daily schedule
 * @deprecated Use getCurrentMusicSchedule instead for better overnight handling
 */
export async function getEffectiveMusicSchedule(
  clubId: string,
  date: Date,
  time?: string
): Promise<MusicSchedule | null> {
  try {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const targetTime =
      time ||
      `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

    // First, check if there's an event on this date/time
    const eventStart = new Date(date);
    eventStart.setHours(0, 0, 0, 0);

    const eventEnd = new Date(date);
    eventEnd.setHours(23, 59, 59, 999);

    const { data: events, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("club_id", clubId)
      .gte("start_date", eventStart.toISOString())
      .lte("end_date", eventEnd.toISOString())
      .not("music_genres", "is", null);

    if (eventError) {
      console.error("Error fetching events:", eventError);
    }

    // If there's an event with music genres, return it
    if (events && events.length > 0) {
      const event = events[0] as Event;
      if (event.music_genres && event.music_genres.length > 0) {
        // Create a music schedule object from the event
        const eventSchedule: MusicSchedule = {
          club_id: clubId,
          day_of_week: dayOfWeek,
          start_time: new Date(event.start_date).toTimeString().slice(0, 5),
          end_time: new Date(event.end_date).toTimeString().slice(0, 5),
          genres: event.music_genres,
          // Set individual genre values to 10 for selected genres
          ...event.music_genres.reduce(
            (acc, genre) => ({ ...acc, [genre]: 10 }),
            {}
          ),
        };

        return eventSchedule;
      }
    }

    // If no event or no event music genres, fall back to regular daily schedule
    const { data: regularSchedule, error: scheduleError } = await supabase
      .from("ClubMusicSchedules")
      .select("*")
      .eq("club_id", clubId)
      .eq("day_of_week", dayOfWeek)
      .single();

    if (scheduleError) {
      console.error("Error fetching regular music schedule:", scheduleError);
      return null;
    }

    return regularSchedule;
  } catch (error) {
    console.error("Error getting effective music schedule:", error);
    return null;
  }
}

/**
 * Get all music schedules for a club (regular + events)
 */
export async function getAllMusicSchedules(clubId: string): Promise<{
  regular: MusicSchedule[];
  events: Event[];
}> {
  try {
    // Get regular schedules
    const { data: regularSchedules, error: regularError } = await supabase
      .from("ClubMusicSchedules")
      .select("*")
      .eq("club_id", clubId)
      .order("day_of_week");

    if (regularError) {
      console.error("Error fetching regular schedules:", regularError);
    }

    // Get events with music genres
    const { data: events, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("club_id", clubId)
      .not("music_genres", "is", null)
      .gte("start_date", new Date().toISOString())
      .order("start_date");

    if (eventError) {
      console.error("Error fetching events:", eventError);
    }

    return {
      regular: regularSchedules || [],
      events: events || [],
    };
  } catch (error) {
    console.error("Error getting all music schedules:", error);
    return { regular: [], events: [] };
  }
}

/**
 * Check if a specific date/time has an event with music genres
 * @deprecated Use getCurrentMusicSchedule instead for better overnight handling
 */
export async function hasEventMusic(
  clubId: string,
  date: Date
): Promise<{ hasEvent: boolean; event?: Event }> {
  try {
    const eventStart = new Date(date);
    eventStart.setHours(0, 0, 0, 0);

    const eventEnd = new Date(date);
    eventEnd.setHours(23, 59, 59, 999);

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("club_id", clubId)
      .gte("start_date", eventStart.toISOString())
      .lte("end_date", eventEnd.toISOString())
      .not("music_genres", "is", null)
      .limit(1);

    if (error) {
      console.error("Error checking for event music:", error);
      return { hasEvent: false };
    }

    return {
      hasEvent: events && events.length > 0,
      event: events?.[0] as Event,
    };
  } catch (error) {
    console.error("Error checking for event music:", error);
    return { hasEvent: false };
  }
}
