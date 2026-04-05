"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface TimetableSlot {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOUR_HEIGHT = 60; // px
const START_HOUR = 8;
const END_HOUR = 18;

const COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200"
];

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    course_id: "",
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "10:00",
    room: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("faculty_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [timetableRes, coursesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/timetable/`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/`, config)
      ]);
      
      setSlots(timetableRes.data);
      const activeCourses = coursesRes.data.filter((c: any) => c.is_active !== false);
      setCourses(activeCourses);
      if (activeCourses.length > 0 && !formData.course_id) {
        setFormData(prev => ({ ...prev, course_id: activeCourses[0].id }));
      }
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch timetable data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this slot?")) return;
    
    try {
      const token = localStorage.getItem("faculty_token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/timetable/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete slot.");
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("faculty_token");
      
      // Ensure HH:MM:00 format
      const formattedData = {
        ...formData,
        start_time: formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time,
        end_time: formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/timetable/`,
        formattedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchData();
      setIsModalOpen(false);
      setFormData({
        course_id: courses.length > 0 ? courses[0].id : "",
        day_of_week: "Monday",
        start_time: "09:00",
        end_time: "10:00",
        room: "",
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to add slot (possibly a time conflict).");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to calculate position
  const getSlotStyle = (start: string, end: string) => {
    // start and end are in format HH:MM:SS
    const parseTime = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h + m / 60;
    };
    
    const startTimeDecimal = parseTime(start);
    const endTimeDecimal = parseTime(end);
    
    const top = (startTimeDecimal - START_HOUR) * HOUR_HEIGHT;
    const height = (endTimeDecimal - startTimeDecimal) * HOUR_HEIGHT;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: "30px", // minimum height for very short classes
    };
  };

  // Assign consistent color per course
  const getCourseColor = (courseCode: string) => {
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) {
        hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
  };

  const formatTimeInfo = (start: string, end: string) => {
    return `${start.substring(0, 5)} - ${end.substring(0, 5)}`;
  };

  if (loading && slots.length === 0) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse"></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse h-[600px]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Timetable</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Slot
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto flex-1 min-w-[800px]">
          <div className="flex min-w-full relative h-full">
            {/* Time Column */}
            <div className="w-16 flex-shrink-0 bg-gray-50 border-r border-gray-200 relative">
              <div className="h-12 border-b border-gray-200 bg-gray-100 sticky top-0 z-10 w-full" />
              <div className="relative w-full" style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}>
                {HOURS.map((hour, idx) => {
                  if (hour === END_HOUR) return null; // Don't draw the last label
                  return (
                    <div 
                      key={hour} 
                      className="absolute w-full right-0 text-right pr-2 text-xs font-medium text-gray-500" 
                      style={{ top: `${idx * HOUR_HEIGHT}px` }}
                    >
                      <span className="-translate-y-1/2 block mt-2">{`${hour.toString().padStart(2, '0')}:00`}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Days Columns */}
            {DAYS.map((day) => (
              <div key={day} className="flex-1 min-w-[120px] border-r border-gray-200 relative">
                {/* Day Header */}
                <div className="h-12 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 flex items-center justify-center">
                  <h3 className="text-sm font-semibold text-gray-700">{day}</h3>
                </div>

                {/* Day Grid Lines & Slots Area */}
                <div 
                  className="relative w-full overflow-hidden" 
                  style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
                >
                  {/* Grid lines */}
                  {HOURS.slice(0, -1).map((_, idx) => (
                    <div 
                      key={idx} 
                      className="absolute w-full border-t border-gray-100" 
                      style={{ top: `${Math.max(1, idx * HOUR_HEIGHT)}px`, left: 0, right: 0 }}
                    />
                  ))}

                  {/* Render Slots */}
                  {slots
                    .filter((s) => s.day_of_week === day)
                    .map((slot) => {
                      const style = getSlotStyle(slot.start_time, slot.end_time);
                      const colorClass = getCourseColor(slot.course_code || slot.course_id);
                      
                      return (
                        <div
                          key={slot.id}
                          className={`absolute left-1 right-1 border rounded-md p-2 shadow-sm overflow-hidden flex flex-col justify-between group transition-shadow hover:shadow ${colorClass}`}
                          style={style}
                        >
                          <div>
                            <div className="font-bold text-xs truncate" title={slot.course_name}>
                              {slot.course_code}
                            </div>
                            <div className="text-[10px] opacity-80 mt-0.5 truncate flex items-center">
                                <svg className="w-3 h-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {slot.room}
                            </div>
                          </div>
                          
                          <div className="text-[10px] font-medium flex justify-between items-end mt-1">
                              <span>{formatTimeInfo(slot.start_time, slot.end_time)}</span>
                              
                              <button 
                                onClick={(e) => handleDelete(slot.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 bg-white/80 rounded p-1 transition-opacity"
                                title="Delete Slot"
                              >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                              </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)}></div>

            <div className="relative inline-block w-full max-w-md overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl sm:my-8 border border-gray-200">
              <form onSubmit={handleAddSlot}>
                <div className="px-6 pt-6 pb-6 bg-white sm:pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 border-b pb-4">Schedule Class</h3>
                  
                  {courses.length === 0 ? (
                      <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg text-sm mb-4">
                          You need to add courses before creating timetable entries.
                      </div>
                  ) : (
                    <div className="space-y-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Course</label>
                        <select
                            required
                            value={formData.course_id}
                            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                        </div>
                        
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                        <select
                            required
                            value={formData.day_of_week}
                            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {DAYS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Time</label>
                            <input
                            type="time"
                            required
                            min="08:00"
                            max="17:00"
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Time</label>
                            <input
                            type="time"
                            required
                            min="08:30"
                            max="18:00"
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        </div>

                        <div>
                        <label className="block text-sm font-medium text-gray-700">Room / Location</label>
                        <input
                            type="text"
                            required
                            value={formData.room}
                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g. Room 302, Lab 1"
                        />
                        </div>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting || courses.length === 0}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Saving..." : "Add to Timetable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm sm:mr-3"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
