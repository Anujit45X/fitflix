# Fitflix
Adult fitness and nutrition tracking with Indian meal habits in mind.

**Live preview:** [fitflix-1smy.onrender.com](https://fitflix-1smy.onrender.com) · [GitHub Actions](https://github.com/Anujit45X/fitflix/actions)

The full-stack app is deployed on Render with PostgreSQL. HTTPS, registration, secure sessions, profile/water persistence, and account deletion were verified on October 7, 2026. The free instance sleeps when idle; its free database expires after 30 days. See [deployment details](docs/deployment.md) and [cloud verification](docs/deployment-verification.json). This preview requires a hosting upgrade for durable production use.

Recovered from the earlier Fitplix MVP and extended here. See [current test report](docs/current-test-report.md) and [implementation checklist](docs/implementation-checklist.md) for pre-deployment implementation evidence. Historical uppercase test/product reports came with the recovered archive and are not current verification evidence.

## Run locally on this Windows machine
Requirements already discovered: Java 21, PostgreSQL 17 binaries, Node 22.16, Maven 3.9 in the local wrapper cache.

From this directory:
~~~powershell
cd frontend
npm.cmd ci
cd ..
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
~~~
Open **http://localhost:5173** and create an account. The launcher creates an isolated PostgreSQL cluster under ignored .local/pgdata, bound to 127.0.0.1:55432, generates a local signing key without printing it, and starts the API on 127.0.0.1:8080 plus Vite on 127.0.0.1:5173. This database uses loopback-only trust authentication for development; never use it as a hosted database. Logs and process IDs live under .local/. Keep this directory private.

The launcher expects the installed Java/PostgreSQL paths documented in its source. On other systems, install Java 21, Maven 3.9+, Node 22 and PostgreSQL 17; set the variables from .env.example, run mvn spring-boot:run in backend and npm run dev -- --host 127.0.0.1 in frontend. Vite proxies /api to port 8080. Use the exact APP_ORIGIN (localhost and 127.0.0.1 are different origins).

To stop, run `powershell -File scripts/stop-local.ps1` (add `-StopDatabase` to stop the isolated database too). Stop the app before rebuilding or running `npm ci` on Windows because running processes lock JAR/native dependency files. To relaunch an already built version, use `powershell -File scripts/start-local.ps1 -SkipBuild`.

## Docker
For public hosting, use the root Dockerfile and [Render deployment guide](docs/deployment.md). `render.yaml` provisions a free preview with a database that expires after 30 days; review hosting limits before launch.

~~~sh
python scripts/configure_local.py
docker compose up --build -d
~~~
Open http://localhost:8088 after all health checks pass. Docker was unavailable on the Windows development host. The root production Dockerfile passed GitHub Actions build/startup checks and runs on Render; the separate Compose topology has not been runtime-verified. Compose runs a migration job before the API, which uses Hibernate validation and has Flyway disabled. See [container and deployment instructions](infra/README.md).

## Features
- Registration, login/logout, BCrypt and PostgreSQL-backed rotating refresh sessions with HttpOnly cookies. Access tokens remain in memory, and the backend checks session revocation on every request.
- Adult onboarding, diet preference, timezone, BMI explanation, estimated energy/macronutrient goals and manual adjustments.
- Source-attributed search over 7,793 USDA SR Legacy entries; private user-entered foods; meal create/edit/delete; stable nutrition snapshots; favorites and reusable saved meals.
- Build my thali: editable rice/roti, dal, vegetables, protein and sides; ten explicit gram-based household examples; four Bengali, North Indian and hostel/canteen ingredient templates. These are estimates, not lab-measured regional recipes.
- Water logging with undo, daily weight/activity records, recorded weight history and data-based insights.
- Six home/gym workout templates covering beginner/intermediate/advanced experience, with instructions, sets, reps, rest and alternatives; persisted scheduling/completion. No BMI-based intensity assignment.
- Responsive desktop sidebar and five-destination mobile navigation; keyboard-accessible dialogs, empty/error/loading states, reduced motion, privacy notice and password-confirmed data export/account deletion.

## Structure
- frontend/: React 19, TypeScript, Vite, Tailwind, React Router, TanStack Query, React Hook Form/Zod and Recharts.
- backend/: Java 21, Spring Boot 3.5.16, Security, JPA/JDBC, Bean Validation, Flyway, OpenAPI.
- infra/: hosting assumptions and exact container/release steps.
- docs/: architecture, database diagram, requirements, evidence and release gates.
- scripts/: USDA import, API verification, local startup and production preflight.
- compose.yml and .github/workflows/ci.yml: local containers and standalone-project CI template. The outer workspace also has an executable path-aware workflow.

Java package/database identifiers retain fitplix for compatibility; all application-facing branding is Fitflix. V1–V5 migration checksums are preserved.

## Tests
~~~sh
cd frontend
npm ci
npm test
npm run build
npm audit --audit-level=moderate
node verify-fitflix.mjs
~~~
Browser verification requires the running local API/frontend and installed Microsoft Edge (default). On Linux/CI, install Playwright Chromium and use BROWSER_CHANNEL=chromium. Test screenshots use an explicitly named disposable QA account; they are not customer activity.

~~~sh
cd backend
mvn verify
~~~
For PostgreSQL integration tests, set RUN_DB_TESTS=true, DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD, JWT_SECRET and SECURE_COOKIE=false against a disposable database. Integration tests create test records and temporarily change a source food inside a try/finally snapshot check. Do not point tests at production.

Python release-configuration checks: python -m unittest discover -s scripts -p test_production_preflight.py.

The lockfile and .npmrc reproduce patched dependencies. npm 10.9.2 needed legacy-peer-deps to avoid its optional Vitest peer resolver crash; Vitest 4.1.11 supports the installed Node 22 and Vite 6.

## API and documentation
Use /api/v1 for new clients; /api aliases preserve recovered compatibility. [API conventions](docs/api.md), [architecture](docs/ARCHITECTURE.md), [database model](docs/SCHEMA.md), [nutrition sources](docs/indian-nutrition.md), [release gates](docs/release-checklist.md), [deployment and rollback](infra/README.md).

Live OpenAPI is /v3/api-docs, restricted to ADMIN/PRODUCT_MANAGER; exported docs/openapi.json contains no credentials. Public registration can only create USER accounts.

## Remaining release blockers
No cloud deployment, production secrets, SMTP provider, email verification, managed backups, hosted restore drill, operational monitoring or hosted load test. Docker builds are unverified. Existing nutrient columns use double precision; serving and recipe gram quantities use fixed decimals. Household portions are explicit editable examples, not universal conversion claims. Data coverage is not a verified comprehensive Indian food database. AI/photo logging is intentionally absent because no service is configured.

Before release, approve a concrete hosting provider and cost, verify Docker/HTTPS deployment, test backup recovery and email delivery, and complete the release checklist.
