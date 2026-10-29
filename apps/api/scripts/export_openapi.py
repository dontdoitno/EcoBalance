"""Dumps the FastAPI app's OpenAPI schema to docs/api/openapi.json, which
packages/contracts turns into a generated TS client via openapi-typescript.

Run: uv run python -m scripts.export_openapi
"""

from __future__ import annotations

import json
from pathlib import Path

from app.main import app

_OUTPUT_PATH = Path(__file__).resolve().parents[3] / "docs" / "api" / "openapi.json"


def main() -> None:
    schema = app.openapi()
    _OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    _OUTPUT_PATH.write_text(
        json.dumps(schema, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
