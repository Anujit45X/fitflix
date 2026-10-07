CREATE TABLE visitor(id UUID PRIMARY KEY,first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),user_id UUID UNIQUE REFERENCES app_user(id) ON DELETE SET NULL,demo BOOLEAN NOT NULL DEFAULT false);
CREATE INDEX visitor_first_seen_idx ON visitor(first_seen);
CREATE TABLE experiment(id VARCHAR(64) PRIMARY KEY,name VARCHAR(150) NOT NULL,hypothesis TEXT NOT NULL,primary_metric VARCHAR(100) NOT NULL,status VARCHAR(24) NOT NULL);
INSERT INTO experiment VALUES ('onboarding-insight-v1','A clearer first step','Showing a personalized insight after onboarding increases the number of meal-logging days in the first seven days.','Mean meal-logging days in days 0–6 after assignment','RUNNING');
CREATE TABLE experiment_assignment(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,experiment_id VARCHAR(64) NOT NULL REFERENCES experiment(id),variant VARCHAR(1) NOT NULL CHECK(variant IN ('A','B')),assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(user_id,experiment_id));
