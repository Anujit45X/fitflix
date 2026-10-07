import { useState } from "react";
import { Link } from "react-router-dom";
import { api, send } from "../services/api";
import { Card, Field, ErrorNote } from "../components/UI";
export default function Settings() {
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState<any>(null),
    [busy, setBusy] = useState(false);
  async function action(remove: boolean) {
    setBusy(true);
    setError(null);
    try {
      const data = await api(
        remove ? "/account" : "/account/export",
        send(remove ? "DELETE" : "POST", { password }),
      );
      if (remove) {
        window.location.assign("/");
        return;
      }
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "fitflix-data.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Your account, your control.</h1>
      <div className="actions section-gap">
        <Link className="button-link" to="/profile">
          Edit profile
        </Link>
        <Link className="button-link" to="/goals">
          Adjust goals
        </Link>
        <Link className="button-link" to="/privacy">
          Privacy notice
        </Link>
      </div>
      <Card className="section-gap">
        <h2>Export or delete your data</h2>
        <p className="muted">
          Confirm your current password to download your account records or
          permanently delete your active account.
        </p>
        <Field label="Current password">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorNote error={error} />
        <button disabled={busy || !password} onClick={() => action(false)}>
          Download my data
        </button>
        <hr className="section-gap" />
        <h3>Delete account</h3>
        <p>
          Deletes your profile, meals, custom foods, water, weight, workouts and
          sessions. This cannot be undone.
        </p>
        <Field label="Type DELETE to confirm">
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button
          className="danger"
          disabled={busy || !password || confirm !== "DELETE"}
          onClick={() => action(true)}
        >
          Permanently delete account
        </button>
      </Card>
    </>
  );
}
export function Privacy() {
  return (
    <main className="onboarding">
      <Link className="brand" to="/">
        fitflix<span>✳</span>
      </Link>
      <h1>Privacy & your records</h1>
      <Card>
        <p>
          Fitflix stores your name, email, password hash, adult fitness profile,
          dietary preference and the food, water, weight and workout records you
          choose to enter. Nutrition and fitness estimates are for general
          wellness.
        </p>
        <p>
          Account data and rotating sign-in sessions are stored in PostgreSQL.
          Essential HttpOnly cookies keep you signed in. An anonymous
          first-party visit cookie and recorded feature events support aggregate
          product analysis; no advertising trackers or external AI services are
          configured.
        </p>
        <p>
          You can export your records and delete your active account in
          Settings. Password recovery is unavailable until an email provider is
          configured. Email verification is not implemented.
        </p>
        <p>
          This is a local development build. There is no hosted backup service
          or external monitoring configured. Before a public release, the
          operator must publish contact details, retention periods and a backup
          deletion schedule reflecting the deployed service.
        </p>
        <Link className="button-link" to="/settings">
          Account controls ↗
        </Link>
      </Card>
    </main>
  );
}
