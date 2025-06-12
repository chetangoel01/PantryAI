import pytest
from app import create_app
from db import supabase
import routes.recipes as recipes_module

class DummyResult:
    def __init__(self, data):
        self.data = data
    def execute(self):
        return self

class DummyTable:
    def __init__(self, name):
        pass
    def select(self, *args, **kwargs):
        # return a dummy result for .execute().data
        return DummyResult([{"name": "apple", "quantity": 2, "unit": ""}])
    def insert(self, items):
        # mimic Supabase insert API
        return DummyResult(items)

@pytest.fixture
def client(monkeypatch):
    # monkey-patch supabase.table to use our dummy
    monkeypatch.setattr(supabase, "table", lambda name: DummyTable(name))
    app = create_app()
    app.testing = True
    return app.test_client()


def test_index_route(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.get_json() == {"message": "PantryAI API is running!"}


def test_404_route(client):
    resp = client.get("/no-such-endpoint")
    assert resp.status_code == 404
    assert resp.get_json() == {"error": "Endpoint not found"}


def test_list_pantry(client):
    resp = client.get("/pantry")
    assert resp.status_code == 200
    assert resp.get_json() == [{"name": "apple", "quantity": 2}]


def test_confirm_add_items_empty_list(client):
    resp = client.post("/pantry/confirm-add", json={"items": []})
    assert resp.status_code == 200
    assert resp.get_json() == {"message": "No items to add."}


def test_confirm_add_items_invalid_payload(client):
    resp = client.post("/pantry/confirm-add", json={})
    assert resp.status_code == 400
    assert "Invalid request payload" in resp.get_json()["error"]


def test_confirm_add_items_success(client):
    new_items = [
        {"name": "banana", "quantity": 3},
        {"name": "rice", "quantity": "two"}  # tests quantity fallback
    ]
    resp = client.post("/pantry/confirm-add", json={"items": new_items})
    assert resp.status_code == 201
    inserted = resp.get_json()["inserted"]
    # names should match and quantity "two" should have defaulted to 1
    names = sorted([it["name"] for it in inserted])
    quantities = sorted([it["quantity"] for it in inserted])
    assert names == ["banana", "rice"]
    assert quantities == [1, 3]


def test_match_recipes_empty_pantry(client, monkeypatch):
    # Simulate empty pantry
    monkeypatch.setattr(recipes_module, "get_pantry_items_text_for_embedding", lambda: "")
    resp = client.get("/recipes/match")
    assert resp.status_code == 200
    assert resp.get_json() == {"message": "Your pantry is empty. Please add items to get recipe suggestions."}


def test_match_recipes_success(client, monkeypatch):
    # Simulate pantry with items and stub embedding and matching
    monkeypatch.setattr(recipes_module, "get_pantry_items_text_for_embedding", lambda: "2 apples")
    monkeypatch.setattr(recipes_module, "generate_text_embedding", lambda text: [0.0] * 768)
    monkeypatch.setattr(recipes_module, "match_recipes", lambda vec, k=5: {"matched_recipes": [{"recipe_id": "test-id", "score": 0.42}]})
    resp = client.get("/recipes/match?k=3")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "matched_recipes" in data
    assert isinstance(data["matched_recipes"], list)
    assert data["matched_recipes"][0]["recipe_id"] == "test-id"
    assert data["matched_recipes"][0]["score"] == 0.42
