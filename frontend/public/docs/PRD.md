# Fitplix — Product Requirements Document
**Owner:** Anujit Das · portfolio project. **Status:** implemented MVP with analytics; operational production gates remain. **Audience:** adult fitness users and internal product teams.

## Problem and vision
Meal trackers provide numbers, but users may struggle to connect them to habits and goals. Fitplix makes daily intake visible, explains patterns and gives a product team a measurable model of activation and retention. Its vision is understandable, consistent self-tracking rather than medical coaching.

## Research assumptions
No user interviews, survey results or market adoption are claimed. The assumptions below need validation through 8–12 adult user interviews and a consented pilot. Interview prompts: describe your last abandoned tracking attempt; show how you estimate a serving; which insight changed a decision; what makes a daily reminder unwelcome?

## Personas and jobs to be done
| Persona | Job | Pain point | MVP response |
|---|---|---|---|
| Weight-loss beginner | Understand my typical intake without judgment | Numbers feel disconnected from progress | Estimated calorie target, daily diary, trend context |
| Muscle-gain user | Know whether my meals support my protein goal | Protein totals require manual arithmetic | Source-backed search, gram quantities, automatic macro totals |
| General fitness user | Build a routine I can sustain | Too many scattered logs | Water, weight, activity and one daily overview |
| Product analyst | Understand where users disengage | Counts without consistent definitions | Events, ordered funnel, mature retention, metric dictionary |

## Product boundaries
Adult general fitness only. No diagnosis, treatment, medical score or guaranteed weight outcome. Target estimates are editable. Users can register, onboard, log and review only their own records. Product-manager/admin roles access internal aggregate analytics. No community, wearables, billing, AI coach or notification claims.

## Functional requirements and acceptance criteria
| User story | Acceptance criteria |
|---|---|
| As a new user, I can create an account | Valid email, 12–72 character password and name required; email normalized/unique; BCrypt hash stored; role always USER |
| As a member, I can sign in and sign out | Invalid credentials return 401; protected API requires valid JWT plus unrevoked session; refresh rotates; logout invalidates that session's access token |
| As a new member, I can set up a goal | Adult age and bounded body metrics validated; target direction matches goal; timezone valid; calorie and macro estimates calculated server-side |
| As a member, I can track meals | Catalog has >500 distinct sourced foods; search/filter/sort/pagination work; 1–30 food items and 1–2,000 g per item; nutrient totals calculated on server |
| As a member, I can correct a diary | Edit and delete update derived totals; owner scope checked; copying yesterday skips previously copied source meals |
| As a member, I can save time planning | Save and delete reusable meals, plan up to 90 days ahead, log a saved plan to today; private favorite foods and custom foods supported |
| As a member, I can track water, weight and movement | Dates bounded; weight and activity upsert once per day; water is appendable/removable; no exercise-calorie compensation |
| As a member, I can change targets | Manual targets validated; macro energy within 10% of calorie total; previously snapshotted day targets unchanged |
| As a member, I can understand patterns | Inclusive 7/30/90-day/custom ranges; trend charts update; missing weight stays null; no-meal state disclosed; insights cite computed supporting metrics |
| As a PM, I can monitor the product | Role checked server-side; demo/real switch; UTC metric definitions; maturity-aware exact-day retention; ordered funnel and calendar-week cohorts |
| As a PM, I can examine an experiment | Persistent assignment at onboarding; B receives insight; results show eligible denominators, nulls for insufficient data and no unsupported winner |

## Non-functional requirements
- Security: stateless access JWT, server-revocable refresh session, cookie flags, exact-origin refresh checks, role authorization, server validation, parameterized persistence. Auth throttling is single-node; edge throttling is a production gate.
- Data integrity: migrations, foreign keys, unique constraints, immutable nutrient snapshots, historical target snapshots, durable volumes and restore procedures.
- Performance targets (not measured SLAs): p95 food search <500 ms and dashboard <1 s for a pilot of 1,000 users. Run load tests before claiming these results.
- UX: responsive desktop/mobile, explicit empty/loading/error states, labeled inputs, keyboard-native dialogs, readable charts and noncolor text equivalents. Full WCAG audit is pending.
- Reliability: liveness/DB health endpoint, environment-required secrets, reproducible builds. Actual uptime and recovery objectives require hosted validation.

## Success metrics and KPI tree
**North star:** weekly activated users who log meals on ≥3 distinct dates. This represents repeat value, not proven fitness improvement.
Acquisition → registered users; activation → onboarding plus first meal in first 7 calendar days; engagement → logged dates/7; retention → exact-day D7/D30; quality guardrails → logging errors, negative search-result rate, unauthorized-access attempts and user-reported burden. Planned guardrails require operational telemetry before launch; do not treat them as currently measured.

## Tracking plan
Server-owned: USER_REGISTERED, USER_LOGIN, ONBOARDING_COMPLETED, CALORIE_GOAL_GENERATED, MEAL_LOGGED, WATER_LOGGED, WEIGHT_UPDATED, ACTIVITY_LOGGED, MEAL_PLAN_CREATED, GOAL_UPDATED. Allowlisted client actions: FOOD_SEARCHED on explicit search, ANALYTICS_VIEWED on screen entry. Each event has UUID, authenticated user ID, name, UTC instant and JSON metadata text. Anonymous browser visitors receive a server-generated cookie ID, linked on registration. No passwords, raw email addresses, body metrics or food queries are put in event metadata.

## Risks, tradeoffs and mitigation
- Incomplete diary ≠ zero intake: disclose missing logs and use appropriate denominators.
- USDA legacy and Indian-recipe coverage: preserve source/preparation details, permit clearly labeled private custom entries; expand with a verified local dataset later.
- Sensitive personal information: least-privilege roles, no public admin, minimization, retention/deletion policy and privacy review before public launch.
- Monolithic analytics reads suit a portfolio/pilot, not large-scale traffic: add materialized aggregates after profiling.
- Password recovery is implemented and locally verified with captured SMTP; production rollout still requires a configured provider and deployed deliverability verification.
- Authentication, rollback, real PostgreSQL concurrency and backups need deployment validation.

## Roadmap
Delivered foundation: authentication/onboarding and estimated targets. Delivered nutrition: diary, foods, goals, water, weight, movement, saved plans. Delivered analytics: personal charts, transparent score, rule-based insights, PM dashboard, funnel, retention/cohorts and experiment framework.
Next: consented pilot, accessibility/privacy/security review, verified Indian recipes, email reset, monitoring and measured performance. Later: opt-in reminders/habit streaks. Deferred: barcode, wearables, AI coaching, social challenges. See RICE assumptions; no dates promised for deferred work.
