"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, LogOut, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { club, logout } = useAuth();
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    configuredDays: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);

  // Use authenticated club ID
  const CLUB_ID = club?.id;

  useEffect(() => {
    if (CLUB_ID) {
      fetchStats();
    }
  }, [CLUB_ID]);

  const fetchStats = async () => {
    try {
      // Fetch upcoming events (events starting from today onwards)
      let upcomingEvents = 0;
      try {
        const today = new Date().toISOString().split("T")[0];
        const { data: events, error: eventsError } = await supabase
          .from("events")
          .select("id")
          .eq("club_id", CLUB_ID)
          .gte("start_date", today);

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
        } else {
          upcomingEvents = events?.length || 0;
        }
      } catch (error) {
        console.error("Error in events query:", error);
      }

      // Fetch club hours to count configured days
      let configuredDays = 0;
      try {
        const { data: clubData, error: hoursError } = await supabase
          .from("Clubs")
          .select("hours")
          .eq("id", CLUB_ID)
          .single();

        if (hoursError) {
          console.error("Error fetching club hours:", hoursError);
        } else if (clubData?.hours?.periods) {
          const daysWithPeriods = new Set();
          clubData.hours.periods.forEach(
            (period: { open: { day: number } }) => {
              daysWithPeriods.add(period.open.day);
            }
          );
          configuredDays = daysWithPeriods.size;
        }
      } catch (error) {
        console.error("Error in club hours query:", error);
      }

      // Fetch reviews count
      let reviewsCount = 0;
      try {
        const { data: reviews, error: reviewsError } = await supabase
          .from("club_reviews")
          .select("id")
          .eq("club_id", CLUB_ID);

        if (reviewsError) {
          console.error("Error fetching reviews:", reviewsError);
        } else {
          reviewsCount = reviews?.length || 0;
        }
      } catch (error) {
        console.error("Error in reviews query:", error);
        // Continue with 0 reviews if table doesn't exist
      }

      setStats({
        upcomingEvents,
        configuredDays,
        reviews: reviewsCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {club?.name || "Club Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Manage your club&apos;s events, music, and hours
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="flex items-center gap-2">
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={logout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Events Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Events
            </CardTitle>
            <CardDescription>Create and manage club events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href="/dashboard/events">View Events</Link>
              </Button>
              <Button asChild variant="outline" size="icon">
                <Link href="/dashboard/events/create">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Club Schedule Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Club Schedule
            </CardTitle>
            <CardDescription>
              Set operating hours and music genres for each day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href="/dashboard/schedule">Manage Schedule</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure hours and music genres together for each day of the week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {loading ? "..." : stats.upcomingEvents}
                </div>
                <div className="text-sm text-muted-foreground">
                  Upcoming Events
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {loading ? "..." : stats.configuredDays}
                </div>
                <div className="text-sm text-muted-foreground">
                  Days Configured
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {loading ? "..." : stats.reviews}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.reviews === 0 && !loading
                    ? "No Reviews Yet"
                    : "Reviews"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
