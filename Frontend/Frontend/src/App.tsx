// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";

import Index from "@/pages/Index";
import StudentsPage from "@/pages/Students";
import AttendancePage from "@/pages/Attendance";
import MarksPage from "@/pages/Marks";
import ReportsPage from "@/pages/Reports";
import StudentPrivateReport from "@/pages/StudentPrivateReport";
import NotFound from "@/pages/NotFound";

import Navbar from "@/components/Navbar";

// Read session
const getLocalSession = () => {
  try {
    const raw = localStorage.getItem("app_session_v1");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function Layout() {
  const location = useLocation();
  const user = getLocalSession();

  // Hide navbar ONLY on login page
  const hideNavbar = location.pathname === "/";

  return (
    <>
      {/* Navbar appears ONLY when logged in and NOT on login page */}
      {!hideNavbar && user && <Navbar />}

      <Routes>
        {/* LOGIN PAGE */}
        <Route path="/" element={<Index />} />

        {/* TEACHER PAGES */}
        <Route
          path="/students"
          element={user ? <StudentsPage /> : <Navigate to="/" />}
        />
        <Route
          path="/attendance"
          element={user ? <AttendancePage /> : <Navigate to="/" />}
        />
        <Route
          path="/marks"
          element={user ? <MarksPage /> : <Navigate to="/" />}
        />
        <Route
          path="/reports"
          element={user ? <ReportsPage /> : <Navigate to="/" />}
        />

        {/* STUDENT PAGE */}
        <Route
          path="/student-private"
          element={user ? <StudentPrivateReport /> : <Navigate to="/" />}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

