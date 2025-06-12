# File: tests/test_parsers.py

import pytest
from parsers import parse_items

def test_parse_items_empty_string():
    assert parse_items("") == []

def test_parse_items_only_whitespace():
    assert parse_items("   \n\t  ") == []

def test_parse_items_with_explicit_quantity_and_name():
    raw = "2 Apples\n3 Bananas"
    items = parse_items(raw)
    assert items == [
        {"name": "apples", "quantity": 2},
        {"name": "bananas", "quantity": 3},
    ]

def test_parse_items_with_no_quantity():
    raw = "Milk\nBread"
    items = parse_items(raw)
    assert items == [
        {"name": "milk", "quantity": 1},
        {"name": "bread", "quantity": 1},
    ]

def test_parse_items_ignores_price_lines():
    raw = "1 Orange\n$5.00\n2 Pears"
    items = parse_items(raw)
    assert items == [
        {"name": "orange", "quantity": 1},
        {"name": "pears", "quantity": 2},
    ]
