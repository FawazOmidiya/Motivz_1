import * as types from "./types";

const HALF_LIFE_MINUTES = 10;
const MINIMUM_THRESHOLD = 2.0;

interface MusicReview {
  id: string;
  club_id: string;
  schedule_id: string;
  user_id: string;
  music_genre: string;
  created_at: string;
}

interface MusicSchedule {
  id: string;
  club_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  genres: Record<string, number>;
  created_at: string;
}

export function calculateGenreScores(
  schedule: MusicSchedule,
  reviews: MusicReview[]
): Record<string, number> {
  // Start with the club's pre-assigned genre weights
  const scores: Record<string, number> = { ...schedule.genres };

  // Calculate total review weight
  let totalReviewWeight = 0;
  const now = new Date().getTime();

  reviews.forEach((review) => {
    const reviewTime = new Date(review.created_at).getTime();
    const minutesAgo = (now - reviewTime) / (1000 * 60);
    const weight = Math.pow(2, -minutesAgo / HALF_LIFE_MINUTES);
    totalReviewWeight += weight;

    if (review.music_genre && scores[review.music_genre] !== undefined) {
      scores[review.music_genre] += weight;
    }
  });

  // Only normalize if we've exceeded the threshold
  if (totalReviewWeight >= MINIMUM_THRESHOLD) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    Object.keys(scores).forEach((genre) => {
      scores[genre] = (scores[genre] / totalScore) * 100;
    });
  }

  return scores;
}

export function getTopGenres(
  scores: Record<string, number>,
  count: number = 3
): string[] {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([genre]) => genre);
}

// Helper function to find the current schedule period
export function findCurrentSchedule(
  schedules: MusicSchedule[]
): MusicSchedule | null {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  return (
    schedules.find((schedule) => {
      if (schedule.day_of_week !== currentDay) return false;

      const [startHour, startMinute] = schedule.start_time
        .split(":")
        .map(Number);
      const [endHour, endMinute] = schedule.end_time.split(":").map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Handle overnight schedules
      if (endMinutes <= startMinutes) {
        return currentTime >= startMinutes || currentTime < endMinutes;
      }

      return currentTime >= startMinutes && currentTime < endMinutes;
    }) || null
  );
}
