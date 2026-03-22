import { useEffect, useMemo, useState } from "react";
import "./index.css";

const API_URL = "https://api.jsonbin.io/v3/b/69bff1ddaa77b81da90a29c3/latest";

type Guest = {
  name: string;
  guests: string;
  attending: string;
  message: string;
  arrivalDate: string;
  arrivalTime: string;
  phone: string;
};

type JsonBinBody = {
  record?: { data?: unknown };
};

function isGuestRecord(x: unknown): x is Guest {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const str = (k: string) => typeof o[k] === "string";
  return (
    str("name") &&
    str("guests") &&
    str("attending") &&
    str("message") &&
    str("arrivalDate") &&
    str("arrivalTime") &&
    str("phone")
  );
}

export default function App() {
  const [items, setItems] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as JsonBinBody;
        const data = json?.record?.data;
        if (!Array.isArray(data)) throw new Error("Invalid payload");
        const guests = data.filter(isGuestRecord);
        if (!cancelled) setItems(guests);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      [
        row.name,
        row.guests,
        row.attending,
        row.message,
        row.arrivalDate,
        row.arrivalTime,
        row.phone,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [items, query]);

  if (loading) {
    return (
      <div className="page">
        <p className="status">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Guests</h1>
      <input
        type="search"
        className="search"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search guests"
      />
      <ul className="list">
        {filtered.map((row, i) => (
          <li key={`${row.phone}-${row.name}-${i}`} className="card">
            <strong>{row.name || "—"}</strong>
            <div>Guests: {row.guests}</div>
            <div>Attending: {row.attending === "yes" ? "Yes" : "No"}</div>
            {row.message ? <div>Message: {row.message}</div> : null}
            {(row.arrivalDate || row.arrivalTime) && (
              <div>
                Arrival: {row.arrivalDate} {row.arrivalTime}
              </div>
            )}
            <div>Phone: {row.phone}</div>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="empty">No matches.</p>}
    </div>
  );
}