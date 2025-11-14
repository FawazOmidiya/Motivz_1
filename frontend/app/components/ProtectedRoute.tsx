import { Redirect } from "expo-router";
import { useSession } from "@/components/SessionContext";
import { View, ActivityIndicator } from "react-native";
import * as Constants from "@/constants/Constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that protects routes requiring authentication
 * Redirects to sign-in if user is not authenticated
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const session = useSession();

  // If no session, redirect to sign-in
  if (!session) {
    return <Redirect href="/auth/sign-in" />;
  }

  // If session exists, render the protected content
  return <>{children}</>;
}
