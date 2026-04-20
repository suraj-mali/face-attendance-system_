"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("faculty_token");
      if (!token || token === "undefined" || token === "null" || token.trim() === "") {
        router.replace("/login");
        return;
      }
      setIsAuthorized(true);
      setAuthChecked(true);
    } catch (err) {
      console.error("Auth check error:", err);
      router.replace("/login");
    }
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto h-screen relative">
        {children}
      </div>
    </div>
  );
}
