import { ReactNode } from "react";

interface ReviewLayoutProps {
  children: ReactNode;
}

export default function ReviewLayout({ children }: ReviewLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
      {children}
    </div>
  );
}
