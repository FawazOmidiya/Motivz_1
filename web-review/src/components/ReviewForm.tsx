"use client";

import { useState } from "react";
import { Star, Music, Users, Send } from "lucide-react";
import { Club, Review, CrowdLevel } from "@/types/club";
import { submitReview } from "@/lib/supabase";

interface ReviewFormProps {
  club: Club;
  onSubmit: () => void;
}

const GENRES = [
  "EDM",
  "HipHop",
  "Rock",
  "Pop",
  "House",
  "Jazz",
  "R&B",
  "Latin",
  "Top40",
  "90's",
  "2000's",
  "2010's",
  "Afrobeats",
  "Reggae",
  "Blues",
  "Soul",
  "Amapiano",
  "Country",
];

const CROWD_LEVELS: CrowdLevel[] = [
  {
    value: "empty",
    label: "Empty",
    icon: "👤",
    description: "Hardly anyone here",
  },
  {
    value: "quiet",
    label: "Quiet",
    icon: "👤",
    description: "A few people around",
  },
  {
    value: "moderate",
    label: "Moderate",
    icon: "👥",
    description: "Decent crowd",
  },
  { value: "busy", label: "Busy", icon: "👥", description: "Good energy" },
  {
    value: "packed",
    label: "Packed",
    icon: "👥",
    description: "Absolutely packed!",
  },
];

export default function ReviewForm({ club, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [crowdLevel, setCrowdLevel] = useState<string>("");
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return "Wack";
      case 2:
        return "Mid";
      case 3:
        return "It's okay";
      case 4:
        return "Kinda lit";
      case 5:
        return "It's bumping";
      default:
        return "Tap a star to rate";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      alert("Please select a rating 1–5.");
      return;
    }

    if (selectedGenres.length === 0) {
      alert("Please select at least one genre.");
      return;
    }

    if (!crowdLevel) {
      alert("Please select how full the place is.");
      return;
    }

    setSubmitting(true);

    try {
      const review: Review = {
        club_id: club.id,
        rating,
        genres: selectedGenres,
        review_text: reviewText.trim() || undefined,
        // crowd_level: crowdLevel as
        //   | "empty"
        //   | "quiet"
        //   | "moderate"
        //   | "busy"
        //   | "packed",
      };

      const { error } = await submitReview(review);

      if (error) {
        throw error;
      }

      onSubmit();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
        Rate Your Experience at {club.Name}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Rating Section */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-700">
            How would you rate {club.Name}?
          </label>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-1 sm:space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95 p-2"
                >
                  <Star
                    className={`w-10 h-10 sm:w-12 sm:h-12 ${
                      rating >= star
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-base sm:text-lg font-medium text-gray-600 text-center">
              {getRatingText(rating)}
            </p>
          </div>
        </div>
        X{/* Music Genres Section */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Music className="w-5 h-5" />
            What kind of music is being played?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => handleGenreToggle(genre)}
                className={`p-3 sm:p-3 rounded-lg border-2 transition-colors text-sm sm:text-base min-h-[48px] sm:min-h-[44px] ${
                  selectedGenres.includes(genre)
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        {/* Crowd Level Section */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Users className="w-5 h-5" />
            How full is the place?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3">
            {CROWD_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setCrowdLevel(level.value)}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-center min-h-[80px] sm:min-h-[100px] ${
                  crowdLevel === level.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">
                  {level.icon}
                </div>
                <div className="font-medium text-xs sm:text-sm">
                  {level.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {level.description}
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Review Text Section */}
        <div className="space-y-4">
          <label
            htmlFor="reviewText"
            className="block text-lg font-semibold text-gray-700"
          >
            Tell us about your experience (optional):
          </label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="How were the vibes? Any highlights or lowlights?"
            rows={4}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 text-black focus:ring-purple-500 focus:border-transparent resize-none text-base"
          />
        </div>
        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 min-h-[56px] text-base"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
