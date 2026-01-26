import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setToken } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      setError("Invalid email or password");
      return;
    }

    setToken("demo-token");
    localStorage.setItem("currentUser", JSON.stringify(user));

    const profile = localStorage.getItem(`profile_${user.email}`);
    navigate(profile ? "/generate" : "/profile", { replace: true });
  };

  return (
    <div className="min-h-screen page flex items-center justify-center px-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-2">Welcome back 👋</h2>
        <p className="text-gray-500 mb-8">
          Log in to continue planning your meals
        </p>

        <div className="space-y-4">
          <input
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Login
          </button>
        </div>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
