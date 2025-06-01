import { supabase } from "./supabaseService";

// Constants for the algorithm
const HALF_LIFE_DAYS = 30; // Reviews older than this have less weight
const MIN_REVIEWS_FOR_TRUST = 5; // Minimum reviews needed to establish trust
const MAX_TRUST_SCORE = 2.0; // Maximum trust multiplier
const MIN_TRUST_SCORE = 0.5; // Minimum trust multiplier

interface WeightedReview {
  id: string;
  club_id: string;
  user_id: string;
  review_type: "music" | "atmosphere" | "service" | "value";
  rating: number;
  weight: number;
  created_at: string;
}

interface UserTrustScore {
  user_id: string;
  trust_score: number;
  total_reviews: number;
  average_rating: number;
  consistency_score: number;
}

/**
 * Calculate the time decay factor for a review
 * Uses exponential decay based on review age
 */
function calculateTimeDecay(createdAt: string): number {
  const now = new Date().getTime();
  const reviewTime = new Date(createdAt).getTime();
  const daysOld = (now - reviewTime) / (1000 * 60 * 60 * 24);
  return Math.pow(2, -daysOld / HALF_LIFE_DAYS);
}

/**
 * Calculate consistency score based on rating variance
 * Lower variance = higher consistency = higher trust
 */
function calculateConsistencyScore(ratings: number[]): number {
  if (ratings.length < 2) return 1.0;

  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance =
    ratings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratings.length;
  const stdDev = Math.sqrt(variance);

  // Convert to a 0-1 score where 1 is most consistent
  return Math.max(0, 1 - stdDev / 2);
}

/**
 * Calculate user trust score based on their review history
 */
export async function calculateUserTrustScore(
  userId: string
): Promise<UserTrustScore> {
  const { data: reviews, error } = await supabase
    .from("weighted_reviews")
    .select("*")
    .eq("user_id", userId);

  if (error || !reviews) {
    throw new Error("Failed to fetch user reviews");
  }

  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      user_id: userId,
      trust_score: 1.0,
      total_reviews: 0,
      average_rating: 0,
      consistency_score: 1.0,
    };
  }

  const ratings = reviews.map((r) => r.rating);
  const averageRating = ratings.reduce((a, b) => a + b, 0) / totalReviews;
  const consistencyScore = calculateConsistencyScore(ratings);

  // Calculate trust score based on:
  // 1. Number of reviews (more reviews = more trust)
  // 2. Consistency of ratings
  // 3. Average rating (slightly favor users who give higher ratings)
  const reviewCountFactor = Math.min(totalReviews / MIN_REVIEWS_FOR_TRUST, 1);
  const trustScore = Math.min(
    MAX_TRUST_SCORE,
    Math.max(
      MIN_TRUST_SCORE,
      1 +
        reviewCountFactor * 0.5 +
        consistencyScore * 0.3 +
        (averageRating - 3) * 0.1
    )
  );

  return {
    user_id: userId,
    trust_score: trustScore,
    total_reviews: totalReviews,
    average_rating: averageRating,
    consistency_score: consistencyScore,
  };
}

/**
 * Calculate the final weight for a review
 */
export async function calculateReviewWeight(
  review: WeightedReview
): Promise<number> {
  const userTrust = await calculateUserTrustScore(review.user_id);
  const timeDecay = calculateTimeDecay(review.created_at);

  // Final weight is product of trust score and time decay
  return userTrust.trust_score * timeDecay;
}

/**
 * Update weights for all reviews
 * This should be run periodically (e.g., daily) to keep weights current
 */
export async function updateAllReviewWeights(): Promise<void> {
  const { data: reviews, error } = await supabase
    .from("weighted_reviews")
    .select("*");

  if (error || !reviews) {
    throw new Error("Failed to fetch reviews");
  }

  for (const review of reviews) {
    const newWeight = await calculateReviewWeight(review);
    await supabase
      .from("weighted_reviews")
      .update({ weight: newWeight })
      .eq("id", review.id);
  }
}

/**
 * Get weighted scores for a club
 */
export async function getClubWeightedScores(clubId: string) {
  const { data, error } = await supabase
    .from("club_weighted_scores")
    .select("*")
    .eq("club_id", clubId);

  if (error) {
    throw new Error("Failed to fetch club scores");
  }

  return data;
}
