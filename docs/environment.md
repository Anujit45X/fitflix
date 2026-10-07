# Environment reference (no secrets)
| Setting | Purpose / local default |
| --- | --- |
| DATABASE_URL | JDBC PostgreSQL URL; native local uses 127.0.0.1:55432/fitflix; Compose uses db:5432/fitplix |
| DATABASE_USER / DATABASE_PASSWORD | Database credentials; secret manager in hosting |
| JWT_SECRET | Random signing key of at least 32 bytes; retain across restarts |
| APP_ORIGIN | Exact browser origin without trailing slash; native http://localhost:5173; Compose http://localhost:8088 |
| SECURE_COOKIE | false for local HTTP only; true for HTTPS |
| PORT / SERVER_ADDRESS | API listener port (8080) and optional bind address; local binds loopback |
| FLYWAY_ENABLED | true in migration job/local development; false in serving production API |
| DEMO_MODE / DEMO_PASSWORD | Demo data disabled by default; never enable for production |
| TRUST_PROXY | false native; true only behind a trusted reverse proxy that overwrites X-Real-IP |
| MAIL_ENABLED | false until SMTP delivery is verified; recovery returns explicit 503 |
| MAIL_FROM / SMTP_HOST / SMTP_PORT | Verified sender and provider configuration |
| SMTP_USERNAME / SMTP_PASSWORD | Email provider credentials, server-only |
| SMTP_AUTH / SMTP_TLS | true in production |
| WEB_PORT | Compose frontend loopback port, default 8088 |
| RUN_DB_TESTS | true explicitly enables tests that create/mutate disposable data |
| BROWSER_CHANNEL | msedge locally; chromium for Playwright's installed browser in CI |

Do not put credentials in frontend VITE_ variables. .env, .env.*, .local, dumps and logs are ignored by Git. .env.example is safe to commit. The PowerShell launcher generates .local/runtime.json without printing its secret.

