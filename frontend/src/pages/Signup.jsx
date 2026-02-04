import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../api/authApi";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    password: "",
  });
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!form.email || !form.password || !form.full_name) {
      setError("Please fill in all fields");
      return;
    }

    try {
      await signup(form.email, form.password, form.full_name);
      alert("Account created successfully! Please login.");
      navigate("/login");
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Signup failed";
      setError(String(msg));
    }
  };

  return (
    <div className="min-h-screen page flex items-center justify-center px-6 bg-gradient-to-b from-green-50 to-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-2">Create your account</h2>
        <p className="text-gray-500 mb-8">
          Start planning meals that fit your lifestyle
        </p>

        <div className="space-y-4">
          <input
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />

          <input
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Create Account
          </button>
        </div>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
