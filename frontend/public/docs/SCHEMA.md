# Database model
Flyway migrations in `backend/src/main/resources/db/migration` are the authoritative PostgreSQL schema. UUIDs identify records; owner IDs are indexed; all event timestamps are UTC timestamptz. User-facing calendar dates are explicitly interpreted in the profile timezone.

```mermaid
erDiagram
 APP_USER ||--o| USER_PROFILE : configures
 APP_USER ||--o{ AUTH_SESSION : authenticates
 APP_USER ||--o{ ANALYTICS_EVENT : emits
 APP_USER ||--o{ MEAL : owns
 MEAL ||--|{ MEAL_ITEM : contains
 FOOD ||--o{ MEAL_ITEM : snapshots
 APP_USER ||--o{ WATER_ENTRY : logs
 APP_USER ||--o{ WEIGHT_ENTRY : logs
 APP_USER ||--o{ ACTIVITY_ENTRY : logs
 APP_USER ||--o{ SAVED_MEAL : saves
 APP_USER ||--o{ EXPERIMENT_ASSIGNMENT : assigned
 EXPERIMENT ||--o{ EXPERIMENT_ASSIGNMENT : groups
```
Nutrition totals are derived rather than mutable aggregate rows. Logged nutrients and targets are snapshotted so subsequent catalog/goal changes do not rewrite past adherence. UserProfile is the current fitness goal; historical target snapshots are attached to meals. Favorite foods and meal templates are owner scoped. Demo users have an explicit marker and are excluded from real-user product metrics.
