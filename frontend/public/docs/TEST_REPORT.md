# Fitplix verification report
**Run completed:** 28 September 2026 (India time). **Outcome:** local application, critical user flows, analytics and persistence checks passed. Source delivery is not a public production deployment.

## What ran
| Check | Result | Evidence / scope |
|---|---|---|
| Java production package | PASS | Maven compiled and packaged Spring Boot on Java17 |
| Backend unit tests | 8 PASS | 4 score boundary tests, 2 profile/target tests, 2 JWT tampering/secret tests |
| Database/controller integration tests | 3 PASS | Registration/persistence/authorization; expired and replayed reset rejection, valid reset and session revocation; account-neutral503 when recovery is disabled |
| Frontend utility tests | 2 PASS | Leap-day/year date shifts and inclusive seven-day windows |
| Frontend production build | PASS | TypeScript + Vite; analytics pages split into lazy chunks |
| Phase1 API flow | PASS | Registration, duplicate email, invalid login/profile, onboarding formula, protected API, refresh rotation/replay, origin rejection, logout revocation, re-login persistence |
| Nutrition API flow | PASS | >500 sourced foods, gram scaling, edit/delete recomputation, idempotent yesterday copy, water/weight/activity, immutable daily targets, bad input/future dates, saved plans, favorites, custom-food privacy and cross-owner denial |
| Analytics API flow | PASS | Personal all-date averages and denominators, score bounds, invalid range, role guard, separated demo/real users, ordered funnel, exact-day mature denominators, future cohort nulls, segment totals and persistent experiment assignments |
| Browser flow | PASS | Registration→onboarding→dashboard, reload/session refresh, food search→meal log→diary persistence, water logging, analytics range switch, admin overview/cohort/funnel/experiment screens, sign-out |
| Responsive inspection | PASS for checked views | Desktop1440×1000 and mobile390×844; no mobile document overflow; screenshots included |
| Process-restart persistence | PASS | Restarted both API and database; same account, meal IDs, nutrient totals, water, weight, activity and target snapshots remained |
| SQL reference queries | PASS | All10 PostgreSQL/psql query sections executed without errors |
| OpenAPI export | PASS | Authenticated generated schema exported to docs/openapi.json |

## Runtime qualification — important
This execution environment could not initialize a standard PostgreSQL OS service because it provides only a mapped root identity. The Java backend was tested over the PostgreSQL JDBC protocol against **disk-backed PGlite PostgreSQL18.3**, with one connection. This is actual backend persistence, not browser localStorage or a mocked API. All migration SQL was applied to this database, and Hibernate schema validation passed.

Flyway execution was **disabled for local runtime tests** after its initialization did not complete with this single-connection embedded runtime. A small external test harness applied the versioned SQL. Consequently, the native PostgreSQL17/Flyway startup lifecycle, concurrent multi-connection transactions, Docker image execution and production backup/restore are **not verified here**. Compose and CI are configured for standard PostgreSQL17 with Flyway enabled; they must run on the target host before public launch.

The test harness was specific to this environment and is not required by the application. The included Maven, Python and Playwright tests target the normal HTTP/PostgreSQL application. Use disposable data when running flow scripts: they create accounts and records.

## Bugs corrected during verification
- Corrected an independently calculated expected calorie value in the test (2,372 kcal for the fixture).
- Bound JDBC timestamp parameters explicitly instead of passing unsupported Instant values.
- Preserved null conversion values for zero-denominator funnels instead of triggering Java unboxing errors.
- Added structured unexpected/malformed-request responses so runtime errors cannot masquerade as unauthenticated requests.
- Replaced unstable Page serialization with an explicit food-page response.
- Removed unsupported full-width plus glyphs and exposed sign-out on mobile.
- Disabled chart drawing animations so initial plots and screenshots display actual data immediately.

## Not claimed
No public URL or live launch, no externally executed CI, no measured load/SLA result, no penetration/accessibility/compliance certification, no externally delivered recovery email, and no real adoption or retention improvement. The30 demo users and their histories are simulated. Real-provider recovery deliverability, privacy/deletion operations, host/TLS/monitoring/backups and standard-PostgreSQL validation remain operator launch work. See LAUNCH_RUNBOOK.md.

## Reproduction
Run backend tests and frontend build/tests as described in README.md. For HTTP flows, install scripts/requirements-test.txt and run verify_phase1.py, verify_nutrition.py, verify_analytics.py in order against a disposable demo database. After restarting the database and API, run verify_persistence.py. API_BASE and APP_ORIGIN are configurable. Playwright requires its Chromium installation, or CHROMIUM_PATH pointing to an installed executable. Screenshots are from real rendered application views with simulated or disposable test data.

## Production-preparation follow-up
- Recovery API and SMTP capture: PASS. Account-neutral responses, password byte/length constraints, invalid tokens, two concurrent reset requests (one200/one400), old-password rejection, access/refresh revocation and new-password login.
- Recovery browser: PASS. Request form → local captured email → reset page, URL-fragment removal, confirmation mismatch validation → successful reset → login/onboarding. Browser test now waits for the new page heading before filling fields, avoiding a navigation race.
- Expiry and disabled-mail behavior: PASS in the three database/controller integration tests above.
- Production configuration gate: 3 Python tests PASS, including unsafe configuration rejection without printing values. CI now runs these tests.
- Regression: Phase1/nutrition/analytics API suites and full browser flow PASS. A combined run reached the auth limiter during extra recovery checks; the dedicated recovery run passed with a fresh server. The rate limit was retained.
- Restart persistence and all10 reference SQL sections: PASS again after V5.
- Production Java package and TypeScript/Vite build: PASS; eight backend unit tests and two frontend utility tests PASS.
- Fixed disabled SMTP health checks so email being intentionally disabled does not make application health fail.

The local SMTP server captures messages only; no email was sent to an external recipient. Concurrent HTTP reset testing used the same single-connection embedded runtime described above, so it does not establish multi-connection production locking. Host credentials/domain, real SMTP delivery and native PostgreSQL17/Flyway checks remain open gates. Recovery's bounded in-memory queue is not durable across restarts; users must retry interrupted requests.
