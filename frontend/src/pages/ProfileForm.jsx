import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { listAllergies } from "../api/allergiesApi";
import { getMyAllergies, saveProfile, setMyAllergies } from "../api/profileApi";
import { getCurrentUser } from "../utils/auth";

export default function ProfileForm() {
  const navigate = useNavigate();
  const user = getCurrentUser();

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

    (async () => {
      try {
        const [allergiesResp, mineResp] = await Promise.all([
          listAllergies(),
          getMyAllergies(),
        ]);

        const all = allergiesResp?.data || [];
        const mine = mineResp?.data?.allergy_ids || [];

        const idToName = new Map(all.map((a) => [a.id, a.name]));
        const selectedNames = mine.map((id) => idToName.get(id)).filter(Boolean);

        setForm((prev) => ({
          ...prev,
          allergies: selectedNames.length ? selectedNames.join(", ") : prev.allergies,
        }));
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line
  }, []);

  const calculateBMI = () => {
    const heightM = form.height_cm / 100;
    if (!heightM || !form.weight_kg) return;

    const bmiValue = (form.weight_kg / (heightM * heightM)).toFixed(1);
    setForm({ ...form, bmi: bmiValue });
  };

  const save = async () => {
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

    try {
      await saveProfile({
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
      });

      const allergiesResp = await listAllergies();
      const all = allergiesResp?.data || [];
      const nameToId = new Map(all.map((a) => [String(a.name || "").toLowerCase().trim(), a.id]));

      const entered = (profile.allergies || [])
        .map((x) => String(x || "").toLowerCase().trim())
        .filter(Boolean);

      const ids = [];
      const unknown = [];
      for (const n of entered) {
        const id = nameToId.get(n) || (n.endsWith("s") ? nameToId.get(n.slice(0, -1)) : undefined);
        if (id) ids.push(id);
        else unknown.push(n);
      }

      await setMyAllergies(Array.from(new Set(ids)));
      if (unknown.length) {
        alert(`Unknown allergy name(s) ignored: ${unknown.join(", ")}`);
      }

      localStorage.setItem(`profile_${user.email}`, JSON.stringify(profile));
      localStorage.setItem("profileCompleted", "true");

      setSaved(true);
      setProfileExists(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to save profile";
      alert(String(msg));
    } finally {
      setSaving(false);
    }
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

    const activityDesc =
      form.activity_level === "sedentary"
        ? "Little to no exercise"
        : form.activity_level === "moderate"
          ? "Exercise a few times per week"
          : "Hard exercise / physical job";

    return (
      <div className="min-h-screen page bg-slate-950 text-slate-100 px-4 sm:px-6 md:px-12 py-8 md:py-12 pb-28 relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none opacity-100">
          <img
            alt="Background"
            className="absolute w-full h-full object-cover opacity-15 blur-3xl scale-110"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkpsu2BNpoXeE0kuE8-XN4_meHk9Qo0GnEzczqXvoPsBBjjOdeD5sPxw4XfYJh1C3PZAp1Ad4QCFOTI63uc4MsLyJUTImKvjGdKRRbfsO1sGRRjB41Yd3F6wp2Ii4klmK_EmzBfZe5yEeG_xsCWpPIA0z4201TojlQfrSw3nRxx-mShfIeaP_b_RBhXh_kbCACeLUf04ylR63NFBEc6Il2v6l36l18Pzkz11zWCZAEEuM9kLDH3xs_fdH8Ev2SSGIH18nfqLIJ7LWH"
          />
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/80 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <header className="mb-8 md:mb-12 text-center md:text-left">
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 tracking-tight">
              Your Profile
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Manage your personal & health details
            </p>
          </header>

          <section className="mb-8">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-200 text-3xl font-bold ring-4 ring-white/10 shadow-lg">
                  {form.name?.charAt(0) || "U"}
                </div>
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="absolute bottom-0 right-0 bg-brand-green text-white p-2 rounded-full shadow-md hover:bg-green-700 transition-colors"
                  aria-label="Edit"
                >
                  <i className="fa-solid fa-pen text-sm" />
                </button>
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {form.name || "User"}
                </h2>
                <p className="text-slate-400 mb-4 font-medium">{user.email}</p>
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="bg-brand-green hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-green-900/20 active:scale-95"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Metric label="Age" value={form.age} icon="fa-calendar-day" />
            <Metric label="BMI" value={form.bmi || "—"} icon="fa-weight-scale" />
            <Metric label="Height" value={`${form.height_cm} cm`} icon="fa-ruler-vertical" />
            <Metric label="Weight" value={`${form.weight_kg} kg`} icon="fa-dumbbell" />

            <Info
              label="Activity Level"
              value={form.activity_level}
              hint={activityDesc}
              icon="fa-person-running"
            />
            <Info
              label="Fitness Goal"
              value={form.fitness_goal.replace("_", " ")}
              icon="fa-flag"
            />
            <Tile
              label="Allergies"
              value={form.allergies || "None"}
              icon="fa-ban"
              tone="danger"
            />
            <Tile
              label="Dietary Restrictions"
              value={dietaryList.length ? dietaryList.join(", ") : "None"}
              icon="fa-leaf"
              tone="ok"
            />
          </section>
        </div>
      </div>
    );
  }

  /* ===========================
     EDIT MODE
     =========================== */
  return (
    <div className="min-h-screen page bg-slate-950 text-slate-100 px-4 sm:px-6 md:px-12 py-8 md:py-12 pb-28 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-100">
        <img
          alt="Background"
          className="absolute w-full h-full object-cover opacity-15 blur-3xl scale-110"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkpsu2BNpoXeE0kuE8-XN4_meHk9Qo0GnEzczqXvoPsBBjjOdeD5sPxw4XfYJh1C3PZAp1Ad4QCFOTI63uc4MsLyJUTImKvjGdKRRbfsO1sGRRjB41Yd3F6wp2Ii4klmK_EmzBfZe5yEeG_xsCWpPIA0z4201TojlQfrSw3nRxx-mShfIeaP_b_RBhXh_kbCACeLUf04ylR63NFBEc6Il2v6l36l18Pzkz11zWCZAEEuM9kLDH3xs_fdH8Ev2SSGIH18nfqLIJ7LWH"
        />
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <header className="mb-8 md:mb-12 text-center md:text-left">
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 tracking-tight">
            {profileExists ? "Edit Profile" : "Your Profile"}
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            This helps us personalize your meals
          </p>
        </header>

        {saved && (
          <div className="mb-6 bg-brand-green/15 border border-brand-green/20 text-green-100 p-4 rounded-2xl text-sm">
            Profile saved successfully
          </div>
        )}

        <Card label="Name">
          <input
            className="w-full text-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </Card>

        <Card label="Age">
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
          >
            {Array.from({ length: 71 }, (_, i) => i + 10).map((a) => (
              <option key={a} value={a} className="bg-slate-900">
                {a}
              </option>
            ))}
          </select>
        </Card>

        <Card label="Height (cm)">
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white"
            value={form.height_cm}
            onChange={(e) =>
              setForm({ ...form, height_cm: Number(e.target.value) })
            }
          >
            {Array.from({ length: 71 }, (_, i) => i + 130).map((h) => (
              <option key={h} value={h} className="bg-slate-900">
                {h}
              </option>
            ))}
          </select>
        </Card>

        <Card label="Weight (kg)">
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white"
            value={form.weight_kg}
            onChange={(e) =>
              setForm({ ...form, weight_kg: Number(e.target.value) })
            }
          >
            {Array.from({ length: 91 }, (_, i) => i + 30).map((w) => (
              <option key={w} value={w} className="bg-slate-900">
                {w}
              </option>
            ))}
          </select>
        </Card>

        <Card label="Activity Level">
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white"
            value={form.activity_level}
            onChange={(e) => setForm({ ...form, activity_level: e.target.value })}
          >
            <option value="sedentary" className="bg-slate-900">
              Sedentary
            </option>
            <option value="moderate" className="bg-slate-900">
              Moderate
            </option>
            <option value="heavy" className="bg-slate-900">
              Heavy
            </option>
          </select>
        </Card>

        <Card label="Body Mass Index (BMI)">
          <div className="flex gap-3">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
              value={form.bmi}
              readOnly
              placeholder="BMI"
            />
            <button
              type="button"
              onClick={calculateBMI}
              className="bg-brand-green text-white px-5 rounded-xl font-bold hover:bg-green-700 transition-colors"
            >
              Calculate
            </button>
          </div>
        </Card>

        <Card label="Fitness Goal">
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white"
            value={form.fitness_goal}
            onChange={(e) => setForm({ ...form, fitness_goal: e.target.value })}
          >
            <option value="lose_weight" className="bg-slate-900">
              Lose Weight
            </option>
            <option value="maintain" className="bg-slate-900">
              Maintain
            </option>
            <option value="gain_muscle" className="bg-slate-900">
              Gain Muscle
            </option>
          </select>
        </Card>

        <Card label="Allergies (comma separated)">
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green text-white"
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            placeholder="e.g. peanuts, milk"
          />
        </Card>

        <div className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
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
                className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl"
              >
                <span className="text-white font-medium">{item.label}</span>
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={(e) =>
                    setForm({ ...form, [item.key]: e.target.checked })
                  }
                  className="w-5 h-5 accent-brand-green"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="flex-1 py-4 rounded-2xl text-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-white font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={`flex-1 py-4 rounded-2xl text-lg shadow-lg transition text-white font-bold ${
              saving ? "bg-slate-600" : "bg-brand-green hover:bg-green-700"
            }`}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Helpers
   =============================== */
function Metric({ label, value, icon }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white/5 text-brand-green">
          <i className={`fa-solid ${icon || "fa-chart-simple"}`} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
            {label}
          </p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon, hint }) {
  return (
    <div className="md:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
      <div className="p-3 rounded-xl bg-white/5 text-brand-green shrink-0">
        <i className={`fa-solid ${icon || "fa-circle-info"}`} />
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-lg font-bold text-white capitalize">{value}</p>
      </div>
      {hint && (
        <div className="hidden sm:block text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-lg">
          {hint}
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, icon, tone }) {
  const iconCls =
    tone === "danger"
      ? "text-red-300"
      : tone === "ok"
        ? "text-brand-green"
        : "text-brand-green";
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-sm min-h-[120px]">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-3 rounded-xl bg-white/5 ${iconCls}`}>
          <i className={`fa-solid ${icon || "fa-circle"}`} />
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
          {label}
        </p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function Card({ label, children }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 mb-4">
      <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </label>
      <div className="mt-3">{children}</div>
    </div>
  );
}
