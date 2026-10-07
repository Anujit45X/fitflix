import { Component, ReactNode } from "react";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="onboarding">
        <h1>Something went wrong.</h1>
        <p>Your saved records remain in your account. Reload to try again.</p>
        <button onClick={() => window.location.reload()}>Reload Fitflix</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
