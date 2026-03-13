# TestSprite Backend API Tests

Base URL: `http://127.0.0.1:8000`  
API Prefix: `/api/v1`  
Credentials: `admin@example.com / Admin123`

## Files

- `standard_prd.json`: Backend test plan (health and auth prioritized first)
- `config.template.json`: TestSprite MCP config template for this project
- `conftest.py`: Shared API config and auth token fixtures
- `TC001_*.py` to `TC005_*.py`: Executable API tests

## Run

1. Start backend:

```powershell
cd backend
uvicorn app.main:app --reload --env-file ../.env
```

2. In another terminal, install test deps:

```powershell
pip install -r testsprite_tests/requirements.txt
```

3. Execute tests:

```powershell
python -m pytest testsprite_tests -v
```

## Optional overrides

You can override defaults with env vars:

- `TESTSPRITE_BASE_URL`
- `TESTSPRITE_API_PREFIX`
- `TESTSPRITE_EMAIL`
- `TESTSPRITE_PASSWORD`
- `TESTSPRITE_TIMEOUT`
