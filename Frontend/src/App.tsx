// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

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

  const [user, setUser] = useState(() => getLocalSession());

  // Listen for login/logout changes
  useEffect(() => {
    const checkSession = () => {
      setUser(getLocalSession());
    };

    window.addEventListener("storage", checkSession);

    return () => window.removeEventListener("storage", checkSession);
  }, []);

  // Hide navbar on login page
  const showNavbar = Boolean(user) && location.pathname !== "/";

  return (
    <>
      {showNavbar && <Navbar />}

      <Routes>
        {/* LOGIN PAGE */}
        <Route path="/" element={<Index />} />

        {/* TEACHER PAGES */}
        <Route
          path="/students"
          element={user ? <StudentsPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/attendance"
          element={user ? <AttendancePage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/marks"
          element={user ? <MarksPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/reports"
          element={user ? <ReportsPage /> : <Navigate to="/" replace />}
        />

        {/* STUDENT PAGE */}
        <Route
          path="/student-private"
          element={user ? <StudentPrivateReport /> : <Navigate to="/" replace />}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true }}>
      <Layout />
    </BrowserRouter>
  );
}