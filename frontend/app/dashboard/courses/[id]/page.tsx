"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

interface Course {
  id: string;
  name: string;
  code: string;
  semester: number;
  division: string;
  year: string;
  is_active: boolean;
}

interface AttendanceSession {
  id: string;
  created_at: string;
  present_count: number;
  total_students: number;
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
  division: string;
  year: string;
  is_enrolled: boolean;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseData = async () => {
      try {
        const token = localStorage.getItem("faculty_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const [courseRes, historyRes, studentsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`, config),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/history?course_id=${courseId}`, config),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students/?per_page=1000`, config)
        ]);

        const fetchedCourse = courseRes.data;
        setCourse(fetchedCourse);
        setHistory(historyRes.data);

        // Filter students locally to match course year and division
        const allStudents = studentsRes.data.students || [];
        const courseStudents = allStudents.filter(
          (s: Student) => s.year === fetchedCourse.year && s.division === fetchedCourse.division
        );
        
        // Sort by roll number
        courseStudents.sort((a: Student, b: Student) => a.roll_number.localeCompare(b.roll_number));
        setStudents(courseStudents);

      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch course details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, router]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse"></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse mb-8">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 mb-6">
          {error || "Course not found"}
        </div>
        <Link href="/dashboard/courses" className="text-blue-600 hover:underline">
          &larr; Back to Courses
        </Link>
      </div>
    );
  }

  const enrolledCount = students.filter(s => s.is_enrolled).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center">
        <Link href="/dashboard/courses" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center text-sm font-medium">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Courses
        </Link>
      </div>

      {/* Course Details Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
            <p className="text-lg text-gray-500 mt-1 font-mono">{course.code}</p>
          </div>
          <div>
            {course.is_active ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Inactive
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-500">Year</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{course.year}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Semester</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{course.semester}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Division</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{course.division}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Enrolled Students</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 text-blue-600">
              {enrolledCount} / {students.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Attendance Sessions</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No attendance sessions recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {history.map((session) => {
                    const percentage = session.total_students > 0 
                      ? Math.round((session.present_count / session.total_students) * 100) 
                      : 0;
                      
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-gray-900 font-medium whitespace-nowrap">
                          {formatDate(session.created_at)}
                        </td>
                        <td className="px-6 py-3 text-center text-gray-700">
                          {session.present_count}
                        </td>
                        <td className="px-6 py-3 text-center text-gray-700">
                          {session.total_students}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className={`font-medium ${percentage < 75 ? 'text-red-500' : 'text-green-600'}`}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enrolled Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Student Roster</h2>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Div {course.division}
            </span>
          </div>
          
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No students assigned to this division yet.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase bg-white">Roll No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase bg-white">Name</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase bg-white">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-gray-500 font-medium">
                        {student.roll_number}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        {student.is_enrolled ? (
                          <span className="inline-flex items-center text-green-600 text-xs font-medium">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Enrolled
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-orange-500 text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
