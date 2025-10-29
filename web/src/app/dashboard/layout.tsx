import RouteProtection from "@/components/RouteProtection";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteProtection>{children}</RouteProtection>;
}
