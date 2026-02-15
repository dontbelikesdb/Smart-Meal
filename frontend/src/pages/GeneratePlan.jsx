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

const _SEARCH_CACHE_KEY = "smartmeal_last_search_v1";

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
  const [expandedMealId, setExpandedMealId] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login", { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(_SEARCH_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.query === "string") setQuery(parsed.query);
        if (Array.isArray(parsed.results)) setResults(parsed.results);
      }
    } catch {
      // ignore
    }
  }, []);

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
        description: r.description ?? null,
        calories: r.calories,
        reasons: r.reasons || [],
        tags: (r.reasons || []).slice(0, 3),
        imageUrl:
          r.image_url ||
          r.imageUrl ||
          r.image ||
          r.image_path ||
          r.photo ||
          null,
        prepTime: r.prep_time ?? r.prepTime ?? null,
        cookTime: r.cook_time ?? r.cookTime ?? null,
        totalTime: r.total_time ?? r.totalTime ?? null,
        servings: r.servings ?? null,
        cuisineType: r.cuisine_type ?? r.cuisineType ?? null,
        proteinG: r.protein_g ?? r.proteinG ?? null,
        carbsG: r.carbs_g ?? r.carbsG ?? null,
        fatG: r.fat_g ?? r.fatG ?? null,
        fiberG: r.fiber_g ?? r.fiberG ?? null,
        sugarG: r.sugar_g ?? r.sugarG ?? null,
        sodiumMg: r.sodium_mg ?? r.sodiumMg ?? null,
        ingredientLines: Array.isArray(r.ingredient_lines)
          ? r.ingredient_lines
          : [],
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        instructions: r.instructions ?? null,
      }));
      setResults(mapped);
      try {
        sessionStorage.setItem(
          _SEARCH_CACHE_KEY,
          JSON.stringify({ query: q, results: mapped }),
        );
      } catch {
        // ignore
      }
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

  const openRecipe = (mealId) => {
    setExpandedMealId(mealId);
  };

  const closeRecipe = () => {
    setExpandedMealId(null);
  };

  const expandedMeal = expandedMealId
    ? results.find((m) => m.id === expandedMealId) || null
    : null;

  useEffect(() => {
    if (!expandedMealId) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeRecipe();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedMealId]);

  /* --------------------------------------------------
     Save (APPEND) & go to plan page 
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

    // read existing plan
    const existingPlan = JSON.parse(localStorage.getItem(key)) || [];

    // merge without duplicates
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
    if (text.includes("low carb"))
      return { label: "Low Carb", cls: "bg-green-500/90" };
    if (text.includes("high protein"))
      return { label: "High Protein", cls: "bg-orange-500/90" };
    if (text.includes("vegetarian"))
      return { label: "Vegetarian", cls: "bg-blue-500/90" };
    if (text.includes("vegan"))
      return { label: "Vegan", cls: "bg-emerald-500/90" };
    if (text.includes("keto"))
      return { label: "Keto", cls: "bg-purple-500/90" };
    if (text.includes("paleo"))
      return { label: "Paleo", cls: "bg-orange-500/90" };
    if (text.includes("gluten"))
      return { label: "Gluten-Free", cls: "bg-amber-500/90" };
    return null;
  };

  const toggleFavorite = (mealId) => {
    setFavorites((prev) =>
      prev.includes(mealId)
        ? prev.filter((id) => id !== mealId)
        : [...prev, mealId],
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
                  onClick={() => openRecipe(meal.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openRecipe(meal.id);
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
                    <i
                      className={
                        fav ? "fa-solid fa-heart" : "fa-regular fa-heart"
                      }
                    />
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

                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                      {typeof meal.prepTime === "number" && (
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10">
                          <i className="fa-regular fa-clock" /> Prep{" "}
                          {meal.prepTime}m
                        </span>
                      )}
                      {typeof meal.cookTime === "number" && (
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10">
                          <i className="fa-solid fa-fire" /> Cook{" "}
                          {meal.cookTime}m
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10">
                        <i className="fa-solid fa-chevron-down" />
                        View
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

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMeal(meal);
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          added
                            ? "bg-brand-green text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                        aria-label={added ? "Remove from plan" : "Add to plan"}
                      >
                        <i
                          className={
                            added ? "fa-solid fa-check" : "fa-solid fa-plus"
                          }
                        />
                        {added ? "Added" : "Add"}
                      </button>
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

      {expandedMeal && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={closeRecipe}
        >
          <div
            className="absolute inset-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full w-full overflow-hidden">
              <div className="h-full w-full bg-slate-950 text-white">
                <div className="relative h-64 sm:h-80">
                  {expandedMeal.imageUrl ? (
                    <img
                      alt={expandedMeal.title}
                      src={expandedMeal.imageUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/40 to-black/20" />

                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center"
                      onClick={closeRecipe}
                      aria-label="Close"
                    >
                      <i className="fa-solid fa-arrow-left" />
                    </button>

                    <button
                      type="button"
                      className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center"
                      onClick={() => toggleFavorite(expandedMeal.id)}
                      aria-label={
                        favorites.includes(expandedMeal.id)
                          ? "Unfavorite"
                          : "Favorite"
                      }
                    >
                      <i
                        className={
                          favorites.includes(expandedMeal.id)
                            ? "fa-solid fa-heart"
                            : "fa-regular fa-heart"
                        }
                      />
                    </button>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5">
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
                      {expandedMeal.title}
                    </h2>
                    {expandedMeal.description && (
                      <p className="mt-2 text-white/70 text-sm sm:text-base line-clamp-3">
                        {expandedMeal.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-[calc(100%-16rem)] sm:h-[calc(100%-20rem)] overflow-auto pb-28">
                  <div className="p-5 max-w-4xl mx-auto">
                    <div className="flex flex-wrap gap-2 text-xs text-white/80">
                      {typeof expandedMeal.prepTime === "number" && (
                        <span className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                          Prep: {expandedMeal.prepTime} min
                        </span>
                      )}
                      {typeof expandedMeal.cookTime === "number" && (
                        <span className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                          Cook: {expandedMeal.cookTime} min
                        </span>
                      )}
                      {typeof expandedMeal.totalTime === "number" && (
                        <span className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                          Total: {expandedMeal.totalTime} min
                        </span>
                      )}
                      {typeof expandedMeal.servings === "number" && (
                        <span className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                          Servings: {expandedMeal.servings}
                        </span>
                      )}
                      {expandedMeal.cuisineType && (
                        <span className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 capitalize">
                          Cuisine: {expandedMeal.cuisineType}
                        </span>
                      )}
                      <span className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                        Calories: {expandedMeal.calories ?? "—"}
                      </span>
                    </div>

                    {(expandedMeal.proteinG != null ||
                      expandedMeal.carbsG != null ||
                      expandedMeal.fatG != null) && (
                      <div className="mt-5 bg-white/5 border border-white/10 rounded-3xl p-4">
                        <div className="text-white font-bold mb-3">
                          Nutrition
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-white/80">
                          {expandedMeal.proteinG != null && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                              <div className="text-white/60 text-xs">
                                Protein
                              </div>
                              <div className="text-white font-bold">
                                {Number(expandedMeal.proteinG).toFixed(1)} g
                              </div>
                            </div>
                          )}
                          {expandedMeal.carbsG != null && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                              <div className="text-white/60 text-xs">Carbs</div>
                              <div className="text-white font-bold">
                                {Number(expandedMeal.carbsG).toFixed(1)} g
                              </div>
                            </div>
                          )}
                          {expandedMeal.fatG != null && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                              <div className="text-white/60 text-xs">Fat</div>
                              <div className="text-white font-bold">
                                {Number(expandedMeal.fatG).toFixed(1)} g
                              </div>
                            </div>
                          )}
                          {expandedMeal.fiberG != null && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                              <div className="text-white/60 text-xs">Fiber</div>
                              <div className="text-white font-bold">
                                {Number(expandedMeal.fiberG).toFixed(1)} g
                              </div>
                            </div>
                          )}
                          {expandedMeal.sugarG != null && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                              <div className="text-white/60 text-xs">Sugar</div>
                              <div className="text-white font-bold">
                                {Number(expandedMeal.sugarG).toFixed(1)} g
                              </div>
                            </div>
                          )}
                          {expandedMeal.sodiumMg != null && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                              <div className="text-white/60 text-xs">
                                Sodium
                              </div>
                              <div className="text-white font-bold">
                                {Number(expandedMeal.sodiumMg).toFixed(0)} mg
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(expandedMeal.ingredientLines?.length > 0 ||
                      expandedMeal.ingredients?.length > 0) && (
                      <div className="mt-6">
                        <div className="text-white font-bold mb-3">
                          Ingredients
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/80">
                          {(expandedMeal.ingredientLines?.length > 0
                            ? expandedMeal.ingredientLines
                            : expandedMeal.ingredients
                          ).map((ing, idx) => (
                            <div
                              key={`${expandedMeal.id}-modal-ing-${idx}`}
                              className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2"
                            >
                              {ing}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {expandedMeal.instructions && (
                      <div className="mt-6">
                        <div className="text-white font-bold mb-3">
                          Instructions
                        </div>
                        <div className="text-sm text-white/80 whitespace-pre-line bg-white/5 border border-white/10 rounded-3xl p-4">
                          {expandedMeal.instructions}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="fixed left-0 right-0 bottom-0 z-[61] p-4 safe-area-pb bg-slate-950/70 backdrop-blur border-t border-white/10">
                  <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <button
                      type="button"
                      onClick={closeRecipe}
                      className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleMeal(expandedMeal)}
                      className={`flex-1 py-3 rounded-2xl font-bold transition-colors ${
                        selectedMeals.some((m) => m.id === expandedMeal.id)
                          ? "bg-brand-green text-white"
                          : "bg-brand-green text-white hover:bg-green-700"
                      }`}
                    >
                      {selectedMeals.some((m) => m.id === expandedMeal.id)
                        ? "Added to Plan"
                        : "Add to Plan"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
