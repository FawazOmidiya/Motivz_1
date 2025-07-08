"use client";

import { useState } from "react";
import ClubSearch from "@/components/ClubSearch";
import ClubConfirmation from "@/components/ClubConfirmation";
import ReviewForm from "@/components/ReviewForm";
import SuccessScreen from "@/components/SuccessScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Club } from "@/types/club";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const handleClubSelect = (club: Club) => {
    setSelectedClub(club);
    setCurrentStep(2);
  };

  const handleClubConfirm = () => {
    setCurrentStep(3);
  };

  const handleBackToSearch = () => {
    setSelectedClub(null);
    setCurrentStep(1);
  };

  const handleReviewSubmit = () => {
    setCurrentStep(4);
  };

  const handleSubmitAnother = () => {
    setSelectedClub(null);
    setCurrentStep(1);
  };

  return (
    <ErrorBoundary>
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
            {currentStep === 1 && (
              <ClubSearch onClubSelect={handleClubSelect} />
            )}
            {currentStep === 2 && selectedClub && (
              <ClubConfirmation
                club={selectedClub}
                onConfirm={handleClubConfirm}
                onBack={handleBackToSearch}
              />
            )}
            {currentStep === 3 && selectedClub && (
              <ReviewForm club={selectedClub} onSubmit={handleReviewSubmit} />
            )}
            {currentStep === 4 && (
              <SuccessScreen onSubmitAnother={handleSubmitAnother} />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
