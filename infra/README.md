# Container deployment preparation

`../compose.yml` builds the frontend and Java 21 backend and starts a persistent PostgreSQL volume. Only the frontend is bound to loopback, on port 8088. It proxies `/api` to the private API container. A one-shot `migrate` container runs Flyway; the API has Flyway disabled and starts only after that job succeeds. Hibernate only validates the schema.

```sh
python scripts/configure_local.py
docker compose up --build -d
docker compose ps
docker compose logs migrate api
curl --fail http://localhost:8088/actuator/health
```

Run these from the `fitflix` directory. Docker was unavailable on the implementation host, so image builds and Compose execution remain unverified. Native Java/PostgreSQL checks are recorded separately. Pin image digests after an authorized registry build and security scan; version tags currently track maintenance releases.

## Staging architecture

No hosting credentials or connected Java/PostgreSQL hosting provider were found; no provider has been provisioned. Prepared topology: one HTTPS reverse proxy/frontend container, one private Java 21 container, one managed PostgreSQL 17 database, all in the same region. Render documents support for Docker containers, private services and internal PostgreSQL URLs, but is only a possible target, not a selected or authorized deployment. No price quote or free-tier suitability is assumed.

1. Obtain authorization for a provider, region, public exposure and its current quoted monthly cost. Provision an isolated staging database; restrict public DB networking.
2. Build `backend/Dockerfile` and `frontend/Dockerfile` in their respective contexts. Push immutable versioned images to the approved registry. Adapt Nginx `api:8080` to the provider's private API hostname.
3. Configure `DATABASE_URL=jdbc:postgresql://<private-host>:5432/<database>?sslmode=require`, `DATABASE_USER`, `DATABASE_PASSWORD`, `JWT_SECRET`, `APP_ORIGIN=https://<actual-host>`, `SECURE_COOKIE=true`, `DEMO_MODE=false`, `TRUST_PROXY=true` only behind the trusted proxy. Never expose the API directly when trusting proxy IP headers.
4. Run the backend image once with `--fitflix.migrate-only=true --server.port=0` and `FLYWAY_ENABLED=true`. Require exit 0. Run the serving backend with `FLYWAY_ENABLED=false`.
5. API readiness: `/actuator/health/readiness`; liveness: `/actuator/health/liveness`. Public smoke: `/actuator/health`. Restrict all other actuator endpoints. Review logs through the provider or `docker compose logs`; do not enable request-body logging.
6. Terminate HTTPS at the provider, proxy all API calls through the frontend origin, and preserve cookies. CORS allows only APP_ORIGIN; authenticated API calls use bearer tokens, refresh/logout require exact Origin and SameSite=Strict HttpOnly cookies.
7. Run the dedicated staging-account browser journey with `APP_ORIGIN` set to the actual HTTPS origin. Verify refresh, logout, meal totals and persistence after backend restart. Delete the dedicated account afterward.

## Rollback and recovery

Before migrations, take an encrypted managed snapshot or `pg_dump -Fc` using secret-injected connection configuration. Restore to a new isolated database with `pg_restore --exit-on-error --no-owner`, validate row counts and Flyway history, then run smoke tests. Never restore over the live DB as a routine test. Database dumps contain sensitive health records and require limited access and a documented retention policy.

Roll back application images to the previous immutable release only if compatible with the current schema. Rolling back images does not reverse migrations. V6 adds independent tables; V1–V5 remain unchanged. Do not automatically undo data or drop tables. If a migration fails, preserve logs, pause release traffic and prepare a forward fix. Backup restoration and infrastructure failover must be tested on the authorized host before production approval.

## Official references checked

- https://docs.spring.io/spring-boot/3.5/system-requirements.html — Boot 3.5.16 supports Java 21.
- https://docs.docker.com/compose/how-tos/startup-order/ — health and completed-job dependencies.
- https://render.com/docs/docker — container deployment.
- https://render.com/docs/private-services — private application service.
- https://render.com/docs/postgresql-creating-connecting — managed DB connection details.
