import type { Metadata } from "next";
import { getClubBySlug } from "@/lib/supabase";

interface ClubLayoutProps {
  children: React.ReactNode;
  params: { clubSlug: string };
}

export async function generateMetadata({
  params,
}: ClubLayoutProps): Promise<Metadata> {
  try {
    const club = await getClubBySlug(await params.clubSlug);

    if (!club) {
      return {
        title: "Club Not Found - Club Review",
        description: "The requested club could not be found.",
      };
    }

    return {
      title: `Review ${club.Name} - Club Review`,
      description: `Rate your experience at ${club.Name}. Submit a review to help others discover great clubs!`,
      keywords: `club review, ${club.Name}, nightlife, music, rating, reviews`,
      openGraph: {
        title: `Review ${club.Name}`,
        description: `Rate your experience at ${club.Name}`,
        type: "website",
      },
    };
  } catch (error) {
    return {
      title: "Club Review - Rate Your Night Out",
      description: "Rate your night out and help others discover great clubs!",
    };
  }
}

export default function ClubLayout({ children }: ClubLayoutProps) {
  return children;
}
