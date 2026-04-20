// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';

// interface Stats {
//     total_students: number;
//     total_courses: number;
//     todays_sessions: number;
//     avg_attendance: number;
// }

// interface TimetableSession {
//     session_id: string;
//     course_id: string;
//     course_name: string;
//     time: string;
//     room: string;
// }

// export default function DashboardOverview() {
//     const [stats, setStats] = useState<Stats | null>(null);
//     const [timetable, setTimetable] = useState<TimetableSession[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     useEffect(() => {
//         const fetchDashboardData = async () => {
//             setIsLoading(true);
//             setError(null);
//             try {
//                 const token = localStorage.getItem('faculty_token');
//                 if (!token) {
//                     throw new Error('No authentication token found. Please log in again.');
//                 }

//                 const headers = {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 };

//                 const [statsRes, timetableRes] = await Promise.all([
//                     fetch('http://localhost:8000/reports/summary', { headers }),
//                     fetch('http://localhost:8000/timetable/today', { headers })
//                 ]);

//                 if (!statsRes.ok || !timetableRes.ok) {
//                     throw new Error('Failed to fetch dashboard data');
//                 }

//                 const statsData = await statsRes.json();
//                 const timetableData = await timetableRes.json();

//                 setStats(statsData);
//                 setTimetable(timetableData);
//             } catch (err: any) {
//                 setError(err.message || 'An error occurred while loading the dashboard. Make sure the backend is running.');
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchDashboardData();
//     }, []);

//     if (error) {
//         return (
//             <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start space-x-3">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <circle cx="12" cy="12" r="10" />
//                     <line x1="12" y1="8" x2="12" y2="12" />
//                     <line x1="12" y1="16" x2="12.01" y2="16" />
//                 </svg>
//                 <span>{error}</span>
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-8 animate-in fade-in duration-500">
//             <div>
//                 <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
//                 <p className="text-slate-500 text-sm mt-1">Welcome back. Here is what's happening today.</p>
//             </div>

//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 {isLoading ? (
//                     Array.from({ length: 4 }).map((_, i) => (
//                         <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse flex items-center space-x-4">
//                             <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
//                             <div className="space-y-2 w-full">
//                                 <div className="h-4 bg-slate-200 rounded w-1/2"></div>
//                                 <div className="h-6 bg-slate-200 rounded w-1/3"></div>
//                             </div>
//                         </div>
//                     ))
//                 ) : stats ? (
//                     <>
//                         <StatCard
//                             title="Total Students"
//                             value={stats.total_students}
//                             icon={<UsersIcon />}
//                             bgColor="bg-blue-50"
//                             iconColor="text-blue-600"
//                         />
//                         <StatCard
//                             title="Total Courses"
//                             value={stats.total_courses}
//                             icon={<BookIcon />}
//                             bgColor="bg-indigo-50"
//                             iconColor="text-indigo-600"
//                         />
//                         <StatCard
//                             title="Today's Sessions"
//                             value={stats.todays_sessions}
//                             icon={<CalendarIcon />}
//                             bgColor="bg-amber-50"
//                             iconColor="text-amber-600"
//                         />
//                         <StatCard
//                             title="Avg Attendance"
//                             value={`${stats.avg_attendance}%`}
//                             icon={<ChartIcon />}
//                             bgColor="bg-teal-50"
//                             iconColor="text-teal-600"
//                         />
//                     </>
//                 ) : null}
//             </div>

//             {/* Timetable Section */}
//             <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
//                 <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//                     <h2 className="text-lg font-semibold text-slate-800">Today's Timetable</h2>
//                     <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
//                         {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
//                     </span>
//                 </div>

//                 <div className="p-6">
//                     {isLoading ? (
//                         <div className="space-y-4">
//                             {Array.from({ length: 3 }).map((_, i) => (
//                                 <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-lg animate-pulse gap-4">
//                                     <div className="space-y-2 w-full sm:w-1/3">
//                                         <div className="h-5 bg-slate-200 rounded w-full"></div>
//                                         <div className="h-4 bg-slate-200 rounded w-2/3"></div>
//                                     </div>
//                                     <div className="h-10 bg-slate-200 rounded-lg w-full sm:w-36"></div>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : timetable.length > 0 ? (
//                         <div className="space-y-4">
//                             {timetable.map((session) => (
//                                 <div key={session.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all duration-200 bg-white group gap-4">
//                                     <div>
//                                         <h3 className="font-semibold text-slate-900 text-lg group-hover:text-teal-600 transition-colors">{session.course_name}</h3>
//                                         <div className="flex items-center text-sm text-slate-500 mt-2 space-x-5">
//                                             <span className="flex items-center">
//                                                 <ClockIcon className="w-4 h-4 mr-1.5 text-slate-400" />
//                                                 {session.time}
//                                             </span>
//                                             <span className="flex items-center">
//                                                 <MapPinIcon className="w-4 h-4 mr-1.5 text-slate-400" />
//                                                 {session.room}
//                                             </span>
//                                         </div>
//                                     </div>
//                                     <Link
//                                         href={`/dashboard/attendance?course_id=${session.course_id}&session_id=${session.session_id}`}
//                                         className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
//                                     >
//                                         Take Attendance
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                             <path d="M5 12h14" />
//                                             <path d="m12 5 7 7-7 7" />
//                                         </svg>
//                                     </Link>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="text-center py-12">
//                             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
//                                 <CalendarIcon className="w-8 h-8 text-slate-300" />
//                             </div>
//                             <h3 className="text-slate-800 font-medium mb-1">No Sessions Today</h3>
//                             <p className="text-slate-500 text-sm">You have a free schedule for the rest of the day.</p>
//                         </div>
//                     )}
//                 </div>z
//             </div>
//         </div>
//     );
// }

// // Reusable Stat Card Component
// function StatCard({
//     title,
//     value,
//     icon,
//     bgColor,
//     iconColor
// }: {
//     title: string;
//     value: string | number;
//     icon: React.ReactNode;
//     bgColor: string;
//     iconColor: string;
// }) {
//     return (
//         <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
//             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor} ${iconColor} shrink-0`}>
//                 {icon}
//             </div>
//             <div>
//                 <p className="text-sm font-medium text-slate-500">{title}</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
//             </div>
//         </div>
//     );
// }

// // Icons
// function UsersIcon({ className = "w-6 h-6" }: { className?: string }) {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
//             <circle cx="9" cy="7" r="4" />
//             <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
//             <path d="M16 3.13a4 4 0 0 1 0 7.75" />
//         </svg>
//     );
// }

// function BookIcon({ className = "w-6 h-6" }: { className?: string }) {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
//         </svg>
//     );
// }

// function CalendarIcon({ className = "w-6 h-6" }: { className?: string }) {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
//             <line x1="16" x2="16" y1="2" y2="6" />
//             <line x1="8" x2="8" y1="2" y2="6" />
//             <line x1="3" x2="21" y1="10" y2="10" />
//         </svg>
//     );
// }

// function ChartIcon({ className = "w-6 h-6" }: { className?: string }) {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <line x1="18" x2="18" y1="20" y2="10" />
//             <line x1="12" x2="12" y1="20" y2="4" />
//             <line x1="6" x2="6" y1="20" y2="14" />
//         </svg>
//     );
// }

// function ClockIcon({ className = "w-5 h-5" }: { className?: string }) {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <circle cx="12" cy="12" r="10" />
//             <polyline points="12 6 12 12 16 14" />
//         </svg>
//     );
// }

// function MapPinIcon({ className = "w-5 h-5" }: { className?: string }) {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
//             <circle cx="12" cy="10" r="3" />
//         </svg>
//     );
// }

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Stats {
  total_students: number;
  total_courses: number;
  todays_sessions: number;
  avg_attendance: number;
}

interface TimetableSlot {
  id: string;
  course_id: string;
  courses: {
    name: string;
    code: string;
  };
  start_time: string;
  end_time: string;
  room: string;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("faculty_token");
        if (!token) {
          router.push("/login");
          return;
        }

        console.log("Token being used:", token ? "EXISTS" : "MISSING")

        const res = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "/faculty/dashboard-stats",
          { headers: { "Authorization": "Bearer " + token } }
        )
        const data = await res.json()
        console.log("Stats API status:", res.status)
        console.log("Stats API response:", data)

        setStats({
          total_students: Number(data.total_students) || 0,
          total_courses: Number(data.total_courses) || 0,
          todays_sessions: Number(data.todays_sessions) || 0,
          avg_attendance: Number(data.avg_attendance) || 0
        })

        const config = {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        };
        const timetableResponse = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/timetable/today", config);
        setTimetable(timetableResponse.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5); // Simplistic assume "HH:MM:SS" -> "HH:MM"
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Timetable Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? stats.total_students : 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Courses</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? stats.total_courses : 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Today's Sessions</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? stats.todays_sessions : 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Avg Attendance</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats ? stats.avg_attendance + "%" : "0%"}
          </p>
        </div>
      </div>

      {/* Today's Timetable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Today's Timetable</h2>
        </div>

        {timetable.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-base font-medium text-gray-900 mb-1">No classes today</p>
            <p className="text-sm">Kick back and relax!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Course</th>
                  <th className="px-6 py-4 font-medium">Room</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {timetable.map((slot: any) => {
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
                    <tr key={slot.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                        {(slot.start_time || '').slice(0, 5)} - {(slot.end_time || '').slice(0, 5)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{code}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                        {slot.room}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right bg">
                        <button
                          onClick={() => router.push(`/dashboard/attendance/session?course_id=${cid}`)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Take Attendance
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
