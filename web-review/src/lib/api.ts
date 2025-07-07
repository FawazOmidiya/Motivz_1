import { Review } from "@/types/club";

export const submitReviewViaAPI = async (review: Review) => {
  try {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(review),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit review");
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error submitting review via API:", error);
    return { data: null, error };
  }
};
