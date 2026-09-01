from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_signup_requires_teacher_login():
    response = client.post(
        "/activities/Chess%20Club/signup?email=student@example.com"
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Teacher login required"


def test_teacher_can_sign_up_with_valid_credentials():
    login = client.post(
        "/login",
        json={"username": "teacher", "password": "welcome123"},
    )

    assert login.status_code == 200
    token = login.json()["token"]
    assert token

    response = client.post(
        "/activities/Chess%20Club/signup?email=student@example.com",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert "Signed up student@example.com" in response.json()["message"]


def test_teacher_can_unregister_with_valid_credentials():
    login = client.post(
        "/login",
        json={"username": "teacher", "password": "welcome123"},
    )
    token = login.json()["token"]

    response = client.delete(
        "/activities/Programming%20Class/unregister?email=emma@mergington.edu",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert "Unregistered emma@mergington.edu" in response.json()["message"]
