import { useId } from "react";

export function TeacherChart({ title, data, unit = "", bars = false }: { title: string; data: { label: string; value: number }[]; unit?: string; bars?: boolean }) {
  const id = useId();
  if (!data.length) return <div className="teacher-chart-empty">Os registros cadastrados aparecerão neste gráfico.</div>;
  const minimum = bars ? 0 : Math.min(...data.map(item => item.value)) - 1;
  const maximum = Math.max(minimum + 1, ...data.map(item => item.value)) + (bars ? 0 : 1);
  const points = data.map((item, index) => ({ ...item, x: 32 + (data.length === 1 ? .5 : index / (data.length - 1)) * 536, y: 160 - (item.value - minimum) / (maximum - minimum) * 124 }));
  return <div className="teacher-chart"><svg viewBox="0 0 600 210" role="img" aria-labelledby={id}>
    <title id={id}>{title}: {data.map(item => `${item.label}: ${item.value}${unit}`).join(", ")}</title>
    {[40, 100, 160].map(y => <line key={y} x1="20" x2="580" y1={y} y2={y} stroke="#ffffff12" />)}
    {!bars && <polyline points={points.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#ff822f" strokeWidth="3" />}
    {points.map((point, index) => <g key={index}>
      {bars ? <rect x={point.x - 17} y={point.y} width="34" height={Math.max(0, 160 - point.y)} rx="5" fill="#ff822f" /> : <circle cx={point.x} cy={point.y} r="5" fill="#ff822f" />}
      <text x={point.x} y={Math.max(20, point.y - 10)} textAnchor="middle" fill="#e6eaed" fontSize="12">{point.value}{unit}</text>
      <text x={point.x} y="190" textAnchor="middle" fill="#a7b0b7" fontSize="11">{data.length > 10 && index % Math.ceil(data.length / 8) ? "" : point.label}</text>
    </g>)}
  </svg></div>;
}
