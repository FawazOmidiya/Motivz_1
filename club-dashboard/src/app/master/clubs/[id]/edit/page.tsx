"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface Club {
  id: string;
  Name: string;
  Address: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  description?: string;
  hours?: Record<string, unknown>;
  music_schedule?: Record<string, unknown>;
}

export default function EditClubPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    Name: "",
    Address: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    description: "",
  });

  useEffect(() => {
    fetchClub();
  }, [clubId]);

  const fetchClub = async () => {
    try {
      setInitialLoading(true);
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
      });
    } catch (error) {
      console.error("Error fetching club:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleUpdateClub = async () => {
    if (!club || !formData.Name) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("Clubs")
        .update({
          Name: formData.Name,
          Address: formData.Address,
          email: formData.email || null,
          phone: formData.phone || null,
          website: formData.website || null,
          instagram: formData.instagram || null,
          description: formData.description || null,
        })
        .eq("id", clubId);

      if (error) throw error;

      alert("Club updated successfully!");
      router.push("/master");
    } catch (error) {
      console.error("Error updating club:", error);
      alert("Error updating club");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (club) {
      setFormData({
        Name: club.Name || "",
        Address: club.Address || "",
        email: club.email || "",
        phone: club.phone || "",
        website: club.website || "",
        instagram: club.instagram || "",
        description: club.description || "",
      });
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading club...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Club Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The club you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/master">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Back to Master Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/master"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Master Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Edit Club: {club.Name}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleUpdateClub}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Updating..." : "Update Club"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Club Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  value={formData.Name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Name: e.target.value,
                    })
                  }
                  placeholder="Enter club name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    value={formData.Address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Address: e.target.value,
                      })
                    }
                    placeholder="123 Main St, City, State"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    placeholder="club@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instagram: e.target.value,
                      })
                    }
                    placeholder="@clubname"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="Club description"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
