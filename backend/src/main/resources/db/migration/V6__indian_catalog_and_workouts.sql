-- New tables only: retain V1-V5 checksums and existing data.
CREATE TABLE food_serving (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 food_id BIGINT NOT NULL REFERENCES food(id), label VARCHAR(100) NOT NULL,
 grams NUMERIC(8,2) NOT NULL CHECK (grams > 0 AND grams <= 2000),
 basis VARCHAR(300) NOT NULL, UNIQUE(food_id,label)
);
-- Explicit app-defined weighed portions, NOT claims that every household bowl weighs the same.
INSERT INTO food_serving(food_id,label,grams,basis) VALUES
 (168878,'Small katori (weighed example)',150,'App-defined 150 g cooked rice; weigh your own katori and adjust.'),
 (172421,'Small katori (weighed example)',150,'App-defined 150 g boiled lentils; dal with water/oil differs.'),
 (171844,'One roti (weighed example)',40,'App-defined 40 g commercial roti proxy; homemade recipes vary.'),
 (171284,'Small katori (weighed example)',100,'App-defined 100 g plain yogurt; weigh your own portion.'),
 (173424,'One egg (weighed edible portion)',50,'App-defined 50 g peeled hard-boiled egg; size varies.'),
 (168463,'Small katori (weighed example)',100,'App-defined 100 g cooked spinach, drained.'),
 (173757,'Small katori (weighed example)',150,'App-defined 150 g boiled chickpeas, drained.'),
 (175177,'Fish portion (weighed example)',100,'App-defined 100 g cooked tilapia; not an equivalent for every fish.'),
 (170440,'Potato portion (weighed example)',100,'App-defined 100 g boiled peeled potato.'),
 (172337,'Oil portion (weighed example)',5,'App-defined 5 g mustard oil; use a scale, not an assumed spoon volume.');

CREATE TABLE recipe (
 id VARCHAR(40) PRIMARY KEY, name VARCHAR(120) NOT NULL, region VARCHAR(60) NOT NULL,
 diet VARCHAR(24) NOT NULL, description VARCHAR(700) NOT NULL
);
CREATE TABLE recipe_ingredient (
 recipe_id VARCHAR(40) NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
 food_id BIGINT NOT NULL REFERENCES food(id), grams NUMERIC(8,2) NOT NULL CHECK(grams > 0 AND grams <= 2000),
 role VARCHAR(30) NOT NULL, PRIMARY KEY(recipe_id,food_id)
);
INSERT INTO recipe VALUES
 ('bengali-veg','Bengali-inspired rice, dal & shaak','Bengal','VEGAN','Ingredient estimate: cooked rice, plain boiled lentils, drained spinach and 5 g mustard oil. Salt, spices and extra oil are excluded; adjust to your actual plate.'),
 ('bengali-fish','Bengali-inspired fish & rice','Bengal','ANY','Ingredient estimate using cooked tilapia as the explicit fish proxy, rice, potato and mustard oil. This is not measured macher jhol; gravy and other ingredients are excluded.'),
 ('hostel','Hostel rice & dal','Hostel / canteen','VEGETARIAN','Canteen estimate: plain cooked rice, boiled lentils and yogurt. Oil, tempering, water and recipes vary; edit all quantities before logging.'),
 ('north-roti','Roti, chana & dahi','North India','VEGETARIAN','Ingredient estimate using commercially prepared roti, plain boiled chickpeas and yogurt. Not a measured chana masala recipe.');
INSERT INTO recipe_ingredient VALUES
 ('bengali-veg',168878,150,'Rice / roti'),('bengali-veg',172421,150,'Dal'),('bengali-veg',168463,100,'Vegetables'),('bengali-veg',172337,5,'Sides'),
 ('bengali-fish',168878,150,'Rice / roti'),('bengali-fish',175177,100,'Protein'),('bengali-fish',170440,100,'Vegetables'),('bengali-fish',172337,5,'Sides'),
 ('hostel',168878,150,'Rice / roti'),('hostel',172421,150,'Dal'),('hostel',171284,100,'Sides'),
 ('north-roti',171844,80,'Rice / roti'),('north-roti',173757,150,'Protein'),('north-roti',171284,100,'Sides');

CREATE TABLE workout_template (
 id VARCHAR(40) PRIMARY KEY, name VARCHAR(100) NOT NULL, level VARCHAR(20) NOT NULL,
 equipment VARCHAR(20) NOT NULL, minutes INT NOT NULL CHECK(minutes BETWEEN 5 AND 180),
 instructions VARCHAR(500) NOT NULL
);
CREATE TABLE exercise (
 id VARCHAR(40) PRIMARY KEY, name VARCHAR(100) NOT NULL, instructions VARCHAR(600) NOT NULL, alternative VARCHAR(300) NOT NULL
);
CREATE TABLE workout_exercise (
 template_id VARCHAR(40) REFERENCES workout_template(id) ON DELETE CASCADE,
 exercise_id VARCHAR(40) REFERENCES exercise(id), position INT NOT NULL,
 sets INT NOT NULL CHECK(sets>0), reps VARCHAR(40) NOT NULL, rest_seconds INT NOT NULL CHECK(rest_seconds>=0),
 PRIMARY KEY(template_id,exercise_id)
);
INSERT INTO exercise VALUES
 ('chair','Chair squat','Use a stable chair. Feet hip-width apart; lean slightly forward, stand with control and sit slowly. Use a comfortable range.','Use hands on the chair or a higher seat.'),
 ('wall','Wall press-up','Place hands on a wall at shoulder height. Keep body aligned, bend elbows slowly and push away with control.','Stand closer to the wall to reduce load.'),
 ('calf','Supported calf raise','Hold a stable support. Slowly lift heels, pause and lower without bouncing.','Use seated calf raises.'),
 ('row','Dumbbell row','Support one hand on a stable bench. Keep back neutral and draw the dumbbell toward your hip; lower slowly. Repeat each side.','Use a light resistance band seated row.'),
 ('goblet','Goblet squat','Hold a light dumbbell close to the chest. Sit hips down between feet with knees tracking toes. Rise with control.','Use a bodyweight chair squat.'),
 ('press','Dumbbell floor press','Lie on a mat with knees bent, dumbbells above elbows. Press upward without locking elbows and lower until upper arms gently touch the floor.','Use a wall press-up.');
INSERT INTO workout_template VALUES
 ('home-beginner','Start strong at home','BEGINNER','HOME',15,'Warm up gently for 5 minutes. Choose a comfortable range; rest longer when needed. Stop for pain or dizziness.'),
 ('home-intermediate','Home strength circuit','INTERMEDIATE','HOME',25,'Warm up for 5 minutes. Keep controlled technique and leave a few repetitions in reserve. Rest between rounds.'),
 ('home-advanced','Home strength practice','ADVANCED','HOME',35,'Warm up, then use a slower lowering phase. Choose difficulty based on experience and comfort, never BMI.'),
 ('gym-beginner','Dumbbell foundations','BEGINNER','GYM',25,'Requires dumbbells, mat and stable support. Start light; ask a qualified trainer to check technique.'),
 ('gym-intermediate','Full body dumbbells','INTERMEDIATE','GYM',35,'Requires dumbbells, mat and stable support. Select a load that permits controlled repetitions.'),
 ('gym-advanced','Full body strength','ADVANCED','GYM',45,'Requires dumbbells, mat and stable support. Use a familiar load with repetitions in reserve; allow recovery days.');
INSERT INTO workout_exercise
 SELECT t.id,e.id,CASE e.id WHEN 'chair' THEN 1 WHEN 'wall' THEN 2 ELSE 3 END,
 CASE t.level WHEN 'BEGINNER' THEN 1 WHEN 'INTERMEDIATE' THEN 2 ELSE 3 END,'8–12',60
 FROM workout_template t CROSS JOIN exercise e WHERE t.equipment='HOME' AND e.id IN ('chair','wall','calf');
INSERT INTO workout_exercise
 SELECT t.id,e.id,CASE e.id WHEN 'goblet' THEN 1 WHEN 'row' THEN 2 ELSE 3 END,
 CASE t.level WHEN 'BEGINNER' THEN 2 WHEN 'INTERMEDIATE' THEN 3 ELSE 4 END,'8–12',90
 FROM workout_template t CROSS JOIN exercise e WHERE t.equipment='GYM' AND e.id IN ('goblet','row','press');
CREATE TABLE workout_record (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 template_id VARCHAR(40) NOT NULL REFERENCES workout_template(id), date DATE NOT NULL,
 completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(user_id,template_id,date)
);
CREATE INDEX workout_user_date ON workout_record(user_id,date);
