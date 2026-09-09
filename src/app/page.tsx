"use client";

import { useAuth } from "@/context/AuthContext";
import LandingPage from "@/app/landing/page";

export default function RootEntryPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C3AED]/20 border-t-[#EAB308] rounded-full animate-spin" />
      </div>
    );
  }

  // Renders the full 3D interactive landing page directly
  return <LandingPage />;
}