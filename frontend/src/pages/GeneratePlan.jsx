import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* --------------------------------------------------
   Mock meal data (API later)
-------------------------------------------------- */
const MEALS = [
  {
    id: 1,
    title: "Grilled Salmon with Asparagus",
    tags: ["low carb", "high protein", "non veg"],
    calories: 450,
    protein: "35g",
    time: "25 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCTHy128to4Fi8P6DwR6KMbtP30_750SV9Kho1RGfj6LDjiBs2wb3yo371NeOW18Pf8tsQ-v-9hIOA88BMMaFjkHD23v2ynocwrLLJZFkoIu7IZBJ3TVK3QEoWOd2KCv5rBoztE3BT72J-KTcC8dnxpjMasTKlrK2wSsdh0XlPyrAzn1gymMfYfYR0QeckChAPNmj0WRt5AJmQ--uqGLk7ndQw_6EQ2TRmEizXlmKR7pJ84qcmhk_FwyL1YnHiV2zSUKZ09zLs2b3JU",
  },
  {
    id: 2,
    title: "Mediterranean Chicken Bowl",
    tags: ["high protein", "non veg"],
    calories: 380,
    protein: "42g",
    time: "15 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCKsZ7uooX0rLzZzjmbvZpfwLCsN3P4qqfPNlscJY1SE1ioFLj-mPLfdZtlvvlw9bOXTIGWEtfr7656U7sW9SOYllxS2SaL4znm3NFPyJpLD0uVhZ-zFZ2S87AnNszHIibOy4zieWGUn7HWWlf3nAqJybD5lJuSkG6yjvP60gVK1fPLnAibg4hbwMCpck9Y6bTPV6VcvbZDjJUHKeFMSHocXsVIkwW0Ond-adUshOEsHJDJjY5R46BWyTcuQ0zawh5gwLx7YrRaE0Xe",
  },
  {
    id: 3,
    title: "Sesame Tofu Stir Fry",
    tags: ["vegan", "low calorie"],
    calories: 320,
    protein: "18g",
    time: "20 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBVYOO_R1P-9LtiAk9N-7Jr4a6plHe3poPmDrrdQ7TaiowXoWr-OlvaDye7APPRTYosP4aKGZK0Fb_FIn2a8tOLm9ipvpkvhTMl04Nd4Moa5ciwAGOm27Rt7r98HhT8eQrkV3lgT0Re462CR-o131qrutMcoEM5CX1g8KxKxJ2gzqzTRq4R9ItsXhpUD4ybkc0Dr_3NSgvP0p5OiprJrs8e8sxCdYxw__lf0zBRVrpeaEsSxGrIVhe1RKImBawEhUbA4YJfve3E2NEN",
  },
];

export default function GeneratePlan() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);

  if (!currentUser) {
    navigate("/login");
  }

  /* --------------------------------------------------
     Search logic
  -------------------------------------------------- */
  const handleSearch = () => {
    if (!query.trim()) {
      alert("Please enter what kind of meals you want");
      return;
    }

    const q = query.toLowerCase();

    const filtered = MEALS.filter(
      (meal) =>
        meal.title.toLowerCase().includes(q) ||
        meal.tags.some((tag) => tag.includes(q))
    );

    setResults(filtered);
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
    if (selectedMeals.length === 0) {
      alert("Please add at least one meal to your plan");
      return;
    }

    const key = `mealplan_${currentUser.email}`;

    // 👇 read existing plan
    const existingPlan =
      JSON.parse(localStorage.getItem(key)) || [];

    // 👇 merge without duplicates
    const mergedPlan = [
      ...existingPlan,
      ...selectedMeals.filter(
        (meal) =>
          !existingPlan.some((m) => m.id === meal.id)
      ),
    ];

    localStorage.setItem(key, JSON.stringify(mergedPlan));

    navigate("/plan");
  };

  return (
    <div className="min-h-screen page bg-gradient-to-b from-blue-50 to-white px-4 pt-8 pb-28">
      <h2 className="text-2xl font-bold mb-1">Search Meals</h2>
      <p className="text-gray-500 mb-6">
        Find meals and add them to your plan
      </p>

      {/* Search bar */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Low carb, vegan, high protein..."
          className="w-full p-3 border rounded-xl outline-none"
        />
        <button
          onClick={handleSearch}
          className="mt-4 w-full bg-green-600 text-white py-3 rounded-xl font-semibold"
        >
          Search
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((meal) => {
            const added = selectedMeals.some(
              (m) => m.id === meal.id
            );

            return (
              <div
                key={meal.id}
                className="bg-white rounded-2xl shadow overflow-hidden"
              >
                <div
                  className="h-36 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${meal.image})`,
                  }}
                />

                <div className="p-4">
                  <h3 className="text-lg font-bold">
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
                      onClick={() => toggleMeal(meal)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                        added
                          ? "bg-gray-300 text-gray-700"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {added ? "Added" : "Add to Plan"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && query && (
        <p className="text-center text-gray-400 mt-8">
          No meals found. Try a different search.
        </p>
      )}

      {/* View plan */}
      {selectedMeals.length > 0 && (
        <button
          onClick={goToPlan}
          className="fixed bottom-20 left-4 right-4 bg-blue-600 text-white py-4 rounded-2xl text-lg font-bold shadow-lg"
        >
          View Plan ({selectedMeals.length})
        </button>
      )}
    </div>
  );
}
