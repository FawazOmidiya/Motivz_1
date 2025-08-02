"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ClubConfirmation from "@/components/ClubConfirmation";
import ReviewForm from "@/components/ReviewForm";
import SuccessScreen from "@/components/SuccessScreen";
import { Club } from "@/types/club";
import { getClubById } from "@/lib/supabase";

export default function ClubReviewPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clubId) {
      loadClub();
    }
  }, [clubId]);

  const loadClub = async () => {
    try {
      setLoading(true);
      const clubData = await getClubById(clubId);
      if (clubData) {
        setClub(clubData);
        setCurrentStep(2); // Start at confirmation step since club is already selected
      } else {
        setError("Club not found");
      }
    } catch (err) {
      console.error("Error loading club:", err);
      setError("Failed to load club information");
    } finally {
      setLoading(false);
    }
  };

  const handleClubConfirm = () => {
    setCurrentStep(3);
  };

  const handleBackToSearch = () => {
    router.push("/");
  };

  const handleReviewSubmit = () => {
    setCurrentStep(4);
  };

  const handleSubmitAnother = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-black">Loading club information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h2 className="text-xl font-bold text-black mb-4">
                Club Not Found
              </h2>
              <p className="text-black mb-6">
                {error || "The requested club could not be found."}
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Search for a Different Club
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-yellow-400">★</span>
            Review {club.Name}
            <span className="text-yellow-400">★</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 px-2">
            Rate your night out and help others discover great clubs!
          </p>
        </header>

        <div className="max-w-md mx-auto">
          {/* Progress Indicator - Mobile Optimized */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between px-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                      currentStep >= step
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-gray-600 text-gray-300"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                        currentStep > step ? "bg-yellow-400" : "bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs sm:text-sm text-gray-400 px-1">
              <span>Find</span>
              <span>Confirm</span>
              <span>Review</span>
              <span>Done</span>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 2 && (
            <ClubConfirmation
              club={club}
              onConfirm={handleClubConfirm}
              onBack={handleBackToSearch}
            />
          )}
          {currentStep === 3 && (
            <ReviewForm club={club} onSubmit={handleReviewSubmit} />
          )}
          {currentStep === 4 && (
            <SuccessScreen onSubmitAnother={handleSubmitAnother} />
          )}
        </div>
      </div>
    </div>
  );
}
