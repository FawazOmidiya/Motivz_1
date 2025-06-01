import { Club } from "@/app/utils/Club";
import * as types from "@/app/utils/types";
import { fetchClubMusicSchedules } from "../app/utils/supabaseService";

// Mock the supabase service
jest.mock("@/app/utils/supabaseService", () => ({
  fetchClubMusicSchedules: jest.fn(),
}));

describe("Club", () => {
  const mockClubData: types.Club = {
    id: "123",
    Name: "Test Club",
    Image: "https://example.com/image.jpg",
    Rating: 4.5,
    hours: {
      openNow: true,
      periods: [
        {
          open: { day: 1, hour: 9, minute: 0 }, // Monday 9:00 AM
          close: { day: 1, hour: 23, minute: 0 }, // Monday 11:00 PM
        },
        {
          open: { day: 2, hour: 9, minute: 0 }, // Tuesday 9:00 AM
          close: { day: 2, hour: 23, minute: 0 }, // Tuesday 11:00 PM
        },
        {
          open: { day: 5, hour: 22, minute: 0 }, // Friday 10:00 PM
          close: { day: 6, hour: 2, minute: 0 }, // Saturday 2:00 AM
        },
      ],
      weekdayDescriptions: [
        "Monday: 9:00 AM – 11:00 PM",
        "Tuesday: 9:00 AM – 11:00 PM",
        "Wednesday: Closed",
        "Thursday: Closed",
        "Friday: 10:00 PM – 2:00 AM",
        "Saturday: Closed",
        "Sunday: Closed",
      ],
    },
    latitude: 0,
    longitude: 0,
    Address: "123 Test St",
  };

  let club: Club;

  beforeEach(() => {
    club = new Club(mockClubData);
    jest.clearAllMocks();
  });

  describe("Constructor and Getters", () => {
    it("should initialize with correct data", () => {
      expect(club.id).toBe("123");
      expect(club.name).toBe("Test Club");
      expect(club.image).toBe("https://example.com/image.jpg");
      expect(club.rating).toBe(4.5);
      expect(club.hours).toEqual(mockClubData.hours);
      expect(club.musicSchedule).toBeNull();
      expect(club.isLoaded).toBe(false);
    });
  });

  describe("isOpen", () => {
    it("should return false if hours data is not available", () => {
      const clubWithoutHours = new Club({ ...mockClubData, hours: undefined });
      expect(clubWithoutHours.isOpen()).toBe(false);
    });

    it("should handle normal operating hours correctly", () => {
      // Mock current time to Monday 10:00 AM
      jest.useFakeTimers().setSystemTime(new Date("2024-01-01T10:00:00"));
      expect(club.isOpen()).toBe(true);

      // Mock current time to Monday 11:30 PM
      jest.useFakeTimers().setSystemTime(new Date("2024-01-01T23:30:00"));
      expect(club.isOpen()).toBe(false);
    });

    it("should handle hours past midnight correctly", () => {
      // Mock current time to Friday 11:00 PM
      jest.useFakeTimers().setSystemTime(new Date("2024-01-05T23:00:00"));
      expect(club.isOpen()).toBe(true);

      // Mock current time to Saturday 1:00 AM
      jest.useFakeTimers().setSystemTime(new Date("2024-01-06T01:00:00"));
      expect(club.isOpen()).toBe(true);

      // Mock current time to Saturday 3:00 AM
      jest.useFakeTimers().setSystemTime(new Date("2024-01-06T03:00:00"));
      expect(club.isOpen()).toBe(false);
    });
  });

  describe("getCurrentDayHours", () => {
    it("should return correct hours for current day", () => {
      // Mock current time to Monday
      jest.useFakeTimers().setSystemTime(new Date("2024-01-01T10:00:00"));
      expect(club.getCurrentDayHours()).toBe("Monday: 9:00 AM – 11:00 PM");
    });

    it('should return "Hours not available" if weekdayDescriptions is missing', () => {
      const clubWithoutDescriptions = new Club({
        ...mockClubData,
        hours: { ...mockClubData.hours!, weekdayDescriptions: undefined },
      });
      expect(clubWithoutDescriptions.getCurrentDayHours()).toBe(
        "Hours not available"
      );
    });
  });

  describe("getFullSchedule", () => {
    it("should return all weekday descriptions", () => {
      expect(club.getFullSchedule()).toEqual(
        mockClubData.hours!.weekdayDescriptions
      );
    });

    it("should return empty array if hours data is missing", () => {
      const clubWithoutHours = new Club({ ...mockClubData, hours: undefined });
      expect(clubWithoutHours.getFullSchedule()).toEqual([]);
    });
  });

  describe("loadMusicSchedule", () => {
    const mockMusicSchedule = {
      EDM: 0.8,
      HipHop: 0.6,
      Rock: 0.4,
    };

    beforeEach(() => {
      (fetchClubMusicSchedules as jest.Mock).mockResolvedValue(
        mockMusicSchedule
      );
    });

    it("should load music schedule for a specific day", async () => {
      await club.loadMusicSchedule(1); // Monday
      expect(fetchClubMusicSchedules).toHaveBeenCalledWith("123", 1);
      expect(club.musicSchedule).toEqual(mockMusicSchedule);
      expect(club.isLoaded).toBe(true);
    });

    it("should not reload schedule if already loaded", async () => {
      await club.loadMusicSchedule(1);
      await club.loadMusicSchedule(1);
      expect(fetchClubMusicSchedules).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTopGenres", () => {
    it("should return top 3 genres sorted by value", async () => {
      await club.loadMusicSchedule(1);
      expect(club.getTopGenres()).toBe("EDM, HipHop, Rock");
    });

    it('should return "No music schedule" if schedule is not loaded', () => {
      expect(club.getTopGenres()).toBe("No music schedule");
    });

    it('should return "No music today" if no genres have positive values', async () => {
      (fetchClubMusicSchedules as jest.Mock).mockResolvedValue({
        EDM: 0,
        HipHop: 0,
        Rock: 0,
      });
      await club.loadMusicSchedule(1);
      expect(club.getTopGenres()).toBe("No music today");
    });
  });

  describe("toJSON", () => {
    it("should return correct JSON representation", () => {
      const json = club.toJSON();
      expect(json).toEqual({
        id: "123",
        Name: "Test Club",
        Image: "https://example.com/image.jpg",
        Rating: 4.5,
        hours: mockClubData.hours,
        latitude: 0,
        longitude: 0,
        Address: "123 Test St",
      });
    });
  });
});
