import { Link, useLocation, useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";

export default function Navbar() {
  const token = getToken();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600 scale-105"
      : "text-gray-500";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50">
      <div className="flex justify-around items-center py-3 text-sm">

        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center transition transform active:scale-95 ${isActive("/")}`}
        >
          <span className="text-xl">🏠</span>
          Home
        </Link>

        {token && (
          <>
            {/* Profile */}
            <Link
              to="/profile"
              className={`flex flex-col items-center transition transform active:scale-95 ${isActive("/profile")}`}
            >
              <span className="text-xl">👤</span>
              Profile
            </Link>

            {/* Search */}
            <Link
              to="/generate"
              className={`flex flex-col items-center transition transform active:scale-95 ${isActive("/generate")}`}
            >
              <span className="text-xl">🔍</span>
              Search
            </Link>
          </>
        )}

        {!token ? (
          <>
            <Link
              to="/login"
              className={`flex flex-col items-center transition transform active:scale-95 ${isActive("/login")}`}
            >
              <span className="text-xl">🔐</span>
              Login
            </Link>

            <Link
              to="/signup"
              className={`flex flex-col items-center transition transform active:scale-95 ${isActive("/signup")}`}
            >
              <span className="text-xl">📝</span>
              Signup
            </Link>
          </>
        ) : (
          <button
            onClick={() => {
              logout();
              alert("👋 Logged out successfully");
              navigate("/login", { replace: true });
            }}
            className="flex flex-col items-center text-red-500 transition transform active:scale-95"
          >
            <span className="text-xl">🚪</span>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
