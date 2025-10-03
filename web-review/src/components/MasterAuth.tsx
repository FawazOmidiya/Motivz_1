"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface MasterAuthProps {
  onAuthenticated: () => void;
}

export default function MasterAuth({ onAuthenticated }: MasterAuthProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded passcode - in production, this should be in environment variables
  const MASTER_PASSCODE = process.env.NEXT_PUBLIC_MASTER_PASSCODE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (passcode === MASTER_PASSCODE) {
      // Store authentication in sessionStorage
      sessionStorage.setItem("master_authenticated", "true");
      onAuthenticated();
    } else {
      setError("Invalid passcode. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Master Dashboard Access
          </CardTitle>
          <CardDescription>
            Enter the master passcode to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter master passcode"
                className="w-full"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
