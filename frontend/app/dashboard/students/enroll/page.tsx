"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Webcam from "react-webcam";

interface Student {
  id: string;
  name: string;
  roll_number: string;
  division: string;
  year: string;
  is_enrolled: boolean;
}

function EnrollStudentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"webcam" | "upload">("webcam");

  // Webcam State
  const webcamRef = useRef<Webcam>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Upload State
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setError("No student ID provided.");
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("faculty_token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudent(res.data);
      } catch (err: any) {
        setError("Failed to fetch student details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  const startAutomatedCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCapturedPhotos([]);
    setError(null);
    let count = 0;

    const interval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          setCapturedPhotos((prev) => {
            const newPhotos = [...prev, imageSrc];
            count = newPhotos.length;
            if (count >= 5) {
              clearInterval(interval);
              setIsCapturing(false);
            }
            return newPhotos;
          });
        }
      }
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    
    // Ensure it's an image
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedPhoto(reader.result);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);
  };

  const handleEnrollment = async () => {
    setError(null);
    setSubmitting(true);
    
    let photosPayload: string[] = [];
    
    if (activeTab === "webcam") {
        if (capturedPhotos.length < 5) {
            setError("Please capture exactly 5 photos using the webcam.");
            setSubmitting(false);
            return;
        }
        // Strip out the data URL wrapper to send pure base64 if needed, 
        // but typically backend handles 'data:image/jpeg;base64,' cleanly. 
        // We'll send it as-is, backend should split based on standard practices.
        photosPayload = capturedPhotos.map(p => p.split(',')[1] || p);
    } else {
        if (!uploadedPhoto) {
            setError("Please upload an image first.");
            setSubmitting(false);
            return;
        }
        photosPayload = [uploadedPhoto.split(',')[1] || uploadedPhoto];
    }

    try {
      const token = localStorage.getItem("faculty_token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}/enroll`,
        { photos: photosPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setStudent(prev => prev ? { ...prev, is_enrolled: true } : null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to enroll student face. Please ensure clear lighting and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse"></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-64 bg-gray-100 rounded w-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10">
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-100 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Enrolled Successfully!</h2>
            <p className="text-green-700 mb-8 mt-4">
                The face biometrics for <strong>{student?.name}</strong> ({student?.roll_number}) have been securely saved and processed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={() => {
                        setSuccess(false);
                        setCapturedPhotos([]);
                        setUploadedPhoto(null);
                    }}
                    className="inline-flex justify-center items-center px-4 py-2 border border-green-600 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
                >
                    Enroll Again
                </button>
                <Link
                    href="/dashboard/students"
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                    Back to Directory
                </Link>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/students" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center text-sm font-medium">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Students
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Face Enrollment</h1>
            <p className="text-sm text-gray-500 mt-1">Register biometrics for tracking attendance.</p>
          </div>
          {student?.is_enrolled && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
               Already Enrolled
            </span>
          )}
        </div>
        
        <div className="p-6 border-b border-gray-100 grid md:grid-cols-2 gap-4">
            <div>
                <p className="text-sm font-medium text-gray-500">Student Name</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{student?.name}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Roll Number</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 font-mono">{student?.roll_number}</p>
            </div>
        </div>

        {error && (
            <div className="mx-6 mt-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm font-medium">
                {error}
            </div>
        )}

        <div className="p-6">
            <div className="flex border-b border-gray-200 mb-6 space-x-8">
                <button
                    className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'webcam' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setActiveTab('webcam'); setError(null); }}
                >
                    Webcam Capture
                </button>
                <button
                    className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setActiveTab('upload'); setError(null); }}
                >
                    Upload Photo
                </button>
            </div>

            {activeTab === 'webcam' && (
                <div className="space-y-6">
                    <div className="bg-black rounded-lg overflow-hidden relative shadow-inner aspect-video md:aspect-auto md:h-[400px] flex items-center justify-center">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                            className="object-cover w-full h-full"
                        />
                        {isCapturing && (
                            <div className="absolute inset-0 bg-white/20 flex items-center justify-center border-4 border-red-500 animate-pulse">
                                <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">Capturing... {capturedPhotos.length}/5</span>
                            </div>
                        )}
                    </div>

                    {capturedPhotos.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Captured Previews ({capturedPhotos.length}/5):</p>
                            <div className="flex gap-2 lg:gap-4 overflow-x-auto pb-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 overflow-hidden ${capturedPhotos[i] ? 'border-green-500' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                                        {capturedPhotos[i] ? (
                                            <img src={capturedPhotos[i]} alt={`Capture ${i+1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                {i + 1}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100 justify-end">
                        <button
                            onClick={startAutomatedCapture}
                            disabled={isCapturing}
                            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {capturedPhotos.length > 0 ? "Retake Photos" : "Start Capture"}
                        </button>
                        <button
                            onClick={handleEnrollment}
                            disabled={capturedPhotos.length < 5 || submitting}
                            className="inline-flex justify-center items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Processing..." : "Enroll Student"}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'upload' && (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-4 flex text-sm text-gray-600 justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none px-1">
                                <span>Upload a file</span>
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG, JPEG up to 10MB. Must clearly show face.</p>
                    </div>

                    {uploadedPhoto && (
                        <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-white shadow-sm inline-block w-full text-center">
                            <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg overflow-hidden mx-auto shadow">
                                <img src={uploadedPhoto} alt="Upload Preview" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}

                    <div className="flex pt-4 border-t border-gray-100 justify-end">
                        <button
                            onClick={handleEnrollment}
                            disabled={!uploadedPhoto || submitting}
                            className="inline-flex justify-center items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Processing..." : "Enroll Uploaded Photo"}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function EnrollStudentPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading enrollment interface...</div>}>
            <EnrollStudentContent />
        </Suspense>
    );
}
