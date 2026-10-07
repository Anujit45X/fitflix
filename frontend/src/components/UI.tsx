import { ReactNode } from "react";
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={"card " + className}>{children}</section>;
}
export function ErrorNote({ error }: { error: any }) {
  return error ? (
    <div className="error" role="alert">
      {error.message || String(error)}
      {error.fields && (
        <ul>
          {Object.entries(error.fields).map(([field, message]) => (
            <li key={field}>
              {field}: {String(message)}
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      Loading your progress…
    </div>
  );
}
export function Metric({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: string | number;
  unit?: string;
  detail?: string;
}) {
  return (
    <Card>
      <div className="eyebrow">{label}</div>
      <div className="metric">
        {value}
        <small>{unit}</small>
      </div>
      {detail && <p className="muted">{detail}</p>}
    </Card>
  );
}
export const fmt = (n: number, d = 0) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: d });
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
