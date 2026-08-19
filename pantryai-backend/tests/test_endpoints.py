import pytest


DEVICE_HEADERS = {"X-Device-ID": "00000000-0000-0000-0000-000000000001"}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "pantryai.sqlite3"))
    from db import init_db

    init_db()
    import app as app_module

    app_module.app.config.update(TESTING=True)
    return app_module.app.test_client()


def test_index_and_404(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"PantryAI" in response.data

    missing = client.get("/no-such-endpoint")
    assert missing.status_code == 404
    assert missing.get_json() == {"error": "Not Found"}


def test_pantry_lifecycle(client):
    created = client.post(
        "/pantry/confirm-add",
        headers=DEVICE_HEADERS,
        json={"items": [{"name": "banana", "quantity": 3}, {"name": "rice", "quantity": "two"}]},
    )
    assert created.status_code == 201
    inserted = created.get_json()["inserted"]
    assert [item["name"] for item in inserted] == ["banana", "rice"]
    assert [item["quantity"] for item in inserted] == [3, 1]

    listed = client.get("/pantry", headers=DEVICE_HEADERS)
    assert listed.status_code == 200
    assert len(listed.get_json()) == 2

    item_id = inserted[0]["id"]
    updated = client.put(
        f"/pantry/{item_id}",
        headers=DEVICE_HEADERS,
        json={"quantity": 4},
    )
    assert updated.status_code == 200
    assert updated.get_json()["quantity"] == 4

    searched = client.get("/pantry/search?query=BAN", headers=DEVICE_HEADERS)
    assert searched.status_code == 200
    assert [item["name"] for item in searched.get_json()] == ["banana"]

    deleted = client.delete(f"/pantry/{item_id}", headers=DEVICE_HEADERS)
    assert deleted.status_code == 200


def test_confirm_add_validation(client):
    empty = client.post("/pantry/confirm-add", headers=DEVICE_HEADERS, json={"items": []})
    assert empty.status_code == 200
    assert empty.get_json() == {"message": "No items to add."}

    invalid = client.post("/pantry/confirm-add", headers=DEVICE_HEADERS, json={})
    assert invalid.status_code == 400
    assert "Invalid request payload" in invalid.get_json()["error"]


def test_recipe_queries_use_sqlite(client):
    from db import recipes_containing_ingredients, search_recipes, upsert_recipes

    upsert_recipes(
        [
            {
                "id": "recipe-1",
                "name": "Apple Pie",
                "description": "A simple pie",
                "ingredients": ["apple", "flour"],
                "steps": ["Bake"],
                "cleaned_ingredients_list": ["apple", "flour"],
            }
        ]
    )
    assert search_recipes("APPLE")[0]["id"] == "recipe-1"
    assert recipes_containing_ingredients(["apple"])[0]["id"] == "recipe-1"

    response = client.get("/recipes/search?query=apple")
    assert response.status_code == 200
    assert response.get_json()["results"][0]["name"] == "Apple Pie"
