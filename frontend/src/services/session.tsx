import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api, setToken, refresh, send } from "./api";
import { useQueryClient } from "@tanstack/react-query";
let visitorPromise: Promise<unknown> | null = null;
const Session = createContext<any>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  async function reload() {
    const data = await api("/me");
    setMe(data);
    return data;
  }
  useEffect(() => {
    const expired = () => {
      setToken(null);
      setMe(null);
      qc.clear();
    };
    window.addEventListener("session-expired", expired);
    if (!visitorPromise)
      visitorPromise = api("/auth/visit", send("POST")).catch(() => {});
    refresh()
      .then((ok) => (ok ? reload() : null))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  async function authenticate(path: string, body: any) {
    const data = await api("/auth/" + path, send("POST", body));
    setToken(data.accessToken);
    await reload();
  }
  async function logout() {
    await api("/auth/logout", send("POST"));
    setToken(null);
    setMe(null);
    qc.clear();
  }
  return (
    <Session.Provider value={{ me, loading, reload, authenticate, logout }}>
      {children}
    </Session.Provider>
  );
}
export const useSession = () => useContext(Session);
