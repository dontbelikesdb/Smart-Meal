# SmartMeal: NLP-Powered Personalized Meal Planning System

---

## Abstract
**SmartMeal** is a comprehensive, full-stack web application designed to simplify the complex task of daily meal planning and dietary management. The platform operates as an intelligent **Natural-Language-Processing (NLP) powered recipe search engine** and planner. 

The system accepts natural language inputs (e.g., "gluten-free meals high in protein under 500 calories"), parses these requirements into structured queries using Large Language Models (LLMs), and retrieves relevant, ranked recipes from a PostgreSQL database seeded with thousands of classified recipes. It features a rich, responsive React frontend tailored with TailwindCSS, offline storage capabilities through Progressive Web App (PWA) configurations, and voice-assisted search mechanisms using local transcription (Faster-Whisper) backed by OpenAI APIs.

Built on the latest stack incorporating FastAPI, SQLAlchemy, PostgreSQL, and React (Vite), SmartMeal is architecturally designed for speed, security, and scalability. This document details the system’s design, setup execution, technical architecture, and implementation challenges resolved during the development of this intelligent lifestyle platform.

---

## Contents
1. **Objective**
2. **Introduction**
3. **Work Done**
   - 3.1 Experimental Setup & Tools
   - 3.2 Technical System Architecture
   - 3.3 Core Component Workflows
   - 3.4 API Documentation overview
   - 3.5 Setup & Execution Guide
4. **Key Learnings & Challenges**
5. **Future Work**
6. **Conclusion**

---

## 1. Objective

### 1.1 Key Objectives
The primary mission of the SmartMeal project was to design an intuitive yet powerful culinary assistance tool. Its core objectives include:
- **Intelligent Search Optimization:** Allow users to request meals dynamically using conversational natural language via text or voice, replacing rigid traditional filter-based search.
- **Dietary Restriction Management:** Intelligently map complex user allergies to base ingredient components allowing for strict, database-level safe food filtering.
- **Rich Recipe Interaction:** Present comprehensive recipe breakdowns, including high-quality visuals, macroeconomic matrices, interactive instructions, and ingredient sizing in a distraction-free, full-screen mobile-optimized layout.
- **Progressive Persistence:** Ensure continuous user experience by caching meal plans client-side, allowing users offline access and bridging the gap between browsing and planning.
- **Scalable Enterprise Architecture:** Utilize a modern Python/React stack integrated with robust JWT-based session security.
### 1.2 Problem Definition
Meal planning applications are ubiquitous, yet most fail to adapt dynamically to a user's exact preferences or complex dietary restrictions without cumbersome form-filling. 
- **The Search Bottleneck:** Finding a meal that is simultaneously "low-carb", "dairy-free", requires "under 30 minutes of prep", and contains "chicken" traditionally requires navigating dense filter menus. 
- **The Allergy Gap:** Users with specific allergies often depend on generic "gluten-free" keywords rather than a system analyzing exact ingredient compositions to guarantee safety.

SmartMeal eliminates these pain points by integrating modern NLP. Users state what they want, and the AI translates human intent into granular database operations.

---

## 2. Introduction
With the surge of personal health consciousness, digital lifestyle management tools require more proactive adaptability. SmartMeal embraces this shift by combining Artificial Intelligence with highly structured dietary datasets. 

By taking user queries—such as "I want an easy vegan breakfast"—the application uses GPT-driven logic (`google-genai` and `openai`) to parse constraints (DietType, CalorieBuckets, include/exclude ingredients). These constraints fetch tailored content from a dynamically seeded relational database. Through a combination of intuitive interface design and intelligent backend routing, SmartMeal converts abstract culinary desires into actionable, visually structured localized meal plans and subsequent shopping requirements.

---

## 3. Work Done

### 3.1 Experimental Setup & Tools
- **Frontend Layer:** React.js, Vite for bundling, TailwindCSS for atomic styling, Axios for HTTP protocol. Fully configured as an installable PWA.
- **Backend Layer:** Python 3.10+, FastAPI framework for high-performance async REST APIs, SQLAlchemy ORM for database interactivity, Alembic for schema migrations.
- **Database System:** PostgreSQL for robust relational data mapping, utilizing structured columns to track macros, JSON for complex dietary sets, and relationships uniting Users, Profiles, Allergies, and Ingredients.
- **AI Integration Engine:** Open-source `faster-whisper` for local rapid voice-to-text, backed by OpenAI APIs for deeper contextual natural language analysis.


### 3.2 Technical System Architecture

The ecosystem relies on an asynchronous backend interpreting requests from a client-side rendered frontend, utilizing a multi-layered REST approach.

```mermaid
graph TD
    %% Frontend Elements
    subgraph Frontend [React SPA / PWA App]
        UI[User Interface]
        VoiceSearch[Voice Search Component]
        PlanStore[localStorage Plan Persistence]
        AuthStore[JWT Access Context]
    end

    %% External Inputs
    UI -.-> |Text Query| SearchRoute
    VoiceSearch -.-> |Audio Blob| VoiceRoute

    %% Backend Elements
    subgraph Backend [FastAPI Backend Server]
        VoiceRoute[POST /api/v1/voice/transcribe]
        SearchRoute[POST /api/v1/search/nl]
        AuthRoute[POST /api/v1/auth]
        AllergyAPI[POST /api/v1/profile/allergies]
        
        NLP[NLP Query Parser]
        Whisper[Faster-Whisper/OpenAI]
        ORM[SQLAlchemy Data Access]
    end

    %% Database Layer
    subgraph DatabaseLayer [PostgreSQL Database]
        Users[(Users/Profiles)]
        Allergies[(Allergy Maps)]
        Recipes[(Recipes Database)]
    end

    %% Processing flows
    VoiceRoute --> |Transcribes| Whisper
    Whisper --> |Outputs string| SearchRoute
    
    SearchRoute --> NLP
    NLP --> |DietType, CalorieBucket, terms| ORM
    
    AllergyAPI --> ORM
    AuthRoute --> ORM
    
    ORM <--> |Query & Update| DatabaseLayer

    %% Return Paths
    SearchRoute --> |Returns RecipeResult| UI
```

### 3.3 Core Component Workflows

Based on internal knowledge graph (Graphify) analysis, the application is divided into fundamental community hubs:

1. **NLP Search Engine (`search_nl`):** The core intelligence endpoint. It ingests search text, pushes it to an LLM to extract structural filters, expands user base allergies into excluded technical ingredients (using `get_allergy_aliases()`), and strictly queries the Postgres DB.
2. **Ingredient & Recipe Seeding (`seed_recipes()`):** Recognized as a "God Node" with the highest interconnectivity in the database logic. This standalone module parses massive raw `.csv` datasets, classifies dietary restrictions automatically (`_classify_is_vegetarian()`), and robustly seeds relational tables during setup.
3. **Shopping List Utils (`deriveShoppingItems()`):** Highly complex frontend algorithms that take locally preserved `MealPlan` data and derive unified, deduplicated snapshot lists of actionable grocery items.
4. **CRUD Base System:** A comprehensive object-oriented approach handling creation, retrieval, updating, and logic deletion scaling uniformly across Users, Profiles, and Models.

### 3.4 API Documentation Overview
A rigorous internal API contract serves as the backbone connecting the SPA to the logic:
- **Authentication:** `POST /auth/login/access-token` via strict OAuth2 Form Data to yield secure JWT Bearers.
- **Search System:** `POST /api/v1/search/nl` takes the user query and requested result counts.
- **Profile Management:** Endpoints for inserting chronic diseases, managing bodily metrics (BMI), and complex allergy definitions (`POST /api/v1/profile/allergies`).

### 3.5 Setup & Execution Guide

SmartMeal requires precise local environment alignment.

**1. Environment Configurations**
Create a `.env` in the root (matching `.env.example`).
```env
DATABASE_URL=postgresql://root:password@localhost:5432/meal_planner
SECRET_KEY=your_secure_randomly_generated_string
```

**2. Database Migrations**
Initialize your relational schema using Alembic:
```bash
cd backend
alembic upgrade head
```

**3. Dataset Seeding**
Ingest `data/raw/recipes.csv` dynamically to bootstrap the platform with searchable material:
```bash
python -m app.scripts.seed_recipes --create-ingredients --backfill-ingredients --limit 5000
```

**4. Executing Servers**
*(Terminal 1: Uvicorn ASGI Backend)*
```bash
cd backend
uvicorn app.main:app --reload --env-file ../.env
```
*(Terminal 2: Vite React Frontend)*
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Key Learnings & Challenges

### 4.1 Implementing Hybrid Voice Transcription
**Challenge:** Navigating complex environmental configurations for `faster-whisper` dynamically on non-GPU local hardware resulted in blocking latency and unexpected crashes on diverse systems.
**Solution:** Architected a "three-tier fallback system" (Community Hub: `Voice API Client`). The system attempts transcription using a local Whisper model, failing gracefully to the OpenAI whisper API layer to guarantee zero interruption in the user experience.

### 4.2 NLP Translation to Relational DB 
**Challenge:** Translating infinite human terminology into rigid database schema column filtering. Prompts via `google-genai` yielded unpredictable JSON formats, crashing the pipeline.
**Solution:** Engineered the `parse_query()` function with rigorous Python generic typing models (`Pydantic`). Forced the LLM to output discrete string elements directly linked to `DietType` enums and numerical range values `CalorieBucket`, effectively eliminating "hallucinated" search arguments. 

### 4.3 Responsive UI Complexities 
**Challenge:** Positioning the dynamic Voice/Text dual-search bar consistently across desktop viewports and restrictive iOS mobile wrappers.
**Solution:** Isolated absolutely positioned visual icons into structurally isolated independent `divs` configured purely `relative` to the active `input`. This solved mobile spacing collapsing inherently caused by responsive grid breakpoints impacting overlapping interactive elements.

---

## 5. Future Work

While SmartMeal possesses a mature Search & Presentation layer, continuous expansion is mapped out:
1. **Native Third-Party Delivery Integration:** Extrapolate the generated Shopping List Utils into direct API handoffs with platforms like Instacart or Amazon Fresh.
3. **Expanded Dietary Classifiers:** Evolve `seed_recipes()` inference algorithms to autonomously identify more complex dietary regimes (e.g., FODMAP compliant, localized strict Vegan guidelines) from raw unstructured textual datasets.

---

## 6. Conclusion

The SmartMeal framework represents the intersection of classical data engineering and modern applied artificial intelligence. By heavily localizing robust NLP logic to alleviate traditional interface obstacles—and backing it with a high-fidelity data seeding mechanism—the platform delivers a seamless, beautiful, and deeply practical dietary management tool.

The application stands fully deployed, rigorously structured based on clear code community hubs, and optimized for scalability extending from its React interface directly to its asynchronous Postgres core.

---
