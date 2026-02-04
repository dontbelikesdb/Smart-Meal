import { Link, useLocation, useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";

export default function Navbar() {
  const token = getToken();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const isActive = (path) =>
    location.pathname === path
      ? "text-brand-green"
      : isHome
        ? "text-white/50"
        : "text-gray-400";

  const gatedPath = (path) => (token ? path : "/login");

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 safe-area-pb z-50 ${
        isHome
          ? "bg-gray-900 border-t border-white/10"
          : "bg-white border-t border-gray-200"
      }`}
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center transition-colors ${
            isHome ? "hover:bg-white/5" : "hover:bg-gray-50"
          } ${isActive("/")}`}
        >
          <i className="fa-solid fa-house text-xl mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          to={gatedPath("/profile")}
          className={`flex flex-col items-center justify-center transition-colors ${
            isHome ? "hover:bg-white/5" : "hover:bg-gray-50"
          } ${isActive("/profile")}`}
        >
          <i className="fa-solid fa-user text-xl mb-1" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>

        <Link
          to={gatedPath("/generate")}
          className={`flex flex-col items-center justify-center transition-colors ${
            isHome ? "hover:bg-white/5" : "hover:bg-gray-50"
          } ${isActive("/generate")}`}
        >
          <i className="fa-solid fa-magnifying-glass text-xl mb-1" />
          <span className="text-[10px] font-medium">Search</span>
        </Link>

        <Link
          to={gatedPath("/plan")}
          className={`flex flex-col items-center justify-center transition-colors ${
            isHome ? "hover:bg-white/5" : "hover:bg-gray-50"
          } ${isActive("/plan")}`}
        >
          <i className="fa-solid fa-calendar-days text-xl mb-1" />
          <span className="text-[10px] font-medium">Plan</span>
        </Link>

        {token ? (
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
              isHome ? "hover:bg-white/5" : "hover:bg-gray-50"
            } ${isHome ? "text-white/50 hover:text-brand-green" : "text-gray-400 hover:text-brand-green"}`}
            type="button"
          >
            <i className="fa-solid fa-right-from-bracket text-xl mb-1" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center justify-center transition-colors ${
              isHome ? "hover:bg-white/5" : "hover:bg-gray-50"
            } ${isActive("/login")}`}
          >
            <i className="fa-solid fa-right-to-bracket text-xl mb-1" />
            <span className="text-[10px] font-medium">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
