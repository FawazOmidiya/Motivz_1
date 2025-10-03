"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Clock,
  Music,
  MapPin,
  Phone,
  // Mail,
  // Globe,
  // Instagram,
} from "lucide-react";

interface Club {
  id: string;
  Name: string;
  Address: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: Record<string, unknown>;
  music_schedule?: Record<string, unknown>;
}

export default function ClubManagementPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
    Address: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    description: "",
    latitude: "",
    longitude: "",
  });

  const [openingHours, setOpeningHours] = useState({
    monday: { open: "", close: "", closed: false },
    tuesday: { open: "", close: "", closed: false },
    wednesday: { open: "", close: "", closed: false },
    thursday: { open: "", close: "", closed: false },
    friday: { open: "", close: "", closed: false },
    saturday: { open: "", close: "", closed: false },
    sunday: { open: "", close: "", closed: false },
  });

  const [musicSchedule, setMusicSchedule] = useState({
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  });

  const fetchClubData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Clubs")
        .select("*")
        .eq("id", clubId)
        .single();

      if (error) throw error;

      setClub(data);
      setFormData({
        Name: data.Name || "",
        Address: data.Address || "",
        email: data.email || "",
        phone: data.phone || "",
        website: data.website || "",
        instagram: data.instagram || "",
        description: data.description || "",
        latitude: data.latitude?.toString() || "",
        longitude: data.longitude?.toString() || "",
      });

      // Load opening hours
      if (data.opening_hours) {
        setOpeningHours(data.opening_hours);
      }

      // Load music schedule
      if (data.music_schedule) {
        setMusicSchedule(data.music_schedule);
      }
    } catch (error) {
      console.error("Error fetching club data:", error);
      alert("Error loading club data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      fetchClubData();
    }
  }, [clubId]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        opening_hours: openingHours,
        music_schedule: musicSchedule,
      };

      const { error } = await supabase
        .from("Clubs")
        .update(updateData)
        .eq("id", clubId);

      if (error) throw error;

      alert("Club updated successfully!");
      router.push("/master");
    } catch (error) {
      console.error("Error updating club:", error);
      alert("Error updating club");
    } finally {
      setSaving(false);
    }
  };

  const handleOpeningHoursChange = (
    day: string,
    field: string,
    value: string | boolean
  ) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleMusicScheduleChange = (day: string, value: string) => {
    setMusicSchedule((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading club data...</div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Club not found</div>
        </div>
      </div>
    );
  }

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/master")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Master Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{club.Name}</h1>
            <p className="text-muted-foreground">Club Management</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="hours">Opening Hours</TabsTrigger>
          <TabsTrigger value="music">Music Schedule</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Basic Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Club Name</Label>
                  <Input
                    id="name"
                    value={formData.Name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, Name: e.target.value }))
                    }
                    placeholder="Enter club name"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.Address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        Address: e.target.value,
                      }))
                    }
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter club description"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="club@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        instagram: e.target.value,
                      }))
                    }
                    placeholder="@clubname"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location Coordinates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Coordinates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          latitude: e.target.value,
                        }))
                      }
                      placeholder="40.7128"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          longitude: e.target.value,
                        }))
                      }
                      placeholder="-74.0060"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Opening Hours Tab */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Opening Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {days.map((day) => (
                  <div
                    key={day.key}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-24 font-medium">{day.label}</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          openingHours[day.key as keyof typeof openingHours]
                            .closed
                        }
                        onChange={(e) =>
                          handleOpeningHoursChange(
                            day.key,
                            "closed",
                            e.target.checked
                          )
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Closed</span>
                    </div>
                    {!openingHours[day.key as keyof typeof openingHours]
                      .closed && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={
                            openingHours[day.key as keyof typeof openingHours]
                              .open
                          }
                          onChange={(e) =>
                            handleOpeningHoursChange(
                              day.key,
                              "open",
                              e.target.value
                            )
                          }
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={
                            openingHours[day.key as keyof typeof openingHours]
                              .close
                          }
                          onChange={(e) =>
                            handleOpeningHoursChange(
                              day.key,
                              "close",
                              e.target.value
                            )
                          }
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Music Schedule Tab */}
        <TabsContent value="music" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Music Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {days.map((day) => (
                  <div
                    key={day.key}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-24 font-medium">{day.label}</div>
                    <div className="flex-1">
                      <Input
                        value={
                          musicSchedule[day.key as keyof typeof musicSchedule]
                        }
                        onChange={(e) =>
                          handleMusicScheduleChange(day.key, e.target.value)
                        }
                        placeholder="e.g., House Music, Hip-Hop, Live DJ"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
