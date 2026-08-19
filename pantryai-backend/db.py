import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path


PANTRY_COLUMNS = (
    "name",
    "category",
    "quantity",
    "unit",
    "expiry",
    "purchase_date",
    "location",
    "brand",
    "barcode",
    "notes",
    "is_opened",
    "added_at",
    "device_id",
)

RECIPE_COLUMNS = (
    "id",
    "url",
    "name",
    "author",
    "ratings",
    "description",
    "ingredients",
    "steps",
    "nutrients",
    "times",
    "serves",
    "difficulty",
    "vote_count",
    "subcategory",
    "dish_type",
    "maincategory",
    "cleaned_ingredients_list",
    "image_url",
)

RECIPE_JSON_FIELDS = {
    "ingredients",
    "steps",
    "nutrients",
    "times",
    "cleaned_ingredients_list",
}


def database_path():
    return Path(os.environ.get("DATABASE_PATH", "data/pantryai.sqlite3"))


def _connect(path=None):
    target = Path(path) if path else database_path()
    database = sqlite3.connect(target, timeout=30)
    database.row_factory = sqlite3.Row
    database.execute("PRAGMA foreign_keys = ON")
    database.execute("PRAGMA busy_timeout = 30000")
    return database


@contextmanager
def connection(path=None):
    database = _connect(path)
    try:
        yield database
        database.commit()
    except Exception:
        database.rollback()
        raise
    finally:
        database.close()


def init_db(path=None):
    target = Path(path) if path else database_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    with connection(target) as database:
        database.executescript(
            """
            PRAGMA journal_mode = WAL;

            CREATE TABLE IF NOT EXISTS pantry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                quantity NUMERIC,
                unit TEXT,
                expiry TEXT,
                purchase_date TEXT,
                location TEXT,
                brand TEXT,
                barcode TEXT,
                notes TEXT,
                is_opened INTEGER NOT NULL DEFAULT 0,
                added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                device_id TEXT
            );

            CREATE TABLE IF NOT EXISTS recipes (
                id TEXT PRIMARY KEY,
                url TEXT,
                name TEXT NOT NULL,
                author TEXT,
                ratings REAL,
                description TEXT,
                ingredients TEXT NOT NULL,
                steps TEXT NOT NULL,
                nutrients TEXT,
                times TEXT,
                serves INTEGER,
                difficulty TEXT,
                vote_count INTEGER,
                subcategory TEXT,
                dish_type TEXT,
                maincategory TEXT,
                cleaned_ingredients_list TEXT,
                image_url TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_pantry_device_id ON pantry(device_id);
            CREATE INDEX IF NOT EXISTS idx_pantry_name ON pantry(name);
            CREATE INDEX IF NOT EXISTS idx_recipes_image_url ON recipes(image_url);
            CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
            """
        )


def _decode_pantry(row):
    if row is None:
        return None
    item = dict(row)
    item["is_opened"] = bool(item["is_opened"])
    return item


def _decode_recipe(row):
    if row is None:
        return None
    recipe = dict(row)
    for field in RECIPE_JSON_FIELDS:
        value = recipe.get(field)
        recipe[field] = json.loads(value) if value else None
    return recipe


def list_pantry(device_id):
    with connection() as database:
        rows = database.execute(
            "SELECT * FROM pantry WHERE device_id = ? ORDER BY id",
            (device_id,),
        ).fetchall()
    return [_decode_pantry(row) for row in rows]


def get_pantry_item(item_id, device_id):
    with connection() as database:
        row = database.execute(
            "SELECT * FROM pantry WHERE id = ? AND device_id = ?",
            (item_id, device_id),
        ).fetchone()
    return _decode_pantry(row)


def insert_pantry_items(items):
    placeholders = ", ".join("?" for _ in PANTRY_COLUMNS)
    with connection() as database:
        inserted_ids = []
        for item in items:
            values = [item.get(column) for column in PANTRY_COLUMNS]
            values[PANTRY_COLUMNS.index("is_opened")] = int(bool(item.get("is_opened")))
            cursor = database.execute(
                f"INSERT INTO pantry ({', '.join(PANTRY_COLUMNS)}) VALUES ({placeholders})",
                values,
            )
            inserted_ids.append(cursor.lastrowid)
        placeholders_for_ids = ", ".join("?" for _ in inserted_ids)
        rows = database.execute(
            f"SELECT * FROM pantry WHERE id IN ({placeholders_for_ids}) ORDER BY id",
            inserted_ids,
        ).fetchall()
    return [_decode_pantry(row) for row in rows]


def update_pantry_item(item_id, device_id, values):
    allowed = set(PANTRY_COLUMNS) - {"device_id", "added_at"}
    updates = {key: value for key, value in values.items() if key in allowed}
    if not updates:
        return get_pantry_item(item_id, device_id)
    if "is_opened" in updates:
        updates["is_opened"] = int(bool(updates["is_opened"]))
    assignments = ", ".join(f"{column} = ?" for column in updates)
    with connection() as database:
        cursor = database.execute(
            f"UPDATE pantry SET {assignments} WHERE id = ? AND device_id = ?",
            [*updates.values(), item_id, device_id],
        )
        if cursor.rowcount == 0:
            return None
    return get_pantry_item(item_id, device_id)


def delete_pantry_item(item_id, device_id):
    with connection() as database:
        cursor = database.execute(
            "DELETE FROM pantry WHERE id = ? AND device_id = ?",
            (item_id, device_id),
        )
        return cursor.rowcount > 0


def search_pantry(device_id, text):
    pattern = f"%{text}%"
    with connection() as database:
        rows = database.execute(
            """
            SELECT * FROM pantry
            WHERE device_id = ? AND name LIKE ? COLLATE NOCASE
            ORDER BY id
            """,
            (device_id, pattern),
        ).fetchall()
    return [_decode_pantry(row) for row in rows]


def pantry_summary(device_id):
    with connection() as database:
        rows = database.execute(
            "SELECT name, quantity, unit FROM pantry WHERE device_id = ? ORDER BY id",
            (device_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_recipe(recipe_id):
    with connection() as database:
        row = database.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,)).fetchone()
    return _decode_recipe(row)


def recipes_by_ids(recipe_ids):
    if not recipe_ids:
        return []
    placeholders = ", ".join("?" for _ in recipe_ids)
    with connection() as database:
        rows = database.execute(
            f"SELECT * FROM recipes WHERE id IN ({placeholders})",
            recipe_ids,
        ).fetchall()
    return [_decode_recipe(row) for row in rows]


def search_recipes(text, limit=20):
    pattern = f"%{text}%"
    with connection() as database:
        rows = database.execute(
            """
            SELECT * FROM recipes
            WHERE name LIKE ? COLLATE NOCASE
               OR description LIKE ? COLLATE NOCASE
            ORDER BY name
            LIMIT ?
            """,
            (pattern, pattern, limit),
        ).fetchall()
    return [_decode_recipe(row) for row in rows]


def recipes_containing_ingredients(ingredients, limit=20):
    wanted = {ingredient.casefold() for ingredient in ingredients}
    with connection() as database:
        rows = database.execute("SELECT * FROM recipes ORDER BY name").fetchall()
    matches = []
    for row in rows:
        recipe = _decode_recipe(row)
        available = {
            str(ingredient).casefold()
            for ingredient in (recipe.get("cleaned_ingredients_list") or [])
        }
        if wanted.issubset(available):
            matches.append(recipe)
            if len(matches) == limit:
                break
    return matches


def filter_recipes(dietary="", cuisine="", difficulty="", sort_by="name", descending=False, limit=50):
    with connection() as database:
        rows = database.execute("SELECT * FROM recipes").fetchall()
    recipes = [_decode_recipe(row) for row in rows]

    if dietary:
        recipes = [recipe for recipe in recipes if recipe.get("dietary_restrictions") == dietary.casefold()]
    if cuisine:
        recipes = [recipe for recipe in recipes if recipe.get("cuisine") == cuisine.casefold()]
    if difficulty:
        recipes = [recipe for recipe in recipes if (recipe.get("difficulty") or "").casefold() == difficulty.casefold()]

    def nested_number(recipe, field, key):
        value = recipe.get(field) or {}
        if not isinstance(value, dict):
            return 0
        result = value.get(key)
        try:
            return float(result)
        except (TypeError, ValueError):
            return 0

    key_functions = {
        "name": lambda recipe: (recipe.get("name") or "").casefold(),
        "rating": lambda recipe: recipe.get("ratings") or 0,
        "time": lambda recipe: nested_number(recipe, "times", "cook"),
        "calories": lambda recipe: nested_number(recipe, "nutrients", "calories"),
    }
    recipes.sort(key=key_functions.get(sort_by, key_functions["name"]), reverse=descending)
    return recipes[:limit]


def list_recipes(offset=0, limit=50):
    with connection() as database:
        rows = database.execute(
            "SELECT * FROM recipes ORDER BY id LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
    return [_decode_recipe(row) for row in rows]


def upsert_recipes(recipes):
    columns = RECIPE_COLUMNS
    placeholders = ", ".join("?" for _ in columns)
    updates = ", ".join(f"{column} = excluded.{column}" for column in columns if column != "id")
    with connection() as database:
        for recipe in recipes:
            values = []
            for column in columns:
                value = recipe.get(column)
                if column in RECIPE_JSON_FIELDS and value is not None:
                    value = json.dumps(value, separators=(",", ":"))
                values.append(value)
            database.execute(
                f"""
                INSERT INTO recipes ({', '.join(columns)}) VALUES ({placeholders})
                ON CONFLICT(id) DO UPDATE SET {updates}
                """,
                values,
            )
    return recipes_by_ids([recipe["id"] for recipe in recipes])


def update_recipe(recipe_id, values):
    allowed = set(RECIPE_COLUMNS) - {"id"}
    updates = {key: value for key, value in values.items() if key in allowed}
    if not updates:
        return get_recipe(recipe_id)
    for field in RECIPE_JSON_FIELDS:
        if field in updates and updates[field] is not None:
            updates[field] = json.dumps(updates[field], separators=(",", ":"))
    assignments = ", ".join(f"{column} = ?" for column in updates)
    with connection() as database:
        cursor = database.execute(
            f"UPDATE recipes SET {assignments} WHERE id = ?",
            [*updates.values(), recipe_id],
        )
        if cursor.rowcount == 0:
            return None
    return get_recipe(recipe_id)


def recipes_with_images():
    with connection() as database:
        rows = database.execute(
            "SELECT * FROM recipes WHERE image_url IS NOT NULL ORDER BY name"
        ).fetchall()
    return [_decode_recipe(row) for row in rows]


def recipes_without_images():
    with connection() as database:
        rows = database.execute(
            "SELECT * FROM recipes WHERE image_url IS NULL ORDER BY name"
        ).fetchall()
    return [_decode_recipe(row) for row in rows]
