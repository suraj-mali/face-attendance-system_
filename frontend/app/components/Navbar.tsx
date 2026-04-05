"use client";

import React, { useEffect, useState } from "react";

interface NavbarProps {
  title?: string;
}

export default function Navbar({ title }: NavbarProps) {
  const [facultyName, setFacultyName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("faculty_name");
    if (name) {
      setFacultyName(name);
    }
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="w-full h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <div className="text-gray-800 font-medium text-lg">
        {title || ""}
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700">
          {facultyName || "Loading..."}
        </span>
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: "#0f766e" }}
        >
          {getInitials(facultyName)}
        </div>
      </div>
    </div>
  );
}
