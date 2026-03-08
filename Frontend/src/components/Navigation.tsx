import { Link, useNavigate, useLocation } from "react-router-dom";
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = (() => {
    try {
      const raw = localStorage.getItem("app_session_v1");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  // Hide navbar only on login page
  if (location.pathname === "/login") return null;

  const handleLogout = () => {
    localStorage.removeItem("app_session_v1");
    navigate("/login");
  };

  return (
    <nav className="w-full bg-gradient-to-r from-[#0c1022] to-[#141a35] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">

        {/* Logo */}
        <span className="font-bold text-2xl tracking-wide text-blue-400">
          CMS
        </span>

        {/* Menu */}
        <div className="flex items-center gap-6 text-[16px] font-medium">

          <Link
            to="/students"
            className={`px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-600 hover:text-white ${
              location.pathname === "/students" ? "bg-blue-600" : ""
            }`}
          >
            Students
          </Link>

          <Link
            to="/attendance"
            className={`px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-600 hover:text-white ${
              location.pathname === "/attendance" ? "bg-blue-600" : ""
            }`}
          >
            Attendance
          </Link>

          <Link
            to="/marks"
            className={`px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-600 hover:text-white ${
              location.pathname === "/marks" ? "bg-blue-600" : ""
            }`}
          >
            Marks
          </Link>

          <Link
            to="/reports"
            className={`px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-600 hover:text-white ${
              location.pathname === "/reports" ? "bg-blue-600" : ""
            }`}
          >
            Reports
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="bg-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}