-- PostgreSQL / psql reference queries. UTC product dates, explicit source.
-- Run against a read replica or a disposable test database.
\set demo true
SELECT (current_date-29)::text AS from_date, current_date::text AS to_date \gset
SET TIME ZONE 'UTC';
CREATE TEMP VIEW metric_users AS SELECT * FROM app_user WHERE demo=:'demo'::boolean AND created_at<(:'to_date'::date+1);
CREATE TEMP VIEW metric_events AS SELECT e.* FROM analytics_event e JOIN metric_users u ON u.id=e.user_id WHERE e.occurred_at<(:'to_date'::date+1);
CREATE TEMP VIEW active_events AS SELECT * FROM metric_events WHERE event_name IN ('USER_LOGIN','MEAL_LOGGED','FOOD_SEARCHED','WATER_LOGGED','WEIGHT_UPDATED','ACTIVITY_LOGGED','ANALYTICS_VIEWED','MEAL_PLAN_CREATED','GOAL_UPDATED');

-- 1. DAU, WAU, MAU, stickiness: report end and trailing 7/30 UTC dates.
WITH a AS (SELECT count(DISTINCT user_id) FILTER(WHERE occurred_at::date=:'to_date'::date) dau,
count(DISTINCT user_id) FILTER(WHERE occurred_at::date>=:'to_date'::date-6) wau,
count(DISTINCT user_id) FILTER(WHERE occurred_at::date>=:'to_date'::date-29) mau FROM active_events)
SELECT *,round(100.0*dau/nullif(mau,0),2) AS dau_mau_pct FROM a;

-- 2. Exact D1/D7/D30 retention. Denominator excludes incomplete target days.
WITH cohort AS (SELECT * FROM metric_users WHERE created_at::date BETWEEN :'from_date'::date AND :'to_date'::date),
eligible AS (SELECT u.id,u.created_at::date signup,n FROM cohort u CROSS JOIN (VALUES(1),(7),(30)) d(n)
WHERE u.created_at::date+n<current_date AND u.created_at::date+n<=:'to_date'::date)
SELECT n,count(*) eligible,count(*) FILTER(WHERE EXISTS(SELECT 1 FROM active_events e WHERE e.user_id=x.id AND e.occurred_at::date=x.signup+x.n)) retained,
100.0*count(*) FILTER(WHERE EXISTS(SELECT 1 FROM active_events e WHERE e.user_id=x.id AND e.occurred_at::date=x.signup+x.n))/nullif(count(*),0) retention_pct
FROM eligible x GROUP BY n ORDER BY n;

-- 3. Feature adoption; denominator is all source users registered by report end.
WITH features(feature,event_name) AS (VALUES('Food tracking','MEAL_LOGGED'),('Water tracking','WATER_LOGGED'),('Weight tracking','WEIGHT_UPDATED'),('Analytics','ANALYTICS_VIEWED'),('Meal planning','MEAL_PLAN_CREATED'))
SELECT f.feature,count(DISTINCT e.user_id) users,100.0*count(DISTINCT e.user_id)/nullif((SELECT count(*) FROM metric_users),0) adoption_pct
FROM features f LEFT JOIN metric_events e ON e.event_name=f.event_name AND e.occurred_at::date BETWEEN :'from_date'::date AND :'to_date'::date GROUP BY f.feature;

-- 4. Average logged meal events per registered user; deletions do not erase actions.
SELECT count(*)::numeric/nullif((SELECT count(*) FROM metric_users),0) meals_per_user
FROM metric_events WHERE event_name='MEAL_LOGGED' AND occurred_at::date BETWEEN :'from_date'::date AND :'to_date'::date;

-- 5. Meal logging frequency: include users with zero meals.
SELECT u.id,count(e.id) meal_events,count(DISTINCT e.occurred_at::date) meal_dates
FROM metric_users u LEFT JOIN metric_events e ON e.user_id=u.id AND e.event_name='MEAL_LOGGED' AND e.occurred_at::date BETWEEN :'from_date'::date AND :'to_date'::date GROUP BY u.id;

-- 6. Ordered visitor acquisition funnel. Visitors are browser cookies, not people.
WITH visitors AS (SELECT * FROM visitor WHERE demo=:'demo'::boolean AND first_seen::date BETWEEN :'from_date'::date AND :'to_date'::date),
stages AS (SELECT v.id visitor_id,u.id user_id,u.created_at signup,o.t onboarding,g.t goal,m.t meal,
 (SELECT count(DISTINCT e.occurred_at::date) FROM active_events e WHERE e.user_id=u.id AND e.occurred_at>=m.t AND e.occurred_at::date<u.created_at::date+7) active_dates,
 EXISTS(SELECT 1 FROM active_events e WHERE e.user_id=u.id AND e.occurred_at::date=u.created_at::date+7 AND e.occurred_at>=m.t) day7
FROM visitors v LEFT JOIN metric_users u ON u.id=v.user_id AND u.created_at>=v.first_seen
LEFT JOIN LATERAL (SELECT min(occurred_at)t FROM metric_events WHERE user_id=u.id AND event_name='ONBOARDING_COMPLETED' AND occurred_at>=u.created_at)o ON true
LEFT JOIN LATERAL (SELECT min(occurred_at)t FROM metric_events WHERE user_id=u.id AND event_name='CALORIE_GOAL_GENERATED' AND occurred_at>=o.t)g ON true
LEFT JOIN LATERAL (SELECT min(occurred_at)t FROM metric_events WHERE user_id=u.id AND event_name='MEAL_LOGGED' AND occurred_at>=g.t)m ON true),
counts AS (SELECT 1 ord,'Visitor' stage,count(*) n FROM stages UNION ALL SELECT 2,'Registration',count(signup) FROM stages UNION ALL SELECT 3,'Profile setup',count(onboarding) FROM stages UNION ALL SELECT 4,'Goal generated',count(goal) FROM stages UNION ALL SELECT 5,'First meal',count(meal) FROM stages UNION ALL SELECT 6,'3-day active',count(*) FILTER(WHERE meal IS NOT NULL AND active_dates>=3) FROM stages UNION ALL SELECT 7,'7-day retained',count(*) FILTER(WHERE meal IS NOT NULL AND active_dates>=3 AND day7) FROM stages)
SELECT stage,n,100.0*n/nullif(lag(n) OVER(ORDER BY ord),0) conversion_pct FROM counts ORDER BY ord;

-- 7. Engagement segmentation as of end. Inactivity has priority.
WITH a AS (SELECT u.id,coalesce(max(e.occurred_at::date),u.created_at::date) last_active,
count(DISTINCT e.occurred_at::date) FILTER(WHERE e.occurred_at::date>=:'to_date'::date-6) active7,
count(DISTINCT e.occurred_at::date) FILTER(WHERE e.occurred_at::date>=:'to_date'::date-6 AND e.event_name='MEAL_LOGGED') meals7
FROM metric_users u LEFT JOIN active_events e ON e.user_id=u.id GROUP BY u.id,u.created_at),
s AS (SELECT CASE WHEN :'to_date'::date-last_active>=14 THEN 'Inactive' WHEN active7>=5 AND meals7>=3 THEN 'Highly engaged' WHEN active7>=2 THEN 'Moderately engaged' ELSE 'At risk' END segment FROM a)
SELECT segment,count(*) FROM s GROUP BY segment;

-- 8. Weekly calorie adherence from persisted meal-day snapshots.
WITH daily AS (SELECT m.user_id,m.date,sum(i.calories) calories,sum(i.protein) protein FROM meal m JOIN meal_item i ON i.meal_id=m.id JOIN metric_users u ON u.id=m.user_id WHERE m.date BETWEEN :'from_date'::date AND :'to_date'::date GROUP BY m.user_id,m.date)
SELECT d.user_id,date_trunc('week',d.date)::date week,count(*) tracked_days,
100.0*count(*) FILTER(WHERE abs(d.calories-t.calories)<=.1*t.calories)/count(*) calorie_adherence_pct,
100.0*count(*) FILTER(WHERE d.protein>=t.protein)/count(*) protein_achievement_pct
FROM daily d JOIN daily_target t ON t.user_id=d.user_id AND t.date=d.date GROUP BY d.user_id,date_trunc('week',d.date) ORDER BY week;

-- 9. Calendar-week cohorts. Unobservable cells remain NULL; week0 is not forced100.
WITH c AS (SELECT id,date_trunc('week',created_at)::date cohort FROM metric_users WHERE date_trunc('week',created_at)::date>=date_trunc('week',:'from_date'::date)::date),
g AS (SELECT c.*,w,cohort+w*7 week_start,cohort+w*7+6 week_end FROM c CROSS JOIN generate_series(0,4)w)
SELECT cohort,w,count(*) cohort_size,CASE WHEN max(week_end)>=current_date OR max(week_end)>:'to_date'::date THEN NULL ELSE
100.0*count(*) FILTER(WHERE EXISTS(SELECT 1 FROM active_events e WHERE e.user_id=g.id AND e.occurred_at::date BETWEEN g.week_start AND g.week_end))/count(*) END retention_pct
FROM g GROUP BY cohort,w ORDER BY cohort,w;

-- 10. Seven-day activation with complete signup days0-6.
WITH c AS (SELECT * FROM metric_users WHERE created_at::date BETWEEN :'from_date'::date AND :'to_date'::date AND created_at::date+6<current_date AND created_at::date+6<=:'to_date'::date)
SELECT count(*) eligible,100.0*count(*) FILTER(WHERE EXISTS(SELECT 1 FROM metric_events e WHERE e.user_id=c.id AND e.event_name='ONBOARDING_COMPLETED' AND e.occurred_at>=c.created_at AND e.occurred_at::date<c.created_at::date+7) AND EXISTS(SELECT 1 FROM metric_events e WHERE e.user_id=c.id AND e.event_name='MEAL_LOGGED' AND e.occurred_at>=c.created_at AND e.occurred_at::date<c.created_at::date+7))/nullif(count(*),0) activation_pct FROM c;

DROP VIEW active_events;DROP VIEW metric_events;DROP VIEW metric_users;
