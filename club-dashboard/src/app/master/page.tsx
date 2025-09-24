"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  Users,
  Clock,
  Music,
  Settings,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types/event";
import { cn } from "@/lib/utils";

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
  hours?: any;
  music_schedule?: any;
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

  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [guestlistRequests, setGuestlistRequests] = useState<
    GuestlistRequest[]
  >([]);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  // Guestlist management state
  const [selectedRequest, setSelectedRequest] =
    useState<GuestlistRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
      const transformedData = (data || []).map((request: any) => ({
        ...request,
        event_title: request.events?.title,
        club_name: request.events?.Clubs?.Name,
      }));

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
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
                            {(event as any).Clubs?.Name}
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

            {/* Current/Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Current & Upcoming Events</CardTitle>
                <CardDescription>
                  Active events across all clubs
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
                        <TableHead className="min-w-[120px]">Club</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[80px]">Type</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {event.title}
                          </TableCell>
                          <TableCell>{(event as any).Clubs?.Name}</TableCell>
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

            {/* Past Events */}
            <Card>
              <CardHeader>
                <CardTitle>Past Events</CardTitle>
                <CardDescription>
                  Completed events for reference
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
                        <TableHead className="min-w-[120px]">Club</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[80px]">Type</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastEvents.map((event) => (
                        <TableRow key={event.id} className="opacity-60">
                          <TableCell className="font-medium">
                            {event.title}
                          </TableCell>
                          <TableCell>{(event as any).Clubs?.Name}</TableCell>
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
                <CardTitle>All Clubs</CardTitle>
                <CardDescription>
                  Manage club information, hours, and music schedules
                </CardDescription>
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
                              {club.email && (
                                <div className="text-sm text-gray-600">
                                  {club.email}
                                </div>
                              )}
                              {club.phone && (
                                <div className="text-sm text-gray-600">
                                  {club.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {club.website && (
                                <Badge variant="outline" className="text-xs">
                                  Website
                                </Badge>
                              )}
                              {club.instagram && (
                                <Badge variant="outline" className="text-xs">
                                  Instagram
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
