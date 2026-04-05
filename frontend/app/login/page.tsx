// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function FacultyLogin() {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState<string | null>(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const router = useRouter();

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError(null);
//         setIsLoading(true);

//         try {
//             const res = await fetch('http://localhost:8000/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ email, password }),
//             });

//             if (!res.ok) {
//                 throw new Error('Invalid email or password');
//             }

//             const data = await res.json();

//             if (data.token) {
//                 localStorage.setItem('faculty_token', data.token);
//                 router.push('/dashboard');
//             } else {
//                 throw new Error('Token not found in response');
//             }
//         } catch (err: any) {
//             setError(err.message || 'An error occurred during login');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
//             <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
//                 <div className="flex flex-col items-center mb-8">
//                     <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-lg mb-6">
//                         <span className="text-gray-500 font-bold tracking-wider">LOGO</span>
//                     </div>
//                     <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Faculty Login</h1>
//                     <p className="text-sm text-gray-500 mt-2 text-center">
//                         Face Recognition Attendance System
//                     </p>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-6">
//                     <div>
//                         <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                             Email address
//                         </label>
//                         <input
//                             id="email"
//                             name="email"
//                             type="email"
//                             autoComplete="email"
//                             required
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
//                             placeholder="Enter your email"
//                         />
//                     </div>

//                     <div>
//                         <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                             Password
//                         </label>
//                         <input
//                             id="password"
//                             name="password"
//                             type="password"
//                             autoComplete="current-password"
//                             required
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
//                             placeholder="Enter your password"
//                         />
//                     </div>

//                     <button
//                         type="submit"
//                         disabled={isLoading}
//                         className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
//                     >
//                         {isLoading ? (
//                             <>
//                                 <svg
//                                     className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                                     xmlns="http://www.w3.org/2000/svg"
//                                     fill="none"
//                                     viewBox="0 0 24 24"
//                                 >
//                                     <circle
//                                         className="opacity-25"
//                                         cx="12"
//                                         cy="12"
//                                         r="10"
//                                         stroke="currentColor"
//                                         strokeWidth="4"
//                                     />
//                                     <path
//                                         className="opacity-75"
//                                         fill="currentColor"
//                                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                                     />
//                                 </svg>
//                                 Signing in...
//                             </>
//                         ) : (
//                             'Sign in'
//                         )}
//                     </button>
//                 </form>

//                 {error && (
//                     <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-lg animate-fade-in">
//                         <p className="text-sm text-red-600 text-center font-medium">{error}</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }


"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function FacultyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        email,
        password,
      });

      const token = response.data.access_token;
      
      // Decode JWT to extract faculty info securely
      const payloadBase64 = token.split('.')[1];
      const payloadDecoded = JSON.parse(atob(payloadBase64));

      localStorage.setItem("faculty_token", token);
      localStorage.setItem("faculty_name", payloadDecoded.name || "Faculty Member");
      localStorage.setItem("faculty_id", payloadDecoded.sub || "");

      router.push("/dashboard");
    } catch (err: any) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-300 flex flex-col items-center justify-center p-2 rounded text-center">
            <span className="text-xs font-bold text-gray-700 leading-tight">
              FACE<br />ATTENDANCE
            </span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Faculty Login
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm py-3 px-3 rounded text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
