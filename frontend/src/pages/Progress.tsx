import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../services/session";
import { api, send } from "../services/api";
import { today, shiftDate } from "../services/date";
import { Card, Field, ErrorNote, fmt } from "../components/UI";
export default function Progress() {
  const { me, reload } = useSession(),
    qc = useQueryClient();
  const [date, setDate] = useState(today(me.profile.timezone)),
    [error, setError] = useState<any>(null),
    [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const history = useQuery({
    queryKey: ["weight-history", date],
    queryFn: () =>
      api("/analytics/summary?from=" + shiftDate(date, -29) + "&to=" + date),
  });
  const q = useQuery({
    queryKey: ["dashboard", date],
    queryFn: () => api("/dashboard?date=" + date),
  });
  async function submit(e: React.FormEvent<HTMLFormElement>, path: string) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const body: any = { date };
    for (const [k, v] of new FormData(e.currentTarget)) body[k] = Number(v);
    try {
      await api(path, send("POST", body));
      qc.invalidateQueries();
      await reload();
      setNotice("Progress saved");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">NOTICE THE SMALL WINS</div>
          <h1>Progress is personal.</h1>
          <p className="muted">
            Keep a record of your weight, movement and hydration.
          </p>
        </div>
        <input
          style={{ width: "auto" }}
          aria-label="Progress date"
          type="date"
          value={date}
          max={today(me.profile.timezone)}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
      </div>
      <ErrorNote error={error || q.error} />
      {notice && (
        <p className="info" role="status">
          {notice}
        </p>
      )}
      <Card className="section-gap">
        <h2>Your BMI estimate</h2>
        <span className="bmi-number">
          {fmt(
            (q.data?.weight || me.profile.weight) /
              Math.pow(me.profile.height / 100, 2),
            1,
          )}
        </span>
        <p className="muted">
          Weight (kg) ÷ height (m)². BMI does not distinguish muscle from fat,
          describe fat distribution, or diagnose health. This general adult tool
          is not designed for pregnancy or children.
        </p>
      </Card>
      <div className="grid-2 section-gap">
        <Card>
          <h2>Weight check-in</h2>
          <p className="muted">
            Last recorded: {fmt(q.data?.weight || me.profile.weight, 1)} kg
          </p>
          <form onSubmit={(e) => submit(e, "/weight")}>
            <Field label="Weight (kg)">
              <input
                type="number"
                name="kg"
                min="30"
                max="350"
                step="0.1"
                required
                defaultValue={me.profile.weight}
              />
            </Field>
            <button className="primary" disabled={busy}>
              Save weight
            </button>
          </form>
          <p className="fine">
            One entry per day. Saving again updates that day’s entry.
          </p>
        </Card>
        <Card>
          <h2>Daily movement</h2>
          <form onSubmit={(e) => submit(e, "/activity")}>
            <Field label="Total steps">
              <input
                type="number"
                name="steps"
                min="0"
                max="100000"
                required
                defaultValue={0}
              />
            </Field>
            <Field label="Active minutes">
              <input
                type="number"
                name="minutes"
                min="0"
                max="600"
                required
                defaultValue={0}
              />
            </Field>
            <button className="primary" disabled={busy}>
              Save activity
            </button>
          </form>
          <p className="fine">
            Daily totals replace previous values. Exercise calories are not
            added to your food budget.
          </p>
        </Card>
        <Card>
          <h2>Water intake</h2>
          <form onSubmit={(e) => submit(e, "/water")}>
            <Field label="Add water (ml)">
              <input
                type="number"
                name="ml"
                min="1"
                max="3000"
                required
                defaultValue={250}
              />
            </Field>
            <button className="primary" disabled={busy}>
              Log water
            </button>
          </form>
          <div className="log-list section-gap">
            {q.data?.waterEntries.map((w: any) => (
              <button
                key={w.id}
                aria-label={"Remove " + w.ml + " ml water"}
                onClick={async () => {
                  try {
                    await api("/water/" + w.id, send("DELETE"));
                    qc.invalidateQueries();
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                {w.ml} ml ×
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <h2>Your weight goal</h2>
          <div className="row">
            <p className="muted">Starting weight</p>
            <b>{me.profile.startWeight} kg</b>
          </div>
          <div className="row">
            <p className="muted">Current weight</p>
            <b>{me.profile.weight} kg</b>
          </div>
          <div className="row">
            <p className="muted">Target weight</p>
            <b>{me.profile.targetWeight} kg</b>
          </div>
          <p className="info section-gap">
            Weight fluctuates day to day. Look at trends over time rather than a
            single reading.
          </p>
        </Card>
      </div>
      <Card className="section-gap">
        <h2>Weight history · last 30 days</h2>
        <ErrorNote error={history.error} />
        {history.data?.days.some((d: any) => d.weight != null) ? (
          <table>
            <caption className="muted">
              Your recorded check-ins in kilograms
            </caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {history.data.days
                .filter((d: any) => d.weight != null)
                .map((d: any) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{fmt(d.weight, 1)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className="empty">No weight records in this period.</p>
        )}
      </Card>
    </>
  );
}
