import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "../services/session";
import { ErrorNote, Field } from "../components/UI";
export default function Auth({ register = false }: { register?: boolean }) {
  const session = useSession(),
    nav = useNavigate();
  const [error, setError] = useState<any>(null);
  const schema = z.object({
    name: register ? z.string().min(1).max(80) : z.string().optional(),
    email: z.string().email(),
    password: z
      .string()
      .min(register ? 12 : 1)
      .max(72),
  });
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });
  return (
    <div className="auth-grid">
      <aside className="auth-art">
        <Link className="brand" to="/">
          fitflix<span>✳</span>
        </Link>
        <div>
          <p className="eyebrow">A LITTLE BETTER, EVERY DAY</p>
          <h1>
            Your progress.
            <br />
            In perspective.
          </h1>
          <p>
            Eat with intention. Build consistency.
            <br />
            Find what works for you.
          </p>
          <div className="abstract-ring">
            <span>
              One day
              <br />
              <b>at a time.</b>
            </span>
          </div>
        </div>
        <small>FITNESS · NUTRITION · ANALYTICS</small>
      </aside>
      <main className="auth-form">
        <div>
          <div className="eyebrow">WELCOME TO FITFLIX</div>
          <h1>
            {register ? "Start your next chapter." : "Good to have you back."}
          </h1>
          <p className="muted">
            {register
              ? "Create your account to start tracking."
              : "Sign in and pick up where you left off."}
          </p>
          <form
            onSubmit={handleSubmit(async (d) => {
              setError(null);
              try {
                await session.authenticate(register ? "register" : "login", d);
                nav("/");
              } catch (e) {
                setError(e);
              }
            })}
          >
            {register && (
              <Field label="Your name">
                <input autoComplete="name" {...field("name")} />
                <small className="invalid">{errors.name?.message}</small>
              </Field>
            )}
            <Field label="Email address">
              <input type="email" autoComplete="email" {...field("email")} />
              <small className="invalid">{errors.email?.message}</small>
            </Field>
            <Field
              label={
                register ? "Password · at least 12 characters" : "Password"
              }
            >
              <input
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                {...field("password")}
              />
              <small className="invalid">{errors.password?.message}</small>
            </Field>
            <ErrorNote error={error} />
            <button className="primary full" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait…"
                : register
                  ? "Create account"
                  : "Sign in"}{" "}
              <span>↗</span>
            </button>
          </form>
          <p className="muted">
            {register ? "Already a member?" : "New to Fitflix?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          {!register && <Link to="/forgot-password">Password recovery</Link>}
          <p className="fine">
            For adults 18+. Nutrition targets are general fitness estimates, not
            medical advice.
          </p>
        </div>
      </main>
    </div>
  );
}
