import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { searchNL } from "../api/searchApi";
import { getCurrentUser } from "../utils/auth";

const _diets = [
  { label: "Keto", icon: "fa-egg", query: "keto" },
  { label: "Vegan", icon: "fa-seedling", query: "vegan" },
  { label: "Gluten-Free", icon: "fa-bread-slice", query: "gluten free" },
  { label: "Paleo", icon: "fa-drumstick-bite", query: "paleo" },
  { label: "Vegetarian", icon: "fa-carrot", query: "vegetarian" },
];

export default function GeneratePlan() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDiet, setActiveDiet] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login", { replace: true });
    }
  }, [currentUser, navigate]);

  /* --------------------------------------------------
     Search logic
  -------------------------------------------------- */
  const handleSearch = async (overrideQuery) => {
    const q = String(overrideQuery ?? query).trim();
    if (!q) {
      alert("Please enter what kind of meals you want");
      return;
    }

    setLoading(true);
    setWarnings([]);
    try {
      const resp = await searchNL(q, 20);
      const apiWarnings = resp?.data?.applied?.warnings || [];
      setWarnings(Array.isArray(apiWarnings) ? apiWarnings : []);

      const rows = resp?.data?.results || [];
      const mapped = rows.map((r) => ({
        id: r.id,
        title: r.name,
        calories: r.calories,
        reasons: r.reasons || [],
        tags: (r.reasons || []).slice(0, 3),
        protein: "",
        time: "",
      }));
      setResults(mapped);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Search failed";
      alert(String(msg));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
     Add / Remove meals
  -------------------------------------------------- */
  const toggleMeal = (meal) => {
    if (selectedMeals.find((m) => m.id === meal.id)) {
      setSelectedMeals(selectedMeals.filter((m) => m.id !== meal.id));
    } else {
      setSelectedMeals([...selectedMeals, meal]);
    }
  };

  /* --------------------------------------------------
     Save (APPEND) & go to plan page ✅
  -------------------------------------------------- */
  const goToPlan = () => {
    if (!currentUser?.email) {
      navigate("/login", { replace: true });
      return;
    }

    if (selectedMeals.length === 0) {
      alert("Please add at least one meal to your plan");
      return;
    }

    const key = `mealplan_${currentUser.email}`;

    // 👇 read existing plan
    const existingPlan = JSON.parse(localStorage.getItem(key)) || [];

    // 👇 merge without duplicates
    const mergedPlan = [
      ...existingPlan,
      ...selectedMeals.filter(
        (meal) => !existingPlan.some((m) => m.id === meal.id),
      ),
    ];

    localStorage.setItem(key, JSON.stringify(mergedPlan));

    navigate("/plan");
  };

  return (
    <div className="min-h-screen page bg-cream-bg text-gray-900">
      <div className="flex-1 px-5 md:px-12 pt-8 pb-28 md:pb-12 max-w-7xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl leading-tight text-[#1A4D1A]">
            Meal
            <br className="md:hidden" /> Discovery Search
          </h1>
        </header>

        <div className="space-y-6 lg:space-y-0 lg:flex lg:items-center lg:gap-4 mb-6">
          <section className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-forest-green text-lg" />
            </div>
            <input
              className="block w-full pl-12 pr-4 py-4 border-none shadow-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-forest-green focus:outline-none bg-white rounded-2xl"
              placeholder="Low carb, vegan, high protein..."
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (activeDiet) setActiveDiet(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </section>
          <div className="lg:w-48">
            <button
              type="button"
              onClick={handleSearch}
              className="w-full bg-[#2F6B28] hover:bg-forest-green text-white font-bold py-4 rounded-2xl shadow-md transition-colors text-lg"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="mb-6 space-y-2">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-2xl text-sm"
              >
                {w}
              </div>
            ))}
          </div>
        )}

        <section className="mb-8 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 md:gap-4 no-scrollbar">
            {_diets.map((d) => {
              const active = activeDiet === d.label;
              return (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    const nextActive = active ? null : d.label;
                    const nextQuery = active ? "" : d.query;
                    setActiveDiet(nextActive);
                    setQuery(nextQuery);
                    if (nextQuery) handleSearch(nextQuery);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[4.5rem] h-20 bg-[#FFFBF2] border rounded-2xl transition-colors ${
                    active
                      ? "border-forest-green bg-[#F2EDE1]"
                      : "border-[#EBE5D5] hover:bg-[#F2EDE1]"
                  }`}
                >
                  <i
                    className={`fa-solid ${d.icon} text-xl mb-1 ${
                      active ? "text-forest-green" : "text-filter-text"
                    }`}
                  />
                  <span className="text-xs font-medium text-[#4A4A4A]">
                    {d.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {results.map((meal) => {
            const added = selectedMeals.some((m) => m.id === meal.id);

            return (
              <article
                key={meal.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-lg cursor-pointer transition-transform active:scale-[0.99] ${
                  added ? "ring-4 ring-forest-green/50" : ""
                }`}
                onClick={() => toggleMeal(meal)}
              >
                <div className="p-4 md:p-5">
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-forest-green/10 via-leaf-green/5 to-white flex items-center justify-center mb-4">
                    <i className="fa-solid fa-utensils text-forest-green text-2xl opacity-80" />
                  </div>

                  <h3 className="font-bold text-base md:text-lg leading-snug mb-2 text-[#1A4D1A]">
                    {meal.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-600">
                      {meal.calories ?? "—"} kcal
                    </span>

                    {added ? (
                      <span className="bg-[#D1FAE5] text-[#065F46] text-[10px] md:text-xs font-bold px-2 py-1 rounded-full">
                        Added
                      </span>
                    ) : (
                      <span className="text-[10px] md:text-xs font-semibold text-forest-green">
                        Tap to add
                      </span>
                    )}
                  </div>

                  {meal.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {meal.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] md:text-xs bg-[#E9EFE9] text-forest-green px-2 py-1 rounded-full font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {results.length === 0 && query && !loading && (
          <p className="text-center text-gray-500 mt-10">
            No meals found. Try a different search.
          </p>
        )}
      </div>

      {/* View plan */}
      {selectedMeals.length > 0 && (
        <button
          onClick={goToPlan}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-[#1E4620] text-white py-4 rounded-2xl text-lg font-bold shadow-lg z-50"
          type="button"
        >
          View Plan ({selectedMeals.length})
        </button>
      )}
    </div>
  );
}
