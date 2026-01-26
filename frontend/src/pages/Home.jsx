import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";

export default function Home() {
  const navigate = useNavigate();
  const token = getToken();

  return (
    <div className="min-h-screen page px-6 pt-16 pb-32 bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <h1 className="text-4xl font-bold mb-4 leading-tight">
        Eat smarter. <br />
        Live healthier.
      </h1>

      <p className="text-gray-600 mb-10 text-lg">
        Smart Meal Planner helps you discover meals that fit your body,
        lifestyle, and goals — all in one simple, modern app.
      </p>

      {/* Features */}
      <div className="grid gap-4 mb-12">
        <div className="bg-white p-4 rounded-2xl shadow-sm flex gap-3">
          <span>🥗</span>
          <span>Personalized meal planning based on your profile</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex gap-3">
          <span>🔍</span>
          <span>Search meals that match your preferences</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex gap-3">
          <span>📱</span>
          <span>Works offline and installable like a mobile app</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex gap-3">
          <span>⚡</span>
          <span>Fast, simple, and distraction-free experience</span>
        </div>
      </div>

      {/* CTA */}
      {!token ? (
        <div className="space-y-4">
          <button
            onClick={() => navigate("/signup")}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl text-lg font-semibold shadow-lg"
          >
            Get Started Free
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full border border-gray-300 py-4 rounded-2xl text-gray-700"
          >
            I already have an account
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl text-lg font-semibold shadow-lg"
        >
          Continue to App
        </button>
      )}
    </div>
  );
}
