"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface StudentReport {
  id: string;
  name: string;
  roll_number: string;
  total_classes: number;
  present: number;
  absent: number;
  percentage: number;
  is_defaulter: boolean;
  shortfall: number;
}

interface ReportData {
  course_name: string;
  course_code: string;
  total_sessions: number;
  from_date: string;
  to_date: string;
  students: StudentReport[];
  defaulters: StudentReport[];
  defaulter_count: number;
  class_average: number;
}

export default function ReportsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab state: 'all' | 'defaulters'
  const [activeTab, setActiveTab] = useState<'all' | 'defaulters'>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("faculty_token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
        if (res.data.length > 0) setCourseId(res.data[0].id);
      } catch (err) {
        console.error("Failed to load courses");
      }
    };
    fetchCourses();
  }, []);

  const handleGenerateReport = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + 
        '/reports/attendance?course_id=' + courseId +
        (fromDate ? '&from_date=' + fromDate : '') + 
        (toDate ? '&to_date=' + toDate : ''),
        {
          headers: {
            'Authorization': 'Bearer ' + 
            localStorage.getItem('faculty_token')
          }
        }
      )
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate report.");
      }
      
      console.log('Report data:', data)
      setReportData(data)
      // Reset tab to 'all' when a new report is generated
      setActiveTab('all');
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!courseId) {
      alert('Please select a course first')
      return
    }

    try {
      setDownloading(true)
      const token = localStorage.getItem('faculty_token')
      
      const fromParam = fromDate || '2024-01-01'
      const toParam = toDate || new Date().toISOString().split('T')[0]

      const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/export?course_id=${courseId}&from_date=${fromParam}&to_date=${toParam}`
      
      console.log('Downloading from:', url)

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })

      console.log('Response status:', res.status)
      console.log('Response type:', res.headers.get('Content-Type'))

      if (!res.ok) {
        let errorMsg = 'Export failed'
        try {
          const errData = await res.json()
          errorMsg = errData.detail || errorMsg
        } catch {
          errorMsg = `Server error: ${res.status}`
        }
        alert('Failed to export Excel file: ' + errorMsg)
        return
      }

      const contentType = res.headers.get('Content-Type') || ''
      if (!contentType.includes('spreadsheet') && 
          !contentType.includes('excel') &&
          !contentType.includes('octet-stream')) {
        const text = await res.text()
        console.error('Unexpected content type:', contentType, text)
        alert('Server returned wrong file type. Check backend logs.')
        return
      }

      const blob = await res.blob()
      console.log('Blob size:', blob.size)

      if (blob.size === 0) {
        alert('Downloaded file is empty. Check backend logs.')
        return
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.style.display = 'none'
      link.href = downloadUrl
      
      const disposition = res.headers.get('Content-Disposition') || ''
      const nameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      const fileName = nameMatch
        ? nameMatch[1].replace(/['"]/g, '')
        : `attendance_report_${fromParam}_${toParam}.xlsx`
      
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      }, 100)

      console.log('Download triggered:', fileName)

    } catch (err: any) {
      console.error('Download error:', err)
      alert('Download failed: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate analytics and export academic records.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 shrink-0 z-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 w-full"
            >
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date (Optional)</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date (Optional)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>
          <div>
            <button
              onClick={handleGenerateReport}
              disabled={!courseId || loading}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 mb-6 shrink-0">
          {error}
        </div>
      )}

      {reportData && (
        <div className="flex flex-col flex-1 min-h-0 z-10 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                    {reportData.course_code}: {reportData.course_name}
                </h2>
                <button
                  onClick={handleDownloadExcel}
                  disabled={downloading || !courseId}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {downloading ? 'Downloading...' : 'Download Excel'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center border-l-4 border-blue-500">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                        <p className="text-2xl font-bold text-blue-600">{reportData.total_sessions}</p>
                    </div>
                </div>
                
                <div className={`bg-white rounded-xl shadow-sm border p-6 flex items-center border-l-4 ${reportData.class_average >= 75 ? 'border-green-500 border-gray-100' : 'border-amber-500 border-gray-100'}`}>
                    <div className={`p-3 rounded-full mr-4 ${reportData.class_average >= 75 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Class Average</p>
                        <p className={`text-2xl font-bold ${reportData.class_average >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                          {reportData.class_average}%
                        </p>
                    </div>
                </div>

                <div className={`bg-white rounded-xl shadow-sm border p-6 flex items-center border-l-4 ${reportData.defaulter_count > 0 ? 'border-red-500' : 'border-green-500'}`}>
                    <div className={`p-3 rounded-full mr-4 ${reportData.defaulter_count > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Defaulters</p>
                        <p className={`text-2xl font-bold ${reportData.defaulter_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {reportData.defaulter_count} <span className="text-sm font-normal text-gray-400">students</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 shrink-0 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.students} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="roll_number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip 
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {reportData.students.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors ${
                  activeTab === 'all' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setActiveTab('defaulters')}
                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none flex items-center transition-colors ${
                  activeTab === 'defaulters' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Defaulters
                <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'defaulters' ? 'bg-white text-red-600' : 'bg-red-100 text-red-600'
                }`}>
                  {reportData.defaulter_count}
                </span>
              </button>
            </div>

            {activeTab === 'all' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
                  <div className="overflow-x-auto overflow-y-auto flex-1">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Roll No</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Present</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Absent</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Attendance %</th>
                                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Last Emotion
                                  </th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100 text-sm">
                              {reportData.students.map((student) => (
                                  <tr key={student.roll_number} className="hover:bg-gray-50">
                                      <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900 border-l-4 border-transparent">
                                          {student.roll_number}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                                          {student.name}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-center text-gray-900">
                                          {student.present}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-center text-gray-500">
                                          {student.absent}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-center text-gray-500">
                                          {student.total_classes}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-center font-bold">
                                          <span className={student.percentage >= 75 ? "text-green-600" : student.percentage >= 60 ? "text-amber-500" : "text-red-500"}>
                                              {student.percentage}%
                                          </span>
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-right">
                                          {student.percentage >= 75 ? (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                  Regular
                                              </span>
                                          ) : student.percentage >= 60 ? (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                  At Risk
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                  Defaulter
                                              </span>
                                          )}
                                      </td>
                                      <td className="px-4 py-2 text-center text-sm text-gray-700">
                                        {(() => {
                                          const e = (student as any).last_emotion
                                          if (!e || e === 'N/A') return '—'
                                          const map: Record<string, string> = {
                                            happy: '😊 Happy', sad: '😢 Sad',
                                            angry: '😠 Angry', neutral: '😐 Neutral',
                                            surprised: '😲 Surprised', fearful: '😨 Fearful',
                                            disgusted: '🤢 Disgusted'
                                          }
                                          return map[e.toLowerCase()] || '😐 Neutral'
                                        })()}
                                      </td>
                                  </tr>
                              ))}
                              {reportData.students.length === 0 && (
                                  <tr>
                                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                          No student records found for the selected criteria.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
            )}

            {activeTab === 'defaulters' && (
              <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden flex flex-col flex-1 min-h-0">
                  <div className="px-6 py-4 border-b border-red-200 bg-red-100/50 flex justify-between items-center">
                    <h3 className="font-bold text-red-800">Students Below 75% Attendance</h3>
                  </div>
                  <div className="overflow-x-auto overflow-y-auto flex-1">
                      <table className="min-w-full divide-y divide-red-200">
                          <thead className="bg-red-50/80 sticky top-0">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Roll No</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Name</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-red-800 uppercase tracking-wider">Present</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-red-800 uppercase tracking-wider">Total</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-red-800 uppercase tracking-wider">Attendance %</th>
                                  <th className="px-6 py-3 text-right text-xs font-bold text-red-800 uppercase tracking-wider">Needs X More Classes</th>
                              </tr>
                          </thead>
                          <tbody className="bg-red-50 divide-y divide-red-100 text-sm">
                              {reportData.defaulters.map((student) => (
                                  <tr key={student.roll_number} className="hover:bg-red-100/50 border-l-4 border-red-500">
                                      <td className="px-6 py-3 whitespace-nowrap font-medium text-red-900">
                                          {student.roll_number}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-red-800">
                                          {student.name}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-center font-medium text-red-900">
                                          {student.present}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-center text-red-700">
                                          {student.total_classes}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-red-600">
                                          {student.percentage}%
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-right font-medium text-red-700">
                                          {student.shortfall} more classes needed
                                      </td>
                                  </tr>
                              ))}
                              {reportData.defaulters.length === 0 && (
                                  <tr>
                                      <td colSpan={6} className="px-6 py-12 text-center text-red-600 font-medium border-l-4 border-red-500">
                                          Great news! There are no defaulters for this course.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
