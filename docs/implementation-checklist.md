# Fitflix implementation checklist
Updated 7 October 2026. This file records the recovered source and work verified on this host.

- [x] Phase 0 — recovered the earlier MVP from Downloads/Fitplix_Full_Stack_MVP.zip into fitflix/. Preserved unrelated workspace projects. No applicable AGENTS.md or reference images found. Baseline source, runtime, schema, security and tests inspected.
- [x] Phase 1 — Fitflix branding; landing, authentication, onboarding, dashboard, diary, thali, workouts, progress, profile, settings and error/not-found routes; sidebar and mobile bottom navigation; responsive and accessible states; production build.
- [x] Phase 2 — native PostgreSQL 17 initialization through V1–V6; serving/recipe/exercise/workout tables, constraints and indexes; /api/v1 aliases; live OpenAPI exported. V1–V5 are byte-identical to the recovered archive.
- [x] Phase 3 — retained BCrypt and database-backed rotating HttpOnly refresh sessions; bearer tokens in memory; origin checks; server ownership; logout/session refresh and restart persistence; auth rate limiting verified. Email recovery explicitly returns 503 while SMTP is disabled. Email verification remains absent.
- [x] Phase 4 — browser journey verifies persisted meal CRUD, portion changes, water undo, weight, thali saving/logging/repeating, workout completion, progress and login/logout.
- [x] Phase 5 — 7,793 source-attributed foods; original USDA archive downloaded and checksum independently verified; four clearly labeled regional/canteen ingredient templates; ten explicit weighed portion examples; six home/gym templates; BMI/energy assumptions documented. Import generated twice and applied twice to an isolated restored DB without duplicates.
- [x] Phase 6 — 14 backend tests, 6 frontend tests and 3 preflight tests pass; production builds and formatting/type checks pass; zero npm audit vulnerabilities; 36 responsive route checks pass at 360/390/768/1440px with zero browser errors. API+PostgreSQL restart and isolated backup restoration verified.
- [x] Phase 7 preparation — multi-stage Dockerfiles, non-root runtime users, reverse proxy, health/readiness, persistent DB volume, separate migration job and CI workflows.
- [ ] Phase 7 execution gate — Docker unavailable; no container build/Compose run or hosted GitHub Actions run. Commands are prepared; native equivalents verified.
- [x] Phase 8 preparation — deployment topology, secrets mapping, HTTPS/cookie requirements, migration job, health, smoke tests and rollback documented.
- [ ] Phase 8 deployment — no configured Java hosting access and no public-publishing authorization. No staging URL exists.
- [x] Phase 9 preparation — release checklist, privacy/export/deletion, recovery and rollback runbook; local isolated restore drill completed.
- [ ] Phase 9 production — SMTP delivery, email verification, managed backups/retention, monitoring, HTTPS staging validation, provider quote/authorization, and production release remain open.
- [x] Phase 10 — source, migrations, source import pipeline, local run commands, API schema, diagrams, test report, release notes and evidence-only case study delivered.

## Baseline and resolved failures
The original workspace had no app source or Git remote, but a downloaded source archive was found. The archive predates the Indian/workout expansion reported in another chat; that report was not treated as evidence. Node 22.16, Java 21, Maven 3.9.11 and PostgreSQL 17 are available.

Recovered backend unit tests, frontend build and two existing frontend tests passed. Initial dependency audit found four vulnerabilities; patched Vitest/source-map dependencies now audit clean. Windows sandbox network/file traversal restrictions required permitted build execution. npm's optional peer resolver crash was resolved with a project-local .npmrc after checking Vitest's supported Node/Vite ranges. Windows file locks required stopping only this app's processes before clean dependency installation and JAR repackaging. A 768px dashboard overflow was found by browser tests and fixed.

See current-test-report.md for measured results. Historical uppercase test reports/screenshots shipped with the archive are retained for provenance, not current claims.

## Deliberate limitations
Nutrient storage retains inherited double precision; new serving and recipe grams are fixed decimals. Ranges and arithmetic tolerances are tested, but this is not a regulated nutrition platform. Household conversions are explicit adjustable examples. Workouts filter by experience/equipment/date and provide alternatives; a richer persisted limitations/injury-preference model is not implemented. Data is not claimed to be comprehensive Indian-food coverage. AI/photo inference has no configured service. Email verification requires an integration/design pass. Full deployment/load/accessibility certification remains pending.
