"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClubSearch from "@/components/ClubSearch";
import { Club } from "@/types/club";

export default function Home() {
  const router = useRouter();

  const handleClubSelect = (club: Club) => {
    // Navigate to the club-specific review page
    router.push(`/${club.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-yellow-400">★</span>
            Club Review
            <span className="text-yellow-400">★</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 px-2">
            Rate your night out and help others discover great clubs!
          </p>
        </header>

        <div className="max-w-md mx-auto">
          <ClubSearch onClubSelect={handleClubSelect} />
        </div>
      </div>
    </div>
  );
}
