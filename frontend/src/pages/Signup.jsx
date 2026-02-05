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
    <div className="min-h-screen page relative overflow-hidden bg-slate-950 text-white flex items-center justify-center px-6 pb-28">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=2000')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white shadow-btn">
            <i className="fa-solid fa-leaf" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold leading-tight">
              SmartMeal
            </h2>
            <p className="text-white/60 text-sm">Create your account</p>
          </div>
        </div>

        <p className="text-white/60 mb-6">
          Start planning meals that fit your lifestyle
        </p>

        <div className="space-y-4">
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white placeholder-white/40"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            autoComplete="name"
          />

          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white placeholder-white/40"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />

          <input
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white placeholder-white/40"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />

          {error && (
            <div className="text-red-200 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            className="w-full bg-brand-green hover:bg-green-700 text-white py-3.5 rounded-2xl font-bold transition shadow-btn active:scale-[0.99]"
            type="button"
          >
            Create Account
          </button>
        </div>

        <p className="mt-6 text-center text-white/60 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-green font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
