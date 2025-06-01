import * as types from "./types";
import { fetchClubMusicSchedules } from "./supabaseService";

export class Club {
  private _id: string;
  private _name: string;
  private _image: string;
  private _rating: number;
  private _hours: types.RegularOpeningHours | null;
  private _musicSchedule: types.musicGenres | null;
  private _isLoaded: boolean;
  private _address: string;

  constructor(data: types.Club) {
    this._id = data.id;
    this._name = data.Name;
    this._image = data.Image;
    this._rating = data.Rating;
    this._hours = data.hours || null;
    this._musicSchedule = null;
    this._isLoaded = false;
    this._address = data.Address;
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

  // Methods
  async loadMusicSchedule(day: number): Promise<void> {
    if (!this._isLoaded) {
      this._musicSchedule = await fetchClubMusicSchedules(this._id, day);
      this._isLoaded = true;
    }
  }

  getTopGenres(): string {
    if (!this._musicSchedule) return "No music schedule";

    const genreEntries = Object.entries(this._musicSchedule)
      .filter(([_, value]) => typeof value === "number" && value > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));

    const topGenres = genreEntries.slice(0, 3).map(([genre]) => genre);
    return topGenres.length > 0 ? topGenres.join(", ") : "No music today";
  }

  isOpen(): boolean {
    try {
      if (!this._hours?.periods || this._hours.periods.length === 0)
        return false;

      const now = new Date();
      const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Convert a period's time into absolute minutes
      const convertToAbsolute = (day: number, hour: number, minute: number) =>
        day * 1440 + hour * 60 + minute;

      // Check each period to see if current time falls within
      for (let period of this._hours.periods) {
        if (!period.open || !period.close) continue; // Defensive: skip malformed periods
        if (!period.open.day || !period.open.hour || !period.open.minute)
          return false;
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
    };
  }
}
