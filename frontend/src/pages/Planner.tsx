import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, send } from "../services/api";
import { useSession } from "../services/session";
import { today } from "../services/date";
import { Card, ErrorNote, Loading } from "../components/UI";
import FoodPicker from "../components/FoodPicker";
import Modal from "../components/Modal";
export default function Planner() {
  const { me } = useSession(),
    qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false),
    [remove, setRemove] = useState<any>(null),
    [error, setError] = useState<any>(null),
    [notice, setNotice] = useState("");
  const q = useQuery({
    queryKey: ["plans"],
    queryFn: () => api<any[]>("/saved-meals"),
  });
  async function action(path: string, method: string, body?: any) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api(path, send(method, body));
      qc.invalidateQueries();
      setNotice(
        method === "DELETE" ? "Plan deleted" : "Added to today’s diary",
      );
      setRemove(null);
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
          <div className="eyebrow">A LITTLE PREPARATION GOES A LONG WAY</div>
          <h1>Make room for good food.</h1>
          <p className="muted">Save meals you love. Plan the days ahead.</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          + Create meal plan
        </button>
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
        <div className="grid-3 section-gap">
          {q.data?.map((p: any) => (
            <Card key={p.id}>
              <span className="tag">{p.mealType}</span>
              <h2 style={{ marginTop: 20 }}>{p.name}</h2>
              <p className="muted">
                {JSON.parse(p.items).length} foods ·{" "}
                {p.plannedDate || "Reusable favorite"}
              </p>
              <div className="actions section-gap">
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    action("/saved-meals/" + p.id + "/log", "POST", {
                      date: today(me.profile.timezone),
                    })
                  }
                >
                  Log today
                </button>
                <button disabled={busy} onClick={() => setRemove(p)}>
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {q.data?.length === 0 && (
        <Card>
          <div className="empty">
            Your next favorite meal starts here. Create a plan or save a meal
            from your diary.
          </div>
        </Card>
      )}
      {open && (
        <FoodPicker
          date={today(me.profile.timezone)}
          planner
          onClose={() => setOpen(false)}
        />
      )}{" "}
      {remove && (
        <Modal title="Delete meal plan?" onClose={() => setRemove(null)}>
          <p>{remove.name}</p>
          <button
            className="danger"
            disabled={busy}
            onClick={() => action("/saved-meals/" + remove.id, "DELETE")}
          >
            Delete plan
          </button>
        </Modal>
      )}
    </>
  );
}
