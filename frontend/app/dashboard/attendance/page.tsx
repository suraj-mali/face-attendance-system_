"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface TodaySlot {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  start_time: string;
  end_time: string;
  room: string;
  day_of_week?: string;
  courses?: any;
  course?: any;
}

export default function AttendancePage() {
  const router = useRouter();
  const [slots, setSlots] = useState<TodaySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodaySlots = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("faculty_token");
        const localDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/timetable/today?day=${localDay}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("RAW timetable today response:", JSON.stringify(data, null, 2));

        const mappedSlots = data.map((slot: any) => {
          const name =
            slot.course_name ||
            slot.courses?.name ||
            slot.course?.name ||
            'Unknown Course'

          const code =
            slot.course_code ||
            slot.courses?.code ||
            slot.course?.code ||
            ''

          const cid =
            slot.course_id ||
            slot.courses?.id ||
            slot.id

          return {
            id: slot.id,
            course_id: cid,
            course_name: name,
            course_code: code,
            start_time: slot.start_time,
            end_time: slot.end_time,
            room: slot.room,
            day_of_week: slot.day_of_week,
            courses: slot.courses,
            course: slot.course
          };
        });

        setSlots(mappedSlots);
        setError(null);
      } catch (err: any) {
        setError("Failed to fetch today's schedule.");
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySlots();
  }, []);

  const formatTimeInfo = (start: string, end: string) => {
    return `${start?.substring(0, 5) || ''} - ${end?.substring(0, 5) || ''}`;
  };

  const date = new Date();
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  const currentDateStr = `${weekday}, ${day} ${month} ${year}`;

  if (loading) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse h-[200px]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Take Attendance</h1>
        <p className="text-gray-500 mt-1">{currentDateStr}</p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      ) : slots.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-12">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-500">No classes scheduled for today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => {
            const name =
              slot.course_name ||
              slot.courses?.name ||
              slot.course?.name ||
              'Unknown Course'

            const code =
              slot.course_code ||
              slot.courses?.code ||
              slot.course?.code ||
              ''

            const cid =
              slot.course_id ||
              slot.courses?.id ||
              slot.id

            return (
              <div key={slot.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
                <div className="mb-4 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{name}</h3>
                  <p className="text-sm font-medium text-teal-600 mb-1">
                    {slot.day_of_week || ''}
                  </p>
                  <p className="text-sm text-gray-500 font-medium mt-1">{code}</p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {(slot.start_time || '').slice(0, 5)} - {(slot.end_time || '').slice(0, 5)}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {slot.room || "No room assigned"}
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/dashboard/attendance/session?course_id=${cid}`)}
                  className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Take Attendance
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
