# Fitflix engineering case study
The task was to turn an existing local fitness MVP into a coherent Indian-food tracking application without discarding working code or presenting simulated activity as evidence.

Discovery found source in a downloaded archive, rather than the workspace. Existing meal tracking, source imports, analytics and database-backed refresh sessions were retained. A new additive migration introduced source-linked serving examples, recipe ingredient templates and workout scheduling. The frontend now exposes those features through a thali builder, workouts and responsive navigation.

The implementation favors explainable estimates. Regional templates name their actual USDA ingredient proxies; household portions state explicit editable gram weights. Historical meal snapshots are preserved, and workout intensity is selected by experience and equipment rather than BMI.

Measured outcomes: 14 backend tests, 6 frontend tests and 3 preflight checks passed; 36 responsive route checks passed with no horizontal overflow or browser errors. A real API/PostgreSQL restart preserved the session and records. An isolated backup restoration and repeat source import succeeded. Four inherited npm audit findings were removed. These are engineering verification results, not adoption or business impact.

The remaining path is operational: Docker verification, authorized HTTPS staging, email/verification services, backup retention, monitoring and a production release decision. No public deployment or user-growth claim is made.
