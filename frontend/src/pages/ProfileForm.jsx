import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileForm() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("currentUser"));

  const [form, setForm] = useState({
    name: "",
    age: 25,
    gender: "male",
    height_cm: 165,
    weight_kg: 60,
    activity_level: "sedentary",
    fitness_goal: "maintain",
    bmi: "",
    allergies: "",
    vegetarian: false,
    diabetic: false,
    pregnant: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const savedProfile = localStorage.getItem(`profile_${user.email}`);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setForm({
        ...form,
        ...parsed,
        allergies: Array.isArray(parsed.allergies)
          ? parsed.allergies.join(", ")
          : "",
        vegetarian:
          parsed.dietary_restrictions?.includes("vegetarian") || false,
        diabetic:
          parsed.dietary_restrictions?.includes("diabetic") || false,
        pregnant:
          parsed.dietary_restrictions?.includes("pregnant") || false,
      });
    }
    // eslint-disable-next-line
  }, []);

  /* BMI Calculation */
  const calculateBMI = () => {
    const heightM = form.height_cm / 100;
    if (!heightM || !form.weight_kg) return;

    const bmiValue = (form.weight_kg / (heightM * heightM)).toFixed(1);
    setForm({ ...form, bmi: bmiValue });
  };

  const save = () => {
    setSaving(true);

    const profile = {
      name: form.name,
      age: Number(form.age),
      gender: form.gender,
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      activity_level: form.activity_level,
      fitness_goal: form.fitness_goal,
      bmi: form.bmi,
      dietary_restrictions: [
        form.vegetarian && "vegetarian",
        form.diabetic && "diabetic",
        form.pregnant && "pregnant",
      ].filter(Boolean),
      allergies: form.allergies
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(`profile_${user.email}`, JSON.stringify(profile));
    localStorage.setItem("profileCompleted", "true");

    setSaved(true);
    setSaving(false);

    setTimeout(() => {
      navigate("/generate", { replace: true });
    }, 600);
  };

  return (
    <div className="min-h-screen page bg-gradient-to-b from-blue-50 to-white px-4 pt-8 pb-28">
      <h2 className="text-2xl font-bold mb-1">Your Profile</h2>
      <p className="text-gray-500 mb-6">
        This helps us personalize your meals
      </p>

      {saved && (
        <div className="mb-6 bg-green-100 text-green-700 p-4 rounded-xl text-sm">
          ✅ Profile saved successfully. Redirecting to search…
        </div>
      )}

      {/* Name */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <label className="text-sm text-gray-500">Name</label>
        <input
          className="w-full text-lg border-b p-2 outline-none"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      {/* Age */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <label className="text-sm text-gray-500">Age</label>
        <select
          className="w-full p-2 border rounded"
          value={form.age}
          onChange={(e) =>
            setForm({ ...form, age: Number(e.target.value) })
          }
        >
          {Array.from({ length: 71 }, (_, i) => i + 10).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Height */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <label className="text-sm text-gray-500">Height (cm)</label>
        <select
          className="w-full p-2 border rounded"
          value={form.height_cm}
          onChange={(e) =>
            setForm({ ...form, height_cm: Number(e.target.value) })
          }
        >
          {Array.from({ length: 71 }, (_, i) => i + 130).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      {/* Weight */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <label className="text-sm text-gray-500">Weight (kg)</label>
        <select
          className="w-full p-2 border rounded"
          value={form.weight_kg}
          onChange={(e) =>
            setForm({ ...form, weight_kg: Number(e.target.value) })
          }
        >
          {Array.from({ length: 91 }, (_, i) => i + 30).map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {/* Activity Level */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <label className="text-sm text-gray-500">Activity Level</label>
        <select
          className="w-full p-2 border rounded"
          value={form.activity_level}
          onChange={(e) =>
            setForm({ ...form, activity_level: e.target.value })
          }
        >
          <option value="sedentary">Sedentary</option>
          <option value="moderate">Moderate</option>
          <option value="heavy">Heavy</option>
        </select>
      </div>

      {/* BMI */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <label className="text-sm text-gray-500">Body Mass Index (BMI)</label>
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 border rounded bg-gray-100"
            value={form.bmi}
            readOnly
            placeholder="BMI"
          />
          <button
            onClick={calculateBMI}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Calculate
          </button>
        </div>
      </div>

      {/* ✅ ADDED BACK: FITNESS GOAL */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <label className="text-sm text-gray-500">Fitness Goal</label>
        <select
          className="w-full p-2 border rounded"
          value={form.fitness_goal}
          onChange={(e) =>
            setForm({ ...form, fitness_goal: e.target.value })
          }
        >
          <option value="lose_weight">Lose Weight</option>
          <option value="maintain">Maintain</option>
          <option value="gain_muscle">Gain Muscle</option>
        </select>
      </div>

      {/* ✅ ADDED BACK: ALLERGIES */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <label className="text-sm text-gray-500">
          Allergies (comma separated)
        </label>
        <input
          className="w-full p-2 border rounded"
          value={form.allergies}
          onChange={(e) =>
            setForm({ ...form, allergies: e.target.value })
          }
          placeholder="eg: peanuts, milk"
        />
      </div>

      {/* ✅ ADDED BACK: DIET & HEALTH */}
      <div className="space-y-3 mb-8">
        {[
          { key: "vegetarian", label: "Vegetarian" },
          { key: "diabetic", label: "Diabetic" },
          { key: "pregnant", label: "Pregnant" },
        ].map((item) => (
          <label
            key={item.key}
            className="flex justify-between items-center bg-white p-4 rounded-xl shadow"
          >
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={form[item.key]}
              onChange={(e) =>
                setForm({ ...form, [item.key]: e.target.checked })
              }
              className="w-5 h-5"
            />
          </label>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className={`w-full py-4 rounded-2xl text-lg shadow-lg transition ${
          saving ? "bg-gray-400 text-white" : "bg-blue-600 text-white"
        }`}
      >
        {saving ? "Saving profile..." : "Save & Continue"}
      </button>
    </div>
  );
}
