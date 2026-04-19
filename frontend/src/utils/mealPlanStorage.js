import { getCurrentUser, getToken } from "./auth";

const _MEAL_PLAN_PREFIX = "mealplan_";

const _safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const _decodeTokenSubject = () => {
  const token = getToken();
  if (!token || !token.includes(".")) return "";

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));
    return decoded?.sub || "";
  } catch {
    return "";
  }
};

export const getPlanOwnerId = () => {
  const user = getCurrentUser();
  const value =
    user?.email ||
    user?.username ||
    user?.sub ||
    _decodeTokenSubject();

  return String(value || "").trim().toLowerCase();
};

export const getMealPlanStorageKey = (ownerId = getPlanOwnerId()) => {
  const normalized = String(ownerId || "").trim().toLowerCase();
  return normalized ? `${_MEAL_PLAN_PREFIX}${normalized}` : "";
};

export const readMealPlan = (ownerId = getPlanOwnerId()) => {
  const key = getMealPlanStorageKey(ownerId);
  if (!key) return [];

  const parsed = _safeJsonParse(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? parsed : [];
};

export const writeMealPlan = (meals, ownerId = getPlanOwnerId()) => {
  const key = getMealPlanStorageKey(ownerId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(Array.isArray(meals) ? meals : []));
};

export const clearMealPlan = (ownerId = getPlanOwnerId()) => {
  const key = getMealPlanStorageKey(ownerId);
  if (!key) return;
  localStorage.removeItem(key);
};
