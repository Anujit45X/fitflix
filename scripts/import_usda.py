"""Generate a reviewed, repeatable USDA import without rewriting Flyway history.

Usage: python scripts/import_usda.py archive.zip [--output candidate.sql]
Only the documented SR Legacy archive is accepted. No database is contacted.
"""
import argparse
import csv
import hashlib
import io
import json
from decimal import Decimal
from pathlib import Path
from zipfile import ZipFile

EXPECTED_SHA256 = "b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0"
SOURCE = "USDA FoodData Central · SR Legacy"
ROOT = Path(__file__).resolve().parents[1]
NUTRIENTS = {1008: "calories", 1003: "protein", 1005: "carbs", 1004: "fat",
             1079: "fiber", 2000: "sugar", 1093: "sodium"}


def generate(source: Path) -> tuple[str, dict]:
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        raise ValueError("Archive checksum differs from the reviewed SR Legacy release; review the new source first.")
    with ZipFile(source) as archive:
        def rows(name):
            matches = [n for n in archive.namelist() if n.rsplit("/", 1)[-1] == name]
            if len(matches) != 1:
                raise ValueError("Expected exactly one " + name)
            return csv.DictReader(io.StringIO(archive.read(matches[0]).decode("utf-8-sig")))
        categories = {r["id"]: r["description"] for r in rows("food_category.csv")}
        nutrients = {}
        for row in rows("food_nutrient.csv"):
            nid = int(row["nutrient_id"])
            if nid in NUTRIENTS and row["amount"]:
                amount = Decimal(row["amount"])
                if not amount.is_finite() or amount < 0:
                    raise ValueError("Invalid source nutrient")
                nutrients.setdefault(row["fdc_id"], {})[NUTRIENTS[nid]] = amount
        foods = []
        for row in rows("food.csv"):
            values = nutrients.get(row["fdc_id"], {})
            if all(k in values for k in ("calories", "protein", "carbs", "fat")):
                foods.append({"id": int(row["fdc_id"]), "name": row["description"],
                              "category": categories.get(row["food_category_id"], "Other"),
                              **{k: values.get(k) for k in NUTRIENTS.values()}})
    foods.sort(key=lambda f: f["id"])
    if len(foods) != len({f["id"] for f in foods}) or len(foods) != 7793:
        raise ValueError("Unexpected source food count or duplicate IDs")

    def literal(value):
        if value is None:
            return "NULL"
        return "'" + value.replace("'", "''") + "'" if isinstance(value, str) else str(value)

    columns = ["id", "name", "category", *NUTRIENTS.values(), "source", "source_id"]
    assignments = ",".join(f"{c}=EXCLUDED.{c}" for c in columns if c not in ("id", "source_id"))
    lines = ["-- Reviewed USDA SR Legacy; public-domain source; per 100 g.",
             "-- Updates catalog only. Never edits historical meal snapshots.",
             "BEGIN;"]
    for food in foods:
        values = [food["id"], food["name"], food["category"],
                  *[food[k] for k in NUTRIENTS.values()], SOURCE, str(food["id"])]
        lines.append("INSERT INTO food(" + ",".join(columns) + ") VALUES (" +
                     ",".join(map(literal, values)) + ") ON CONFLICT(id) DO UPDATE SET " +
                     assignments + " WHERE food.owner_id IS NULL AND food.source_id=EXCLUDED.source_id;")
    lines += ["SELECT setval(pg_get_serial_sequence('food','id'),(SELECT max(id) FROM food));", "COMMIT;"]
    return "\n".join(lines) + "\n", {
        "source": "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip",
        "license": "Public domain (USDA FoodData Central)",
        "sha256": digest, "foods": len(foods), "unit": "per 100 g",
        "historical_migrations_modified": False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / ".local/usda-reviewed-import.sql")
    args = parser.parse_args()
    output = args.output.resolve()
    migrations = (ROOT / "backend/src/main/resources/db/migration").resolve()
    if output == migrations or migrations in output.parents:
        raise SystemExit("Refusing to rewrite Flyway history. Choose a separate review file.")
    sql, provenance = generate(args.archive)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        if output.read_text(encoding="utf-8") != sql:
            raise SystemExit("Output exists with different content; choose a new filename.")
    else:
        output.write_text(sql, encoding="utf-8")
    sidecar = output.with_suffix(".provenance.json")
    if not sidecar.exists():
        sidecar.write_text(json.dumps(provenance, indent=2), encoding="utf-8")
    print(f"Verified {provenance['foods']} source foods. Candidate SQL ready for review; no database changed.")


if __name__ == "__main__":
    main()
