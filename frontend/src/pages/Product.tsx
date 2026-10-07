import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Navigate } from "react-router-dom";
import { useSession } from "../services/session";
import { api } from "../services/api";
import { today, shiftDate } from "../services/date";
import { Card, Metric, ErrorNote, Loading, fmt } from "../components/UI";
export default function Product() {
  const { me } = useSession();
  const [tab, setTab] = useState("Overview"),
    [demo, setDemo] = useState(true),
    [range, setRange] = useState("90");
  const to = today("UTC"),
    from = shiftDate(to, 1 - Number(range));
  const q = useQuery({
    queryKey: ["product", demo, range],
    queryFn: () =>
      api(`/admin/product-metrics?demo=${demo}&from=${from}&to=${to}`),
    enabled: me.user.role !== "USER",
  });
  if (me.user.role === "USER") return <Navigate to="/" replace />;
  const d = q.data,
    k = d?.kpis,
    pct = (n: any) => (n == null ? "—" : fmt(n, 1) + "%");
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">FITFLIX · PRODUCT WORKSPACE</div>
          <h1>From behavior to decisions.</h1>
          <p className="muted">
            Acquisition, activation and habits that bring people back.
          </p>
        </div>
        <div className="actions">
          <select
            aria-label="Product dataset"
            value={demo ? "demo" : "real"}
            onChange={(e) => setDemo(e.target.value === "demo")}
          >
            <option value="demo">Simulated demo users</option>
            <option value="real">Real users</option>
          </select>
          <select
            aria-label="Product date range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
      </div>
      <div className="info">
        {demo
          ? "SIMULATED DEMO DATA — generated histories for a portfolio demonstration. No real adoption, retention lift or business impact is claimed."
          : "REAL USER DATA — excludes all seeded demo accounts."}{" "}
        Product dates use UTC; today may be incomplete.
      </div>
      <div className="tabs" role="tablist" aria-label="Product views">
        {[
          "Overview",
          "Funnel",
          "Retention",
          "Users",
          "Experiments",
          "Product docs",
        ].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      <ErrorNote error={q.error} />
      {q.isLoading ? (
        <Loading />
      ) : (
        d && (
          <>
            {tab === "Overview" && (
              <>
                <div className="grid-4">
                  <Metric
                    label="TOTAL USERS"
                    value={k.totalUsers}
                    detail={`${k.newUsers} registered in selected window`}
                  />
                  <Metric
                    label="DAILY ACTIVE USERS"
                    value={k.dau}
                    detail={`${k.wau} weekly · ${k.mau} monthly`}
                  />
                  <Metric
                    label="DAU / MAU"
                    value={pct(k.stickiness)}
                    detail="UTC active users · trailing windows"
                  />
                  <Metric
                    label="7-DAY ACTIVATION"
                    value={pct(k.activationRate)}
                    detail={`${k.activationEligible} mature registrations`}
                  />
                </div>
                <div className="grid-2 section-gap">
                  <Card>
                    <h2>Active users over time</h2>
                    <div className="chart section-gap">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={d.daily}>
                          <CartesianGrid vertical={false} stroke="#edf0e9" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(s) => s.slice(5)}
                            minTickGap={30}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Area
                            isAnimationActive={false}
                            dataKey="activeUsers"
                            fill="#edf5e5"
                            stroke="#88ae66"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card>
                    <h2>Feature adoption</h2>
                    <p className="muted">
                      Distinct feature users / all registered users as of window
                      end.
                    </p>
                    {d.adoption.map((a: any) => (
                      <div className="macro-row" key={a.feature}>
                        <div className="row">
                          <span>{a.feature}</span>
                          <b>
                            {pct(a.rate)}{" "}
                            <small className="muted">({a.users})</small>
                          </b>
                        </div>
                        <progress value={a.rate || 0} max={100} />
                      </div>
                    ))}
                  </Card>
                </div>
                <div className="grid-4 section-gap">
                  <Metric label="ONBOARDED USERS" value={k.onboardedUsers} />
                  <Metric
                    label="MEAL LOGGING RATE"
                    value={pct(k.mealLoggingRate)}
                  />
                  <Metric
                    label="MEALS PER USER"
                    value={
                      k.averageMealsPerUser == null
                        ? "—"
                        : fmt(k.averageMealsPerUser, 1)
                    }
                  />
                  <Metric
                    label="DAILY GOAL COMPLETION"
                    value={pct(k.goalCompletion)}
                    detail="Calorie + protein + water · logged meal-days"
                  />
                </div>
              </>
            )}
            {tab === "Funnel" && (
              <Card>
                <h2>The activation journey</h2>
                <p className="muted">
                  First-time browsers in the selected window, linked to
                  accounts. Ordered milestones; repeat visits do not add
                  visitors.
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Stage</th>
                        <th>Users / visitors</th>
                        <th>From previous</th>
                        <th>Relative reach</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.funnel.map((f: any, i: number) => (
                        <tr key={f.stage}>
                          <td>
                            {i + 1}. {f.stage}
                          </td>
                          <td>{f.users}</td>
                          <td>{i === 0 ? "Baseline" : pct(f.conversion)}</td>
                          <td style={{ width: "35%" }}>
                            <progress
                              max={d.funnel[0].users || 1}
                              value={f.users}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="info section-gap">
                  Largest proportional drop-off: <b>{d.largestDropoff}</b>.
                  Investigate the affected step before attributing causes.
                  Recent visitors may still progress.
                </p>
                <p className="fine">
                  3-day active requires 3 distinct active dates after first meal
                  within registration days 0–6. 7-day retention requires
                  activity on registration day 7. Funnel values are observed to
                  date and are not maturity-adjusted retention estimates.
                </p>
              </Card>
            )}
            {tab === "Retention" && (
              <>
                <div className="grid-3">
                  {d.retention.map((r: any) => (
                    <Metric
                      key={r.day}
                      label={"D" + r.day + " RETENTION"}
                      value={pct(r.rate)}
                      detail={`${r.retained} retained / ${r.eligible} eligible · exact day`}
                    />
                  ))}
                </div>
                <Card className="section-gap">
                  <h2>Registration cohorts</h2>
                  <p className="muted">
                    Active in each UTC calendar week, grouped by registration
                    week. A dash means the full week is not yet observable.
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Registration week</th>
                          <th>Users</th>
                          {[0, 1, 2, 3, 4].map((w) => (
                            <th key={w}>Week {w}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d.cohorts.map((c: any) => (
                          <tr key={c.week}>
                            <td>{c.week}</td>
                            <td>{c.size}</td>
                            {c.retention.map((n: any, i: number) => (
                              <td
                                key={i}
                                style={{
                                  background:
                                    n == null
                                      ? "#f7f8f5"
                                      : `rgba(126,166,85,${0.08 + n / 150})`,
                                  color: "#213d2e",
                                }}
                              >
                                {pct(n)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!d.cohorts.length && (
                    <p className="empty">
                      No registration cohorts in this window.
                    </p>
                  )}
                </Card>
              </>
            )}
            {tab === "Users" && (
              <>
                <div className="grid-4">
                  {Object.entries(d.segments).map(([segment, n]) => (
                    <Metric
                      key={segment}
                      label={segment.toUpperCase()}
                      value={Number(n)}
                    />
                  ))}
                </div>
                <Card className="section-gap">
                  <h2>Engagement segments</h2>
                  <p className="muted">
                    High: ≥5 active dates and ≥3 meal dates in 7 days. Moderate:
                    ≥2 active dates. Inactive: ≥14 days since activity.
                    Remaining users: at risk.
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Registered</th>
                          <th>Active days / 7</th>
                          <th>Days since activity</th>
                          <th>Segment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.users.map((u: any) => (
                          <tr key={u.id}>
                            <td>{u.name}</td>
                            <td>{u.registered}</td>
                            <td>{u.activeDays7}</td>
                            <td>{u.daysSinceActivity}</td>
                            <td>
                              <span className="tag">{u.segment}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
            {tab === "Experiments" && (
              <Card>
                <div className="row">
                  <h2>{d.experiment.name}</h2>
                  <span className="tag">EXPLORATORY</span>
                </div>
                <p>{d.experiment.hypothesis}</p>
                <p className="muted">
                  Primary metric: {d.experiment.primaryMetric}
                </p>
                <div className="grid-2 section-gap">
                  {d.experiment.variants.map((v: any) => (
                    <Card key={v.variant}>
                      <div className="eyebrow">VARIANT {v.variant}</div>
                      <h2 style={{ marginTop: 16 }}>
                        {v.variant === "A"
                          ? "Standard dashboard"
                          : "Dashboard + personal insight"}
                      </h2>
                      <div className="metric">
                        {v.meanMealDays == null ? "—" : fmt(v.meanMealDays, 2)}
                        <small>meal days</small>
                      </div>
                      <p className="muted">
                        {v.eligible} mature of {v.assigned} assigned
                      </p>
                      <p>Activation: {pct(v.activationRate)}</p>
                      <p>
                        D7 retention: {pct(v.retention)} · n={v.d7Eligible}
                      </p>
                    </Card>
                  ))}
                </div>
                <p className="info section-gap">
                  {d.experiment.disclosure} No winner declared. Review sample
                  size, exposure quality, balance and guardrails before making a
                  product decision.
                </p>
              </Card>
            )}
            {tab === "Product docs" && (
              <div className="grid-2">
                {[
                  [
                    "PRD",
                    "Product requirements",
                    "Problem, personas, user stories and acceptance criteria.",
                  ],
                  [
                    "METRIC_DICTIONARY",
                    "Metric dictionary",
                    "Formulas, denominators, time windows and interpretation.",
                  ],
                  [
                    "RICE_PRIORITIZATION",
                    "RICE prioritization",
                    "Transparent reach, impact, confidence and effort assumptions.",
                  ],
                  [
                    "PRODUCT_CASE_STUDY",
                    "Product case study",
                    "A defensible narrative for product and analytics interviews.",
                  ],
                  [
                    "LAUNCH_RUNBOOK",
                    "Launch runbook",
                    "Deployment, operational checks and remaining launch gates.",
                  ],
                  [
                    "ARCHITECTURE",
                    "Architecture",
                    "System structure, trust boundaries and authentication.",
                  ],
                ].map(([file, title, description]) => (
                  <Card key={file}>
                    <h2>{title}</h2>
                    <p className="muted">{description}</p>
                    <a
                      className="doc-link"
                      href={"/docs/" + file + ".md"}
                      download
                    >
                      Download document ↗
                    </a>
                  </Card>
                ))}
              </div>
            )}
          </>
        )
      )}
    </>
  );
}
