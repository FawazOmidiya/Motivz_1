"use client";

import { useState } from "react";
import { Search, MapPin, Star } from "lucide-react";
import { Club } from "@/types/club";
import { searchClubsByName } from "@/lib/supabase";

interface ClubSearchProps {
  onClubSelect: (club: Club) => void;
}

export default function ClubSearch({ onClubSelect }: ClubSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const results = await searchClubsByName(searchTerm);
      setClubs(results);
    } catch (error) {
      console.error("Search error:", error);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatHours = (hours: Club["Hours"]) => {
    if (!hours?.periods || hours.periods.length === 0) {
      return "Hours not available";
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const period = hours.periods[0]; // Show first period for simplicity

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
        Find Your Club
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for a club..."
            className="w-full pl-10 pr-4 py-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !searchTerm.trim()}
          className="px-6 py-4 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-base min-h-[56px] sm:min-h-[44px]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {searched && (
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Searching for clubs...</p>
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No clubs found. Try a different search term.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3 sm:mb-4 px-1">
                Found {clubs.length} club{clubs.length !== 1 ? "s" : ""}
              </p>
              {clubs.map((club) => (
                <div
                  key={club.id}
                  onClick={() => onClubSelect(club)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors active:bg-purple-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 mb-2 text-base truncate">
                        {club.Name}
                      </h3>
                      <div className="flex items-center text-gray-600 text-sm mb-2">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{club.Address}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current flex-shrink-0" />
                        <span className="font-medium">
                          {club.Rating.toFixed(1)}
                        </span>
                        <span className="mx-1">•</span>
                        <span className="truncate">
                          {formatHours(club.Hours)}
                        </span>
                      </div>
                    </div>
                    <div className="text-purple-600 ml-3 flex-shrink-0">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
