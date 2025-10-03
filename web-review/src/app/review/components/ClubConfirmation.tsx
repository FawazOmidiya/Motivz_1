"use client";

import { MapPin, Star, Clock, CheckCircle } from "lucide-react";
import { Club } from "../types/club";

interface ClubConfirmationProps {
  club: Club;
  onConfirm: () => void;
  onBack: () => void;
}

export default function ClubConfirmation({
  club,
  onConfirm,
  onBack,
}: ClubConfirmationProps) {
  const formatHours = (hours: Club["Hours"]) => {
    if (!hours?.periods || hours.periods.length === 0) {
      return "Hours not available";
    }

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const period = hours.periods[0];

    const openTime = `${period.open.hour
      .toString()
      .padStart(2, "0")}:${period.open.minute.toString().padStart(2, "0")}`;
    const closeTime = `${period.close.hour
      .toString()
      .padStart(2, "0")}:${period.close.minute.toString().padStart(2, "0")}`;

    return `${dayNames[period.open.day]} ${openTime} - ${
      dayNames[period.close.day]
    } ${closeTime}`;
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Very Good";
    if (rating >= 3.5) return "Good";
    if (rating >= 3.0) return "Average";
    return "Below Average";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
        Confirm Your Club
      </h2>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg sm:text-xl font-bold">
                {club.Name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 truncate">
              {club.Name}
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{club.Address}</span>
              </div>

              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                <span className="font-medium">{club.Rating.toFixed(1)}</span>
                <span className="text-gray-500">
                  ({getRatingText(club.Rating)})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{formatHours(club.Hours)}</span>
              </div>
            </div>
          </div>
        </div>

        {club.Description && (
          <div className="mt-4 p-3 bg-white rounded border-l-4 border-purple-500">
            <p className="text-sm text-gray-700">{club.Description}</p>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">
              Please Confirm
            </h4>
            <p className="text-sm text-yellow-700">
              Is this the club you&apos;re currently at? This helps ensure your
              review goes to the right place.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[44px]"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-base">Yes, this is the right club</span>
        </button>
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[56px] sm:min-h-[44px] text-base"
        >
          No, let me search again
        </button>
      </div>
    </div>
  );
}
