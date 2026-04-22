"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Webcam from "react-webcam";
import axios from "axios";

interface SessionData {
  session_id: string;
  course_name: string;
  total_students: number;
  started_at: string;
}

interface DetectedFace {
  student_id: string;
  name: string;
  roll_number: string;
  confidence: number;
  bbox: [number, number, number, number];
  already_marked: boolean;
  is_unknown: boolean;
}

interface ProcessFrameResponse {
  detected: DetectedFace[];
  total_present: number;
  warning?: string;
}

interface PresentStudent {
  student_id: string;
  name: string;
  roll_number: string;
  confidence: number;
  emotion?: string;
  time: string;
}

export default function AttendanceSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const course_id = searchParams.get("course_id");

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [presentStudents, setPresentStudents] = useState<PresentStudent[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalPresent, setTotalPresent] = useState<number>(0);
  const [latestDetected, setLatestDetected] = useState<DetectedFace[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Waiting for faces...");
  const [endingSummary, setEndingSummary] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const presentStudentsRef = useRef<PresentStudent[]>([]);
  const sessionStartedRef = useRef(false);

  // 1. Start session on mount
  useEffect(() => {
    if (!course_id) return
    if (sessionStartedRef.current) {
      console.log('Session already started, skipping duplicate call')
      return
    }
    sessionStartedRef.current = true

    console.log("Course ID from URL:", course_id);

    const startSession = async () => {
      if (!course_id) {
        setError('No course selected')
        return
      }
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "/attendance/start",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + localStorage.getItem("faculty_token")
            },
            body: JSON.stringify({ course_id: course_id })
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Start session error:", response.status, errorData);
          setError("Failed to start session: " + (errorData.detail || response.statusText));
          return;
        }
        
        const data = await response.json();
        console.log("Session started:", data);
        setSessionData(data);
        setTotalStudents(data.total_students || 0);

      } catch (err: any) {
        setError("Failed to start session: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    startSession();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [course_id]);

  // 5. Start interval to process frame
  useEffect(() => {
    if (!sessionData || sessionEnded) return;

    const captureAndProcess = async () => {
      const sessionId = sessionData?.session_id;
      if (isProcessingRef.current) return
      if (!sessionId || !webcamRef.current) return
      isProcessingRef.current = true
      setProcessing(true)
      try {
        const imageSrc = webcamRef.current.getScreenshot({ width: 320, height: 240 })
        if (!imageSrc) {
          console.log('No screenshot available')
          return
        }
        const token = localStorage.getItem('faculty_token')
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_URL + '/attendance/process-frame',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ session_id: sessionId, frame: imageSrc })
          }
        )
        if (!res.ok) {
          console.error('process-frame failed:', res.status)
          return
        }
        const data = await res.json()
        console.log('Detected:', data.detected?.length, 'Total present:', data.total_present)
        
        if (data.warning) console.warn(data.warning)
        
        const detected = data.detected || []
        
        // Update canvas
        const canvas = canvasRef.current
        const webcamVideo = webcamRef.current?.video
        
        if (canvas && webcamVideo) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Get the actual displayed size of the webcam on screen
            const displayWidth = webcamVideo.clientWidth || canvas.width
            const displayHeight = webcamVideo.clientHeight || canvas.height
            
            // Frame was captured at 320x240
            const capturedWidth = 320
            const capturedHeight = 240
            
            // Scale factors to convert from captured coords to display coords
            const scaleX = displayWidth / capturedWidth
            const scaleY = displayHeight / capturedHeight
            
            // Make canvas match the displayed webcam size
            if (canvas.width !== displayWidth) canvas.width = displayWidth
            if (canvas.height !== displayHeight) canvas.height = displayHeight
            
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            detected.forEach((face: any) => {
              if (!face.bbox || face.bbox.length < 4) return
              
              // Scale bbox from captured frame size to display size
              const x1 = face.bbox[0] * scaleX
              const y1 = face.bbox[1] * scaleY
              const x2 = face.bbox[2] * scaleX
              const y2 = face.bbox[3] * scaleY
              const w = x2 - x1
              const h = y2 - y1
              
              if (w <= 0 || h <= 0) return
              
              // Color based on detection state
              if (face.is_unknown) {
                ctx.strokeStyle = '#ef4444'  // red for unknown
              } else if (face.already_marked) {
                ctx.strokeStyle = '#22c55e'  // green for already marked (not blue)
              } else {
                ctx.strokeStyle = '#22c55e'  // green for newly marked
              }
              
              ctx.lineWidth = 3
              ctx.strokeRect(x1, y1, w, h)
              
              // Draw name label above the box
              const label = face.is_unknown 
                ? 'Unknown' 
                : (face.name || 'Detected')
              
              ctx.font = 'bold 13px Arial'
              const textWidth = ctx.measureText(label).width
              
              // Background for text readability
              ctx.fillStyle = face.is_unknown ? '#ef4444' : '#22c55e'
              ctx.fillRect(x1, y1 - 22, textWidth + 8, 20)
              
              // White text
              ctx.fillStyle = '#ffffff'
              ctx.fillText(label, x1 + 4, y1 - 6)
            })
          }
        }
        
        // Update present students list
        console.log('Detected faces:', detected.length, detected)

        // Find students newly marked in this frame
        const newlyMarked = detected.filter((f: any) =>
          f.is_unknown === false &&
          f.already_marked === false &&
          f.student_id != null &&
          f.name != null
        )

        console.log('Newly marked this frame:', newlyMarked.length, newlyMarked.map((f:any) => f.name))

        if (newlyMarked.length > 0) {
          setPresentStudents((prev: any[]) => {
            const existingIds = new Set(prev.map((s: any) => s.student_id))
            const toAdd = newlyMarked
              .filter((f: any) => !existingIds.has(f.student_id))
              .map((f: any) => ({
                student_id: f.student_id,
                name: f.name || 'Unknown',
                roll_number: f.roll_number || '',
                confidence: Math.round(((f.confidence || 0) * 100)),
                emotion: f.emotion || 'neutral',
                time: new Date().toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }))
            if (toAdd.length > 0) {
              console.log('Adding to present list:', toAdd.map(s => s.name))
              return [...toAdd, ...prev]
            }
            return prev
          })
        }

        if (typeof data.total_present === 'number') {
          setTotalPresent(data.total_present)
        }
      } catch (err) {
        console.error('captureAndProcess error:', err)
      } finally {
        isProcessingRef.current = false
        setProcessing(false)
      }
    };

    intervalRef.current = setInterval(captureAndProcess, 1500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionData, sessionEnded]);

  const handleEndSession = async () => {
    const sessionId = sessionData?.session_id;
    if (!sessionId) return
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + '/attendance/end',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('faculty_token')
          },
          body: JSON.stringify({ session_id: sessionId })
        }
      )
      const data = await res.json()
      console.log('End session:', data)
      if (res.ok) {
        alert('Session ended! Present: ' + data.present_count + ', Absent: ' + data.absent_count)
        router.push('/dashboard/attendance/history')
      } else {
        alert('Error: ' + (data.detail || 'Could not end session'))
      }
    } catch (err) {
      console.error('End session error:', err)
      alert('Failed to end session')
    }
  };

  if (!course_id && error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 mb-4 font-medium max-w-lg text-center">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12">
        <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600 font-medium text-lg">Starting session...</p>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="p-6 h-full flex flex-col justify-center items-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-200 text-center max-w-lg shadow-sm">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getEmotionDisplay = (emotion: string) => {
    const map: Record<string, { emoji: string; color: string }> = {
      happy:     { emoji: '😊', color: 'bg-green-100 text-green-800' },
      sad:       { emoji: '😢', color: 'bg-blue-100 text-blue-800' },
      angry:     { emoji: '😠', color: 'bg-red-100 text-red-800' },
      neutral:   { emoji: '😐', color: 'bg-gray-100 text-gray-700' },
      surprised: { emoji: '😲', color: 'bg-yellow-100 text-yellow-800' },
      fearful:   { emoji: '😨', color: 'bg-purple-100 text-purple-800' },
      disgusted: { emoji: '🤢', color: 'bg-orange-100 text-orange-800' },
      unknown:   { emoji: '❓', color: 'bg-gray-100 text-gray-500' },
    }
    return map[emotion] || map['neutral']
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{sessionData?.course_name || "Live Attendance"}</h1>
        {endingSummary && (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium animate-pulse">
            {endingSummary}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start">
        {/* LEFT: Webcam Stack */}
        <div className="flex-1 relative bg-black rounded-xl overflow-hidden shadow-sm border border-gray-200">
          <Webcam
            ref={webcamRef}
            audio={false}
            width={640}
            height={480}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-auto max-w-[640px] max-h-[480px] object-cover mx-auto mx-auto"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />
          <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
             <p>Session ID: {sessionData?.session_id}</p>
             <p>Total enrolled: {totalStudents}</p>
             <p>Interval running: {sessionData?.session_id && !sessionEnded ? "Yes" : "No"}</p>
             <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full transition-colors ${
                 processing ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
               }`}/>
               <span className="text-xs text-gray-400">
                 {processing ? 'Scanning...' : 'Ready'}
               </span>
             </div>
          </div>
        </div>

        {/* RIGHT: Sidebar Panel */}
        <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[480px]">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
            <h2 className="text-3xl font-bold text-green-600">
              {presentStudents.length} <span className="text-lg text-gray-500 font-normal">/ {totalStudents} Present</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1">{sessionData?.course_name}</p>
            {statusMessage && <p className="text-orange-500 text-xs mt-1 font-medium">{statusMessage}</p>}
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 p-4 space-y-3">
            {presentStudents.length === 0 && (latestDetected.length === 0 || latestDetected.every((f) => f.is_unknown)) ? (
              <p className="text-gray-400 text-sm text-center mt-8 italic">Waiting for faces...</p>
            ) : presentStudents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-8 italic">Detecting faces...</p>
            ) : (
              presentStudents.map((student) => (
                <div key={student.student_id} className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div className="flex items-center">
                    <span className="h-2.5 w-2.5 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">
                        {student.name}
                        {student.emotion && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-1.5 align-middle ${getEmotionDisplay(student.emotion).color}`}>
                            {getEmotionDisplay(student.emotion).emoji}{' '}
                            {student.emotion.charAt(0).toUpperCase() + student.emotion.slice(1)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{student.roll_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{student.time}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{Math.round(student.confidence)}%</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50/50 rounded-b-xl flex flex-col">
            {presentStudents.length > 0 && (
              <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Mood Summary
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(
                    presentStudents.reduce((acc: Record<string, number>, s: any) => {
                      const e = s.emotion || 'neutral'
                      acc[e] = (acc[e] || 0) + 1
                      return acc
                    }, {})
                  ).map(([emotion, count]) => (
                    <span
                      key={emotion}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getEmotionDisplay(emotion).color}`}
                    >
                      {getEmotionDisplay(emotion).emoji} {emotion} <span className="opacity-70 ml-0.5">{String(count)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
             <button
               onClick={handleEndSession}
               disabled={isEnding || !sessionData?.session_id}
               className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
             >
               {isEnding ? "Ending..." : "End Session"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
