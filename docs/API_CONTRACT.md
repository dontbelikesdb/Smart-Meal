# Meal Planner Backend API Contract (Frontend Reference)

**Base URL (local):** `http://127.0.0.1:8000`

**API Prefix:** `/api/v1`

---

## Authentication / Local Storage Rules

### Bearer Token

After login, store the returned `access_token` in local storage.

For all protected endpoints, send:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Important: Login uses FORM-DATA (not JSON)

The login endpoint uses `OAuth2PasswordRequestForm`, so the frontend must send:

- `Content-Type: application/x-www-form-urlencoded`
- fields: `username` and `password`

---

# 1) Authentication APIs

## 1.1 Login (get JWT token)

**POST** `/api/v1/auth/login/access-token`

- **Auth required:** No
- **Content-Type:** `application/x-www-form-urlencoded`

### Request (form fields)

- `username`: string (**email**)
- `password`: string

Example:

```txt
username=admin@example.com
password=Admin123!
```

### Response 200

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### Errors

- **400**

```json
{ "detail": "Incorrect email or password" }
```

- **400**

```json
{ "detail": "Inactive user" }
```

---

## 1.2 Test token (verify current token)

**POST** `/api/v1/auth/login/test-token`

- **Auth required:** Yes
- **Request body:** none

### Response 200 (`schemas.User`)

```json
{
  "id": 1,
  "email": "admin@example.com",
  "full_name": "Admin",
  "is_active": true,
  "is_superuser": true,
  "created_at": "2026-01-01T10:00:00.000000",
  "updated_at": "2026-01-01T10:00:00.000000",
  "profile": null
}
```

---

# 2) Users APIs

## 2.1 Create user (signup)

**POST** `/api/v1/users/`

- **Auth required:** No
- **Content-Type:** `application/json`

### Request (`schemas.UserCreate`)

```json
{
  "email": "user1@example.com",
  "full_name": "User One",
  "password": "Password1"
}
```

### Response 200 (`schemas.User`)

```json
{
  "id": 2,
  "email": "user1@example.com",
  "full_name": "User One",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2026-01-01T10:00:00.000000",
  "updated_at": "2026-01-01T10:00:00.000000",
  "profile": null
}
```

### Error 400

```json
{ "detail": "The user with this username already exists in the system." }
```

---

## 2.2 Get current user

**GET** `/api/v1/users/me`

- **Auth required:** Yes

### Response 200

`schemas.User`

---

## 2.3 List users (admin only)

**GET** `/api/v1/users/?skip=0&limit=100`

- **Auth required:** Yes (superuser only)

### Response 200

Array of `schemas.User`

---

## 2.4 Get user by ID

**GET** `/api/v1/users/{user_id}`

- **Auth required:** Yes
- **Rules:**
  - If `{user_id}` matches current user: allowed
  - Otherwise: requires superuser

### Response 200

`schemas.User`

### Error 400

```json
{ "detail": "The user doesn't have enough privileges" }
```

---

# 3) Profile APIs

## 3.1 Save profile

**POST** `/api/v1/profile/`

- **Auth required:** Yes
- **Content-Type:** `application/json`

### Request (`schemas.ProfileUpdate`)

Fields are optional; include only what you want to update.

Example:

```json
{
  "age": 23,
  "height_cm": 170,
  "weight_kg": 70
}
```

### Response 200

```json
{
  "message": "profile saved",
  "user_id": 2,
  "profile_id": 1
}
```

---

## 3.2 Get my selected allergies

**GET** `/api/v1/profile/allergies`

- **Auth required:** Yes

### Response 200 (`UserAllergySet`)

```json
{
  "allergy_ids": [1, 3]
}
```

---

## 3.3 Set/replace my selected allergies

**POST** `/api/v1/profile/allergies`

- **Auth required:** Yes
- **Content-Type:** `application/json`

### Request (`UserAllergySet`)

```json
{
  "allergy_ids": [1, 3]
}
```

### Response 200

```json
{
  "allergy_ids": [1, 3]
}
```

### Error 404 (unknown IDs)

```json
{ "detail": "Unknown allergy_id(s): [999]" }
```

---

# 4) Allergies + Ingredient Mapping APIs

## 4.1 List allergies (global list)

**GET** `/api/v1/allergies/`

- **Auth required:** Yes

### Response 200 (`AllergyOut[]`)

```json
[
  { "id": 1, "name": "milk", "description": "Dairy / milk proteins" },
  { "id": 2, "name": "egg", "description": "Eggs and egg products" }
]
```

---

## 4.2 Create allergy (admin only)

**POST** `/api/v1/allergies/`

- **Auth required:** Yes (superuser)
- **Content-Type:** `application/json`

### Request (`AllergyCreate`)

```json
{
  "name": "mustard",
  "description": "Mustard and mustard products"
}
```

### Response 200 (`AllergyOut`)

```json
{ "id": 11, "name": "mustard", "description": "Mustard and mustard products" }
```

---

## 4.3 List mapped ingredients for an allergy

**GET** `/api/v1/allergies/{allergy_id}/mapped-ingredients`

- **Auth required:** Yes

### Response 200 (`MappedIngredientOut[]`)

```json
[
  { "ingredient_id": 10, "ingredient_name": "peanut" },
  { "ingredient_id": 11, "ingredient_name": "peanut butter" }
]
```

---

## 4.4 Map ingredient to allergy (admin only)

**POST** `/api/v1/allergies/{allergy_id}/map-ingredient`

- **Auth required:** Yes (superuser)

### Request (`AllergyIngredientMapCreate`)

Either:

```json
{ "ingredient_id": 10 }
```

Or:

```json
{ "ingredient_name": "peanut" }
```

### Response 200

List of mappings after update (`MappedIngredientOut[]`).

---

## 4.5 Auto-map ingredients (admin only)

**POST** `/api/v1/allergies/{allergy_id}/auto-map?limit=25`

- **Auth required:** Yes (superuser)

### Response 200 (`AutoMapResponse`)

```json
{
  "allergy_id": 3,
  "mapped_count": 12,
  "ingredient_ids": [10, 11, 12]
}
```

---

## 4.6 Unmap ingredient (admin only)

**DELETE** `/api/v1/allergies/{allergy_id}/mapped-ingredients/{ingredient_id}`

- **Auth required:** Yes (superuser)

### Response 200

```json
{
  "allergy_id": 3,
  "mapped_count": 0,
  "ingredient_ids": []
}
```

---

# 5) Search APIs

## 5.1 Debug list recipes

**GET** `/api/v1/search/recipes?limit=10`

- **Auth required:** Yes

### Response 200 (`RecipeResult[]`)

```json
[
  { "id": 1, "name": "Chicken Curry", "calories": 550, "reasons": [] },
  { "id": 2, "name": "Veg Salad", "calories": 200, "reasons": [] }
]
```

---

## 5.2 Natural language recipe search

**POST** `/api/v1/search/nl`

- **Auth required:** Yes
- **Content-Type:** `application/json`

### Request (`SearchNLRequest`)

```json
{
  "query": "veg low calorie recipes without peanuts",
  "limit": 10
}
```

### Response 200 (`SearchResponse`)

```json
{
  "applied": {
    "parsed": {
      "diet": "veg",
      "calorie_bucket": "low",
      "include_terms": [],
      "exclude_terms": ["peanuts"],
      "wants_high_calorie": false
    },
    "bmi": 24.1,
    "bmi_cutoff": 22.9,
    "default_activity": "sedentary",
    "allergy_terms": ["peanut", "peanuts"],
    "mapped_ingredient_ids": [10, 11],
    "search_terms": ["veg", "low", "calorie"]
  },
  "results": [
    {
      "id": 22,
      "name": "Veg Soup",
      "calories": 180,
      "reasons": ["calorie_bucket=low", "bmi_high_prioritized_low"]
    }
  ]
}
```

---

# 6) Plan APIs

## 6.1 Generate plan (stub)

**POST** `/api/v1/plan/generate`

- **Auth required:** No (currently)
- **Content-Type:** `application/json`

### Request (`PlanRequest`)

```json
{
  "user_id": 2,
  "days": 7
}
```

### Response 200

```json
{
  "plan_id": "<uuid>",
  "status": "pending"
}
```
