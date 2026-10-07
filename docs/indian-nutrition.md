# Nutrition provenance and assumptions
The recovered V3 migration contains 7,793 distinct USDA SR Legacy foods with original FDC IDs and per-100-g values. The native PostgreSQL integration suite checks this count. The original import script and archive checksum are documented in FOOD_DATA_PROVENANCE.md. USDA states that these data are public domain: https://fdc.nal.usda.gov/api-guide/ . Source downloads: https://fdc.nal.usda.gov/download-datasets/ .

V6 adds no invented nutrient values. Four regional/canteen templates combine existing ingredients. They are clearly labeled ingredient estimates, not measured Bengali recipes or actual canteen menu analyses:
- Bengali-inspired vegetarian plate: cooked rice, boiled lentils, drained spinach, mustard oil.
- Bengali-inspired fish plate: cooked tilapia proxy, rice, boiled potato and mustard oil; no claim that tilapia represents rohu or every curry.
- Hostel rice/dal: rice, boiled lentils and plain yogurt; added water, oil and seasoning differ.
- North Indian plate: commercial roti proxy, plain boiled chickpeas and yogurt.

Each recipe ingredient stores its food ID and grams. The thali UI displays every ingredient and lets the user change/remove it or add more. Raw/cooked descriptions are retained from USDA. Recipes with oil can have incomplete optional sugar/fiber/sodium; ordinary meal summaries retain the existing incomplete-data warning.

## Household portions
Ten records in food_serving use NUMERIC(8,2) grams and record their basis. Katori/roti/egg portions are **app-defined weighed examples**. They are not externally measured household conversion standards. For example, a rice katori means 150 g only because that example explicitly sets 150 g. The user must weigh and adjust their bowl. The UI repeats this limitation alongside the conversion button. This avoids falsely implying a universal bowl volume-to-mass conversion.

## Arithmetic
Source nutrients are per 100 g; each logged nutrient = source value × grams / 100. Authoritative calculation occurs on the server; thali previews use the same rule. Historical meal items copy food name, grams and all nutrient values. The integration suite changes a catalog value and proves old logs retain the snapshot. Existing source and nutrient columns retain double precision for compatibility; quantities in the new serving/recipe tables are fixed decimal. Tests compare calculated values within 1e-6; UI rounds display only.

## General wellness estimates
Mifflin–St Jeor: 10 × kg + 6.25 × cm − 5 × age + sex coefficient (+5 male, −161 female), verified against the original paper: https://pubmed.ncbi.nlm.nih.gov/2305711/ .
The inherited activity multipliers 1.2, 1.375, 1.55, 1.725 and goal adjustments −300 / +250 kcal are heuristic app assumptions, not individually measured requirements. Protein/fat allocations and calorie floors are app heuristics; users can adjust targets in Goals. These are not diagnosis or treatment.

BMI = kg / m²; it cannot separate fat from muscle or describe fat distribution. The interface explains these limits and excludes children/pregnancy from its intended scope. BMI is never used to set workout intensity.

Workout templates are authored general examples with experience/equipment filters and alternatives. Home movement guidance was checked against https://www.nhs.uk/live-well/exercise/strength-exercises/ and https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/ . They are not clinical exercise prescriptions. No estimate of calories burned is fabricated.

