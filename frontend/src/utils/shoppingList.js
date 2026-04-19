const _MEAL_PLAN_PREFIX = "mealplan_";
const _SHOPPING_STATE_PREFIX = "shoppinglist_";

const _UNITS_PATTERN =
  "(?:cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|kg|g|gram|grams|ml|l|liter|liters|litre|litres|pinch|pinches|dash|dashes|clove|cloves|can|cans|jar|jars|packet|packets|pkg|pkgs|slice|slices|piece|pieces|sprig|sprigs|bunch|bunches|stick|sticks)";

const _LEADING_MEASUREMENT = new RegExp(
  `^(?:about\\s+|approx(?:imately)?\\s+)?(?:[\\d¼½¾⅓⅔⅛⅜⅝⅞./-]+\\s+)*(?:${_UNITS_PATTERN})\\b(?:\\s+of)?\\s*`,
  "i",
);

const _LEADING_PAREN_BLOCK = /^\([^)]*\)\s*/;
const _LEADING_BULLETS = /^[\s,*\-•]+/;

const _safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const _cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

export const getMealPlanStorageKey = (email) => `${_MEAL_PLAN_PREFIX}${email}`;

export const getShoppingStateStorageKey = (email) =>
  `${_SHOPPING_STATE_PREFIX}${email}`;

export const getPlanMealsForUser = (email) => {
  if (!email) return [];
  const raw = localStorage.getItem(getMealPlanStorageKey(email));
  const parsed = _safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
};

export const getSavedShoppingState = (email) => {
  if (!email) return {};
  const raw = localStorage.getItem(getShoppingStateStorageKey(email));
  const parsed = _safeJsonParse(raw, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed
    : {};
};

export const saveShoppingState = (email, state) => {
  if (!email) return;
  localStorage.setItem(
    getShoppingStateStorageKey(email),
    JSON.stringify(state || {}),
  );
};

export const normalizeIngredientLabel = (value) => {
  let text = _cleanText(value).toLowerCase();
  if (!text) return "";

  text = text.replace(_LEADING_BULLETS, "");

  for (let i = 0; i < 4; i += 1) {
    const before = text;
    text = text.replace(_LEADING_PAREN_BLOCK, "");
    text = text.replace(/^[\d¼½¾⅓⅔⅛⅜⅝⅞./-]+\s+/, "");
    text = text.replace(_LEADING_MEASUREMENT, "");
    text = text.replace(/^of\s+/, "");
    text = text.replace(_LEADING_BULLETS, "");
    if (text === before) break;
  }

  return _cleanText(text.replace(/^[,;:]+/, ""));
};

export const deriveShoppingItems = (meals) => {
  const items = new Map();

  for (const meal of Array.isArray(meals) ? meals : []) {
    const title = _cleanText(meal?.title || meal?.name || "Planned meal");
    const rawIngredients =
      Array.isArray(meal?.ingredientLines) && meal.ingredientLines.length > 0
        ? meal.ingredientLines
        : Array.isArray(meal?.ingredients)
          ? meal.ingredients
          : [];

    for (const raw of rawIngredients) {
      const displayLabel = _cleanText(raw);
      const key = normalizeIngredientLabel(displayLabel);
      if (!displayLabel || !key) continue;

      if (!items.has(key)) {
        items.set(key, {
          key,
          label: displayLabel,
          normalizedLabel: key,
          sourceCount: 1,
          mealTitles: new Set(title ? [title] : []),
        });
        continue;
      }

      const existing = items.get(key);
      existing.sourceCount += 1;
      if (title) existing.mealTitles.add(title);
    }
  }

  return Array.from(items.values())
    .map((item) => ({
      key: item.key,
      label: item.label,
      normalizedLabel: item.normalizedLabel,
      sourceCount: item.sourceCount,
      mealTitles: Array.from(item.mealTitles).sort((a, b) =>
        a.localeCompare(b),
      ),
    }))
    .sort((a, b) => a.normalizedLabel.localeCompare(b.normalizedLabel));
};

export const buildShoppingSnapshot = (email) => {
  const meals = getPlanMealsForUser(email);
  const items = deriveShoppingItems(meals);
  const savedState = getSavedShoppingState(email);
  const cleanedState = {};

  for (const item of items) {
    cleanedState[item.key] = Boolean(savedState[item.key]);
  }

  saveShoppingState(email, cleanedState);

  return {
    meals,
    items,
    checkedState: cleanedState,
  };
};
