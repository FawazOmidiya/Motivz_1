"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function SettingsPage() {
  const { club, changePassword, updateClubName } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Club name update state
  const [clubName, setClubName] = useState(club?.name || "");
  const [updatingName, setUpdatingName] = useState(false);

  // Update club name when club data changes
  useEffect(() => {
    if (club?.name) {
      setClubName(club.name);
    }
  }, [club?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Basic validation
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "New password must be at least 8 characters long",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to change password",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred while changing password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClubName = async () => {
    if (!clubName.trim()) {
      setMessage({ type: "error", text: "Club name cannot be empty" });
      return;
    }

    if (clubName.trim() === club?.name) {
      setMessage({
        type: "error",
        text: "Club name is already set to this value",
      });
      return;
    }

    setUpdatingName(true);
    setMessage(null);

    try {
      const result = await updateClubName(clubName.trim());

      if (result.success) {
        setMessage({
          type: "success",
          text: "Club name updated successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update club name",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred while updating club name",
      });
    } finally {
      setUpdatingName(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your club&apos;s account settings
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Club Information
          </CardTitle>
          <CardDescription>
            Update your club&apos;s basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clubName" className="text-sm font-medium">
              Club Name
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="clubName"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Enter club name"
                disabled={updatingName}
              />
              <Button
                onClick={handleUpdateClubName}
                disabled={
                  updatingName ||
                  !clubName.trim() ||
                  clubName.trim() === club?.name
                }
                size="sm"
              >
                {updatingName ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm text-muted-foreground">{club?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your club&apos;s login password securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={loading}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long and contain
                uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {message && (
              <Alert
                className={
                  message.type === "success"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription
                  className={
                    message.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }
                >
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
