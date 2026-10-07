# Current verification report
7 October 2026 · native Windows host · disposable local PostgreSQL data.

| Check | Actual result |
| --- | --- |
| Java 21 backend compilation/package | Passed; executable JAR produced |
| JUnit/Spring integration suite | 14 passed, 0 failed, 0 skipped with RUN_DB_TESTS=true |
| Frontend production build | Passed, strict TypeScript + Vite |
| Vitest | 6 passed across date/timezone and accessible UI component tests |
| Python production preflight tests | 3 passed |
| Frontend formatting/type checks | Prettier and strict tsc passed |
| Java formatting | google-java-format 1.28.0 applied |
| npm dependency audit | 0 vulnerabilities after patching four recovered findings |
| Fresh PostgreSQL schema | Flyway V1–V6 applied successfully; JPA validation passed |
| Migration job mode | Native executable completed successfully and exited 0 |
| Source data | Downloaded official USDA archive matches recorded SHA-256; 7,793 distinct foods |
| Import repeatability | Candidate generated twice; applied twice to isolated restore DB; still 7,793 distinct source IDs |
| Original migrations | V1–V5 byte-identical to recovered source archive |
| Browser daily journey | Registration, onboarding, meal create/edit/delete, water add/undo, weight, thali save/log, saved repeat, workouts, refresh, progress, logout/login passed |
| Responsive layouts | 36 route checks at 360, 390, 768 and 1440px; zero horizontal overflow |
| Browser errors | 0 uncaught page errors |
| Keyboard/mobile | Native dialog Escape close, visible focus styles, mobile bottom-nav/profile/settings actions checked |
| Restart persistence | HttpOnly session, two thali logs, 500 ml water, 69.4 kg weight and completed workout survived API and PostgreSQL restart |
| Account isolation | Cross-user meal edit/delete, water delete, saved meal log and workout edit/delete rejected |
| Historical snapshot | Catalog calorie mutation did not alter previously logged calories |
| Privacy | Password-gated export; no password/session secrets in export; account cascade deletion and session rejection passed |
| Origin checks | Foreign login Origin 403; cookie refresh without Origin 403 |
| Recovery disabled | Explicit account-neutral 503; no fake email success |
| Rate limit | Versioned auth route returns 429 with Retry-After: 60 |
| Backup restore | pg_dump custom archive restored into new fitflix_restore_check DB; 7,793 foods, six successful migrations, three workout records at capture time |
| Live API documentation | 90 routes including compatibility aliases exported from /v3/api-docs |

Machine-readable evidence: browser-results.json, restart-results.json, auth-probe-results.json, source-verification.json. Current screenshots are in screenshots/current/ and show a disposable QA Test Account. Backend Surefire XML/text remain in ignored backend/target/surefire-reports and a redacted summary is copied to backend-test-results.txt.

## Scope and unresolved checks
Docker and Docker Compose were not installed, so container execution is unverified. There is no Git remote and GitHub Actions was not run remotely. No staging/production deployment, HTTPS-host smoke test, real SMTP delivery, email verification, hosted backup restore, managed monitoring or load test has occurred. Native local restore success does not establish managed-host recovery readiness. Full assistive-technology and security certification were not performed.

No customer adoption, commercial outcomes or latency claims are inferred from these checks.
