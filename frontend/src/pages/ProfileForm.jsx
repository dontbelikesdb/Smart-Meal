import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileForm() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("currentUser"));

  const [editMode, setEditMode] = useState(false);
  const [profileExists, setProfileExists] = useState(false);

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
      setProfileExists(true);
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
    } else {
      setEditMode(true);
    }
    // eslint-disable-next-line
  }, []);

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
    setProfileExists(true);
    setEditMode(false);

    setTimeout(() => setSaved(false), 1500);
  };

  /* ===========================
     VIEW MODE
     =========================== */
  if (profileExists && !editMode) {
    const dietaryList = [
      form.vegetarian && "Vegetarian",
      form.diabetic && "Diabetic",
      form.pregnant && "Pregnant",
    ].filter(Boolean);

    return (
      <div className="min-h-screen page bg-gradient-to-b from-blue-50 to-white px-4 pt-8 pb-28">
        <h2 className="text-2xl font-bold mb-1">Your Profile</h2>
        <p className="text-gray-500 mb-6">
          Manage your personal & health details
        </p>

        <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center">
          <div className="w-24 h-24 rounded-full bg-blue-100 mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-blue-600">
            {form.name?.charAt(0) || "U"}
          </div>
          <h3 className="text-xl font-bold">{form.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>

          <button
            onClick={() => setEditMode(true)}
            className="mt-4 px-6 py-2 rounded-xl bg-blue-100 text-blue-700 font-semibold transition active:scale-95"
          >
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Metric label="Age" value={form.age} />
          <Metric label="BMI" value={form.bmi || "—"} />
          <Metric label="Height" value={`${form.height_cm} cm`} />
          <Metric label="Weight" value={`${form.weight_kg} kg`} />
        </div>

        <Info label="Activity Level" value={form.activity_level} />
        <Info
          label="Fitness Goal"
          value={form.fitness_goal.replace("_", " ")}
        />
        <Info label="Allergies" value={form.allergies || "None"} />
        <Info
          label="Dietary Restrictions"
          value={dietaryList.length ? dietaryList.join(", ") : "None"}
        />
      </div>
    );
  }

  /* ===========================
     EDIT MODE
     =========================== */
  return (
    <div className="min-h-screen page bg-gradient-to-b from-blue-50 to-white px-4 pt-8 pb-28">
      <h2 className="text-2xl font-bold mb-1">
        {profileExists ? "Edit Profile" : "Your Profile"}
      </h2>
      <p className="text-gray-500 mb-6">
        This helps us personalize your meals
      </p>

      {saved && (
        <div className="mb-6 bg-green-100 text-green-700 p-4 rounded-xl text-sm">
          ✅ Profile saved successfully
        </div>
      )}

      {/* Name */}
      <Card label="Name">
        <input
          className="w-full text-lg border-b p-2 outline-none"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Card>

      {/* Age */}
      <Card label="Age">
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
      </Card>

      {/* Height */}
      <Card label="Height (cm)">
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
      </Card>

      {/* Weight */}
      <Card label="Weight (kg)">
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
      </Card>

      {/* Activity */}
      <Card label="Activity Level">
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
      </Card>

      {/* BMI */}
      <Card label="Body Mass Index (BMI)">
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 border rounded bg-gray-100"
            value={form.bmi}
            readOnly
          />
          <button
            onClick={calculateBMI}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Calculate
          </button>
        </div>
      </Card>

      {/* Fitness Goal */}
      <Card label="Fitness Goal">
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
      </Card>

      {/* Allergies */}
      <Card label="Allergies (comma separated)">
        <input
          className="w-full p-2 border rounded"
          value={form.allergies}
          onChange={(e) =>
            setForm({ ...form, allergies: e.target.value })
          }
        />
      </Card>

      {/* Dietary Restrictions */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-2 font-semibold">
          Dietary Restrictions
        </p>
        <div className="space-y-3">
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
      </div>

      <button
        onClick={save}
        disabled={saving}
        className={`w-full py-4 rounded-2xl text-lg shadow-lg transition ${
          saving ? "bg-gray-400" : "bg-blue-600"
        } text-white`}
      >
        {saving ? "Saving profile..." : "Save Profile"}
      </button>
    </div>
  );
}

/* ===============================
   Helpers
   =============================== */
function Metric({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <p className="text-xs text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="font-semibold capitalize">{value}</p>
    </div>
  );
}

function Card({ label, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <label className="text-sm text-gray-500">{label}</label>
      {children}
    </div>
  );
}
