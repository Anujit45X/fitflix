import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, send } from "../services/api";
import { ErrorNote, Field, fmt } from "./UI";
import Modal from "./Modal";
export default function FoodPicker({
  date,
  slot = "BREAKFAST",
  existing,
  onClose,
  planner = false,
}: {
  date: string;
  slot?: string;
  existing?: any;
  onClose: () => void;
  planner?: boolean;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [sort, setSort] = useState("name"),
    [page, setPage] = useState(0),
    [mealType, setMealType] = useState(existing?.mealType || slot),
    [items, setItems] = useState<any[]>(
      existing?.items?.map((i: any) => ({
        foodId: i.foodId,
        name: i.name,
        grams: i.grams,
        calories: (i.calories / i.grams) * 100,
      })) || [],
    ),
    [error, setError] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [name, setName] = useState(""),
    [plannedDate, setPlannedDate] = useState(date),
    [custom, setCustom] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const foods = useQuery({
    queryKey: ["foods", query, category, sort, page],
    queryFn: () =>
      api(
        `/foods?search=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&sort=${sort}&page=${page}`,
      ),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<string[]>("/foods/categories"),
  });
  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body = {
        date,
        mealType,
        items: items.map((i) => ({ foodId: i.foodId, grams: Number(i.grams) })),
      };
      await api(
        planner
          ? "/saved-meals"
          : existing?.id
            ? "/meals/" + existing.id
            : "/meals",
        send(
          existing?.id && !planner ? "PUT" : "POST",
          planner ? { ...body, name, plannedDate: plannedDate || null } : body,
        ),
      );
      await qc.invalidateQueries();
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        planner
          ? "Create a meal plan"
          : existing?.id
            ? "Edit your meal"
            : "Add to your food diary"
      }
      onClose={onClose}
    >
      <div className="search-row">
        <select
          aria-label="Meal type"
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
        >
          {["BREAKFAST", "LUNCH", "DINNER", "SNACKS"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <span className="muted">{date}</span>
      </div>
      {planner && (
        <div className="form-grid">
          <Field label="Plan name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </Field>
          <Field label="Planned date (optional)">
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
            />
          </Field>
        </div>
      )}
      <form
        className="search-row"
        onSubmit={(e) => {
          e.preventDefault();
          api("/events/FOOD_SEARCHED", send("POST")).catch(() => {});
          setQuery(search);
        }}
      >
        <input
          aria-label="Search foods"
          placeholder="Search 7,000+ foodsâ€¦"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <div className="search-row">
        <select
          aria-label="Food category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Sort foods"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(0);
          }}
        >
          <option value="name">Name Aâ€“Z</option>
          <option value="calories">Calories: low first</option>
          <option value="protein">Protein: high first</option>
        </select>
        <button onClick={() => setCustom(!custom)}>
          {custom ? "Back to search" : "+ Custom food"}
        </button>
      </div>
      {custom ? (
        <CustomFood
          onSaved={() => {
            setCustom(false);
            qc.invalidateQueries({ queryKey: ["foods"] });
          }}
        />
      ) : (
        <>
          <p className="fine" style={{ marginTop: 0 }}>
            Nutrients per 100 g Â· {foods.data?.totalElements ?? "â€¦"} results.
            Preparation matters: choose the closest match.
          </p>
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            {foods.isLoading ? (
              <p role="status">Searching foodsâ€¦</p>
            ) : (
              foods.data?.content.map((f: any) => (
                <div className="food-result" key={f.id}>
                  <div>
                    <h3>{f.name}</h3>
                    <p>
                      {f.source} · {fmt(f.calories)} kcal Â· P{" "}
                      {fmt(f.protein, 1)}g Â· C {fmt(f.carbs, 1)}g Â· F{" "}
                      {fmt(f.fat, 1)}g
                    </p>
                  </div>
                  <button
                    aria-label={"Add " + f.name}
                    onClick={() =>
                      setItems([
                        ...items,
                        {
                          foodId: f.id,
                          name: f.name,
                          grams: 100,
                          calories: f.calories,
                        },
                      ])
                    }
                  >
                    +
                  </button>
                </div>
              ))
            )}
            {foods.data?.content.length === 0 && (
              <p className="empty">
                No matches. Try another name or add a custom food.
              </p>
            )}
          </div>
          <ErrorNote error={foods.error} />
          <div className="row" style={{ margin: "12px 0" }}>
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <small className="muted">
              Page {page + 1} of {foods.data?.totalPages || 1}
            </small>
            <button
              disabled={!foods.data || page + 1 >= foods.data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
      <h3>
        Your meal Â·{" "}
        {fmt(items.reduce((s, i) => s + (i.calories * i.grams) / 100, 0))} kcal
      </h3>
      {items.length === 0 ? (
        <p className="empty">Add a food above to begin.</p>
      ) : (
        items.map((i, index) => (
          <div className="food-result" key={index}>
            <div>
              <h3>{i.name}</h3>
              <button
                className="text-button"
                onClick={async () => {
                  try {
                    await api("/favorites", send("POST", { foodId: i.foodId }));
                    qc.invalidateQueries({ queryKey: ["favorites"] });
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                Toggle favorite
              </button>
            </div>
            <label style={{ width: 100, flexShrink: 0 }}>
              <small>Grams</small>
              <input
                aria-label={"Grams for " + i.name}
                type="number"
                min="1"
                max="2000"
                value={i.grams}
                onChange={(e) =>
                  setItems(
                    items.map((x, j) =>
                      j === index ? { ...x, grams: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <button
              aria-label={"Remove " + i.name}
              onClick={() => setItems(items.filter((_, j) => j !== index))}
            >
              Ã—
            </button>
          </div>
        ))
      )}
      <p className="fine">
        Amounts are edible grams. Household sizes vary; weigh your portion.
        Source details appear in each search result.
      </p>
      <ErrorNote error={error} />
      <button
        className="primary full"
        disabled={
          busy ||
          !items.length ||
          (planner && !name.trim()) ||
          items.some((i) => i.grams < 1 || i.grams > 2000)
        }
        onClick={save}
      >
        {busy
          ? "Savingâ€¦"
          : planner
            ? "Save meal plan"
            : existing?.id
              ? "Update meal"
              : "Log meal"}
      </button>
    </Modal>
  );
}
function CustomFood({ onSaved }: { onSaved: () => void }) {
  const [error, setError] = useState<any>(null),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const data = new FormData(e.currentTarget);
        const body: any = {};
        for (const [k, v] of data)
          body[k] = ["name", "category"].includes(k) ? v : Number(v);
        try {
          await api("/foods", send("POST", body));
          onSaved();
        } catch (e) {
          setError(e);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="info">
        Enter values from a label or recipe per 100 g. Custom foods are private
        and marked as user-entered.
      </p>
      <div className="form-grid">
        <Field label="Food name">
          <input name="name" required maxLength={300} />
        </Field>
        <Field label="Category">
          <input
            name="category"
            required
            defaultValue="Indian Foods"
            maxLength={100}
          />
        </Field>
        {[
          "calories",
          "protein",
          "carbs",
          "fat",
          "fiber",
          "sugar",
          "sodium",
        ].map((k) => (
          <Field
            label={
              k +
              (k === "calories" ? " (kcal)" : k === "sodium" ? " (mg)" : " (g)")
            }
            key={k}
          >
            <input
              name={k}
              type="number"
              step="0.1"
              min="0"
              max={k === "calories" ? 1000 : k === "sodium" ? 50000 : 100}
              required
              defaultValue={0}
            />
          </Field>
        ))}
      </div>
      <ErrorNote error={error} />
      <button disabled={busy} type="submit">
        Save custom food
      </button>
    </form>
  );
}
