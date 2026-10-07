# Fitplix delivery checklist
## Phase1 — foundation
- [x] Production-oriented architecture, PostgreSQL identity schema and ER documentation
- [x] Modular Spring Boot backend and React/TypeScript frontend
- [x] BCrypt, JWT, refresh rotation/replay checks, revocation and roles
- [x] Registration, login, onboarding, protected routes and profile persistence
- [x] Calorie/macronutrient estimates, valid goal direction and timezone
- [x] Phase1 API and browser verification before nutrition implementation
## Nutrition
- [x]7,793 distinct USDA foods, original source IDs and per100 g provenance
- [x] Search, categories, sort, pagination and private custom foods
- [x] Meal add/edit/delete, gram calculations, daily nutrition totals
- [x] Idempotent yesterday copy, favorites and saved/planned meals
- [x] Water, weight and activity logging
- [x] Manual targets with historical target snapshots
- [x] Daily dashboard and complete API/browser flow checks
## Personal and product analytics
- [x] Personal trends, date filters, rolling weight and logging calendar
- [x] Transparent Fitplix Score and rule-based insights
- [x] KPI dashboard, ordered visitor funnel, exact-day mature retention
- [x] Calendar-week cohorts, feature adoption and engagement segments
- [x] Persistent experiment assignments and variant UI
- [x]30 clearly marked demo users and up to90 days of records
- [x] PRD, metric dictionary, RICE assumptions and product case study
- [x] Analytical SQL reference queries and exported OpenAPI JSON
## Verification and launch package
- [x] Backend unit and database/controller integration tests
- [x] Frontend utility tests, TypeScript build and browser flow
- [x] Desktop/mobile visual inspection and captured screenshots
- [x] API/database process-restart persistence check
- [x] Dockerfiles, Compose, random local secret setup and CI template
- [x] Source/package documentation and test limitations
- [ ] Execute Compose/CI with native PostgreSQL17 and Flyway on target host
- [ ] Provision public hosting/domain/TLS and production secrets
- [x] Implement reset-token migration, SMTP adapter, recovery/reset UI, single-use tokens and session revocation
- [x] Add offline production configuration gate
- [ ] Configure a real SMTP provider and verify hosted deliverability before unrestricted rollout
- [ ] Operational monitoring, distributed throttling, privacy/deletion, load/accessibility/security review
- [ ] Verify backups/restoration and production rollback

The unchecked entries are explicit launch work, not claims of completed production deployment. Local database verification used persistent embedded PostgreSQL as described in TEST_REPORT.md.
