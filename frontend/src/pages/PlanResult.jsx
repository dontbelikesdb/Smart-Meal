import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/auth";

const _fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDu7F1GZildoPkQwlmkdCrVYHPKjK5xrJ1P7I88EPD4jgKyV7EL8wCH2-q-UzBOb4HZfVWXqOssKBorvvmaR-pB_Et6QZcfchxNhMUDt7mRB8uew2CwYiGFnnrvdOUe7la1ezB7OgmdSmv9du81bCB_fdfIb-uo0PYV-4AUbB9WhVCHtKDeIo51DidymHAZgwdihPQoSwOTHoKfb56NJ5jmFJ9e00TqKt44AgUq2aOORYlbn49DlzmGgBJEdZ57ci9ZPOYlejxvfRZ3";

const _getMealImage = (meal) =>
  meal?.image_url ||
  meal?.imageUrl ||
  meal?.image ||
  meal?.image_path ||
  meal?.photo ||
  null;

export default function PlanResult() {
  const navigate = useNavigate();
  const userEmail = getCurrentUser()?.email || "";
  const [meals, setMeals] = useState([]);
  const [expandedMealId, setExpandedMealId] = useState(null);

  /* -----------------------------------------
     Load plan
  ----------------------------------------- */
  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    const stored = localStorage.getItem(`mealplan_${userEmail}`);

    if (stored) {
      setMeals(JSON.parse(stored));
    }
  }, [userEmail, navigate]);

  /* -----------------------------------------
     Remove single meal
  ----------------------------------------- */
  const removeMeal = (id) => {
    const updated = meals.filter((m) => m.id !== id);
    setMeals(updated);

    localStorage.setItem(`mealplan_${userEmail}`, JSON.stringify(updated));
  };

  /* -----------------------------------------
     Clear entire plan
  ----------------------------------------- */
  const clearPlan = () => {
    if (!window.confirm("Clear your entire meal plan?")) return;

    setMeals([]);
    localStorage.removeItem(`mealplan_${userEmail}`);
  };

  const openRecipe = (mealId) => {
    setExpandedMealId(mealId);
  };

  const closeRecipe = () => {
    setExpandedMealId(null);
  };

  const expandedMeal = expandedMealId
    ? meals.find((m) => m.id === expandedMealId) || null
    : null;

  useEffect(() => {
    if (!expandedMealId) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeRecipe();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedMealId]);

  /* -----------------------------------------
     Empty state
  ----------------------------------------- */
  if (!meals.length) {
    return (
      <div className="min-h-screen page relative overflow-hidden bg-gray-950 text-white">
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${_fallbackImage})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center pb-28">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="font-serif text-3xl font-bold mb-2">
              No meals in your plan
            </h2>
            <p className="text-white/60 mb-6">
              Start searching and add meals to build your plan
            </p>

            <button
              onClick={() => navigate("/generate")}
              className="w-full bg-brand-green hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl shadow-btn active:scale-[0.99] transition-all"
              type="button"
            >
              Find Meals
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -----------------------------------------
     View Plan
  ----------------------------------------- */
  return (
    <div className="min-h-screen page relative overflow-hidden bg-gray-950 text-white">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${_fallbackImage})` }}
      >
        <div
          className="absolute inset-0 bg-black/60"
          style={{ backdropFilter: "blur(20px) brightness(0.4)" }}
        />
      </div>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 pb-28">
        <header className="flex items-center justify-between mb-2">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
            Your Meal Plan
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
            {meals.length} meals
          </span>
        </header>
        <p className="text-white/60 text-sm md:text-base mb-8">
          Meals you've added so far
        </p>

        <div className="space-y-6 mb-10">
          {meals.map((meal) => {
            const img = _getMealImage(meal) || _fallbackImage;
            return (
              <div
                key={meal.id}
                className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-card border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
                onClick={() => openRecipe(meal.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openRecipe(meal.id);
                }}
              >
                <div className="h-48 sm:h-56 w-full overflow-hidden relative">
                  <img
                    alt={meal.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    src={img}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white mb-2 leading-snug">
                        {meal.title}
                      </h3>
                      <div className="flex items-center text-white/60 text-sm">
                        <i className="fa-solid fa-fire-flame-curved text-orange-400 mr-2" />
                        <span>{meal.calories ?? "—"} kcal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMeal(meal.id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="self-start sm:self-center px-4 py-2 text-sm font-medium text-[#E57373] bg-[rgba(229,115,115,0.1)] hover:bg-[rgba(229,115,115,0.2)] rounded-lg transition-colors border border-[rgba(229,115,115,0.2)]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate("/generate")}
            className="w-full bg-brand-green hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl shadow-btn active:scale-[0.99] transition-all flex items-center justify-center group"
          >
            <i className="fa-solid fa-plus mr-2 group-hover:rotate-90 transition-transform" />
            Add More Meals
          </button>
          <button
            type="button"
            onClick={clearPlan}
            className="w-full bg-[rgba(229,115,115,0.1)] hover:bg-[rgba(229,115,115,0.2)] text-[#E57373] font-semibold text-lg py-4 rounded-xl border border-[rgba(229,115,115,0.2)] active:scale-[0.99] transition-all"
          >
            Clear Plan
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="w-full bg-white/5 hover:bg-white/10 text-white/80 font-medium text-lg py-4 rounded-xl border border-white/10 active:scale-[0.99] transition-all"
          >
            Update Profile
          </button>
        </div>
      </main>

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
                  {_getMealImage(expandedMeal) ? (
                    <img
                      alt={expandedMeal.title}
                      src={_getMealImage(expandedMeal)}
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
                      onClick={() => removeMeal(expandedMeal.id)}
                      aria-label="Remove"
                    >
                      <i className="fa-solid fa-trash" />
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
                              key={`${expandedMeal.id}-plan-modal-ing-${idx}`}
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
                      onClick={() => removeMeal(expandedMeal.id)}
                      className="flex-1 py-3 rounded-2xl font-bold bg-[rgba(229,115,115,0.15)] hover:bg-[rgba(229,115,115,0.25)] text-[#E57373] border border-[rgba(229,115,115,0.25)]"
                    >
                      Remove from Plan
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
