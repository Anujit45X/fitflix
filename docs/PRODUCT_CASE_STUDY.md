# Fitplix — connecting full-stack engineering, analytics and product decisions
## 1. Problem
Nutrition tracking can produce precise-looking numbers without helping someone understand a routine. Fitplix joins a simple diary to transparent trend metrics and connects those behaviors to product activation and retention.
## 2. Research assumptions
Personas and pain points are hypotheses. No completed interviews, live customers, revenues or improved retention are claimed. A follow-up pilot should test serving-size friction, logging effort and whether insights change a useful action.
## 3. Target persona
An adult beginning a fitness routine who needs fast logging and a clear explanation of progress. Secondary personas are protein-focused users and general fitness users. The internal product analyst needs definitions that survive scrutiny.
## 4. Hypothesis
If onboarding produces an understandable target and the first dashboard presents a concrete next step, more new users will log meals consistently during their first week. The experiment is implemented as a framework; current seeded outcomes do not establish this hypothesis.
## 5. MVP selection
Prioritized identity → onboarding → food lookup → meal log → derived dashboard before advanced charts. This creates a functional value loop and a reliable source for analytics. Planning is deliberately a saved-meal workflow rather than an elaborate recommendation engine.
## 6. Prioritization
Used RICE with explicit hypothetical reach and effort. Food logging is an enabling dependency; AI coaching and wearables were deferred for uncertain value and additional quality/privacy obligations. The scored table is in RICE_PRIORITIZATION.md.
## 7. KPI framework
North star proposed: weekly activated users with ≥3 meal-logging dates. Acquisition: registration; activation: onboarding + first meal; engagement: logging consistency; retention: mature exact D7/D30. The score is a disclosed habit composite, not an outcome metric or medical measure.
## 8. Analytics implementation
Transactional server events, owner-scoped source tables, nutrient/target snapshots, UTC product metrics, user-local nutrition dates, source filtering, cohort maturity and documented denominators. USDA records retain FDC IDs and missing optional nutrients. Zero logs do not imply zero consumption. Product event counts reflect logging actions even when users later delete diary entries.
## 9. Experimentation
Persistent A/B assignment at onboarding. Control: standard dashboard. Variant: one personalized next-step card. Primary outcome: meal-logging days0–6; secondary: activation and exact D7 activity. Before a real decision, verify exposure, balance, consent, sample-size assumptions, uncertainty and guardrails. Current results are exploratory, with no winner declared.
## 10. Insights and decisions
The app computes observations such as tracked-day calorie adherence, protein fulfillment and largest meal contribution. The product dashboard locates funnel drop-offs and engagement segments. A drop-off is a signal to investigate, not proof of cause. Inspect a real cohort and interview users before recommending a roadmap change. No simulated percentage is used as business impact.
## 11. Engineering tradeoffs
React/Spring Boot/PostgreSQL preserve a common enterprise stack. A modular monolith is simpler to debug and deploy than microservices for this scope. On-demand aggregation is transparent at pilot scale but must be profiled before scaling. Local verification used a persistent embedded PostgreSQL runtime; standard PostgreSQL concurrency, Flyway lifecycle and Docker deployment still need a real-host run. Password recovery now includes locally verified SMTP capture, single-use tokens and session revocation. Real-provider deliverability remains a launch gate.
## 12. Roadmap
First: operational deployment, privacy/accessibility/security review, restored-backup rehearsal and a consented pilot. Then: verified Indian recipes and friction reduction. Only after validated demand: reminders, barcode and wearables. Keep AI coaching deferred until the product can support its quality and safety costs.

## Interview narrative (truthful)
“I built Fitplix to demonstrate a complete product loop: secure onboarding, source-backed food tracking, nutrition trends and event-based product analytics. I used React, Spring Boot and a PostgreSQL schema, imported7,793 distinct USDA foods, and made retention denominators and score assumptions explicit. I tested identity, logging, access controls and calculations, and wrote the PRD, RICE roadmap and metric dictionary. Demo users are simulated; I do not claim real usage or retention uplift. The next stage is deployment validation and a real pilot.”

Avoid claiming a public production launch, measured performance SLA, clinical validity, real user count or business uplift until evidence exists.
