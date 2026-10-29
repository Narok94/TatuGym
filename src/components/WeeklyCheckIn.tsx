import { useId, useState } from "react";
import { Check } from "lucide-react";
import { localDate, STORAGE_KEY } from "../store";

const storageKey = `${STORAGE_KEY}:weekly-checkins`;
const weekdays = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function readRecords(): Record<string, true> {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return {};
  const records: unknown = JSON.parse(raw);
  if (!records || typeof records !== "object" || Array.isArray(records) ||
    Object.entries(records).some(([date, done]) => !/^\d{4}-\d{2}-\d{2}$/.test(date) || done !== true)) {
    throw new Error("Invalid check-ins");
  }
  return records as Record<string, true>;
}

export function WeeklyCheckIn({ today }: { today: Date }) {
  const gradientId = useId();
  const [initial] = useState(() => {
    try { return { records: readRecords(), error: "" }; }
    catch { return { records: {}, error: "Não foi possível acessar os check-ins salvos." }; }
  });
  const [records, setRecords] = useState<Record<string, true>>(initial.records);
  const [error, setError] = useState(initial.error);
  const date = localDate(today);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const days = weekdays.map((label, i) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    return { label, date: localDate(day) };
  });

  function toggle(day: string) {
    if (day > localDate()) return;
    try {
      const next = readRecords();
      if (next[day]) delete next[day]; else next[day] = true;
      localStorage.setItem(storageKey, JSON.stringify(next));
      setRecords(next);
      setError("");
    } catch {
      setError("Não foi possível salvar o check-in. Tente novamente.");
    }
  }

  return <section className="weekly-checkin" aria-labelledby="weekly-checkin-title">
    <div className="weekly-checkin-heading">
      <h2 id="weekly-checkin-title">SEU CHECK-IN SEMANAL</h2>
      <span aria-live="polite"><strong>{days.filter(day => records[day.date]).length}/7</strong> dias</span>
    </div>
    <div className="weekly-checkin-days">
      {days.map(day => <button key={day.date} type="button"
        className={`checkin-day${records[day.date] ? " is-done" : ""}`}
        aria-label={`Check-in ${day.label}, ${day.date.split("-").reverse().join("/")}`}
        aria-pressed={!!records[day.date]} aria-current={day.date === date ? "date" : undefined}
        disabled={day.date > date} onClick={() => toggle(day.date)}>
        <span className="checkin-plate">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id={`${gradientId}-${day.date}-metal`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#9b9d97" /><stop offset=".22" stopColor="#353938" />
                <stop offset=".55" stopColor="#080b0c" /><stop offset=".8" stopColor="#555955" /><stop offset="1" stopColor="#151919" />
              </linearGradient>
              <radialGradient id={`${gradientId}-${day.date}-face`} cx="35%" cy="25%" r="80%">
                <stop stopColor="#383d3c" /><stop offset=".65" stopColor="#171b1c" /><stop offset="1" stopColor="#080b0c" />
              </radialGradient>
            </defs>
            <path className="plate-body" d="M14 3H34L46 24 34 45H14L2 24Z"
              fill={`url(#${gradientId}-${day.date}-metal)`} />
            <circle cx="24" cy="24" r="18" fill={`url(#${gradientId}-${day.date}-face)`} stroke="#555b58" strokeWidth=".7" />
            {records[day.date] && <path className="plate-accent" d="M34 3H14L2 24 14 45H34L46 24" />}
            <circle cx="24" cy="24" r="8" fill={`url(#${gradientId}-${day.date}-metal)`} />
            <circle className="plate-hole" cx="24" cy="24" r="5.5" />
          </svg>
          {records[day.date] && <Check className="checkin-check" size={17} strokeWidth={3} aria-hidden="true" />}
        </span>
        <span className="checkin-weekday">{day.label}</span>
      </button>)}
    </div>
    {error && <p className="checkin-error" role="status">{error}</p>}
  </section>;
}
