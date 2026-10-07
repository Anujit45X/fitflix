# Fitplix launch runbook
## Local production-style stack
Prerequisites: Docker Engine/Desktop with Compose, Python3 for configuration. Run `python scripts/configure_local.py`, then `docker compose up --build -d`. Open http://localhost:8088. Generated `.env` stays private. Set DEMO_MODE=true before first boot only if you want the30 simulated demo accounts. Demo sign-ins are `demo@fitplix.local` and `admin@fitplix.local`; password is your generated DEMO_PASSWORD value in `.env`. Never use demo accounts as live administrative accounts.

The Java build uses Maven/Java17; React builds with Node22. Database is PostgreSQL17. Nginx serves static assets and proxies API calls to Spring Boot. Refresh cookies require same-origin deployment. DB/API are not publicly bound in Compose; only web port8088 is exposed. Persistent volume `fitplix_pgdata` holds data; restarting containers must not delete it.

## Production configuration and gates
1. Provision a host capable of Java containers and PostgreSQL. The Sites Worker runtime cannot run this Java backend. No hosted URL is delivered by this package.
2. Generate unique secrets; set DATABASE_PASSWORD and JWT_SECRET (≥32 random bytes). Use a managed secret store. Do not put secrets in frontend variables or git.
3. Set DEMO_MODE=false on a fresh production database; do not use the demo database for actual users. Configure exact HTTPS APP_ORIGIN and SECURE_COOKIE=true. Set WEB_PORT behind a TLS-terminating ingress. Forward only trusted proxy headers. Compose enables TRUST_PROXY only because the API is private and Nginx overwrites X-Real-IP; disable it for a directly exposed API.
4. Build immutable images and run `docker compose up --build -d`. Flyway must complete before readiness; Hibernate must validate. Record image digests and migration versions. Do not downgrade across destructive migrations.
5. Register the operator account, then grant ADMIN using a database-owner session and exact verified email. Registration can never choose a role. Revoke unnecessary access after setup.
6. Configure `MAIL_ENABLED=true`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH=true`, `SMTP_TLS=true`. Verify the sender/domain with your provider, then test inbox/spam deliverability on the deployed HTTPS origin. The reset API, database migration, SMTP adapter and browser flow are implemented and locally tested against a capture mailbox; no external message was sent. Request acceptance is not delivery confirmation. Monitor redacted delivery failures; interrupted queued requests require retry.
7. Add distributed auth rate limits, structured request/error metrics, central logs without sensitive bodies, alerting and a retention/deletion policy. Health endpoint does not constitute monitoring.
8. Run the full API/browser suite against standard PostgreSQL with Flyway enabled. Rehearse concurrent writes/refresh rotation, TLS cookies, CORS, upgrade/rollback, mobile behavior and unauthorized admin/private-record access.
9. Back up, restore into a separate environment, compare counts and sign in. Define actual RPO/RTO with the operator. Confirm data jurisdiction/consent requirements with qualified reviewers; no compliance certification is claimed.
10. Conduct load, dependency/security and accessibility reviews. CI is a template until a repository actually runs it.

## Backup and restore
`docker compose exec -T db pg_dump -U fitplix -d fitplix -Fc > fitplix.backup`
Restore only into an isolated empty database with matching PostgreSQL tools; use `pg_restore --no-owner --dbname=... fitplix.backup`. Encrypt backups, restrict access and test restoration. Never execute `docker compose down -v` on a database you intend to keep.

## Operational smoke test
Health green; register/login/refresh/logout; onboarding; food search; meal add/edit/delete; daily totals; water/weight; restart; same records present; regular user gets403 on admin; demo/real split; retained cohort denominators; backup restore. Observe failed requests rather than relying only on a screenshot.

## Known boundaries
Current run evidence is documented in TEST_REPORT.md. A public production launch requires the host, domain/TLS, email adapter, operational controls and standard-PostgreSQL validation above. No provider account, live endpoint, CI execution or production SLA is implied by source delivery.

## Production configuration gate
Before deploying, run `python scripts/production_preflight.py --env .env.production`.
The script never prints secret values; it rejects weak/sample secrets, non-HTTPS origins, demo mode, insecure cookies and incomplete or insecure SMTP settings. Keep the env file outside source control. This is a configuration check, not proof of hosted security or deliverability. Compose keeps the API and database private; only the web port is exposed. Terminate HTTPS at your host/load balancer and preserve the exact public APP_ORIGIN.

## Password recovery verification
On a disposable local environment set MAIL_ENABLED=true, SMTP_HOST=127.0.0.1, SMTP_PORT=1025, SMTP_AUTH=false, SMTP_TLS=false, MANAGEMENT_HEALTH_MAIL_ENABLED=false. These overrides are for testing only. Start API and frontend, install scripts/requirements-test.txt and Chromium, then run `python scripts/verify_recovery.py`. It starts its own loopback-only SMTP capture server and runs the browser reset test. Run Maven with RUN_DB_TESTS=true against PostgreSQL17 to include expiry/replay database tests. Never use real user data in this harness. Restore secure settings before launch.

SMTP adapter configuration follows the [Spring Boot email reference](https://docs.spring.io/spring-boot/reference/io/email.html), with explicit five-second connection/read/write timeouts.
