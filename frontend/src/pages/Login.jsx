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
            <p className="text-white/60 text-sm">Welcome back</p>
          </div>
        </div>

        <p className="text-white/60 mb-6">
          Log in to continue planning your meals
        </p>

        <div className="space-y-4">
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white placeholder-white/40"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white placeholder-white/40"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
            Login
          </button>
        </div>

        <p className="mt-6 text-center text-white/60 text-sm">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-brand-green font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
