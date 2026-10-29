import { useState } from "react";
import { Check } from "lucide-react";
import { localDate, STORAGE_KEY } from "../store";
import plateImage from "../assets/interface/anilha_checkin.png";

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
          <img src={plateImage} alt="" width="32" height="32" decoding="async" />
          {records[day.date] && <Check className="checkin-check" size={17} strokeWidth={3} aria-hidden="true" />}
        </span>
        <span className="checkin-weekday">{day.label}</span>
      </button>)}
    </div>
    {error && <p className="checkin-error" role="status">{error}</p>}
  </section>;
}
