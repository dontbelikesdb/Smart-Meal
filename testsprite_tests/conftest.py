import os
from typing import Dict

import pytest
import requests


BASE_URL = os.getenv("TESTSPRITE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
API_PREFIX = os.getenv("TESTSPRITE_API_PREFIX", "/api/v1")
EMAIL = os.getenv("TESTSPRITE_EMAIL", "admin@example.com")
PASSWORD = os.getenv("TESTSPRITE_PASSWORD", "Admin123")
TIMEOUT = int(os.getenv("TESTSPRITE_TIMEOUT", "20"))


def _url(path: str) -> str:
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{BASE_URL}{path}"


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture(scope="session")
def api_prefix() -> str:
    return API_PREFIX


@pytest.fixture(scope="session")
def auth_token(api_prefix: str) -> str:
    response = requests.post(
        _url(f"{api_prefix}/auth/login/access-token"),
        data={"username": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT,
    )
    assert response.status_code == 200, (
        f"Login failed with {response.status_code}. "
        f"Response: {response.text}"
    )
    payload = response.json()
    assert payload.get("access_token"), "No access_token returned in login response"
    return payload["access_token"]


@pytest.fixture(scope="session")
def auth_headers(auth_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {auth_token}"}
