import requests

from conftest import TIMEOUT


def test_generate_plan_success(base_url: str, api_prefix: str):
    payload = {"user_id": 1, "days": 1}
    response = requests.post(
        f"{base_url}{api_prefix}/plan/generate",
        json=payload,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("status") == "pending"
    assert isinstance(body.get("plan_id"), str) and len(body["plan_id"]) > 10


def test_search_recipes_authenticated(base_url: str, api_prefix: str, auth_headers):
    response = requests.get(
        f"{base_url}{api_prefix}/search/recipes",
        headers=auth_headers,
        params={"limit": 3},
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_search_nl_validation_error_on_empty_query(
    base_url: str, api_prefix: str, auth_headers
):
    payload = {"query": "", "limit": 5}
    response = requests.post(
        f"{base_url}{api_prefix}/search/nl",
        json=payload,
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 422
