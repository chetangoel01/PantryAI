#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import sqlite3
import sys
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from db import (  # noqa: E402
    PANTRY_COLUMNS,
    RECIPE_COLUMNS,
    RECIPE_JSON_FIELDS,
    _decode_pantry,
    _decode_recipe,
    connection,
    init_db,
)


def load_rows(source, table):
    path = source / f"{table}.jsonl"
    with path.open() as handle:
        return [json.loads(line) for line in handle if line.strip()]


def encode_recipe_value(column, value):
    if column in RECIPE_JSON_FIELDS and value is not None:
        return json.dumps(value, separators=(",", ":"), sort_keys=True)
    return value


def create_database(source, output, replace=False):
    if output.exists() and not replace:
        raise SystemExit(f"Refusing to replace existing database: {output}")

    source_rows = {
        "pantry": load_rows(source, "pantry"),
        "recipes": load_rows(source, "recipes"),
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_handle = tempfile.NamedTemporaryFile(
        prefix=f".{output.name}.", suffix=".new", dir=output.parent, delete=False
    )
    temporary = Path(temporary_handle.name)
    temporary_handle.close()

    try:
        init_db(temporary)
        pantry_columns = ("id", *PANTRY_COLUMNS)
        recipe_columns = RECIPE_COLUMNS
        with connection(temporary) as database:
            pantry_placeholders = ", ".join("?" for _ in pantry_columns)
            for row in source_rows["pantry"]:
                values = [row.get(column) for column in pantry_columns]
                values[pantry_columns.index("is_opened")] = int(bool(row.get("is_opened")))
                database.execute(
                    f"INSERT INTO pantry ({', '.join(pantry_columns)}) VALUES ({pantry_placeholders})",
                    values,
                )

            recipe_placeholders = ", ".join("?" for _ in recipe_columns)
            for row in source_rows["recipes"]:
                database.execute(
                    f"INSERT INTO recipes ({', '.join(recipe_columns)}) VALUES ({recipe_placeholders})",
                    [encode_recipe_value(column, row.get(column)) for column in recipe_columns],
                )

        with connection(temporary) as database:
            pantry_rows = [
                _decode_pantry(row)
                for row in database.execute("SELECT * FROM pantry ORDER BY id")
            ]
            recipe_rows = [
                _decode_recipe(row)
                for row in database.execute("SELECT * FROM recipes ORDER BY id")
            ]

        if pantry_rows != source_rows["pantry"]:
            raise RuntimeError("Logical data mismatch after importing pantry")
        if recipe_rows != source_rows["recipes"]:
            raise RuntimeError("Logical data mismatch after importing recipes")

        with sqlite3.connect(temporary) as database:
            integrity = database.execute("PRAGMA integrity_check").fetchone()[0]
            foreign_key_errors = database.execute("PRAGMA foreign_key_check").fetchall()
            database.execute("PRAGMA journal_mode=DELETE")
        if integrity != "ok" or foreign_key_errors:
            raise RuntimeError(
                f"SQLite validation failed: integrity={integrity}, foreign_keys={foreign_key_errors}"
            )

        os.chmod(temporary, 0o600)
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
        Path(f"{temporary}-shm").unlink(missing_ok=True)
        Path(f"{temporary}-wal").unlink(missing_ok=True)

    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    for table, rows in source_rows.items():
        print(f"{table}={len(rows)}")
    print("integrity=ok")
    print(f"sha256={digest}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--replace", action="store_true")
    args = parser.parse_args()
    create_database(args.source, args.output, args.replace)


if __name__ == "__main__":
    main()
