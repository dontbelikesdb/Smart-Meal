import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/auth";
import { buildShoppingSnapshot, saveShoppingState } from "../utils/shoppingList";

const _fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDu7F1GZildoPkQwlmkdCrVYHPKjK5xrJ1P7I88EPD4jgKyV7EL8wCH2-q-UzBOb4HZfVWXqOssKBorvvmaR-pB_Et6QZcfchxNhMUDt7mRB8uew2CwYiGFnnrvdOUe7la1ezB7OgmdSmv9du81bCB_fdfIb-uo0PYV-4AUbB9WhVCHtKDeIo51DidymHAZgwdihPQoSwOTHoKfb56NJ5jmFJ9e00TqKt44AgUq2aOORYlbn49DlzmGgBJEdZ57ci9ZPOYlejxvfRZ3";

export default function ShoppingList() {
  const navigate = useNavigate();
  const userEmail = getCurrentUser()?.email || "";
  const [meals, setMeals] = useState([]);
  const [items, setItems] = useState([]);
  const [checkedState, setCheckedState] = useState({});

  useEffect(() => {
    if (!userEmail) {
      navigate("/login", { replace: true });
      return undefined;
    }

    const loadSnapshot = () => {
      const snapshot = buildShoppingSnapshot(userEmail);
      setMeals(snapshot.meals);
      setItems(snapshot.items);
      setCheckedState(snapshot.checkedState);
    };

    loadSnapshot();

    const handleStorage = (event) => {
      if (
        !event.key ||
        event.key.includes(`_${userEmail}`) ||
        event.key === null
      ) {
        loadSnapshot();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", loadSnapshot);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", loadSnapshot);
    };
  }, [navigate, userEmail]);

  const sortedItems = useMemo(() => {
    const rows = [...items];
    rows.sort((a, b) => {
      const aChecked = checkedState[a.key] ? 1 : 0;
      const bChecked = checkedState[b.key] ? 1 : 0;
      if (aChecked !== bChecked) return aChecked - bChecked;
      return a.normalizedLabel.localeCompare(b.normalizedLabel);
    });
    return rows;
  }, [checkedState, items]);

  const boughtCount = useMemo(
    () => items.filter((item) => checkedState[item.key]).length,
    [checkedState, items],
  );

  const updateCheckedState = (nextState) => {
    setCheckedState(nextState);
    saveShoppingState(userEmail, nextState);
  };

  const toggleItem = (key) => {
    const nextState = {
      ...checkedState,
      [key]: !checkedState[key],
    };
    updateCheckedState(nextState);
  };

  const markAllBought = () => {
    const nextState = {};
    for (const item of items) nextState[item.key] = true;
    updateCheckedState(nextState);
  };

  const clearBought = () => {
    const nextState = {};
    for (const item of items) nextState[item.key] = false;
    updateCheckedState(nextState);
  };

  if (!items.length) {
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
              No shopping items yet
            </h2>
            <p className="text-white/60 mb-2">
              Add meals to your plan and their ingredients will appear here.
            </p>
            {meals.length === 0 && (
              <p className="text-white/40 text-sm mb-6">
                Your grocery checklist is generated from your saved plan.
              </p>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate("/generate")}
                className="w-full bg-brand-green hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl shadow-btn active:scale-[0.99] transition-all"
                type="button"
              >
                Find Meals
              </button>
              <button
                onClick={() => navigate("/plan")}
                className="w-full bg-white/5 hover:bg-white/10 text-white/80 font-medium text-lg py-4 rounded-xl border border-white/10 active:scale-[0.99] transition-all"
                type="button"
              >
                Back to Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 pb-28">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Shopping List
            </h1>
            <p className="text-white/60 text-sm md:text-base mt-2">
              Ingredients combined from the meals in your plan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center px-3 py-1 rounded-full font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
              {items.length} ingredients
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
              {boughtCount} bought
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full font-medium bg-white/5 text-white/70 border border-white/10">
              {Math.max(items.length - boughtCount, 0)} left
            </span>
          </div>
        </header>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            type="button"
            onClick={markAllBought}
            className="bg-brand-green hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-btn transition-all"
          >
            Mark All Bought
          </button>
          <button
            type="button"
            onClick={clearBought}
            className="bg-white/5 hover:bg-white/10 text-white/80 font-medium px-5 py-3 rounded-2xl border border-white/10 transition-all"
          >
            Clear Bought
          </button>
          <button
            type="button"
            onClick={() => navigate("/plan")}
            className="bg-white/5 hover:bg-white/10 text-white/80 font-medium px-5 py-3 rounded-2xl border border-white/10 transition-all"
          >
            Back to Plan
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedItems.map((item) => {
            const checked = Boolean(checkedState[item.key]);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleItem(item.key)}
                className={`w-full text-left rounded-2xl border backdrop-blur-md p-4 sm:p-5 transition-all ${
                  checked
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                      checked
                        ? "bg-brand-green border-brand-green text-white"
                        : "border-white/20 text-transparent"
                    }`}
                  >
                    <i className="fa-solid fa-check text-xs" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-semibold text-base sm:text-lg ${
                        checked ? "text-white/60 line-through" : "text-white"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/65">
                        Used {item.sourceCount} time{item.sourceCount > 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/65">
                        {item.mealTitles.length} meal{item.mealTitles.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    {item.mealTitles.length > 0 && (
                      <div className="mt-3 text-sm text-white/55">
                        {item.mealTitles.join(" • ")}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
