import requests

from conftest import EMAIL, PASSWORD, TIMEOUT


def test_login_access_token_success(base_url: str, api_prefix: str):
    response = requests.post(
        f"{base_url}{api_prefix}/auth/login/access-token",
        data={"username": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("token_type") == "bearer"
    assert isinstance(body.get("access_token"), str) and len(body["access_token"]) > 10


def test_login_test_token_success(base_url: str, api_prefix: str, auth_headers):
    response = requests.post(
        f"{base_url}{api_prefix}/auth/login/test-token",
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("email") == EMAIL
    assert "id" in body


def test_login_access_token_invalid_password(base_url: str, api_prefix: str):
    response = requests.post(
        f"{base_url}{api_prefix}/auth/login/access-token",
        data={"username": EMAIL, "password": "WrongPassword123"},
        timeout=TIMEOUT,
    )
    assert response.status_code == 400
    assert "Incorrect email or password" in response.text


def test_login_test_token_without_bearer_fails(base_url: str, api_prefix: str):
    response = requests.post(
        f"{base_url}{api_prefix}/auth/login/test-token",
        timeout=TIMEOUT,
    )
    assert response.status_code == 401
