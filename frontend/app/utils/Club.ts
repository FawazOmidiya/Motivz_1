import * as types from "./types";
import { fetchClubMusicSchedules, supabase } from "./supabaseService";

export class Club {
  private _id: string;
  private _name: string;
  private _image: string;
  private _rating: number;
  private _hours: types.RegularOpeningHours | null;
  private _musicSchedule: types.musicGenres | null;
  private _isLoaded: boolean;
  private _address: string;
  private _live_rating: number; // Always a number
  private _instagram_handle: string | null;
  // Trending properties
  private _isTrending: boolean | null = null;
  private _trendingScore: number = 0;
  private _recentReviewsCount: number = 0;
  private _avgRating: number = 0;

  constructor(data: types.Club) {
    this._id = data.id;
    this._name = data.Name;
    this._image = data.Image;
    this._rating = data.Rating;
    this._hours = data.hours || null;
    this._musicSchedule = null;
    this._isLoaded = false;
    this._address = data.Address;
    this._live_rating =
      typeof data.live_rating === "number" ? data.live_rating : data.Rating;
    this._instagram_handle = data.instagram_handle || null;
    // live_rating will be set asynchronously
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get image(): string {
    return this._image;
  }
  get rating(): number {
    return this._rating;
  }
  get hours(): types.RegularOpeningHours | null {
    return this._hours;
  }
  get musicSchedule(): types.musicGenres | null {
    return this._musicSchedule;
  }
  get isLoaded(): boolean {
    return this._isLoaded;
  }
  get live_rating(): number {
    return this._live_rating;
  }
  get instagram_handle(): string | null {
    return this._instagram_handle;
  }

  // Trending getters
  get isTrending(): boolean | null {
    return this._isTrending;
  }

  get trendingScore(): number {
    return this._trendingScore;
  }

  get recentReviewsCount(): number {
    return this._recentReviewsCount;
  }

  get avgRating(): number {
    return this._avgRating;
  }

  // Methods
  async loadMusicSchedule(day: number): Promise<void> {
    if (!this._isLoaded) {
      this._musicSchedule = await fetchClubMusicSchedules(this._id, day);
      this._isLoaded = true;
    }
  }

  getTopGenres(): string {
    if (!this._musicSchedule) return "";

    const genreEntries = Object.entries(this._musicSchedule)
      .filter(([_, value]) => typeof value === "number" && value > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));

    const topGenres = genreEntries.slice(0, 3).map(([genre]) => genre);
    return topGenres.length > 0 ? topGenres.join(", ") : "";
  }

  isOpen(): boolean {
    try {
      if (!this._hours?.periods || this._hours.periods.length === 0)
        return false;
      // TODO: This is a hack to get the current day and time, export this to a function for reuse
      const now = new Date();
      const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Convert a period's time into absolute minutes
      const convertToAbsolute = (day: number, hour: number, minute: number) =>
        day * 1440 + hour * 60 + minute;

      // Check each period to see if current time falls within
      for (let period of this._hours.periods) {
        if (!period.open || !period.close) continue; // Defensive: skip malformed periods

        let openAbs = convertToAbsolute(
          period.open.day,
          period.open.hour,
          period.open.minute
        );
        let closeAbs = convertToAbsolute(
          period.close.day,
          period.close.hour,
          period.close.minute
        );

        // If period spans midnight (or wraps to the next week), adjust closeAbs
        if (closeAbs <= openAbs) {
          closeAbs += 7 * 1440;
        }

        // Convert current time to absolute minutes
        let currentAbs = convertToAbsolute(
          currentDay,
          now.getHours(),
          now.getMinutes()
        );

        // If current time is before openAbs and the period spans midnight, add one week
        if (currentAbs < openAbs) {
          currentAbs += 7 * 1440;
        }

        if (currentAbs >= openAbs && currentAbs < closeAbs) {
          return true;
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  }
  // TODO: This is a temporary function to get the current day hours, does not take into account the current time after midnight
  getCurrentDayHours(): string {
    if (!this._hours?.weekdayDescriptions) return "Hours not available";

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const currentDay = dayNames[new Date().getDay()];

    const currentDayDescription = this._hours.weekdayDescriptions.find((desc) =>
      desc.startsWith(currentDay)
    );

    return currentDayDescription || "Hours not available";
  }

  getFullSchedule(): string[] {
    return this._hours?.weekdayDescriptions || [];
  }

  toJSON(): types.Club {
    return {
      id: this._id,
      Name: this._name,
      Image: this._image,
      Rating: this._rating,
      hours: this._hours || undefined,
      latitude: 0,
      longitude: 0,
      Address: this._address,
      live_rating: this._live_rating,
      instagram_handle: this._instagram_handle,
    };
  }

  async addAppReview(
    userId: string,
    rating: number,
    musicGenre: string[],
    text: string
  ) {
    const { data, error } = await supabase
      .from("club_reviews")
      .insert([
        {
          club_id: this._id,
          user_id: userId,
          rating: rating,
          genres: musicGenre,
          review_text: text || "",
          like_ids: [],
        },
      ])
      .select();
    return { data, error };
  }

  async addAppReviewSimple(
    userId: string,
    rating: number,
    musicGenre: string[]
  ) {
    const { data, error } = await supabase
      .from("club_reviews")
      .insert([
        {
          club_id: this._id,
          user_id: userId,
          rating: rating,
          genres: musicGenre,
          review_text: null,
          like_ids: [],
        },
      ])
      .select();
    return { data, error };
  }

  async getLiveRating(): Promise<number> {
    try {
      if (!this._hours?.periods || this._hours.periods.length === 0) {
        return this._rating;
      }

      const now = new Date();
      const period = this.getCurrentPeriod();
      if (!period) return this._rating;

      // Construct open and close Date objects
      let openDate = new Date(now);
      let closeDate = new Date(now);
      openDate.setHours(period.open.hour, period.open.minute, 0, 0);
      closeDate.setHours(period.close.hour, period.close.minute, 0, 0);

      // If period spans midnight and now is after midnight but before close time, use yesterday for openDate
      if (closeDate <= openDate && now < closeDate) {
        openDate.setDate(openDate.getDate() - 1);
      }

      // Format openDate to match DB format: YYYY-MM-DD HH:mm:ss+00
      function toDbTimestamp(date: Date): string {
        // Pad helper
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
          date.getUTCDate()
        )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
          date.getUTCSeconds()
        )}+00`;
      }
      const openDbTimestamp = toDbTimestamp(openDate);

      // Get reviews from the current open period
      const { data: reviews, error } = await supabase
        .from("club_reviews")
        .select("rating, created_at")
        .eq("club_id", this._id)
        .gte("created_at", openDbTimestamp);
      if (error) {
        console.error("Error fetching reviews:", error);
        return this._rating;
      }
      if (!reviews || reviews.length === 0) {
        return this._rating;
      }

      // Calculate weighted average
      // Base rating has weight of 10
      const baseRatingWeight = 10;
      const baseRatingTotal = this._rating * baseRatingWeight;

      // Sum up all review ratings
      const reviewTotal = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );

      // Calculate final weighted average
      const totalWeight = baseRatingWeight + reviews.length;
      const weightedAverage = (baseRatingTotal + reviewTotal) / totalWeight;
      return Number(weightedAverage.toFixed(2));
    } catch (e) {
      console.error("Error calculating live rating:", e);
      return this._rating;
    }
  }

  getCurrentPeriod(): {
    open: { day: number; hour: number; minute: number };
    close: { day: number; hour: number; minute: number };
  } | null {
    if (!this._hours?.periods || this._hours.periods.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Convert a period's time into absolute minutes.
    const convertToAbsolute = (day: number, hour: number, minute: number) =>
      day * 1440 + hour * 60 + minute;

    // Check each period to see if current time falls within.
    for (let period of this._hours.periods) {
      let openAbs = convertToAbsolute(
        period.open.day,
        period.open.hour,
        period.open.minute
      );
      let closeAbs = convertToAbsolute(
        period.close.day,
        period.close.hour,
        period.close.minute
      );

      // If period spans midnight (or wraps to the next week), adjust closeAbs.
      if (closeAbs <= openAbs) {
        closeAbs += 7 * 1440;
      }

      // Convert current time to absolute minutes.
      let currentAbs = convertToAbsolute(
        currentDay,
        now.getHours(),
        now.getMinutes()
      );
      // If current time is before openAbs and the period spans midnight, add one week.
      if (currentAbs < openAbs) {
        currentAbs += 7 * 1440;
      }

      if (currentAbs >= openAbs && currentAbs < closeAbs) {
        return period;
      }
    }

    return null;
  }

  /**
   * Call this after instantiation to set the live_rating property asynchronously.
   * Usage: const club = new Club(data); await club.initLiveRating();
   */
  async initLiveRating() {
    this._live_rating = await this.getLiveRating();
  }
}
