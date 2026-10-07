# Food data provenance
7,793 distinct USDA FoodData Central SR Legacy foods; IDs are the original FDC IDs. All core nutrients (energy kcal, protein g, carbohydrate g, fat g) are present. Fiber and sugar are grams; sodium is milligrams. Quantities are per 100 g edible portion. Preparation details remain in food names. Default serving = 100 g, not a claimed household serving. Nutrient values vary by recipe and source.

Source: https://fdc.nal.usda.gov/download-datasets/
Archive: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
SHA-256: b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0
Source release: April 2018 (legacy); retrieved 2026-09-27. USDA data are public domain; attribution retained. No invented padding, replications, or random nutrition values. Legacy coverage and Indian recipe coverage are limited; users can add private recipe-label data marked unverified. No claim of comprehensive Indian-food coverage.

Verified again on 7 October 2026: the official archive was downloaded and matched the SHA-256 above. Generate a reviewed import with `python scripts/import_usda.py /path/to/download.zip`; it now writes `.local/usda-reviewed-import.sql` and a provenance sidecar, never overwrites a Flyway migration, and never contacts the database. It rejects an unreviewed archive checksum. Review the candidate, then use `psql -v ON_ERROR_STOP=1 -f .local/usda-reviewed-import.sql` against the intended database with operator-provided connection settings. Upserts only modify matching public source IDs, leaving private foods and meal snapshots untouched. Applying it twice to the isolated restored database retained exactly 7,793 distinct records. Import keeps null optional nutrients; absent does not mean measured zero.
