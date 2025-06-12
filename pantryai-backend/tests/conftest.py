# File: tests/conftest.py

import os, sys

# Ensure the project root (where app.py, parsers.py, etc. live) is on sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
