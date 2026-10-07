let token: string | null = null;
let refreshing: Promise<boolean> | null = null;
export function setToken(t: string | null) {
  token = t;
}
export async function refresh() {
  if (!refreshing)
    refreshing = fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) {
          token = null;
          return false;
        }
        token = (await r.json()).accessToken;
        return true;
      })
      .finally(() => (refreshing = null));
  return refreshing;
}
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const r = await fetch("/api/v1" + path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (
    r.status === 401 &&
    retry &&
    !path.startsWith("/auth/") &&
    (await refresh())
  )
    return api(path, options, false);
  if (r.status === 401 && !path.startsWith("/auth/"))
    window.dispatchEvent(new Event("session-expired"));
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.message || "Something went wrong");
    Object.assign(err, { status: r.status, fields: data.fields });
    throw err;
  }
  return data;
}
export const send = (method: string, body?: unknown) => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});
