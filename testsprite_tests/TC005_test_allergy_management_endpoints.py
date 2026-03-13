import requests

from conftest import TIMEOUT


def test_list_allergies_authenticated(base_url: str, api_prefix: str, auth_headers):
    response = requests.get(
        f"{base_url}{api_prefix}/allergies/",
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    assert "id" in body[0]
    assert "name" in body[0]


def test_get_and_set_profile_allergies(base_url: str, api_prefix: str, auth_headers):
    list_response = requests.get(
        f"{base_url}{api_prefix}/allergies/",
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert list_response.status_code == 200
    allergies = list_response.json()
    first_allergy_id = allergies[0]["id"]

    set_response = requests.post(
        f"{base_url}{api_prefix}/profile/allergies",
        json={"allergy_ids": [first_allergy_id]},
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert set_response.status_code == 200
    set_body = set_response.json()
    assert set_body.get("allergy_ids") == [first_allergy_id]

    get_response = requests.get(
        f"{base_url}{api_prefix}/profile/allergies",
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert get_response.status_code == 200
    get_body = get_response.json()
    assert first_allergy_id in get_body.get("allergy_ids", [])


def test_set_profile_allergies_with_unknown_id_fails(
    base_url: str, api_prefix: str, auth_headers
):
    response = requests.post(
        f"{base_url}{api_prefix}/profile/allergies",
        json={"allergy_ids": [9999999]},
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert response.status_code == 404
    assert "Unknown allergy_id" in response.text
