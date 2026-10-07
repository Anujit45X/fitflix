import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "./services/session";
import Recovery from "./pages/Recovery";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./layouts/AppLayout";
import { Loading } from "./components/UI";
import Dashboard from "./pages/Dashboard";
import Diary from "./pages/Diary";
import Planner from "./pages/Planner";
import Progress from "./pages/Progress";
import Goals from "./pages/Goals";
import Landing from "./pages/Landing";
import Thali from "./pages/Thali";
import Workouts from "./pages/Workouts";
import Settings, { Privacy } from "./pages/Settings";
import ErrorBoundary from "./components/ErrorBoundary";
import { Link } from "react-router-dom";
const Analytics = React.lazy(() => import("./pages/Analytics"));
const Product = React.lazy(() => import("./pages/Product"));
import "./style.css";
import "./fitflix.css";
function Guard() {
  const { me, loading } = useSession();
  if (loading) return <Loading />;
  return me ? <Outlet /> : <Navigate to="/login" replace />;
}
function Onboarded() {
  const { me } = useSession();
  return me.profile ? <Outlet /> : <Navigate to="/onboarding" replace />;
}
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <ErrorBoundary>
        <SessionProvider>
          <BrowserRouter>
            <React.Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route
                  path="/forgot-password"
                  element={<Recovery key="forgot" />}
                />
                <Route
                  path="/reset-password"
                  element={<Recovery key="reset" reset />}
                />
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth register />} />
                <Route element={<Guard />}>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route element={<Onboarded />}>
                    <Route element={<AppLayout />}>
                      <Route path="today" element={<Dashboard />} />
                      <Route path="thali" element={<Thali />} />
                      <Route path="workouts" element={<Workouts />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="diary" element={<Diary />} />
                      <Route path="planner" element={<Planner />} />
                      <Route path="progress" element={<Progress />} />
                      <Route path="goals" element={<Goals />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="product" element={<Product />} />
                      <Route path="profile" element={<Onboarding />} />
                    </Route>
                  </Route>
                </Route>
                <Route
                  path="*"
                  element={
                    <main className="onboarding">
                      <h1>This page wandered off.</h1>
                      <p>Let’s get back to your day.</p>
                      <Link className="button-link primary" to="/">
                        Return to Fitflix
                      </Link>
                    </main>
                  }
                />
              </Routes>
            </React.Suspense>
          </BrowserRouter>
        </SessionProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>,
);
