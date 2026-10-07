import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useSession } from "../services/session";
import { api, send } from "../services/api";
import { today, shiftDate } from "../services/date";
import { Card, Metric, ErrorNote, Loading, fmt } from "../components/UI";
const colors = ["#84a961", "#d2ad6b", "#7da4a0", "#b7a1be"];
export default function Analytics() {
  const { me } = useSession();
  const end = today(me.profile.timezone);
  const [range, setRange] = useState("30"),
    [from, setFrom] = useState(shiftDate(end, -29)),
    [to, setTo] = useState(end);
  const q = useQuery({
    queryKey: ["analytics", from, to],
    queryFn: () => api("/analytics/summary?from=" + from + "&to=" + to),
  });
  const daily = useQuery({
      queryKey: ["score", end],
      queryFn: () => api("/analytics/summary?from=" + end + "&to=" + end),
    }),
    weekly = useQuery({
      queryKey: ["score-week", end],
      queryFn: () =>
        api("/analytics/summary?from=" + shiftDate(end, -6) + "&to=" + end),
    }),
    monthly = useQuery({
      queryKey: ["score-month", end],
      queryFn: () =>
        api("/analytics/summary?from=" + shiftDate(end, -29) + "&to=" + end),
    });
  useEffect(() => {
    api("/events/ANALYTICS_VIEWED", send("POST")).catch(() => {});
  }, []);
  function change(v: string) {
    setRange(v);
    if (v !== "custom") {
      setFrom(shiftDate(end, 1 - Number(v)));
      setTo(end);
    }
  }
  const d = q.data;
  const percent = (n: any) => (n == null ? "—" : fmt(n) + "%");
  const weeks: any[] = [];
  if (d)
    for (let i = 0; i < d.days.length; i += 7) {
      const days = d.days.slice(i, i + 7),
        tracked = days.filter((x: any) => x.logged).length;
      weeks.push({
        week: days[0].date.slice(5),
        adherence: tracked
          ? (100 * days.filter((x: any) => x.calorieAdherent).length) / tracked
          : 0,
        tracked,
      });
    }
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">THE BIGGER PICTURE</div>
          <h1>See what’s working.</h1>
          <p className="muted">
            Turn daily check-ins into a clearer direction.
          </p>
        </div>
        <div className="actions">
          <select
            aria-label="Analytics range"
            value={range}
            onChange={(e) => change(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
      </div>
      {range === "custom" && (
        <div className="actions">
          <label>
            From{" "}
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => e.target.value && setFrom(e.target.value)}
            />
          </label>
          <label>
            To{" "}
            <input
              type="date"
              value={to}
              max={end}
              onChange={(e) => e.target.value && setTo(e.target.value)}
            />
          </label>
        </div>
      )}
      <ErrorNote error={q.error} />
      {q.isLoading ? (
        <Loading />
      ) : (
        d && (
          <>
            <div className="grid-4">
              <Metric
                label="DAILY CALORIES · AVERAGE"
                value={fmt(d.averageCalories)}
                unit="kcal"
                detail="All dates in selected range"
              />
              <Metric
                label="CALORIE ADHERENCE"
                value={percent(d.calorieAdherence)}
                detail={`${d.trackedDays} meal-tracked days · ±10% of target`}
              />
              <Metric
                label="LOGGING CONSISTENCY"
                value={percent(d.loggingConsistency)}
                detail={`${d.trackedDays} of ${d.totalDays} days logged`}
              />
              <Metric
                label="PROTEIN · AVERAGE"
                value={fmt(d.averageProtein)}
                unit="g"
                detail={`${percent(d.proteinAchievement)} tracked days met target`}
              />
            </div>
            <div className="grid-4 section-gap">
              <Metric
                label="CARBOHYDRATES · AVERAGE"
                value={fmt(d.averageCarbs)}
                unit="g"
              />
              <Metric
                label="FAT · AVERAGE"
                value={fmt(d.averageFat)}
                unit="g"
              />
              <Metric
                label="WATER · AVERAGE"
                value={fmt(d.averageWater / 1000, 2)}
                unit="L"
              />
              <Metric
                label="RECORDED WEIGHT · AVERAGE"
                value={d.averageWeight == null ? "—" : fmt(d.averageWeight, 1)}
                unit="kg"
              />
            </div>
            <div className="grid-3 section-gap">
              <Metric
                label="TODAY’S FITFLIX SCORE"
                value={daily.data ? fmt(daily.data.score) : "—"}
                unit="/ 100"
              />
              <Metric
                label="7-DAY FITFLIX SCORE"
                value={weekly.data ? fmt(weekly.data.score) : "—"}
                unit="/ 100"
              />
              <Metric
                label="30-DAY FITFLIX SCORE"
                value={monthly.data ? fmt(monthly.data.score) : "—"}
                unit="/ 100"
              />
            </div>
            <div className="grid-2 section-gap">
              <Card>
                <h2>Daily calorie trend</h2>
                <p className="muted">Your intake alongside the day’s target.</p>
                <Chart>
                  <AreaChart data={d.days}>
                    <CartesianGrid vertical={false} stroke="#edf0e9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(s) => s.slice(5)}
                      minTickGap={25}
                    />
                    <YAxis width={40} />
                    <Tooltip />
                    <Area
                      isAnimationActive={false}
                      dataKey="calories"
                      name="Intake"
                      stroke="#89ae66"
                      fill="#edf5e4"
                      strokeWidth={2}
                    />
                    <Area
                      isAnimationActive={false}
                      dataKey="calorieTarget"
                      name="Target"
                      stroke="#b49a62"
                      fill="none"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </Chart>
              </Card>
              <Card>
                <h2>Weight, in perspective</h2>
                <p className="muted">
                  {d.startWeight} kg starting · {fmt(d.currentWeight, 1)} kg
                  current · {d.targetWeight} kg target
                </p>
                <Chart>
                  <LineChart data={d.days}>
                    <CartesianGrid vertical={false} stroke="#edf0e9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(s) => s.slice(5)}
                      minTickGap={25}
                    />
                    <YAxis domain={["auto", "auto"]} width={40} />
                    <Tooltip />
                    <Line
                      isAnimationActive={false}
                      dataKey="weight"
                      name="Recorded kg"
                      stroke="#b6c7a8"
                      dot={{ r: 4 }}
                    />
                    <Line
                      isAnimationActive={false}
                      dataKey="rollingWeight"
                      name="7-day recorded average"
                      stroke="#416b50"
                      dot={false}
                    />
                  </LineChart>
                </Chart>
                {d.averageWeight == null && (
                  <p className="muted">
                    No weight entries in this range. Add a check-in in Progress.
                  </p>
                )}
              </Card>
              <Card>
                <h2>Where your energy comes from</h2>
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        isAnimationActive={false}
                        data={Object.entries(d.macroEnergy).map(
                          ([name, value]) => ({ name, value }),
                        )}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {colors.slice(0, 3).map((c) => (
                          <Cell key={c} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(v) + " kcal"} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="fine">
                  Energy shares use protein ×4, carbs ×4, fat ×9. Source
                  calories can differ due to fiber and rounding.
                </p>
              </Card>
              <Card>
                <h2>Protein over time</h2>
                <Chart>
                  <LineChart data={d.days}>
                    <CartesianGrid vertical={false} stroke="#edf0e9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(s) => s.slice(5)}
                      minTickGap={25}
                    />
                    <YAxis width={40} />
                    <Tooltip />
                    <Line
                      isAnimationActive={false}
                      dataKey="protein"
                      name="Protein g"
                      stroke="#86ac62"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      isAnimationActive={false}
                      dataKey="proteinTarget"
                      name="Target g"
                      stroke="#b8c6af"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </Chart>
              </Card>
              <Card>
                <h2>Hydration, day by day</h2>
                <p className="muted">
                  {fmt(d.averageWater / 1000, 2)} L average ·{" "}
                  {percent(d.hydrationAdherence)} days reached target
                </p>
                <Chart>
                  <BarChart data={d.days}>
                    <CartesianGrid vertical={false} stroke="#edf0e9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(s) => s.slice(5)}
                      minTickGap={25}
                    />
                    <YAxis width={40} />
                    <Tooltip />
                    <Bar
                      isAnimationActive={false}
                      dataKey="water"
                      name="Water ml"
                      fill="#83a9a6"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </Chart>
              </Card>
              <Card>
                <h2>Calories by meal</h2>
                <Chart>
                  <BarChart
                    data={Object.entries(d.mealDistribution).map(
                      ([meal, calories]) => ({
                        meal: meal.toLowerCase(),
                        calories,
                      }),
                    )}
                  >
                    <XAxis dataKey="meal" />
                    <YAxis width={40} />
                    <Tooltip />
                    <Bar
                      isAnimationActive={false}
                      dataKey="calories"
                      fill="#c4a367"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </Chart>
              </Card>
              <Card>
                <h2>Weekly calorie adherence</h2>
                <p className="muted">
                  7-day blocks from the selected start. Percent of meal-tracked
                  days.
                </p>
                <Chart>
                  <BarChart data={weeks}>
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 100]} width={40} />
                    <Tooltip />
                    <Bar
                      isAnimationActive={false}
                      dataKey="adherence"
                      fill="#8aaa6b"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </Chart>
              </Card>
              <Card>
                <h2>A rhythm worth building</h2>
                <p className="muted">
                  Meal logging calendar · {from} to {to}
                </p>
                <div className="heatmap section-gap">
                  {d.days.map((x: any) => (
                    <span
                      key={x.date}
                      className={x.logged ? "logged" : ""}
                      title={
                        x.date +
                        ": " +
                        (x.logged ? "Meal logged" : "No meal logged")
                      }
                      aria-label={
                        x.date +
                        ": " +
                        (x.logged ? "Meal logged" : "No meal logged")
                      }
                    />
                  ))}
                </div>
                <p className="fine">
                  Green = at least one logged meal. Pale = no meal logged.
                  Missing logs do not prove you ate nothing.
                </p>
                <div className="row section-gap">
                  <span className="muted">Weight-goal progress</span>
                  <b>{percent(d.weightProgress)}</b>
                </div>
                <div className="row">
                  <span className="muted">All three nutrition goals met</span>
                  <b>{percent(d.goalCompletion)}</b>
                </div>
              </Card>
            </div>
            <Card className="section-gap">
              <h2>Your patterns, explained.</h2>
              <div className="grid-2">
                {d.insights.map((i: any) => (
                  <div className="insight" key={i.observation}>
                    <h3>{i.observation}</h3>
                    <p>
                      <b>{i.metric}</b>
                    </p>
                    <p className="muted">{i.action}</p>
                  </div>
                ))}
              </div>
            </Card>
            <details className="card section-gap">
              <summary>How the Fitflix Score works</summary>
              <p className="muted">
                Calories 25% · protein 20% · hydration 15% · activity 15% · meal
                logging 15% · weight-goal progress 10%. Protein and hydration
                are capped at 100% fulfillment; calories score only within ±10%
                of target. Activity uses the greater of steps/8,000 or active
                minutes/30. A completely untracked day scores 0. Period scores
                average every date, including untracked dates. Maintenance uses
                ±2% of starting weight. The score is a transparent habit
                indicator, not a validated medical assessment.
              </p>
              <a href="/docs/METRIC_DICTIONARY.md" download>
                Read the metric dictionary ↗
              </a>
            </details>
          </>
        )
      )}
    </>
  );
}
function Chart({ children }: { children: React.ReactElement }) {
  return (
    <div className="chart section-gap">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
