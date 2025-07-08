"use client";

import { CheckCircle, Star, Plus } from "lucide-react";

interface SuccessScreenProps {
  onSubmitAnother: () => void;
}

export default function SuccessScreen({ onSubmitAnother }: SuccessScreenProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
      <div className="mb-6 sm:mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Thank You!
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4">
          Your review has been submitted successfully.
        </p>
        <p className="text-sm sm:text-base text-gray-500">
          Your feedback helps others discover great clubs!
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            What happens next?
          </h3>
        </div>
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
          <p>• Your review will be visible to other club-goers</p>
          <p>• It helps calculate real-time ratings for the club</p>
          <p>• Other users can see what music was playing</p>
          <p>• Crowd levels help people plan their night</p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={onSubmitAnother}
          className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 min-h-[56px] text-base"
        >
          <Plus className="w-5 h-5" />
          Submit Another Review
        </button>

        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-500 mb-2">
            Want to see all reviews and discover clubs?
          </p>
          <a
            href="#"
            className="text-purple-600 hover:text-purple-700 font-medium text-sm sm:text-base"
            onClick={(e) => {
              e.preventDefault();
              alert("This would link to the main app or website");
            }}
          >
            Download the full app →
          </a>
        </div>
      </div>
    </div>
  );
}
