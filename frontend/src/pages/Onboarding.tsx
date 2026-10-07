import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useSession } from "../services/session";
import { api, send } from "../services/api";
import { Card, Field, ErrorNote } from "../components/UI";
export default function Onboarding() {
  const { me, reload } = useSession(),
    nav = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: me?.profile || {
      age: 25,
      sex: "MALE",
      height: 170,
      weight: 70,
      targetWeight: 65,
      activity: "MODERATE",
      goal: "LOSE",
      diet: "ANY",
      waterTarget: 2500,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  const [error, setError] = useState<any>(null);
  return (
    <div className="onboarding">
      <div className="eyebrow">YOUR PERSONAL BASELINE</div>
      <h1>
        {me?.profile
          ? "Make your goals yours."
          : "Let’s find your starting point."}
      </h1>
      <p className="muted">
        A few details help us estimate your daily targets. You can adjust them
        later.
      </p>
      {me?.profile && (
        <div className="profile-links">
          <Link className="button-link" to="/settings">
            Account settings
          </Link>
          <Link className="button-link" to="/goals">
            Adjust nutrition targets
          </Link>
          <Link className="button-link" to="/planner">
            Saved meals
          </Link>
        </div>
      )}
      <Card>
        <form
          onSubmit={handleSubmit(async (d) => {
            setError(null);
            try {
              await api("/profile", send("PUT", d));
              await reload();
              nav("/");
            } catch (e) {
              setError(e);
            }
          })}
        >
          <div className="form-grid">
            {[
              ["age", "Age", 18, 100],
              ["height", "Height (cm)", 100, 250],
              ["weight", "Current weight (kg)", 30, 350],
              ["targetWeight", "Target weight (kg)", 30, 350],
              ["waterTarget", "Daily water (ml)", 500, 6000],
            ].map(([k, l, min, max]) => (
              <Field key={k} label={String(l)}>
                <input
                  type="number"
                  step={k === "age" || k === "waterTarget" ? 1 : 0.1}
                  min={min}
                  max={max}
                  required
                  {...register(String(k), { valueAsNumber: true })}
                />
              </Field>
            ))}
            <Field label="Sex used for BMR estimate">
              <select {...register("sex")}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </Field>
            <Field label="Fitness goal">
              <select {...register("goal")}>
                <option value="LOSE">Lose weight</option>
                <option value="MAINTAIN">Maintain weight</option>
                <option value="GAIN">Gain muscle</option>
              </select>
            </Field>
            <Field label="Activity level">
              <select {...register("activity")}>
                <option value="SEDENTARY">Sedentary</option>
                <option value="LIGHT">Light activity</option>
                <option value="MODERATE">Moderate activity</option>
                <option value="VERY_ACTIVE">Very active</option>
              </select>
            </Field>
            <Field label="Diet preference">
              <select {...register("diet")}>
                <option value="ANY">No preference</option>
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="VEGAN">Vegan</option>
              </select>
            </Field>
            <Field label="Timezone">
              <input required {...register("timezone")} />
            </Field>
          </div>
          <ErrorNote error={error} />
          <p className="fine">
            Mifflin–St Jeor estimates use sex-specific coefficients. These
            estimates use activity multipliers (1.2–1.725) and goal adjustments
            (−300 or +250 kcal/day), which are app assumptions, not measured
            energy expenditure. Adjust targets in Goals. BMI cannot distinguish
            muscle from fat or show fat distribution and is not a diagnosis.
            These tools are not designed for pregnancy or under-18s. Consult a
            qualified professional for individual guidance.
          </p>
          <button className="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save profile & generate targets"} ↗
          </button>
        </form>
      </Card>
    </div>
  );
}
