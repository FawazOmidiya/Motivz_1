"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ClubConfirmation from "../components/ClubConfirmation";
import ReviewForm from "../components/ReviewForm";
import SuccessScreen from "../components/SuccessScreen";
import { Club } from "../types/club";
import { getClubById } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star } from "lucide-react";

export default function ClubReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubId = (params.clubId as string) || searchParams.get("clubId");

  const [currentStep, setCurrentStep] = useState(1);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Club[]>([]);
  const [searching, setSearching] = useState(false);

  const loadClub = useCallback(async () => {
    if (!clubId) return;

    try {
      setLoading(true);
      const clubData = await getClubById(clubId);
      if (clubData) {
        setClub(clubData);
        setCurrentStep(2); // Skip to confirmation step
      } else {
        setError("Club not found");
      }
    } catch {
      setError("Failed to load club information");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  // If we have a clubId, load that club directly
  useEffect(() => {
    if (clubId) {
      loadClub();
    } else {
      setLoading(false);
    }
  }, [clubId, loadClub]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearching(true);
    try {
      // This would typically search your database
      // For now, we'll use mock data
      const mockResults: Club[] = [
        {
          id: "demo-1",
          Name: "Club XYZ",
          Address: "123 Main St, City",
          Rating: 4.5,
          Image: undefined,
        },
        {
          id: "demo-2",
          Name: "Venue ABC",
          Address: "456 Oak Ave, City",
          Rating: 4.2,
          Image: undefined,
        },
      ];
      setSearchResults(mockResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleClubSelect = (selectedClub: Club) => {
    setClub(selectedClub);
    setCurrentStep(2);
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(1);
    setClub(null);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading club information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Step 1: Club Selection (if no clubId provided)
  if (currentStep === 1 && !clubId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                Leave a Review
              </h1>
              <p className="text-gray-300">
                Share your experience at your favorite venues
              </p>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Find Your Venue</CardTitle>
                <CardDescription className="text-gray-300">
                  Search for the club, bar, or venue you want to review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search for clubs, bars, venues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  <Button
                    onClick={() => handleSearch(searchQuery)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={!searchQuery.trim() || searching}
                  >
                    {searching ? "Searching..." : "Search"}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-semibold text-white">Search Results</h3>
                    {searchResults.map((result) => (
                      <Card
                        key={result.id}
                        className="cursor-pointer hover:bg-gray-800 bg-gray-800 border-gray-700"
                        onClick={() => handleClubSelect(result)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">
                                {result.Name}
                              </h4>
                              <p className="text-sm text-gray-300 flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {result.Address}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                <Star className="w-3 h-3 mr-1" />
                                {result.Rating || "New"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Demo clubs for testing */}
                <div className="mt-6">
                  <h3 className="font-semibold text-white mb-3">
                    Popular Venues
                  </h3>
                  <div className="space-y-3">
                    <Card
                      className="cursor-pointer hover:bg-gray-800 bg-gray-800 border-gray-700"
                      onClick={() =>
                        handleClubSelect({
                          id: "demo-1",
                          Name: "Club XYZ",
                          Address: "123 Main St, City",
                          Rating: 4.5,
                          Image: undefined,
                        } as Club)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-white">
                              Club XYZ
                            </h4>
                            <p className="text-sm text-gray-300 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              123 Main St, City
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              <Star className="w-3 h-3 mr-1" />
                              4.5
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:bg-gray-800 bg-gray-800 border-gray-700"
                      onClick={() =>
                        handleClubSelect({
                          id: "demo-2",
                          Name: "Venue ABC",
                          Address: "456 Oak Ave, City",
                          Rating: 4.2,
                          Image: undefined,
                        } as Club)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-white">
                              Venue ABC
                            </h4>
                            <p className="text-sm text-gray-300 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              456 Oak Ave, City
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              <Star className="w-3 h-3 mr-1" />
                              4.2
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Club Confirmation
  if (currentStep === 2 && club) {
    return (
      <ClubConfirmation
        club={club}
        onConfirm={handleNext}
        onBack={handleBack}
      />
    );
  }

  // Step 3: Review Form
  if (currentStep === 3 && club) {
    return <ReviewForm club={club} onSubmit={handleNext} />;
  }

  // Step 4: Success Screen
  if (currentStep === 4) {
    return <SuccessScreen onSubmitAnother={handleComplete} />;
  }

  return null;
}
