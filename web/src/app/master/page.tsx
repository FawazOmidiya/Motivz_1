"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MasterAuth from "@/components/MasterAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarIcon,
  Users,
  Clock,
  // Music,
  Settings,
  Eye,
  Edit,
  CheckCircle,
  Plus,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Flame,
  // AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types/event";
import { MUSIC_GENRES, CROWD_PREFERENCES, NIGHTLIFE_GOALS } from "@/Constants";
// import { cn } from "@/lib/utils";

interface Club {
  id: string;
  Name: string;
  Address: string;
  Image?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  description?: string;
  hours?: Record<string, unknown>;
  music_schedule?: Record<string, unknown>;
  Rating?: number;
  Tags?: string[];
}

interface GuestlistRequest {
  id: string;
  event_id: string;
  club_id: string;
  user_id: string;
  group_name: string;
  men_count: number;
  women_count: number;
  total_count: number;
  wants_table: boolean;
  status: "pending" | "contacted" | "handled";
  notes?: string;
  created_at: string;
  event_title?: string;
  club_name?: string;
}

export default function MasterDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [guestlistRequests, setGuestlistRequests] = useState<
    GuestlistRequest[]
  >([]);

  // Sorting state
  const [sortBy, setSortBy] = useState<"date" | "club">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Search state
  const [clubSearchQuery, setClubSearchQuery] = useState("");

  // Notification state
  // const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationResult, setNotificationResult] = useState<string | null>(
    null
  );
  const [notificationType, setNotificationType] = useState<
    "all" | "specific" | "targeted"
  >("all");
  const [specificUserId, setSpecificUserId] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<
    {
      id: string;
      username: string;
      first_name: string;
      last_name: string;
      push_token: string | null;
    }[]
  >([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Targeted notification preferences
  const [selectedMusicGenres, setSelectedMusicGenres] = useState<string[]>([]);
  const [selectedCrowdPreferences, setSelectedCrowdPreferences] = useState<
    string[]
  >([]);
  const [selectedNightlifeGoals, setSelectedNightlifeGoals] = useState<
    string[]
  >([]);
  const [targetedUserIds, setTargetedUserIds] = useState<string[]>([]);
  const [loadingTargetedUsers, setLoadingTargetedUsers] = useState(false);
  // const [selectedClub, setSelectedClub] = useState<string>("");
  // const [selectedEvent, setSelectedEvent] = useState<string>("");

  // Guestlist management state
  const [selectedRequest, setSelectedRequest] =
    useState<GuestlistRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  // Club management state
  const [showAddClubDialog, setShowAddClubDialog] = useState(false);
  const [showDeleteClubDialog, setShowDeleteClubDialog] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<string | null>(null);
  const [newClub, setNewClub] = useState({
    Name: "",
    Address: "",
    Image: "",
    Rating: null as number | null,
    latitude: null as number | null,
    longitude: null as number | null,
    Tags: [] as string[],
    current_music: [] as string[],
    google_id: "",
    hours: {
      periods: [],
      weekdayDescriptions: [
        "Monday: Closed",
        "Tuesday: Closed",
        "Wednesday: Closed",
        "Thursday: Closed",
        "Friday: Closed",
        "Saturday: Closed",
        "Sunday: Closed",
      ],
    },
    website: "",
    instagram_handle: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchClubs(),
        fetchEvents(),
        fetchGuestlistRequests(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if already authenticated
    const isAuth = sessionStorage.getItem("master_authenticated") === "true";
    setIsAuthenticated(isAuth);

    if (isAuth) {
      fetchData();
    }
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    fetchData();
  };

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("Clubs")
        .select("*")
        .order("Name");

      if (error) {
        console.error("Supabase error fetching clubs:", error);
        throw error;
      }
      console.log("Clubs fetched successfully:", data?.length || 0, "clubs");
      setClubs(data || []);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          Clubs!inner(Name)
        `
        )
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Supabase error fetching events:", error);
        throw error;
      }

      const now = new Date();
      const currentEventsList = (data || []).filter(
        (event) => new Date(event.end_date) >= now
      );
      const pastEventsList = (data || []).filter(
        (event) => new Date(event.end_date) < now
      );

      console.log("Events fetched successfully:", data?.length || 0, "events");
      setEvents(data || []);
      setCurrentEvents(currentEventsList);
      setPastEvents(pastEventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Filter and sort events based on current settings
  const getFilteredAndSortedEvents = (eventsList: Event[]) => {
    // First, filter by club name if search query exists
    let filtered = [...eventsList];

    if (clubSearchQuery.trim()) {
      filtered = filtered.filter((event) => {
        const clubName =
          (event as Event & { Clubs?: { Name: string } }).Clubs?.Name || "";
        return clubName.toLowerCase().includes(clubSearchQuery.toLowerCase());
      });
    }

    // Then sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === "club") {
        const clubA =
          (a as Event & { Clubs?: { Name: string } }).Clubs?.Name || "";
        const clubB =
          (b as Event & { Clubs?: { Name: string } }).Clubs?.Name || "";
        comparison = clubA.localeCompare(clubB);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  // Handle sort column click
  const handleSort = (column: "date" | "club") => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column and default to ascending
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Toggle trending status for an event
  const toggleTrending = async (eventId: string, currentTrending: boolean) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ trending: !currentTrending })
        .eq("id", eventId);

      if (error) {
        console.error("Error updating trending status:", error);
        alert("Failed to update trending status");
        return;
      }

      // Update local state
      setCurrentEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, trending: !currentTrending }
            : event
        )
      );
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, trending: !currentTrending }
            : event
        )
      );
    } catch (error) {
      console.error("Error toggling trending:", error);
      alert("Failed to update trending status");
    }
  };

  const fetchGuestlistRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("guestlist_requests")
        .select(
          `
          *,
          events!inner(title, Clubs!inner(Name))
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error fetching guestlist requests:", error);
        throw error;
      }

      // Transform the data to include event and club names
      const transformedData = (data || []).map(
        (
          request: GuestlistRequest & {
            events?: { title: string; Clubs?: { Name: string } };
          }
        ) => ({
          ...request,
          event_title: request.events?.title,
          club_name: request.events?.Clubs?.Name,
        })
      );

      console.log(
        "Guestlist requests fetched successfully:",
        transformedData?.length || 0,
        "requests"
      );
      setGuestlistRequests(transformedData);
    } catch (error) {
      console.error("Error fetching guestlist requests:", error);
    }
  };

  const updateGuestlistRequestStatus = async (
    requestId: string,
    status: string
  ) => {
    try {
      const { error } = await supabase
        .from("guestlist_requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;

      fetchGuestlistRequests();
      setShowRequestDetails(false);
    } catch (error) {
      console.error("Error updating request status:", error);
      alert("Failed to update request status");
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, first_name, last_name, push_token")
        .or(
          `username.ilike.%${query}%, first_name.ilike.%${query}%, last_name.ilike.%${query}%`
        )
        .limit(10);

      if (error) {
        console.error("Error searching users:", error);
        setUserSearchResults([]);
      } else {
        setUserSearchResults(data || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setUserSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Fetch and filter users based on selected preferences
  const fetchTargetedUsers = useCallback(async () => {
    if (
      selectedMusicGenres.length === 0 &&
      selectedCrowdPreferences.length === 0 &&
      selectedNightlifeGoals.length === 0
    ) {
      setTargetedUserIds([]);
      return;
    }

    setLoadingTargetedUsers(true);
    try {
      // Fetch all users with push tokens (notifications enabled) and their preferences
      const { data: allUsers, error } = await supabase
        .from("profiles")
        .select(
          "id, favorite_music, crowd_preferences, nightlife_goals, push_token"
        )
        .not("push_token", "is", null)
        .neq("push_token", "Notification Permission not granted");

      if (error) {
        throw new Error(error.message);
      }

      if (!allUsers || allUsers.length === 0) {
        setTargetedUserIds([]);
        return;
      }

      // Filter users based on selected preferences
      const filteredUsers = allUsers.filter((user) => {
        // Check if user matches at least one preference
        let matches = false;

        // Check music genres
        if (
          selectedMusicGenres.length > 0 &&
          user.favorite_music &&
          Array.isArray(user.favorite_music)
        ) {
          const hasMatchingGenre = selectedMusicGenres.some((genre) =>
            user.favorite_music.includes(genre)
          );
          if (hasMatchingGenre) matches = true;
        }

        // Check crowd preferences
        if (
          selectedCrowdPreferences.length > 0 &&
          user.crowd_preferences &&
          Array.isArray(user.crowd_preferences)
        ) {
          const hasMatchingCrowd = selectedCrowdPreferences.some((pref) =>
            user.crowd_preferences.includes(pref)
          );
          if (hasMatchingCrowd) matches = true;
        }

        // Check nightlife goals
        if (
          selectedNightlifeGoals.length > 0 &&
          user.nightlife_goals &&
          Array.isArray(user.nightlife_goals)
        ) {
          const hasMatchingGoal = selectedNightlifeGoals.some((goal) =>
            user.nightlife_goals.includes(goal)
          );
          if (hasMatchingGoal) matches = true;
        }

        return matches;
      });

      setTargetedUserIds(filteredUsers.map((user) => user.id));
    } catch (error) {
      console.error("Error fetching targeted users:", error);
      setTargetedUserIds([]);
    } finally {
      setLoadingTargetedUsers(false);
    }
  }, [selectedMusicGenres, selectedCrowdPreferences, selectedNightlifeGoals]);

  // Update targeted users when preferences change
  useEffect(() => {
    if (notificationType === "targeted") {
      fetchTargetedUsers();
    } else {
      setTargetedUserIds([]);
    }
  }, [notificationType, fetchTargetedUsers]);

  const sendPushNotification = async () => {
    if (sendingNotification) {
      console.log("Notification already being sent, ignoring duplicate call");
      return;
    }

    if (!notificationTitle.trim() || !notificationBody.trim()) {
      setNotificationResult("Please fill in both title and message");
      return;
    }

    if (notificationType === "specific" && !specificUserId.trim()) {
      setNotificationResult("Please select a specific user");
      return;
    }

    if (notificationType === "targeted") {
      if (
        selectedMusicGenres.length === 0 &&
        selectedCrowdPreferences.length === 0 &&
        selectedNightlifeGoals.length === 0
      ) {
        setNotificationResult(
          "Please select at least one preference for targeted notifications"
        );
        return;
      }

      if (targetedUserIds.length === 0) {
        setNotificationResult(
          "No users found matching the selected preferences"
        );
        return;
      }
    }

    console.log("Sending notification:", {
      title: notificationTitle,
      body: notificationBody,
    });
    setSendingNotification(true);
    setNotificationResult(null);

    try {
      let totalSent = 0;
      let errors: string[] = [];

      if (notificationType === "targeted") {
        // Send notification to each targeted user individually
        for (const userId of targetedUserIds) {
          try {
            const { data, error } = await supabase.functions.invoke(
              "send-push-notification",
              {
                body: {
                  title: notificationTitle,
                  body: notificationBody,
                  userId: userId,
                  sendToAll: false,
                },
              }
            );

            if (error) {
              errors.push(`User ${userId}: ${error.message}`);
            } else if (data?.error) {
              errors.push(`User ${userId}: ${data.error}`);
            } else {
              totalSent += data?.totalSent || 1;
            }
          } catch (err) {
            errors.push(
              `User ${userId}: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            );
          }
        }

        if (errors.length > 0) {
          setNotificationResult(
            `⚠️ Sent to ${totalSent} users, but ${
              errors.length
            } failed: ${errors.slice(0, 3).join(", ")}${
              errors.length > 3 ? "..." : ""
            }`
          );
        } else {
          setNotificationResult(
            `✅ Successfully sent notification to ${totalSent} targeted user${
              totalSent !== 1 ? "s" : ""
            }`
          );
        }
      } else {
        // Original behavior for "all" or "specific"
        const { data, error } = await supabase.functions.invoke(
          "send-push-notification",
          {
            body: {
              title: notificationTitle,
              body: notificationBody,
              userId: notificationType === "specific" ? specificUserId : null,
              sendToAll: notificationType === "all",
            },
          }
        );

        if (error) {
          throw new Error(error.message || "Failed to send notification");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setNotificationResult(
          `✅ ${data?.message || "Notification sent successfully"}`
        );
      }

      // Clear form
      setNotificationTitle("");
      setNotificationBody("");
      setSpecificUserId("");
      setUserSearchResults([]);
      setSelectedMusicGenres([]);
      setSelectedCrowdPreferences([]);
      setSelectedNightlifeGoals([]);
      setTargetedUserIds([]);
    } catch (error) {
      console.error("Error sending notification:", error);
      setNotificationResult(
        `❌ Failed to send notification: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSendingNotification(false);
    }
  };

  // Club management functions
  const addClub = async () => {
    if (!newClub.Name.trim() || !newClub.Address.trim()) {
      alert("Please fill in at least club name and address");
      return;
    }

    try {
      const { error } = await supabase.from("Clubs").insert([newClub]).select();

      if (error) {
        throw new Error(error.message);
      }

      // Refresh clubs list
      await fetchClubs();

      // Reset form and close dialog
      setNewClub({
        Name: "",
        Address: "",
        Image: "",
        Rating: null,
        latitude: null,
        longitude: null,
        Tags: [],
        current_music: [],
        google_id: "",
        hours: {
          periods: [],
          weekdayDescriptions: [
            "Monday: Closed",
            "Tuesday: Closed",
            "Wednesday: Closed",
            "Thursday: Closed",
            "Friday: Closed",
            "Saturday: Closed",
            "Sunday: Closed",
          ],
        },
        website: "",
        instagram_handle: "",
      });
      setShowAddClubDialog(false);

      alert("Club added successfully!");
    } catch (error) {
      console.error("Error adding club:", error);
      alert(
        `Failed to add club: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const deleteClub = async (clubId: string) => {
    if (!clubId) return;

    try {
      const { error } = await supabase.from("Clubs").delete().eq("id", clubId);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh clubs list
      await fetchClubs();

      // Close dialog and reset state
      setShowDeleteClubDialog(false);
      setClubToDelete(null);

      alert("Club deleted successfully!");
    } catch (error) {
      console.error("Error deleting club:", error);
      alert(
        `Failed to delete club: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteClick = (clubId: string) => {
    setClubToDelete(clubId);
    setShowDeleteClubDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            Pending
          </Badge>
        );
      case "contacted":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Contacted
          </Badge>
        );
      case "handled":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Handled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return <MasterAuth onAuthenticated={handleAuthenticated} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading master dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/events"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Club Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Master Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Complete control over all clubs, events, and guestlist requests
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Events</span>
              <span className="sm:hidden">Events</span>
            </TabsTrigger>
            <TabsTrigger value="guestlist" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Guestlist Requests</span>
              <span className="sm:hidden">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="clubs" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Club Management</span>
              <span className="sm:hidden">Clubs</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-xs sm:text-sm py-2"
            >
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Push</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Clubs
                  </CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clubs.length}</div>
                  <p className="text-xs text-muted-foreground">Active venues</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Events
                  </CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {
                      events.filter((e) => new Date(e.start_date) > new Date())
                        .length
                    }{" "}
                    upcoming
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Requests
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      guestlistRequests.filter((r) => r.status === "pending")
                        .length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {guestlistRequests.length} total requests
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recurring Events
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {events.filter((e) => e.recurring_config).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automated events
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Recent Events
                  </CardTitle>
                  <CardDescription>
                    Latest events across all clubs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {events.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2 sm:gap-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {
                              (event as Event & { Clubs?: { Name: string } })
                                .Clubs?.Name
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(
                              parseISO(event.start_date),
                              "MMM dd, yyyy 'at' h:mm a"
                            )}
                          </p>
                          {event.caption && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {event.caption}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">
                            {event.guestlist_available
                              ? "Guestlist"
                              : "Tickets"}
                          </Badge>
                          {event.recurring_config && (
                            <Badge variant="secondary" className="text-xs">
                              Recurring
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Recent Guestlist Requests
                  </CardTitle>
                  <CardDescription>
                    Latest requests requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {guestlistRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0"
                      >
                        <div>
                          <p className="font-medium">{request.group_name}</p>
                          <p className="text-sm text-gray-500">
                            {request.total_count} people • {request.club_name}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Event Management
              </h2>
              <Button
                onClick={() => router.push("/master/events/create")}
                size="sm"
                className="w-full sm:w-auto"
              >
                Create Event
              </Button>
            </div>

            {/* Search by Club Name */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Label htmlFor="club-search">Search by Club Name</Label>
                    <Input
                      id="club-search"
                      placeholder="Type club name to filter events..."
                      value={clubSearchQuery}
                      onChange={(e) => setClubSearchQuery(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  {clubSearchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setClubSearchQuery("")}
                      className="mt-6 sm:mt-0"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current/Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Current & Upcoming Events</CardTitle>
                <CardDescription>
                  {clubSearchQuery
                    ? `Showing ${
                        getFilteredAndSortedEvents(currentEvents).length
                      } of ${currentEvents.length} events`
                    : `Active events across all clubs (${currentEvents.length} total)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">
                          Event Title
                        </TableHead>
                        <TableHead
                          className="min-w-[120px] cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("club")}
                        >
                          <div className="flex items-center gap-1">
                            Club
                            {sortBy === "club" ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="min-w-[100px] cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            {sortBy === "date" ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[80px]">Type</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAndSortedEvents(currentEvents).map(
                        (event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">
                              {event.title}
                            </TableCell>
                            <TableCell>
                              {
                                (event as Event & { Clubs?: { Name: string } })
                                  .Clubs?.Name
                              }
                            </TableCell>
                            <TableCell>
                              {format(
                                parseISO(event.start_date),
                                "MMM dd, yyyy"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline">
                                  {event.guestlist_available
                                    ? "Guestlist"
                                    : "Tickets"}
                                </Badge>
                                {event.recurring_config && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Recurring
                                  </Badge>
                                )}
                                {event.trending && (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-orange-500"
                                  >
                                    <Flame className="h-3 w-3 mr-1" />
                                    Trending
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/master/events/${event.id}/edit`
                                    )
                                  }
                                  className="text-xs"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                  variant={
                                    event.trending ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    toggleTrending(
                                      event.id,
                                      event.trending || false
                                    )
                                  }
                                  className={`text-xs ${
                                    event.trending
                                      ? "bg-orange-500 hover:bg-orange-600"
                                      : ""
                                  }`}
                                >
                                  <Flame className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="hidden sm:inline">
                                    {event.trending
                                      ? "Trending"
                                      : "Mark Trending"}
                                  </span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/master/events/create?duplicate=${event.id}`
                                    )
                                  }
                                  className="text-xs"
                                >
                                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="hidden sm:inline">
                                    Duplicate
                                  </span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Past Events */}
            <Card>
              <CardHeader>
                <CardTitle>Past Events</CardTitle>
                <CardDescription>
                  {clubSearchQuery
                    ? `Showing ${
                        getFilteredAndSortedEvents(pastEvents).length
                      } of ${pastEvents.length} events`
                    : `Completed events for reference (${pastEvents.length} total)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">
                          Event Title
                        </TableHead>
                        <TableHead
                          className="min-w-[120px] cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("club")}
                        >
                          <div className="flex items-center gap-1">
                            Club
                            {sortBy === "club" ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="min-w-[100px] cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            {sortBy === "date" ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[80px]">Type</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAndSortedEvents(pastEvents).map((event) => (
                        <TableRow key={event.id} className="opacity-60">
                          <TableCell className="font-medium">
                            {event.title}
                          </TableCell>
                          <TableCell>
                            {
                              (event as Event & { Clubs?: { Name: string } })
                                .Clubs?.Name
                            }
                          </TableCell>
                          <TableCell>
                            {format(parseISO(event.start_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline">
                                {event.guestlist_available
                                  ? "Guestlist"
                                  : "Tickets"}
                              </Badge>
                              {event.recurring_config && (
                                <Badge variant="secondary" className="text-xs">
                                  Recurring
                                </Badge>
                              )}
                              {event.trending && (
                                <Badge
                                  variant="default"
                                  className="text-xs bg-orange-500"
                                >
                                  <Flame className="h-3 w-3 mr-1" />
                                  Trending
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/master/events/${event.id}/edit`)
                                }
                                className="text-xs"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                variant={event.trending ? "default" : "outline"}
                                size="sm"
                                onClick={() =>
                                  toggleTrending(
                                    event.id,
                                    event.trending || false
                                  )
                                }
                                className={`text-xs ${
                                  event.trending
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : ""
                                }`}
                              >
                                <Flame className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">
                                  {event.trending
                                    ? "Trending"
                                    : "Mark Trending"}
                                </span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/master/events/create?duplicate=${event.id}`
                                  )
                                }
                                className="text-xs"
                              >
                                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">
                                  Duplicate
                                </span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guestlist Requests Tab */}
          <TabsContent value="guestlist" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Guestlist Requests
              </h2>
              <Button
                onClick={fetchGuestlistRequests}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Guestlist Requests</CardTitle>
                <CardDescription>
                  Manage guestlist requests from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Group</TableHead>
                        <TableHead className="min-w-[150px]">Event</TableHead>
                        <TableHead className="min-w-[120px]">Club</TableHead>
                        <TableHead className="min-w-[100px]">People</TableHead>
                        <TableHead className="min-w-[80px]">Table</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Date</TableHead>
                        <TableHead className="min-w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guestlistRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.group_name}
                          </TableCell>
                          <TableCell>{request.event_title}</TableCell>
                          <TableCell>{request.club_name}</TableCell>
                          <TableCell>
                            {request.men_count}M / {request.women_count}W
                            <br />
                            <span className="text-sm text-gray-500">
                              ({request.total_count} total)
                            </span>
                          </TableCell>
                          <TableCell>
                            {request.wants_table ? (
                              <Badge
                                variant="outline"
                                className="text-blue-600 border-blue-600"
                              >
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            {format(
                              parseISO(request.created_at),
                              "MMM dd, h:mm a"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRequestDetails(true);
                              }}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Club Management Tab */}
          <TabsContent value="clubs" className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Club Management</h2>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>All Clubs</CardTitle>
                    <CardDescription>
                      Manage club information, hours, and music schedules
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowAddClubDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Club
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">
                          Club Name
                        </TableHead>
                        <TableHead className="min-w-[200px]">Address</TableHead>
                        <TableHead className="min-w-[150px]">Contact</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clubs.map((club) => (
                        <TableRow key={club.id}>
                          <TableCell className="font-medium">
                            {club.Name}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {club.Address}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {club.website && (
                                <div className="text-sm text-gray-600">
                                  {club.website}
                                </div>
                              )}
                              {club.instagram && (
                                <div className="text-sm text-gray-600">
                                  {club.instagram}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {club.Rating && (
                                <Badge variant="outline" className="text-xs">
                                  ⭐ {club.Rating}
                                </Badge>
                              )}
                              {club.Tags && club.Tags.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {club.Tags[0]}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/master/club/${club.id}`)
                                }
                                className="text-xs"
                              >
                                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Manage</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/master/clubs/${club.id}/edit`)
                                }
                                className="text-xs"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">
                                  Quick Edit
                                </span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(club.id)}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Add Club Dialog */}
            <Dialog
              open={showAddClubDialog}
              onOpenChange={setShowAddClubDialog}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Club</DialogTitle>
                  <DialogDescription>
                    Enter the club information below. Name and address are
                    required.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="club-name">Club Name *</Label>
                      <Input
                        id="club-name"
                        value={newClub.Name}
                        onChange={(e) =>
                          setNewClub({ ...newClub, Name: e.target.value })
                        }
                        placeholder="Enter club name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="club-address">Address *</Label>
                      <Input
                        id="club-address"
                        value={newClub.Address}
                        onChange={(e) =>
                          setNewClub({ ...newClub, Address: e.target.value })
                        }
                        placeholder="Enter club address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="club-image">Image URL</Label>
                      <Input
                        id="club-image"
                        value={newClub.Image}
                        onChange={(e) =>
                          setNewClub({ ...newClub, Image: e.target.value })
                        }
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="club-rating">Rating (0-5)</Label>
                      <Input
                        id="club-rating"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={newClub.Rating || ""}
                        onChange={(e) =>
                          setNewClub({
                            ...newClub,
                            Rating: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                        placeholder="4.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="club-latitude">Latitude</Label>
                      <Input
                        id="club-latitude"
                        type="number"
                        step="any"
                        value={newClub.latitude || ""}
                        onChange={(e) =>
                          setNewClub({
                            ...newClub,
                            latitude: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                        placeholder="40.7128"
                      />
                    </div>
                    <div>
                      <Label htmlFor="club-longitude">Longitude</Label>
                      <Input
                        id="club-longitude"
                        type="number"
                        step="any"
                        value={newClub.longitude || ""}
                        onChange={(e) =>
                          setNewClub({
                            ...newClub,
                            longitude: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                        placeholder="-74.0060"
                      />
                    </div>
                    <div>
                      <Label htmlFor="club-google-id">Google Place ID</Label>
                      <Input
                        id="club-google-id"
                        value={newClub.google_id}
                        onChange={(e) =>
                          setNewClub({ ...newClub, google_id: e.target.value })
                        }
                        placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="club-website">Website</Label>
                      <Input
                        id="club-website"
                        value={newClub.website}
                        onChange={(e) =>
                          setNewClub({ ...newClub, website: e.target.value })
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="club-instagram">Instagram Handle</Label>
                      <Input
                        id="club-instagram"
                        value={newClub.instagram_handle}
                        onChange={(e) =>
                          setNewClub({
                            ...newClub,
                            instagram_handle: e.target.value,
                          })
                        }
                        placeholder="@clubname"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="club-tags">Tags (comma-separated)</Label>
                    <Input
                      id="club-tags"
                      value={newClub.Tags.join(", ")}
                      onChange={(e) =>
                        setNewClub({
                          ...newClub,
                          Tags: e.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter((tag) => tag),
                        })
                      }
                      placeholder="nightclub, electronic, dance"
                    />
                  </div>

                  <div>
                    <Label htmlFor="club-music">
                      Current Music (comma-separated)
                    </Label>
                    <Input
                      id="club-music"
                      value={newClub.current_music.join(", ")}
                      onChange={(e) =>
                        setNewClub({
                          ...newClub,
                          current_music: e.target.value
                            .split(",")
                            .map((music) => music.trim())
                            .filter((music) => music),
                        })
                      }
                      placeholder="house, techno, deep house"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddClubDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addClub}>Add Club</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Club Dialog */}
            <Dialog
              open={showDeleteClubDialog}
              onOpenChange={setShowDeleteClubDialog}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Club</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this club? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteClubDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => clubToDelete && deleteClub(clubToDelete)}
                  >
                    Delete Club
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">
              Push Notifications
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Send Push Notification</CardTitle>
                <CardDescription>
                  Send a push notification to all users or a specific user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Notification Type Selection */}
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="notificationType"
                        value="all"
                        checked={notificationType === "all"}
                        onChange={(e) =>
                          setNotificationType(
                            e.target.value as "all" | "specific" | "targeted"
                          )
                        }
                        className="rounded"
                      />
                      <span>All Users</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="notificationType"
                        value="specific"
                        checked={notificationType === "specific"}
                        onChange={(e) =>
                          setNotificationType(
                            e.target.value as "all" | "specific" | "targeted"
                          )
                        }
                        className="rounded"
                      />
                      <span>Specific User</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="notificationType"
                        value="targeted"
                        checked={notificationType === "targeted"}
                        onChange={(e) =>
                          setNotificationType(
                            e.target.value as "all" | "specific" | "targeted"
                          )
                        }
                        className="rounded"
                      />
                      <span>Targeted by Preferences</span>
                    </label>
                  </div>
                </div>

                {/* User Search (only show for specific user) */}
                {notificationType === "specific" && (
                  <div className="space-y-2">
                    <Label htmlFor="user-search">Search User</Label>
                    <Input
                      id="user-search"
                      placeholder="Search by username, first name, or last name..."
                      onChange={(e) => searchUsers(e.target.value)}
                    />
                    {searchingUsers && (
                      <p className="text-sm text-gray-500">Searching...</p>
                    )}
                    {userSearchResults.length > 0 && (
                      <div className="border rounded-md max-h-40 overflow-y-auto">
                        {userSearchResults.map((user) => (
                          <div
                            key={user.id}
                            className={`p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                              specificUserId === user.id ? "bg-blue-50" : ""
                            }`}
                            onClick={() => {
                              setSpecificUserId(user.id);
                              setUserSearchResults([]);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  @{user.username}
                                </p>
                              </div>
                              <div className="text-xs">
                                {user.push_token ? "📱" : "❌"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {specificUserId && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          ✅ User selected:{" "}
                          {
                            userSearchResults.find(
                              (u) => u.id === specificUserId
                            )?.first_name
                          }{" "}
                          {
                            userSearchResults.find(
                              (u) => u.id === specificUserId
                            )?.last_name
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Targeted Preferences Selection */}
                {notificationType === "targeted" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <Label>Music Genres</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Select genres to target users who have these in their
                        preferences
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {MUSIC_GENRES.map((genre) => (
                          <label
                            key={genre}
                            className="flex items-center space-x-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMusicGenres.includes(genre)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMusicGenres([
                                    ...selectedMusicGenres,
                                    genre,
                                  ]);
                                } else {
                                  setSelectedMusicGenres(
                                    selectedMusicGenres.filter(
                                      (g) => g !== genre
                                    )
                                  );
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{genre}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Crowd Preferences</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Select crowd preferences to target matching users
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {CROWD_PREFERENCES.map((pref) => (
                          <label
                            key={pref}
                            className="flex items-center space-x-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCrowdPreferences.includes(pref)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCrowdPreferences([
                                    ...selectedCrowdPreferences,
                                    pref,
                                  ]);
                                } else {
                                  setSelectedCrowdPreferences(
                                    selectedCrowdPreferences.filter(
                                      (p) => p !== pref
                                    )
                                  );
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{pref}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Nightlife Goals</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Select goals to target users with matching preferences
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {NIGHTLIFE_GOALS.map((goal) => (
                          <label
                            key={goal}
                            className="flex items-center space-x-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedNightlifeGoals.includes(goal)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNightlifeGoals([
                                    ...selectedNightlifeGoals,
                                    goal,
                                  ]);
                                } else {
                                  setSelectedNightlifeGoals(
                                    selectedNightlifeGoals.filter(
                                      (g) => g !== goal
                                    )
                                  );
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{goal}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {loadingTargetedUsers && (
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm text-gray-600">
                          🔍 Finding matching users...
                        </p>
                      </div>
                    )}
                    {!loadingTargetedUsers && targetedUserIds.length > 0 && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          ✅ Found {targetedUserIds.length} user
                          {targetedUserIds.length !== 1 ? "s" : ""} matching
                          your preferences
                        </p>
                      </div>
                    )}
                    {!loadingTargetedUsers &&
                      targetedUserIds.length === 0 &&
                      (selectedMusicGenres.length > 0 ||
                        selectedCrowdPreferences.length > 0 ||
                        selectedNightlifeGoals.length > 0) && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">
                            ⚠️ No users found matching the selected preferences
                          </p>
                        </div>
                      )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notification-title">Title</Label>
                  <Input
                    id="notification-title"
                    placeholder="Enter notification title..."
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-body">Message</Label>
                  <Textarea
                    id="notification-body"
                    placeholder="Enter notification message..."
                    value={notificationBody}
                    onChange={(e) => setNotificationBody(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      sendPushNotification();
                    }}
                    disabled={
                      sendingNotification ||
                      !notificationTitle.trim() ||
                      !notificationBody.trim() ||
                      (notificationType === "specific" && !specificUserId) ||
                      (notificationType === "targeted" &&
                        (targetedUserIds.length === 0 || loadingTargetedUsers))
                    }
                    className="w-full sm:w-auto"
                  >
                    {sendingNotification ? "Sending..." : "Send Notification"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotificationTitle("");
                      setNotificationBody("");
                      setSpecificUserId("");
                      setUserSearchResults([]);
                      setSelectedMusicGenres([]);
                      setSelectedCrowdPreferences([]);
                      setSelectedNightlifeGoals([]);
                      setNotificationResult(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                </div>
                {notificationResult && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      notificationResult.startsWith("✅")
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {notificationResult}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Guestlist Request Details Modal */}
        <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guestlist Request Details</DialogTitle>
              <DialogDescription>
                Review and manage this guestlist request
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Group Name</Label>
                    <p className="text-sm">{selectedRequest.group_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total People</Label>
                    <p className="text-sm">
                      {selectedRequest.total_count} ({selectedRequest.men_count}
                      M / {selectedRequest.women_count}W)
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Event</Label>
                    <p className="text-sm">{selectedRequest.event_title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Club</Label>
                    <p className="text-sm">{selectedRequest.club_name}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Table Request</Label>
                  <p className="text-sm">
                    {selectedRequest.wants_table ? "Yes" : "No"}
                  </p>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Requested</Label>
                  <p className="text-sm">
                    {format(parseISO(selectedRequest.created_at), "PPP 'at' p")}
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateGuestlistRequestStatus(
                        selectedRequest.id,
                        "contacted"
                      )
                    }
                    disabled={selectedRequest.status === "contacted"}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark as Contacted
                  </Button>
                  <Button
                    onClick={() =>
                      updateGuestlistRequestStatus(
                        selectedRequest.id,
                        "handled"
                      )
                    }
                    disabled={selectedRequest.status === "handled"}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark as Handled
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
