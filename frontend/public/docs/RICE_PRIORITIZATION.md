# RICE prioritization
These are planning assumptions for a hypothetical 1,000-user quarterly pilot, not observed reach, usage or impact. Reach = unique affected users/quarter; impact = 0.5–3 relative value points/user; confidence is a fraction; effort = person-weeks. RICE = Reach × Impact × Confidence / Effort. Scores compare assumptions, not financial returns.

| Feature | Reach | Impact | Confidence | Effort | RICE score | Decision |
|---|---:|---:|---:|---:|---:|---|
| Food logging | 1,000 | 3 | 90% | 4 | 675 | Core MVP dependency |
| Water tracking | 700 | 1 | 80% | 1 | 560 | Included |
| Weight tracking | 700 | 2 | 85% | 2 | 595 | Included |
| Meal planning | 400 | 1.5 | 65% | 3 | 130 | Lightweight saved-plan version included |
| Personalized insights | 650 | 2 | 70% | 3 | 303.3 | Rule-based MVP included |
| Barcode scanner | 450 | 1.5 | 55% | 5 | 74.3 | Research coverage/licensing first |
| AI coach | 500 | 2 | 35% | 8 | 43.8 | Deferred; quality/safety burden |
| Social challenges | 300 | 1 | 40% | 5 | 24 | Deferred; validate demand |
| Wearable integration | 350 | 1.5 | 45% | 8 | 29.5 | Deferred; partner/privacy work |

Food logging outranks easier additions strategically because every nutrition insight depends on it, even where a smaller feature scores well per unit effort. Authentication/security are prerequisites, not optional scored features. Re-estimate reach from pilot feature adoption, impact from interviews/experiments, confidence from evidence quality and effort from engineering estimates.

Sensitivity: halving personalized-insight confidence to35% reduces its score from303.3 to151.7. It remains ahead of barcode under these assumptions, but uncertainty should inform experiment design rather than a claim of superiority.
