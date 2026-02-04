import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getMe } from "../api/authApi";
import { setCurrentUser, setToken } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      const resp = await login(email, password);
      const token = resp?.data?.access_token;
      if (!token) {
        setError("Login failed: missing access token");
        return;
      }

      setToken(token);

      const me = await getMe();
      setCurrentUser(me?.data);

      navigate("/profile", { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Invalid email or password";
      setError(String(msg));
    }
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
