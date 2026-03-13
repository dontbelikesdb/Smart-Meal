import requests

from conftest import TIMEOUT


def test_users_me_authenticated(base_url: str, api_prefix: str, auth_headers):
    response = requests.get(
        f"{base_url}{api_prefix}/users/me",
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    assert "email" in body
    assert "id" in body


def test_users_me_unauthorized(base_url: str, api_prefix: str):
    response = requests.get(
        f"{base_url}{api_prefix}/users/me",
        timeout=TIMEOUT,
    )
    assert response.status_code == 401


def test_profile_update_success(base_url: str, api_prefix: str, auth_headers):
    payload = {
        "age": 30,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 75,
        "fitness_goal": "maintain",
        "dietary_restrictions": ["vegetarian"],
    }
    response = requests.post(
        f"{base_url}{api_prefix}/profile/",
        json=payload,
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    assert body.get("message") == "profile saved"
    assert "user_id" in body
    assert "profile_id" in body
