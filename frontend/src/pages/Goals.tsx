import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "../services/session";
import { api, send } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Field, ErrorNote } from "../components/UI";
export default function Goals() {
  const { me, reload } = useSession(),
    qc = useQueryClient(),
    p = me.profile;
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      calories: p.calorieTarget,
      protein: p.proteinTarget,
      carbs: p.carbsTarget,
      fat: p.fatTarget,
      fiber: p.fiberTarget,
      water: p.waterTarget,
    },
  });
  const [error, setError] = useState<any>(null),
    [saved, setSaved] = useState(false);
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">A DIRECTION, NOT A DEADLINE</div>
          <h1>Your goals, your pace.</h1>
          <p className="muted">
            Personalize the daily estimates that work for you.
          </p>
        </div>
      </div>
      <Card>
        <form
          onSubmit={handleSubmit(async (d) => {
            setError(null);
            try {
              await api("/goals", send("PUT", d));
              await reload();
              qc.invalidateQueries();
              setSaved(true);
            } catch (e) {
              setError(e);
            }
          })}
        >
          <div className="form-grid">
            {[
              ["calories", "Calories (kcal)", 1200, 5000],
              ["protein", "Protein (g)", 30, 300],
              ["carbs", "Carbohydrates (g)", 0, 700],
              ["fat", "Fat (g)", 20, 200],
              ["fiber", "Fiber (g)", 10, 60],
              ["water", "Water (ml)", 500, 6000],
            ].map(([key, label, min, max]) => (
              <Field key={key} label={String(label)}>
                <input
                  type="number"
                  step="1"
                  min={min}
                  max={max}
                  required
                  {...register(key as any, { valueAsNumber: true })}
                />
              </Field>
            ))}
          </div>
          <p className="info">
            Changes apply to dates without logged entries. A day’s targets are
            frozen when you first log, preserving honest historical comparisons.
            Protein and carbs provide about 4 kcal/g; fat provides about 9
            kcal/g.
          </p>
          <ErrorNote error={error} />
          {saved && <p role="status">Your targets are saved.</p>}
          <button className="primary section-gap" disabled={isSubmitting}>
            Save targets
          </button>
        </form>
      </Card>
    </>
  );
}
