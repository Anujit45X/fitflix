import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, send } from "../services/api";
import { useSession } from "../services/session";
import { today } from "../services/date";
import { Card, ErrorNote, Field, Loading, fmt } from "../components/UI";
type Item = {
  foodId: number;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  role: string;
};
export default function Thali() {
  const { me } = useSession(),
    qc = useQueryClient();
  const [items, setItems] = useState<Item[]>([]),
    [name, setName] = useState("My thali"),
    [mealType, setMealType] = useState("LUNCH"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<any>(null),
    [notice, setNotice] = useState(""),
    [diet, setDiet] = useState(me.profile.diet),
    [description, setDescription] = useState(""),
    [search, setSearch] = useState(""),
    [role, setRole] = useState("Rice / roti");
  const recipes = useQuery({
    queryKey: ["recipes"],
    queryFn: () => api<any[]>("/recipes"),
  });
  const foods = useQuery({
    queryKey: ["thali-foods", search],
    queryFn: () => api("/foods?search=" + encodeURIComponent(search)),
    enabled: search.trim().length > 1,
  });
  const totals = items.reduce(
    (s, i) => ({
      calories: s.calories + (i.calories * i.grams) / 100,
      protein: s.protein + (i.protein * i.grams) / 100,
      carbs: s.carbs + (i.carbs * i.grams) / 100,
      fat: s.fat + (i.fat * i.grams) / 100,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  async function save(saved: boolean) {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      await api(
        saved ? "/saved-meals" : "/meals",
        send("POST", {
          name,
          mealType,
          date: today(me.profile.timezone),
          items: items.map(({ foodId, grams }) => ({ foodId, grams })),
        }),
      );
      await qc.invalidateQueries();
      setNotice(
        saved
          ? "Thali saved. Repeat it from Saved meals."
          : "Thali added to today's diary.",
      );
      if (!saved) setItems([]);
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
          <div className="eyebrow">FAMILIAR FOOD. YOUR PORTIONS.</div>
          <h1>Build my thali.</h1>
          <p className="muted">A plate that fits your everyday life.</p>
        </div>
        <Link className="button-link" to="/planner">
          Saved meals ↗
        </Link>
      </div>
      <div className="split">
        <div>
          <Card>
            <div className="row">
              <h2>Start with a familiar plate</h2>
              <select
                aria-label="Template diet"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="ANY">All diets</option>
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="VEGAN">Vegan</option>
              </select>
            </div>
            <p className="muted">
              Templates are editable ingredient estimates, not measured canteen
              recipes.
            </p>
            {recipes.isLoading && <Loading />}
            <ErrorNote error={recipes.error} />
            <div className="template-list">
              {recipes.data
                ?.filter(
                  (r) =>
                    diet === "ANY" || r.diet === "VEGAN" || r.diet === diet,
                )
                .map((r) => (
                  <button
                    className="template-choice"
                    key={r.id}
                    onClick={() => {
                      setItems(
                        r.items.map((i: any) => ({
                          ...i,
                          grams: Number(i.grams),
                        })),
                      );
                      setName(r.name);
                      setDescription(r.description);
                      setNotice("");
                    }}
                  >
                    <span className="tag">{r.region}</span>
                    <strong>{r.name}</strong>
                    <span>Customize plate →</span>
                  </button>
                ))}
            </div>
          </Card>
          <Card className="section-gap">
            <h2>Add to your plate</h2>
            <div className="form-grid">
              <Field label="Thali section">
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {["Rice / roti", "Dal", "Vegetables", "Protein", "Sides"].map(
                    (r) => (
                      <option key={r}>{r}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Search ingredients">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="rice, lentils, spinach…"
                />
              </Field>
            </div>
            <ErrorNote error={foods.error} />
            {foods.isFetching && <p role="status">Searching…</p>}
            {foods.data?.content.slice(0, 8).map((f: any) => (
              <div className="food-result" key={f.id}>
                <div>
                  <strong>{f.name}</strong>
                  <p>
                    {fmt(f.calories)} kcal / 100 g · {f.source}
                  </p>
                </div>
                <button
                  aria-label={"Add " + f.name + " to thali"}
                  onClick={() =>
                    setItems([
                      ...items,
                      { ...f, foodId: f.id, grams: 100, role },
                    ])
                  }
                >
                  +
                </button>
              </div>
            ))}
            {foods.data?.content.length === 0 && (
              <p className="empty">No matches. Try a different ingredient.</p>
            )}
          </Card>
        </div>
        <Card className="thali-summary">
          <div className="plate-art" aria-hidden="true">
            <span>RICE / ROTI</span>
            <span>DAL</span>
            <span>VEGETABLES</span>
            <span>PROTEIN</span>
            <span>SIDES</span>
          </div>
          <h2>Your thali, your way</h2>
          <p className="notice">
            {description ||
              "Add ingredients to begin. Weigh cooked edible portions and include any oil or sides."}
          </p>
          <Field label="Thali name">
            <input
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Meal">
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
            >
              {["BREAKFAST", "LUNCH", "DINNER", "SNACKS"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          {items.length === 0 && (
            <p className="empty">Your plate is ready for something good.</p>
          )}
          <ul className="ingredient-list">
            {items.map((i, index) => (
              <li key={index}>
                <span className="tag">{i.role}</span>
                <strong>{i.name}</strong>
                <div className="actions">
                  <label>
                    Grams
                    <input
                      aria-label={"Grams for " + i.name}
                      type="number"
                      min={1}
                      max={2000}
                      step="0.1"
                      value={i.grams}
                      onChange={(e) =>
                        setItems(
                          items.map((x, n) =>
                            n === index
                              ? { ...x, grams: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    aria-label={"Remove " + i.name}
                    onClick={() =>
                      setItems(items.filter((_, n) => n !== index))
                    }
                  >
                    Remove
                  </button>
                </div>
                <Serving
                  foodId={i.foodId}
                  onSelect={(grams) =>
                    setItems(
                      items.map((x, n) => (n === index ? { ...x, grams } : x)),
                    )
                  }
                />
              </li>
            ))}
          </ul>
          <div className="thali-totals" aria-live="polite">
            <strong>
              {fmt(totals.calories)} <small>kcal</small>
            </strong>
            <p>
              Protein {fmt(totals.protein, 1)} g · Carbs {fmt(totals.carbs, 1)}{" "}
              g · Fat {fmt(totals.fat, 1)} g
            </p>
          </div>
          <ErrorNote error={error} />
          {notice && (
            <p className="info" role="status">
              {notice}
            </p>
          )}
          <div className="actions section-gap">
            <button
              className="primary"
              disabled={
                busy ||
                !items.length ||
                items.some(
                  (i) =>
                    !Number.isFinite(i.grams) || i.grams < 1 || i.grams > 2000,
                )
              }
              onClick={() => save(false)}
            >
              Log thali
            </button>
            <button
              disabled={
                busy ||
                !name.trim() ||
                !items.length ||
                items.some(
                  (i) =>
                    !Number.isFinite(i.grams) || i.grams < 1 || i.grams > 2000,
                )
              }
              onClick={() => save(true)}
            >
              Save for later
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
function Serving({
  foodId,
  onSelect,
}: {
  foodId: number;
  onSelect: (grams: number) => void;
}) {
  const q = useQuery({
    queryKey: ["servings", foodId],
    queryFn: () => api<any[]>("/foods/" + foodId + "/servings"),
  });
  return (
    <>
      {q.data?.map((s) => (
        <div className="portion-note" key={s.label}>
          <button
            className="text-button"
            onClick={() => onSelect(Number(s.grams))}
          >
            {s.label}: {s.grams} g
          </button>
          <small>{s.basis}</small>
        </div>
      ))}
    </>
  );
}
