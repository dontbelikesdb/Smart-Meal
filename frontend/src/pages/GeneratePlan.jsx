import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GeneratePlan() {
  const [days, setDays] = useState(3);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    navigate("/login");
  }

  const searchMeals = () => {
    if (!query.trim()) {
      alert("Please describe what kind of meals you are looking for");
      return;
    }

    setLoading(true);

    const results = [];

    for (let i = 1; i <= days; i++) {
      results.push({
        day: i,
        focus: query,
        meals: [
          "🥣 Breakfast: Healthy Smoothie",
          "🥗 Lunch: Balanced Veg / Protein Bowl",
          "🍲 Dinner: Light Home-style Meal",
        ],
      });
    }

    localStorage.setItem(
      `mealplan_${currentUser.email}`,
      JSON.stringify(results)
    );

    setTimeout(() => {
      navigate("/plan");
    }, 900);
  };

  return (
    <div className="min-h-screen page bg-gradient-to-b from-blue-50 to-white px-4 pt-8 pb-28">
      <h2 className="text-2xl font-bold mb-1">Search Meals</h2>
      <p className="text-gray-500 mb-6">
        Tell us what you’re craving or focusing on
      </p>

      {/* Search Input */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <label className="text-sm text-gray-500 mb-1 block">
          Meal preference
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="High protein, low carb, quick meals…"
          className="w-full p-3 border rounded-xl outline-none"
        />
      </div>

      {/* Days Selector */}
      <div className="bg-white rounded-2xl shadow p-4 mb-8">
        <label className="text-sm text-gray-500 mb-2 block">
          Plan duration
        </label>
        <input
          type="range"
          min="1"
          max="7"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-full accent-green-600"
        />
        <p className="mt-2 text-sm text-gray-600">
          {days} day{days > 1 ? "s" : ""}
        </p>
      </div>

      <button
        onClick={searchMeals}
        disabled={loading}
        className={`w-full py-4 rounded-2xl text-lg shadow-lg transition ${
          loading
            ? "bg-gray-400 text-white"
            : "bg-green-600 text-white"
        }`}
      >
        {loading ? "Searching meals…" : "Search Meals"}
      </button>
    </div>
  );
}
