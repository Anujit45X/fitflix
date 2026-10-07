import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorNote, Field } from "../components/UI";

// Capture once before StrictMode renders; immediately remove the secret from browser history.
const resetToken =
  new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
if (window.location.pathname === "/reset-password")
  window.history.replaceState(null, "", window.location.pathname);
export default function Recovery({ reset = false }: { reset?: boolean }) {
  const [error, setError] = useState<any>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="auth-form" style={{ minHeight: "100vh" }}>
      <div>
        <Link className="brand" to="/login">
          fitflix<span>✳</span>
        </Link>
        <h1>{reset ? "Choose a new password." : "Let’s get you back in."}</h1>
        <p className="muted">
          {reset
            ? "Use at least 12 characters. All existing sessions will be signed out."
            : "Enter your email to request a link valid for 15 minutes."}
        </p>
        {!message && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setBusy(true);
              const data = new FormData(e.currentTarget);
              try {
                const password = String(data.get("password") || "");
                if (reset && password !== data.get("confirm"))
                  throw new Error("Passwords do not match");
                if (reset && new TextEncoder().encode(password).length > 72)
                  throw new Error("Password must be at most 72 UTF-8 bytes");
                const response = await fetch(
                  `/api/auth/${reset ? "reset-password" : "forgot-password"}`,
                  {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                      reset
                        ? { token: resetToken, password }
                        : { email: data.get("email") },
                    ),
                  },
                );
                const result = await response.json();
                if (!response.ok)
                  throw new Error(result.message || "Please try again later");
                setMessage(result.message);
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            {reset ? (
              <>
                <Field label="New password">
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={72}
                    required
                  />
                </Field>
                <Field label="Confirm password">
                  <input
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={72}
                    required
                  />
                </Field>
              </>
            ) : (
              <Field label="Email address">
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </Field>
            )}
            {reset && !resetToken && (
              <p role="alert">
                This link is incomplete. Request a new reset link.
              </p>
            )}
            <ErrorNote error={error} />
            <button
              className="primary full"
              disabled={busy || (reset && !resetToken)}
            >
              {busy
                ? "Please wait…"
                : reset
                  ? "Update password"
                  : "Send reset link"}
            </button>
          </form>
        )}
        {message && <p role="status">{message}</p>}
        <p>
          <Link to="/login">Back to sign in</Link>
        </p>
        {reset && <Link to="/forgot-password">Request a new reset link</Link>}
      </div>
    </main>
  );
}
