# Meal Planning (NLP Recipe Search)

Full‑stack meal planning app built around **natural‑language recipe search** and a rich recipe details experience.

This project originally started as a GA-based meal planner, but the current implementation focuses on:

- **NLP search** over a recipe database
- **Full‑screen recipe modal** (images, ingredient quantities, time breakdown, macros)
- **Meal plan persistence** (Search state + Plan stored in browser)

## Tech Stack

- **Frontend:** React (Vite) + TailwindCSS
- **Backend:** FastAPI + SQLAlchemy
- **Database:** PostgreSQL

## Key Features

- **Natural language search** (`/api/v1/search/nl`) with ranked results.
- **Recipe cards** that expand into a **full‑screen modal**.
- Modal shows:
  - image
  - ingredient lines (**quantity + ingredient**) from the dataset
  - prep/cook/total time
  - description, servings, cuisine type
  - nutrition macros (protein/carbs/fat/fiber/sugar/sodium)
- **Plan page** stores meals in `localStorage` per user and supports:
  - add/remove meals
  - clear plan
  - recipe modal on planned meals
- **Search persistence** when navigating between Search and Plan.

## Local Setup

### Prerequisites

- Node.js (for frontend)
- Python 3.10+ (backend)
- PostgreSQL running locally

### Environment Variables

Create a `.env` in the repo root (this file is gitignored):

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/meal_planner
```

Note: if your password contains special characters like `@`, it must be URL-encoded (e.g. `@` becomes `%40`).

### Seed the database

The backend reads recipes from `data/raw/recipes.csv` and writes them into PostgreSQL.

From `backend/`:

```
python -m app.scripts.seed_recipes --create-ingredients --backfill-ingredients --limit 2000
```

Increase `--limit` to seed more rows (e.g. `25000`, `100000`).

### Run Backend

From `backend/`:

```
uvicorn app.main:app --reload --env-file ../.env
```

Backend base URL:

- `http://127.0.0.1:8000`

### Run Frontend

From `frontend/`:

```
npm install
npm run dev
```

Frontend URL is printed by Vite (commonly `http://localhost:5173`).

## API Notes

- API prefix: `/api/v1`
- Search endpoint: `POST /api/v1/search/nl` (requires auth)
- Swagger docs: `GET /docs`

## About `ga-engine/`

The repository still contains a `ga-engine/` folder from earlier iterations. The current app flow does **not** require the GA worker to use search, recipe modals, or the plan UI.

## TestSprite MCP Setup (Windsurf)

### 1) Configure MCP server

File: `C:\Users\biswa\.codeium\windsurf\mcp_config.json`

Use this server entry:

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/testsprite-mcp@latest", "server"],
      "env": {
        "API_KEY": "YOUR_TESTSPRITE_API_KEY"
      }
    }
  }
}
```

### 2) Use project config template

Template file: `testsprite_tests/config.template.json`

- `localEndpoint` is set to `http://127.0.0.1:8000` for this backend.
- `backendUsername` / `backendPassword` match this project's seeded superuser.
- Replace `executionArgs.envs.API_KEY` with your TestSprite key.

### 3) Start backend before running TestSprite

From `backend/`:

```bash
uvicorn app.main:app --reload --env-file ../.env
```

Then ask your IDE agent: `Help me test this project with TestSprite`.
