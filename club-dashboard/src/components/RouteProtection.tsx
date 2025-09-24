"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import MasterAuth from "./MasterAuth";

interface RouteProtectionProps {
  children: React.ReactNode;
}

export default function RouteProtection({ children }: RouteProtectionProps) {
  const { club, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState(false);
  const [checkingMasterAuth, setCheckingMasterAuth] = useState(true);

  const isLoginPage = pathname === "/login";
  const isMasterPage =
    pathname === "/master" || pathname.startsWith("/master/");

  // Check master authentication on mount
  useEffect(() => {
    if (isMasterPage) {
      const masterAuth = sessionStorage.getItem("master_authenticated");
      setIsMasterAuthenticated(masterAuth === "true");
      setCheckingMasterAuth(false);
    }
  }, [isMasterPage]);

  useEffect(() => {
    if (!isLoading) {
      // Handle master page authentication
      if (isMasterPage) {
        return; // Let the master auth logic handle this
      }

      // Regular club dashboard logic
      if (!club && !isLoginPage && !isMasterPage) {
        router.push("/login");
      } else if (club && isLoginPage) {
        router.push("/");
      }
    }
  }, [club, isLoading, isLoginPage, isMasterPage, router]);

  if (isLoading || (isMasterPage && checkingMasterAuth)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If on master page, check authentication
  if (isMasterPage) {
    if (!isMasterAuthenticated) {
      return (
        <MasterAuth onAuthenticated={() => setIsMasterAuthenticated(true)} />
      );
    }
    return <>{children}</>;
  }

  // If on login page and not authenticated, show login
  if (isLoginPage && !club) {
    return <>{children}</>;
  }

  // If not on login page and not authenticated, show loading (will redirect)
  if (!isLoginPage && !club) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authenticated and on login page, show loading (will redirect to dashboard)
  if (club && isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // If authenticated and not on login page, show protected content
  return <>{children}</>;
}
