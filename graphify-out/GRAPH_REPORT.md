# Graph Report - .  (2026-04-19)

## Corpus Check
- 91 files · ~194,509 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 374 nodes · 577 edges · 36 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 138 edges (avg confidence: 0.77)
- Token cost: 2,500 input · 800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_NLP Search Engine|NLP Search Engine]]
- [[_COMMUNITY_API Endpoints Layer|API Endpoints Layer]]
- [[_COMMUNITY_Auth & JWT Module|Auth & JWT Module]]
- [[_COMMUNITY_Allergies Feature|Allergies Feature]]
- [[_COMMUNITY_Allergy Schemas & Mapping|Allergy Schemas & Mapping]]
- [[_COMMUNITY_Frontend React App Shell|Frontend React App Shell]]
- [[_COMMUNITY_User Profile & DB Models|User Profile & DB Models]]
- [[_COMMUNITY_API Contract Docs|API Contract Docs]]
- [[_COMMUNITY_Ingredient & Recipe Seeding|Ingredient & Recipe Seeding]]
- [[_COMMUNITY_CRUD Base & Voice API|CRUD Base & Voice API]]
- [[_COMMUNITY_Shopping List Utils|Shopping List Utils]]
- [[_COMMUNITY_Plan Generation & Voice Search|Plan Generation & Voice Search]]
- [[_COMMUNITY_TestSprite Test Fixtures|TestSprite Test Fixtures]]
- [[_COMMUNITY_Initial DB Migration|Initial DB Migration]]
- [[_COMMUNITY_Profile Fields Migration|Profile Fields Migration]]
- [[_COMMUNITY_Initial Schema Migration|Initial Schema Migration]]
- [[_COMMUNITY_Dietary Restrictions Migration|Dietary Restrictions Migration]]
- [[_COMMUNITY_Alembic Migration Runner|Alembic Migration Runner]]
- [[_COMMUNITY_DB Table Inspector|DB Table Inspector]]
- [[_COMMUNITY_Plan API Client|Plan API Client]]
- [[_COMMUNITY_Search API Client|Search API Client]]
- [[_COMMUNITY_Voice API Client|Voice API Client]]
- [[_COMMUNITY_Login Page|Login Page]]
- [[_COMMUNITY_Signup Page|Signup Page]]
- [[_COMMUNITY_Voice Search Button|Voice Search Button]]
- [[_COMMUNITY_Backend API Init|Backend API Init]]
- [[_COMMUNITY_API v1 Init|API v1 Init]]
- [[_COMMUNITY_Database Init|Database Init]]
- [[_COMMUNITY_Features Init|Features Init]]
- [[_COMMUNITY_Scripts Init|Scripts Init]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Vite Build Config|Vite Build Config]]
- [[_COMMUNITY_React Entry Point|React Entry Point]]
- [[_COMMUNITY_Axios HTTP Client|Axios HTTP Client]]
- [[_COMMUNITY_Users REST API|Users REST API]]

## God Nodes (most connected - your core abstractions)
1. `seed_recipes()` - 17 edges
2. `_normalize_term()` - 16 edges
3. `search_nl()` - 16 edges
4. `User` - 14 edges
5. `CRUDUser` - 11 edges
6. `parse_query()` - 11 edges
7. `get_allergy_aliases()` - 10 edges
8. `expand_allergy_terms()` - 8 edges
9. `CRUDBase` - 8 edges
10. `get_password_hash()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Natural Language Recipe Search` --semantically_similar_to--> `Natural Language Search Endpoint (POST /api/v1/search/nl)`  [INFERRED] [semantically similar]
  README.md → docs/API_CONTRACT.md
- `Meal Plan Persistence (localStorage)` --semantically_similar_to--> `Plan Generate Stub Endpoint`  [INFERRED] [semantically similar]
  README.md → docs/API_CONTRACT.md
- `create_allergy()` --calls--> `Allergy`  [INFERRED]
  backend\app\api\v1\allergies.py → backend\app\models\allergy.py
- `auto_map()` --calls--> `AutoMapResponse`  [INFERRED]
  backend\app\api\v1\allergies.py → backend\app\schemas\allergy_mapping.py
- `unmap_ingredient()` --calls--> `AutoMapResponse`  [INFERRED]
  backend\app\api\v1\allergies.py → backend\app\schemas\allergy_mapping.py

## Hyperedges (group relationships)
- **Full-Stack Meal Planner Architecture** — readme_react_frontend, readme_fastapi_backend, readme_postgresql, requirements_redis_rq [INFERRED 0.90]
- **NLP Recipe Search Pipeline** — api_search_nl, api_profile, api_allergies, requirements_google_genai [INFERRED 0.85]

## Communities

### Community 0 - "NLP Search Engine"
Cohesion: 0.1
Nodes (38): Enum, get_recipes(), search_natural_language(), CalorieBucket, DietType, ParsedQuery, RecipeResult, SearchNLRequest (+30 more)

### Community 1 - "API Endpoints Layer"
Cohesion: 0.07
Nodes (23): listAllergies(), getMe(), getMyAllergies(), getMyProfile(), test_openapi_health(), test_root_health(), test_login_access_token_success(), test_login_test_token_success() (+15 more)

### Community 2 - "Auth & JWT Module"
Cohesion: 0.09
Nodes (22): login_access_token(), OAuth2 compatible token login, get an access token for future requests, _ensure_first_superuser(), main(), reset_superuser(), create_access_token(), get_current_active_user(), get_current_user() (+14 more)

### Community 3 - "Allergies Feature"
Cohesion: 0.09
Nodes (22): auto_map(), create_allergy(), list_mapped_ingredients(), map_ingredient(), unmap_ingredient(), Allergy, AllergyIngredientMap, _basic_variants() (+14 more)

### Community 4 - "Allergy Schemas & Mapping"
Cohesion: 0.09
Nodes (24): AllergyCreate, AllergyIngredientMapCreate, AllergyOut, AutoMapResponse, Config, UserAllergySet, BaseModel, get_current_user() (+16 more)

### Community 5 - "Frontend React App Shell"
Cohesion: 0.07
Nodes (16): Private(), getCurrentUser(), getToken(), Home(), clearMealPlan(), _decodeTokenSubject(), getMealPlanStorageKey(), getPlanOwnerId() (+8 more)

### Community 6 - "User Profile & DB Models"
Cohesion: 0.1
Nodes (15): UserAllergy, Base, ChronicDisease, UserChronicDisease, Meal, MealPlan, MealRecipe, get_my_allergies() (+7 more)

### Community 7 - "API Contract Docs"
Cohesion: 0.11
Nodes (22): Allergies + Ingredient Mapping API, Auth Login Endpoint (JWT), Bearer Token Authentication (OAuth2), Plan Generate Stub Endpoint, Profile API (Health Metrics + Allergies), Natural Language Search Endpoint (POST /api/v1/search/nl), Frontend Entry HTML (Vite PWA), PWA Web Manifest (+14 more)

### Community 8 - "Ingredient & Recipe Seeding"
Cohesion: 0.18
Nodes (16): Ingredient, RecipeIngredient, _classify_free_from(), _classify_is_dairy_free(), _classify_is_gluten_free(), _classify_is_vegetarian(), _duration_to_minutes(), _first_image_url() (+8 more)

### Community 9 - "CRUD Base & Voice API"
Cohesion: 0.18
Nodes (7): CRUDBase, CRUD object with default methods to Create, Read, Update, Delete (CRUD)., read_users(), _get_local_transcriber(), transcribe_audio(), _transcribe_with_local_model(), _transcribe_with_openai()

### Community 10 - "Shopping List Utils"
Cohesion: 0.42
Nodes (9): buildShoppingSnapshot(), _cleanText(), deriveShoppingItems(), getPlanMealsForUser(), getSavedShoppingState(), getShoppingStateStorageKey(), normalizeIngredientLabel(), _safeJsonParse() (+1 more)

### Community 11 - "Plan Generation & Voice Search"
Cohesion: 0.29
Nodes (4): GeneratePlan(), getPreferredRecordingType(), isMediaRecordingSupported(), useVoiceSearch()

### Community 12 - "TestSprite Test Fixtures"
Cohesion: 0.4
Nodes (2): auth_token(), _url()

### Community 13 - "Initial DB Migration"
Cohesion: 0.5
Nodes (2): Add database models  Revision ID: e1b3779c9677 Revises: 846f9fce431d Create, upgrade()

### Community 14 - "Profile Fields Migration"
Cohesion: 0.5
Nodes (1): Add profile fields and superuser flag  Revision ID: 6f0a9f0ddf7c Revises: add_di

### Community 15 - "Initial Schema Migration"
Cohesion: 0.5
Nodes (1): Initial migration  Revision ID: 846f9fce431d Revises:  Create Date: 2025-11-

### Community 16 - "Dietary Restrictions Migration"
Cohesion: 0.5
Nodes (1): Add dietary_restrictions JSON column to user_profiles  Revision ID: add_dietary_

### Community 17 - "Alembic Migration Runner"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "DB Table Inspector"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Plan API Client"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Search API Client"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Voice API Client"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Login Page"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Signup Page"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Voice Search Button"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Backend API Init"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "API v1 Init"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Database Init"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Features Init"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Scripts Init"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "PostCSS Config"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Vite Build Config"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "React Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Axios HTTP Client"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Users REST API"
Cohesion: 1.0
Nodes (1): Users API (CRUD)

## Knowledge Gaps
- **19 isolated node(s):** `OAuth2 compatible token login, get an access token for future requests`, `Get a specific user by id.`, `Config`, `CRUD object with default methods to Create, Read, Update, Delete (CRUD).`, `Dependency function that yields database sessions.          Example usage:` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `DB Table Inspector`** (2 nodes): `check_tables.py`, `check_tables()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Plan API Client`** (2 nodes): `planApi.js`, `generatePlan()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Search API Client`** (2 nodes): `searchApi.js`, `searchNL()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Voice API Client`** (2 nodes): `voiceApi.js`, `transcribeVoice()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login Page`** (2 nodes): `Login.jsx`, `Login()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Signup Page`** (2 nodes): `Signup.jsx`, `Signup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Voice Search Button`** (2 nodes): `VoiceSearchButton.jsx`, `VoiceSearchButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend API Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API v1 Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Features Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Scripts Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Build Config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Entry Point`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Axios HTTP Client`** (1 nodes): `axiosClient.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Users REST API`** (1 nodes): `Users API (CRUD)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `deriveShoppingItems()` connect `Shopping List Utils` to `API Endpoints Layer`?**
  _High betweenness centrality (0.188) - this node is a cross-community bridge._
- **Why does `getPlanMealsForUser()` connect `Shopping List Utils` to `Frontend React App Shell`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `readMealPlan()` connect `Frontend React App Shell` to `Shopping List Utils`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `seed_recipes()` (e.g. with `.get()` and `Recipe`) actually correct?**
  _`seed_recipes()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `search_nl()` (e.g. with `search_natural_language()` and `expand_allergy_terms()`) actually correct?**
  _`search_nl()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `str` (e.g. with `generate_plan()` and `get_default_allergies()`) actually correct?**
  _`str` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `OAuth2 compatible token login, get an access token for future requests`, `Get a specific user by id.`, `Config` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._