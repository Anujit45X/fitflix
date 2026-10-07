# Deploy Fitflix

## Current public preview

- Website: https://fitflix-1smy.onrender.com
- Repository: https://github.com/Anujit45X/fitflix
- Hosting dashboard: https://dashboard.render.com/web/srv-db31nq0m7kps73cnebvg
- Blueprint: https://dashboard.render.com/blueprint/exs-db31mve0tbcc738dkabg
- Deployed commit: `ccccdfefed75f43b0dd0b8a248a2e14e2d4c87e9` (October 7, 2026).
- GitHub CI passed both application tests and production container smoke checks. Live HTTPS/API checks are recorded in `deployment-verification.json`; the temporary cloud test account was deleted.
- Both resources use free plans. The database expires 30 days after creation; upgrade before expiry if keeping data.
- The deployment uses the public Git repository URL. Render reports that automatic deploys require connecting its GitHub repository integration. For now, check GitHub CI and use **Manual Deploy → Deploy latest commit** in the service dashboard. The blueprint's checks-pass policy applies when that integration is connected.

The root Dockerfile builds React into Spring Boot's static resources. One HTTPS web service serves the UI and `/api/v1`, with a separate PostgreSQL 17 database. Browser deep links are explicitly forwarded to the SPA; API authorization remains enforced.

## Render preview

Connect this repository to a new Render Blueprint and select `render.yaml` on branch `main`. Review the resource summary before applying. The blueprint explicitly requests **free** web and database plans in Singapore and generates a private JWT signing key. No local records, test accounts, or secrets are uploaded.

Render provides `RENDER_EXTERNAL_URL`; the entrypoint uses it as `APP_ORIGIN`. The database is connected through private host/user/password references and has no public IP allowlist. Migrations run during startup before the readiness check passes. Automatic deploys wait for GitHub checks. Do not reuse the local trust-authenticated PostgreSQL cluster.

Free preview limitations: the web service sleeps after 15 minutes idle; the free database expires after 30 days, has no managed backups, and is deleted after its grace period. This is not durable production hosting. Account bandwidth/build overages may incur charges when a payment method is present: review account spend controls before applying. See https://render.com/docs/free and https://render.com/docs/blueprint-spec.

## Production upgrade

Choose paid web/database plans only after approving their current price in the dashboard. Enable managed backups and verify a restore, then use a separate migration job and set `FLYWAY_ENABLED=false` for serving processes. Configure transactional email if password reset is required (`MAIL_ENABLED` is false by default). Free web plans block common SMTP ports. Configure your custom domain and set `APP_ORIGIN` to its exact HTTPS origin before switching traffic.

## Verification after deploy

1. Confirm `/actuator/health/readiness` returns HTTP 200.
2. Load `/`, `/login`, and a direct `/profile` link; confirm assets load without CSP errors.
3. Register a test account, create a profile, log a meal and water, then reload and sign out/in to verify persistence.
4. Confirm an unauthenticated `/api/v1/profile` request returns 401 and `/api/v1/auth/refresh` rejects a foreign Origin.
5. Verify the refresh cookie has Secure and HttpOnly attributes over HTTPS.
6. Delete the temporary test account. Never use local test credentials in production.

Docker is built and smoke-tested by GitHub Actions. Local Windows testing uses the equivalent bundled JAR because Docker is unavailable on the development host.
