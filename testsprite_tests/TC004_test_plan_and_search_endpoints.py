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


def test_search_nl_high_fiber_and_time_constraints(
    base_url: str, api_prefix: str, auth_headers
):
    payload = {"query": "high fiber meals under 20 minutes", "limit": 5}
    response = requests.post(
        f"{base_url}{api_prefix}/search/nl",
        json=payload,
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    applied = body.get("applied", {})
    nutrition = applied.get("nutrition", {})
    assert nutrition.get("high_fiber") is True
    assert applied.get("time_max_minutes") == 20


def test_search_nl_low_sodium_and_low_sugar_constraints(
    base_url: str, api_prefix: str, auth_headers
):
    payload = {"query": "low sodium low sugar dinner", "limit": 5}
    response = requests.post(
        f"{base_url}{api_prefix}/search/nl",
        json=payload,
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    applied = body.get("applied", {})
    nutrition = applied.get("nutrition", {})
    assert nutrition.get("low_sodium") is True
    assert nutrition.get("low_sugar") is True


def test_search_nl_high_sugar_drinks_constraint(
    base_url: str, api_prefix: str, auth_headers
):
    payload = {"query": "high sugary drinks", "limit": 5}
    response = requests.post(
        f"{base_url}{api_prefix}/search/nl",
        json=payload,
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    nutrition = body.get("applied", {}).get("nutrition", {})
    assert nutrition.get("high_sugar") is True
    assert "drinks" in body.get("applied", {}).get("search_terms", [])


def test_search_nl_gluten_free_bread_constraint(
    base_url: str, api_prefix: str, auth_headers
):
    payload = {"query": "gluten free bread", "limit": 5}
    response = requests.post(
        f"{base_url}{api_prefix}/search/nl",
        json=payload,
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    nutrition = body.get("applied", {}).get("nutrition", {})
    assert nutrition.get("gluten_free") is True
    assert "bread" in body.get("applied", {}).get("search_terms", [])
    assert "gluten" not in body.get("applied", {}).get("search_terms", [])


def test_search_nl_warns_for_unsupported_budget_query(
    base_url: str, api_prefix: str, auth_headers
):
    payload = {"query": "cheap budget meals", "limit": 5}
    response = requests.post(
        f"{base_url}{api_prefix}/search/nl",
        json=payload,
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    warnings = body.get("applied", {}).get("warnings", [])
    assert any("Budget-aware filtering is not supported yet." in warning for warning in warnings)
