# Fitplix metric dictionary
## Conventions
Personal reports: profile timezone; local dates inclusive; 1–90-day windows. Product reports: UTC; active events listed below; today may be partial. Numeric null displays as “—”, never zero. Demo is a source filter and all charts disclose it. Nutrient observations are not claims about food actually eaten unless completely logged.
Meal-tracked day = ≥1 persisted meal. Source calories are authoritative; macro energy is a separate 4/4/9 estimate. Optional missing nutrients are flagged as incomplete. Historical targets use first-log snapshots; untracked dates use current estimates for reference only.

## Personal metrics
| Metric | Formula | Source / window | Meaning and limitations |
|---|---|---|---|
| Nutrient intake | Σ(food nutrient per 100 g × grams / 100) | meal_item snapshots; selected day | Logged intake only; kcal, protein/carbs/fat/fiber/sugar g, sodium mg |
| Calories remaining | max(0, target − logged kcal) | daily_target + meal items; selected day | UI separately reports amount above target |
| Daily averages | Σ logged amount / all selected calendar dates | meals/water; inclusive range | Missing dates count zero logged amount, not confirmed zero consumption |
| Average weight | Mean of recorded weight entries only | weight_entry; range | No imputed zero weights |
| Calorie adherence | Tracked days within ±10% of snapshotted target / meal-tracked days ×100 | meals + daily_target; range | Null if no tracked days; may overstate actual adherence with partial diaries |
| Protein achievement | Meal-tracked days protein ≥ target / meal-tracked days ×100 | meals + target; range | Distinct from average protein fulfillment |
| Logging consistency | Meal-tracked days / all dates ×100 | meal; range | Measure of usage, not dietary quality |
| Hydration adherence | Days logged water ≥ target / all dates ×100 | water_entry + target; range | Unlogged dates do not meet logged-water target |
| Goal completion | Dates meeting calorie tolerance, protein and water / all dates ×100 | daily aggregates; range | Product aggregate uses eligible meal-days instead; label distinguishes denominators |
| Weight progress | clamp((current − start)/(target − start),0,1)×100 | profile + latest weight ≤ end | Same equation handles loss and gain. Maintenance/equal start-target: 100% within ±2% start, otherwise 0% |
| Rolling weight | Mean recorded weights within trailing 7 dates | weight_entry | Null where that window has no records |
| Macro distribution | P×4, C×4, F×9 normalized to total estimated macro energy | meal_item; range | Does not force source energy to equal macro energy |
| Meal contribution | Meal-type calories / total logged calories ×100 | meal/meal_item; range | Incomplete meal logging affects proportions |
| Weekly adherence bars | Calorie-adherent meal days / tracked days in each consecutive 7-day block from range start | daily series | Block dates are labeled; not ISO weeks. Empty blocks have zero-height bar and tracked=0 tooltip |

## Fitplix Score (0–100)
Daily score = 25×C + 20×P + 15×H + 15×A + 15×L + 10×W.
C=1 if a meal is logged and calories within ±10% of target, else 0. P=clamp(protein/target). H=clamp(water/target). A=clamp(max(steps/8000, active minutes/30)). L=1 if meal logged else 0. W=weight progress fraction. Clamp limits to [0,1]. If no meal/water/weight/activity record exists that day, the entire score is 0. Today score uses one day; weekly/monthly scores average all 7/30 calendar dates. Weight may carry forward; goal progress is not a measured health result. Weights are product-design assumptions, not clinical validation.

## Product metrics
Active event set: USER_LOGIN, MEAL_LOGGED, FOOD_SEARCHED, WATER_LOGGED, WEIGHT_UPDATED, ACTIVITY_LOGGED, ANALYTICS_VIEWED, MEAL_PLAN_CREATED, GOAL_UPDATED. Registration/onboarding/refresh do not count as activity. Food search means an explicitly submitted search; type-ahead queries alone are not events. Analytics view events may repeat on development remounts; active-user/feature measures deduplicate user IDs.
| Metric | Formula | Source and window | Interpretation |
|---|---|---|---|
| Total users | Count registered by end | app_user; selected source | Includes users without onboarding |
| New users | Count registrations in range | app_user.created_at UTC | Acquisition volume |
| DAU | Distinct active user IDs on end date | analytics_event | Partial on current UTC date |
| WAU / MAU | Distinct active IDs in trailing 7 / 30 dates ending on end date | analytics_event | Independent of selected cohort start |
| Stickiness | DAU / MAU ×100 | above | Null if MAU=0 |
| Onboarded users | Distinct users with onboarding event by end | analytics_event | Lifetime as-of count |
| Activation | Registrations completing onboarding and first meal during signup dates 0–6 / eligible registrations ×100 | cohort registered in range; full day6 elapsed and within report end | Excludes immature users |
| Meal logging rate | Distinct meal-event users in range / all registered users by end ×100 | events/users | Includes inactive accounts in denominator |
| Average meals per user | MEAL_LOGGED events / all registered users by end | events/users; range | Logging actions: later deletion does not remove the event |
| D1/D7/D30 retention | Registrations with active event exactly N UTC dates after signup / eligible cohort ×100 | users/events; selected registration range | Only fully elapsed Nth days within report end; null if no eligible users |
| Feature adoption | Distinct users with mapped feature event in range / all registered users by end ×100 | events/users | Not limited to MAU |
| Product goal completion | Meal-days meeting calorie, protein and water goals / meal-days with target snapshot ×100 | persisted meal items, targets, water; range | Different from personal all-date completion |
| Cohort week W | Users active in cohort Monday+7W through +7W+6 / all cohort registrations ×100 | users/events UTC calendar weeks | Null until full calendar week elapsed. Week0 is actual activity, not forced 100% |
| Engagement segment | Inactive if ≥14 days since activity; otherwise high if ≥5 active dates and ≥3 meal dates in trailing7; moderate if ≥2 active dates; otherwise at risk | event history as-of end | Signup date used for recency when no active event exists |

## Funnel and largest drop-off
Funnel denominator starts with distinct first-time browser cookies created in window. Account must be linked to that visitor and registered after first visit. Events must occur in order: registration → onboarding → calorie goal → first meal. Next milestone is 3 distinct active dates after first meal in registration days0–6. Final stage requires exact signup day7 activity. Each stage is a subset of the preceding one. Conversion = stage count / previous stage count; null for zero denominator. Largest drop-off = greatest 100−conversion among measurable transitions, earliest tie. Browser cookies are not unique humans; cookie resets inflate visitor counts. Recent cohorts can be immature: use retention table for maturity-adjusted comparison.

## Experiment
Assignment at onboarding, persistent UUID-hash A/B. A: normal dashboard; B: personalized next-step insight. Primary metric = mean distinct MEAL_LOGGED UTC dates during assignment dates0–6 among users whose full day6 elapsed. Secondary activation = ≥1 meal day during same period; D7 = exact assignment day7 activity among D7-mature assignments. Scope is all assignments in selected source observed by report end, not registrations limited by start. Assignment is not confirmed exposure. Demo results are simulated; no uplift, significance or winner is claimed. Planned analysis: preregister hypothesis, minimum detectable effect, allocation check, attrition, confidence intervals, errors and user-burden guardrails before a real pilot.
