import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, send } from "../services/api";
import { useSession } from "../services/session";
import { today, shiftDate as addDays } from "../services/date";
import { Card, ErrorNote, Field, Loading } from "../components/UI";
export default function Workouts() {
  const { me } = useSession(),
    qc = useQueryClient(),
    now = today(me.profile.timezone);
  const [level, setLevel] = useState("BEGINNER"),
    [equipment, setEquipment] = useState("HOME"),
    [date, setDate] = useState(now),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<any>(null),
    [notice, setNotice] = useState("");
  const templates = useQuery({
    queryKey: ["workout-templates"],
    queryFn: () => api<any[]>("/workouts/templates"),
  });
  const records = useQuery({
    queryKey: ["workouts", date],
    queryFn: () => api<any[]>("/workouts?from=" + date + "&to=" + date),
  });
  async function action(path: string, method: string, body?: any) {
    setBusy(true);
    setError(null);
    try {
      await api(path, send(method, body));
      await qc.invalidateQueries({ queryKey: ["workouts"] });
      setNotice(
        method === "POST"
          ? "Workout scheduled."
          : method === "DELETE"
            ? "Workout removed."
            : "Workout updated.",
      );
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
          <div className="eyebrow">MOVE AT YOUR OWN PACE</div>
          <h1>A little stronger, every day.</h1>
          <p className="muted">
            Choose by experience and equipment. Make room for recovery.
          </p>
        </div>
      </div>
      <Card>
        <div className="grid-3">
          <Field label="Experience">
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Equipment">
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
            >
              <option value="HOME">Home · chair and wall</option>
              <option value="GYM">Gym · dumbbells and mat</option>
            </select>
          </Field>
          <Field label="Workout date">
            <input
              type="date"
              value={date}
              min={addDays(now, -365)}
              max={addDays(now, 90)}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </Field>
        </div>
        <p className="muted">
          Use the listed alternatives for a comfortable range. For injury,
          pregnancy or medical limitations, seek individual guidance. Templates
          do not use BMI to assign intensity.
        </p>
      </Card>
      <ErrorNote error={error || templates.error || records.error} />
      {notice && (
        <p className="info section-gap" role="status">
          {notice}
        </p>
      )}
      <div className="split section-gap">
        <div>
          {templates.isLoading && <Loading />}
          {templates.data
            ?.filter((t) => t.level === level && t.equipment === equipment)
            .map((t) => (
              <Card key={t.id}>
                <span className="tag">
                  {t.minutes} min · {t.level.toLowerCase()}
                </span>
                <h2 className="section-gap">{t.name}</h2>
                <p className="muted">{t.instructions}</p>
                <ol className="exercise-list">
                  {t.exercises.map((e: any) => (
                    <li key={e.id}>
                      <h3>{e.name}</h3>
                      <p>
                        <b>
                          {e.sets} sets × {e.reps} reps
                        </b>{" "}
                        · Rest {e.restSeconds}s
                      </p>
                      <p>{e.instructions}</p>
                      <small>Alternative: {e.alternative}</small>
                    </li>
                  ))}
                </ol>
                <button
                  className="primary full"
                  disabled={
                    busy || records.data?.some((r) => r.templateId === t.id)
                  }
                  onClick={() =>
                    action("/workouts", "POST", { templateId: t.id, date })
                  }
                >
                  {records.data?.some((r) => r.templateId === t.id)
                    ? "Already scheduled"
                    : "Schedule workout"}
                </button>
              </Card>
            ))}
        </div>
        <Card>
          <h2>Your movement plan</h2>
          <p className="muted">{date}</p>
          {records.isLoading && <Loading />}
          {records.data?.length === 0 && (
            <p className="empty">
              Nothing scheduled for this date. Choose a session to get started.
            </p>
          )}
          {records.data?.map((r) => (
            <div className="workout-record" key={r.id}>
              <span className="tag">
                {r.completedAt ? "Completed" : "Scheduled"}
              </span>
              <h3>{r.name}</h3>
              <p className="muted">{r.minutes} min</p>
              <div className="actions">
                <button
                  className="primary"
                  disabled={busy || (!r.completedAt && date > now)}
                  onClick={() =>
                    action("/workouts/" + r.id, "PUT", {
                      completed: !r.completedAt,
                    })
                  }
                >
                  {r.completedAt ? "Undo completion" : "Mark complete"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => action("/workouts/" + r.id, "DELETE")}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <p className="fine">
            Completion records are saved to your account. Exercise calories are
            not added to your food target.
          </p>
        </Card>
      </div>
    </>
  );
}
