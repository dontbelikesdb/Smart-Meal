import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PlanResult() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [meals, setMeals] = useState([]);

  /* -----------------------------------------
     Load plan
  ----------------------------------------- */
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const stored = localStorage.getItem(
      `mealplan_${currentUser.email}`
    );

    if (stored) {
      setMeals(JSON.parse(stored));
    }
  }, [currentUser, navigate]);

  /* -----------------------------------------
     Remove single meal
  ----------------------------------------- */
  const removeMeal = (id) => {
    const updated = meals.filter((m) => m.id !== id);
    setMeals(updated);

    localStorage.setItem(
      `mealplan_${currentUser.email}`,
      JSON.stringify(updated)
    );
  };

  /* -----------------------------------------
     Clear entire plan
  ----------------------------------------- */
  const clearPlan = () => {
    if (!window.confirm("Clear your entire meal plan?")) return;

    setMeals([]);
    localStorage.removeItem(`mealplan_${currentUser.email}`);
  };

  /* -----------------------------------------
     Empty state
  ----------------------------------------- */
  if (!meals.length) {
    return (
      <div className="min-h-screen page flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 text-center">
        <h2 className="text-xl font-bold mb-2">
          No meals in your plan
        </h2>
        <p className="text-gray-500 mb-6">
          Start searching and add meals to build your plan
        </p>

        <button
          onClick={() => navigate("/generate")}
          className="bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold"
        >
          Find Meals
        </button>
      </div>
    );
  }

  /* -----------------------------------------
     View Plan
  ----------------------------------------- */
  return (
    <div className="min-h-screen page bg-gradient-to-b from-blue-50 to-white px-4 pt-8 pb-28">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold">Your Meal Plan</h2>
        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          {meals.length} meals
        </span>
      </div>

      <p className="text-gray-500 mb-6">
        Meals you’ve added so far
      </p>

      <div className="space-y-4">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="bg-white rounded-2xl shadow overflow-hidden"
          >
            {/* Image */}
            <div
              className="h-36 bg-cover bg-center"
              style={{
                backgroundImage: `url(${meal.image})`,
              }}
            />

            {/* Content */}
            <div className="p-4">
              <h3 className="text-lg font-bold mb-1">
                {meal.title}
              </h3>

              <p className="text-sm text-gray-500 mb-2">
                {meal.calories} kcal • {meal.protein}
              </p>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  ⏱ {meal.time}
                </span>

                <button
                  onClick={() => removeMeal(meal.id)}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold transition active:scale-95"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-10 space-y-4">
        <button
          onClick={() => navigate("/generate")}
          className="w-full bg-green-600 text-white py-4 rounded-2xl text-lg font-bold shadow-lg"
        >
          Add More Meals
        </button>

        <button
          onClick={clearPlan}
          className="w-full bg-red-100 text-red-600 py-3 rounded-xl font-semibold"
        >
          Clear Plan
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl"
        >
          Update Profile
        </button>
      </div>
    </div>
  );
}
