import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, send } from "../services/api";
import { useSession } from "../services/session";
import { today } from "../services/date";
import { Card, ErrorNote, Loading, fmt, Metric } from "../components/UI";
import FoodPicker from "../components/FoodPicker";
import Modal from "../components/Modal";
export default function Diary() {
  const { me } = useSession(),
    qc = useQueryClient();
  const [date, setDate] = useState(today(me.profile.timezone)),
    [picker, setPicker] = useState<any>(null),
    [error, setError] = useState<any>(null),
    [remove, setRemove] = useState<any>(null),
    [notice, setNotice] = useState("");
  const q = useQuery({
      queryKey: ["dashboard", date],
      queryFn: () => api("/dashboard?date=" + date),
    }),
    favorites = useQuery({
      queryKey: ["favorites"],
      queryFn: () => api<any[]>("/favorites"),
    });
  async function action(
    path: string,
    method: string,
    body?: any,
    message = "Saved",
  ) {
    try {
      await api(path, send(method, body));
      qc.invalidateQueries();
      setNotice(message);
      setRemove(null);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">AWARENESS STARTS HERE</div>
          <h1>Your food diary.</h1>
          <p className="muted">Every meal is a piece of the picture.</p>
        </div>
        <div className="actions">
          <input
            aria-label="Diary date"
            type="date"
            value={date}
            max={today(me.profile.timezone)}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
          <button
            onClick={async () => {
              try {
                const result = await api("/meals/copy", send("POST", { date }));
                qc.invalidateQueries();
                setNotice(
                  `${result.copied} meals copied. Previously copied meals are skipped.`,
                );
              } catch (e) {
                setError(e);
              }
            }}
          >
            Copy yesterday
          </button>
        </div>
      </div>
      <ErrorNote error={error || q.error} />
      {notice && (
        <p className="info" role="status">
          {notice}
        </p>
      )}
      {q.isLoading ? (
        <Loading />
      ) : (
        q.data && (
          <>
            <div className="grid-4">
              <Metric
                label="CALORIES"
                value={fmt(q.data.totals.calories)}
                unit="kcal"
              />
              <Metric
                label="PROTEIN"
                value={fmt(q.data.totals.protein, 1)}
                unit="g"
              />
              <Metric
                label="CARBS"
                value={fmt(q.data.totals.carbs, 1)}
                unit="g"
              />
              <Metric label="FAT" value={fmt(q.data.totals.fat, 1)} unit="g" />
            </div>
            {["BREAKFAST", "LUNCH", "DINNER", "SNACKS"].map((type) => (
              <Card className="section-gap" key={type}>
                <div className="row">
                  <h2>{type[0] + type.slice(1).toLowerCase()}</h2>
                  <button onClick={() => setPicker({ slot: type })}>
                    + Add food
                  </button>
                </div>
                {q.data.meals.filter((m: any) => m.mealType === type).length ===
                0 ? (
                  <div className="empty">
                    Nothing here yet. What’s on your plate?
                  </div>
                ) : (
                  q.data.meals
                    .filter((m: any) => m.mealType === type)
                    .map((m: any) => (
                      <div key={m.id}>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Food</th>
                                <th>Grams</th>
                                <th>kcal</th>
                                <th>Protein</th>
                                <th>Carbs</th>
                                <th>Fat</th>
                              </tr>
                            </thead>
                            <tbody>
                              {m.items.map((i: any) => (
                                <tr key={i.id}>
                                  <td>{i.name}</td>
                                  <td>{fmt(i.grams)}</td>
                                  <td>{fmt(i.calories)}</td>
                                  <td>{fmt(i.protein, 1)} g</td>
                                  <td>{fmt(i.carbs, 1)} g</td>
                                  <td>{fmt(i.fat, 1)} g</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="actions" style={{ marginTop: 14 }}>
                          <button onClick={() => setPicker({ existing: m })}>
                            Edit meal
                          </button>
                          <button
                            onClick={() =>
                              action(
                                "/saved-meals",
                                "POST",
                                {
                                  name:
                                    type[0] +
                                    type.slice(1).toLowerCase() +
                                    " favorite",
                                  mealType: type,
                                  items: m.items.map((i: any) => ({
                                    foodId: i.foodId,
                                    grams: i.grams,
                                  })),
                                },
                                "Meal saved to your planner",
                              )
                            }
                          >
                            Save meal
                          </button>
                          <button
                            className="danger"
                            onClick={() => setRemove(m)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </Card>
            ))}
          </>
        )
      )}
      <Card className="section-gap">
        <h2>Your favorite foods</h2>
        {favorites.data?.length ? (
          <div className="log-list">
            {favorites.data.map((f: any) => (
              <button
                key={f.id}
                onClick={() =>
                  setPicker({
                    slot: "SNACKS",
                    existing: {
                      items: [
                        {
                          foodId: f.id,
                          name: f.name,
                          grams: 100,
                          calories: f.calories,
                        },
                      ],
                      mealType: "SNACKS",
                    },
                  })
                }
              >
                {f.name} +
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">
            Use “Toggle favorite” when building a meal to keep foods here.
          </p>
        )}
      </Card>
      {picker && (
        <FoodPicker
          date={date}
          {...picker}
          existing={picker.existing}
          onClose={() => setPicker(null)}
        />
      )}{" "}
      {remove && (
        <Modal title="Delete this meal?" onClose={() => setRemove(null)}>
          <p>Its nutrients will be removed from your daily totals.</p>
          <div className="actions">
            <button onClick={() => setRemove(null)}>Cancel</button>
            <button
              className="danger"
              onClick={() =>
                action(
                  "/meals/" + remove.id,
                  "DELETE",
                  undefined,
                  "Meal deleted",
                )
              }
            >
              Delete meal
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
