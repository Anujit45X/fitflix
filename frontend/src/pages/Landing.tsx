import { Link, Navigate } from "react-router-dom";
import { useSession } from "../services/session";
export default function Landing() {
  const { me } = useSession();
  if (me)
    return <Navigate to={me.profile ? "/today" : "/onboarding"} replace />;
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="brand">
          fitflix<span>✳</span>
        </Link>
        <div className="actions">
          <Link to="/login">Sign in</Link>
          <Link className="button-link primary" to="/register">
            Get started ↗
          </Link>
        </div>
      </header>
      <main>
        <div className="landing-hero">
          <div>
            <div className="eyebrow">GOOD HABITS. FAMILIAR FOOD.</div>
            <h1>
              Your everyday.
              <br />
              <em>A little healthier.</em>
            </h1>
            <p>
              From morning chai to your evening workout.
              <br />
              Make sense of your meals, movement and progress — one day at a
              time.
            </p>
            <Link className="button-link primary" to="/register">
              Make your first small step ↗
            </Link>
            <p className="fine">
              Built for adult wellness. Your food, your pace.
            </p>
          </div>
          <div className="hero-plate">
            <div className="hero-label">MAKE IT YOUR THALI</div>
            <div className="plate-art" aria-hidden="true">
              <span>RICE & ROTI</span>
              <span>DAL</span>
              <span>SHAaK</span>
              <span>PROTEIN</span>
              <span>SIDES</span>
            </div>
            <h2>
              A familiar plate.
              <br />A clearer picture.
            </h2>
            <p>Editable portions · Source-attributed ingredients</p>
          </div>
        </div>
        <div className="landing-features">
          {[
            [
              "01",
              "Eat what feels like home.",
              "Build a thali, explore regional ingredient templates and save the meals you return to.",
            ],
            [
              "02",
              "Make movement your own.",
              "Home and gym workouts organized by experience and equipment, with practical alternatives.",
            ],
            [
              "03",
              "See the habits adding up.",
              "Meals, hydration and weight in one place. Progress comes from the records you actually log.",
            ],
          ].map(([n, title, copy]) => (
            <section key={n}>
              <span className="eyebrow">{n} / THE EVERYDAY APPROACH</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </section>
          ))}
        </div>
      </main>
      <footer>
        Fitflix · A little awareness. A little consistency.{" "}
        <Link to="/privacy">Privacy & data</Link>
      </footer>
    </div>
  );
}
