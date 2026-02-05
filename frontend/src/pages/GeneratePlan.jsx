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
  const [favorites, setFavorites] = useState([]);

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
        imageUrl:
          r.image_url || r.imageUrl || r.image || r.image_path || r.photo || null,
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

  const displayName =
    currentUser?.full_name ||
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const getBadge = (meal) => {
    const text = (meal?.reasons || []).join(" ").toLowerCase();
    if (text.includes("low carb")) return { label: "Low Carb", cls: "bg-green-500/90" };
    if (text.includes("high protein"))
      return { label: "High Protein", cls: "bg-orange-500/90" };
    if (text.includes("vegetarian"))
      return { label: "Vegetarian", cls: "bg-blue-500/90" };
    if (text.includes("vegan")) return { label: "Vegan", cls: "bg-emerald-500/90" };
    if (text.includes("keto")) return { label: "Keto", cls: "bg-purple-500/90" };
    if (text.includes("paleo")) return { label: "Paleo", cls: "bg-orange-500/90" };
    if (text.includes("gluten"))
      return { label: "Gluten-Free", cls: "bg-amber-500/90" };
    return null;
  };

  const toggleFavorite = (mealId) => {
    setFavorites((prev) =>
      prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId],
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="min-h-screen pb-28 lg:pb-12">
        <header className="flex items-center justify-between p-4 lg:px-8 bg-slate-950 sticky top-0 z-40 border-b border-white/10">
          <span className="text-xl font-serif font-bold text-brand-green">
            SmartMeal
          </span>
        </header>

        <section className="p-4 lg:p-8">
          <div
            className="relative w-full h-64 lg:h-80 rounded-3xl overflow-hidden flex items-end p-8 lg:p-12"
            style={{
              backgroundImage:
                "linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=2000')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl lg:text-6xl font-serif font-bold text-white mb-2">
                Hello, {displayName}
              </h1>
              <p className="text-lg lg:text-xl text-slate-200 font-light">
                What would you like to cook today?
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 lg:px-8 mt-6 relative z-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-green transition-colors">
                <i className="fa-solid fa-magnifying-glass" />
              </span>
              <input
                className="w-full h-16 lg:h-20 pl-16 pr-28 rounded-2xl bg-slate-900/70 border border-white/10 shadow-xl focus:ring-2 focus:ring-brand-green focus:outline-none text-lg text-white placeholder-slate-500"
                placeholder="Search for dishes, e.g., low carb meals"
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
              <button
                type="button"
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-12 lg:h-14 px-5 rounded-xl bg-brand-green text-white font-bold shadow-btn hover:bg-green-700 transition-colors"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {warnings.length > 0 && (
              <div className="mt-4 space-y-2">
                {warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-3 rounded-2xl text-sm"
                  >
                    {w}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 overflow-x-auto no-scrollbar">
              <div className="flex gap-3">
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
                      className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full border transition-colors ${
                        active
                          ? "bg-brand-green text-white border-brand-green"
                          : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <i className={`fa-solid ${d.icon}`} />
                      <span className="text-sm font-semibold">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8 max-w-[1600px] mx-auto">
            <h2 className="text-2xl lg:text-3xl font-serif font-bold text-white">
              Recommended Meals
            </h2>
            <button
              type="button"
              onClick={() => {
                if (query.trim()) handleSearch();
              }}
              className="text-brand-green hover:underline font-semibold flex items-center gap-2"
            >
              See All <i className="fa-solid fa-arrow-right text-sm" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
            {results.map((meal) => {
              const added = selectedMeals.some((m) => m.id === meal.id);
              const fav = favorites.includes(meal.id);
              const badge = getBadge(meal);

              return (
                <div
                  key={meal.id}
                  className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                    added ? "ring-2 ring-brand-green" : ""
                  }`}
                  onClick={() => toggleMeal(meal)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") toggleMeal(meal);
                  }}
                >
                  {meal.imageUrl ? (
                    <img
                      alt={meal.title}
                      className="w-full h-72 lg:h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                      src={meal.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-72 lg:h-80 bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
                      <i className="fa-solid fa-utensils text-4xl text-white/60" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <button
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(meal.id);
                    }}
                    aria-label={fav ? "Unfavorite" : "Favorite"}
                  >
                    <i className={fav ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
                  </button>

                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-white text-lg font-bold leading-tight">
                        {meal.title}
                      </h3>
                      <span className="text-white/80 text-sm font-semibold whitespace-nowrap">
                        {meal.calories ?? "—"} kcal
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      {badge ? (
                        <span
                          className={`inline-block px-3 py-1 ${badge.cls} text-white text-xs font-bold rounded-lg uppercase tracking-wider`}
                        >
                          {badge.label}
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                          Meal
                        </span>
                      )}

                      {added ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-green text-white text-xs font-bold">
                          <i className="fa-solid fa-check" /> Added
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold">
                          <i className="fa-solid fa-plus" /> Add
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {results.length === 0 && query && !loading && (
            <p className="text-center text-slate-400 mt-10">
              No meals found. Try a different search.
            </p>
          )}

          {results.length === 0 && !query && !loading && (
            <p className="text-center text-slate-400 mt-10">
              Search to see recommended meals.
            </p>
          )}
        </section>
      </main>

      {selectedMeals.length > 0 && (
        <button
          onClick={goToPlan}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-brand-green text-white py-4 rounded-2xl text-lg font-bold shadow-lg z-50"
          type="button"
        >
          View Plan ({selectedMeals.length})
        </button>
      )}
    </div>
  );
}
