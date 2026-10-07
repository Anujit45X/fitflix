# Fitflix recovery candidate (artifact 1.0.0) — release gates

This is a local release candidate, not a production certification.

- [ ] Build both Docker images and start Compose on a Docker-enabled host.
- [ ] Publish to an explicitly authorized staging host; confirm current provider quote and limits.
- [ ] Keep one HTTPS origin; secure cookies; verify malicious Origin rejection and revocation.
- [ ] Inject random database/JWT secrets from a secret manager; disable demo and debug behavior.
- [ ] Use controlled Flyway migration job and validate serving API with migration disabled.
- [ ] Configure, verify and test SMTP reset delivery. Email verification is not implemented.
- [ ] Configure database backups, encryption, retention, restoration and deletion handling.
- [ ] Publish operator contact and privacy/retention information reflecting actual hosting.
- [ ] Configure error alerts and uptime checks without sending health records to logs.
- [ ] Verify edge rate limiting before multiple API replicas (current in-process limit is single-node).
- [ ] Verify account export and deletion, including private foods and all new workout records.
- [ ] Review inherited floating-point nutrient storage before regulated/high-precision uses; current values are wellness estimates, tested with arithmetic tolerances.
- [ ] Repeat accessibility, concurrency and load checks on the deployed topology.
- [ ] Verify restart/redeploy persistence and isolated backup restore.
- [ ] Obtain explicit production publishing authorization.

## Release notes

Recovered existing source without changing V1–V5 migration checksums. Added Fitflix UI, landing/not-found/error views, mobile navigation, versioned API aliases, thali builder, four source-attributed regional/canteen ingredient estimates, ten explicit weighed serving examples, six home/gym workout templates with scheduling and completion, water undo, weight history, account export/deletion, login Origin guard, Java 21 configuration and migration job mode. Patched vulnerable frontend test dependencies. Existing meal CRUD, goals, analytics, source import, rotating refresh sessions and password-recovery implementation retained.

No email delivery, cloud deployment, revenue, adoption or performance impact is claimed.
