import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Utensils,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Droplets,
} from "lucide-react";
import { api, send } from "../services/api";
import { useSession } from "../services/session";
import { today, shiftDate } from "../services/date";
import { Card, Metric, ErrorNote, Loading, fmt } from "../components/UI";
import FoodPicker from "../components/FoodPicker";
export default function Dashboard() {
  const { me } = useSession(),
    qc = useQueryClient();
  const [date, setDate] = useState(today(me.profile.timezone)),
    [slot, setSlot] = useState<string | null>(null),
    [error, setError] = useState<any>(null);
  const [waterBusy, setWaterBusy] = useState(false),
    [lastWater, setLastWater] = useState<string | null>(null);
  const {
    data: d,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["dashboard", date],
    queryFn: () => api("/dashboard?date=" + date),
  });
  const weekly = useQuery({
    queryKey: ["weekly", date],
    queryFn: () =>
      api("/analytics/summary?from=" + shiftDate(date, -6) + "&to=" + date),
    retry: false,
  });
  if (isLoading) return <Loading />;
  if (!d) return <ErrorNote error={loadError} />;
  const t = d.totals,
    g = d.target;
  async function water(ml: number) {
    if (waterBusy) return;
    setWaterBusy(true);
    setError(null);
    try {
      const entry = await api("/water", send("POST", { date, ml }));
      setLastWater(entry.id);
      qc.invalidateQueries();
    } catch (e) {
      setError(e);
    } finally {
      setWaterBusy(false);
    }
  }
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">LET’S MAKE TODAY COUNT</div>
          <h1>
            Hello, {me.user.name.split(" ")[0]}
            <span style={{ color: "#8bad6a" }}> .</span>
          </h1>
          <p className="muted">
            A little awareness. A little consistency. A healthier you.
          </p>
        </div>
        <div className="actions">
          <input
            aria-label="Dashboard date"
            type="date"
            value={date}
            max={today(me.profile.timezone)}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
          <button className="primary" onClick={() => setSlot("BREAKFAST")}>
            + Log a meal
          </button>
        </div>
      </div>
      <ErrorNote error={error} />
      {me.variant === "B" && (
        <p className="info" style={{ marginBottom: 20 }}>
          Your first step: aim to log one meal today. Your estimated protein
          target is {fmt(g.protein)} g; consistent logging helps you see how
          your intake compares.
        </p>
      )}
      <div className="grid-4">
        <Metric
          label="CALORIES CONSUMED"
          value={fmt(t.calories)}
          unit="kcal"
          detail={`${fmt(Math.max(0, g.calories - t.calories))} kcal remaining`}
        />
        <Metric
          label="PROTEIN INTAKE"
          value={fmt(t.protein)}
          unit="g"
          detail={`Your goal is ${fmt(g.protein)} g`}
        />
        <Metric
          label="WATER INTAKE"
          value={fmt(t.water / 1000, 2)}
          unit="L"
          detail={`of ${fmt(g.water / 1000, 1)} L daily goal`}
        />
        <Metric
          label="CURRENT WEIGHT"
          value={fmt(d.weight, 1)}
          unit="kg"
          detail={`BMI ${fmt(d.bmi, 1)} · adult estimate`}
        />
      </div>
      <div className="grid-3 section-gap">
        <Card>
          <div className="row">
            <h2>Daily energy</h2>
            <span className="tag">
              {fmt((t.calories / g.calories) * 100)}% of target
            </span>
          </div>
          <div
            className="ring"
            style={{
              background: `conic-gradient(#91b96a ${Math.min(100, (t.calories / g.calories) * 100)}%,#edf2e8 0)`,
            }}
          >
            <div>
              <strong>{fmt(Math.max(0, g.calories - t.calories))}</strong>
              <small>kcal remaining</small>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="eyebrow">CONSUMED</div>
              <b>{fmt(t.calories)}</b>
            </div>
            <div>
              <div className="eyebrow">DAILY TARGET</div>
              <b>{fmt(g.calories)}</b>
            </div>
          </div>
          {t.calories > g.calories && (
            <p className="notice">
              {fmt(t.calories - g.calories)} kcal above the estimate. One day is
              only part of the picture.
            </p>
          )}
        </Card>
        <Card>
          <h2>Find your balance</h2>
          <p className="muted">Your macronutrients, at a glance.</p>
          {[
            ["Protein", "protein", "#91b96a"],
            ["Carbohydrates", "carbs", "#d6ae61"],
            ["Fats", "fat", "#80a4a2"],
            ["Fiber", "fiber", "#aaa1c5"],
          ].map(([label, key, color]) => (
            <div className="macro-row" key={key}>
              <div className="row">
                <span>{label}</span>
                <span>
                  <b>{fmt(t[key])}</b>
                  <span className="muted"> / {fmt(g[key])} g</span>
                </span>
              </div>
              <div
                style={{ height: 7, background: "#edf1e9", borderRadius: 8 }}
              >
                <div
                  style={{
                    width: Math.min(100, (t[key] / g[key]) * 100) + "%",
                    height: 7,
                    background: color,
                    borderRadius: 8,
                  }}
                />
              </div>
            </div>
          ))}
        </Card>
        <Card className="workout-promo">
          <div className="eyebrow">A LITTLE MOVEMENT GOES A LONG WAY</div>
          <h2>
            Make time
            <br />
            for yourself.
          </h2>
          <p className="muted">
            Choose a home or gym session that suits your experience and
            equipment.
          </p>
          <Link className="button-link primary section-gap" to="/workouts">
            Plan your movement ↗
          </Link>
        </Card>
      </div>
      <div className="split section-gap">
        <Card>
          <div className="row">
            <h2>On the menu today</h2>
            <Link className="muted" to="/diary">
              Open diary ↗
            </Link>
          </div>
          {["BREAKFAST", "LUNCH", "DINNER", "SNACKS"].map((type, i) => {
            const entries = d.meals.filter((m: any) => m.mealType === type),
              Icon = [Sun, Sunset, Moon, Coffee][i];
            return (
              <div className="food-result meal-summary" key={type}>
                <div className="row">
                  <div className="meal-icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3>{type[0] + type.slice(1).toLowerCase()}</h3>
                    <p>
                      {entries.length
                        ? entries
                            .flatMap((m: any) =>
                              m.items.map((i: any) => i.name),
                            )
                            .join(" · ")
                        : "A fresh start. Nothing logged yet."}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <small>
                    {fmt(
                      entries
                        .flatMap((m: any) => m.items)
                        .reduce((s: number, i: any) => s + i.calories, 0),
                    )}{" "}
                    kcal
                  </small>
                  <button
                    aria-label={"Add " + type.toLowerCase()}
                    onClick={() => setSlot(type)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <div className="row">
            <h2>A moment to hydrate</h2>
            <Droplets size={20} />
          </div>
          <p className="muted">Small sips add up.</p>
          <div className="metric">
            {fmt(t.water / 1000, 2)} <small>/ {fmt(g.water / 1000, 1)} L</small>
          </div>
          <progress
            aria-label="Water intake toward daily goal"
            max={g.water}
            value={Math.min(g.water, t.water)}
          />
          <div className="water-buttons">
            <button disabled={waterBusy} onClick={() => water(250)}>
              + 250 ml
            </button>
            <button disabled={waterBusy} onClick={() => water(500)}>
              + 500 ml
            </button>
          </div>
          {lastWater && (
            <button
              className="text-button section-gap"
              disabled={waterBusy}
              onClick={async () => {
                setWaterBusy(true);
                try {
                  await api("/water/" + lastWater, send("DELETE"));
                  setLastWater(null);
                  await qc.invalidateQueries();
                } catch (e) {
                  setError(e);
                } finally {
                  setWaterBusy(false);
                }
              }}
            >
              Undo last water entry
            </button>
          )}
          <div className="section-title">MOVEMENT TODAY</div>
          <div className="row">
            <span>
              <b>{fmt(t.steps)}</b> steps
            </span>
            <span>
              <b>{t.minutes}</b> active min
            </span>
          </div>
          <Link to="/progress" className="muted">
            Update activity ↗
          </Link>
        </Card>
      </div>
      <div className="grid-2 section-gap">
        <Card>
          <h2>A week of small steps</h2>
          {weekly.data ? (
            <>
              <p>
                You logged meals on <b>{weekly.data.trackedDays} of 7 days</b>.
              </p>
              <p className="muted">
                Unlogged days are missing intake, not zero food eaten.
              </p>
              <Link className="button-link section-gap" to="/analytics">
                Review your trends ↗
              </Link>
            </>
          ) : (
            <p className="muted">
              {weekly.isLoading
                ? "Loading weekly records…"
                : "Weekly records are unavailable right now."}
            </p>
          )}
        </Card>
        <Card>
          <h2>Your weight this week</h2>
          {weekly.data?.days.filter((d: any) => d.weight != null).length ? (
            <table className="weight-history">
              <caption className="muted">Recorded check-ins · kg</caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {weekly.data.days
                  .filter((d: any) => d.weight != null)
                  .map((d: any) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>{fmt(d.weight, 1)} kg</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">
              No weight check-ins this week. Your next step starts wherever you
              are.
            </p>
          )}
          <Link className="button-link section-gap" to="/progress">
            Record a check-in ↗
          </Link>
        </Card>
      </div>
      {t.incomplete && (
        <p className="notice">
          Some foods have missing fiber, sugar or sodium values. Those totals
          may be incomplete.
        </p>
      )}
      {slot && (
        <FoodPicker date={date} slot={slot} onClose={() => setSlot(null)} />
      )}
    </>
  );
}
