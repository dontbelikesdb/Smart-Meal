import requests

from conftest import TIMEOUT


def test_root_health(base_url: str):
    response = requests.get(f"{base_url}/", timeout=TIMEOUT)
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
    assert body.get("docs") == "/docs"


def test_openapi_health(base_url: str, api_prefix: str):
    response = requests.get(f"{base_url}{api_prefix}/openapi.json", timeout=TIMEOUT)
    assert response.status_code == 200
    body = response.json()
    assert "openapi" in body
    assert "paths" in body
