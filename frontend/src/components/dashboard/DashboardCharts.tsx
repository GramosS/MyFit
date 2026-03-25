// Enkla SVG-diagram utan extern chart-bibliotek.
// Koordinater normaliseras så grafen skalar i CSS.
type Point = { date: string; weight: number };

// Viktgraf (mini). Kräver minst två punkter.
export function WeightSparkline({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return <div className="dashboard-chart-empty">Logga minst två vikter för att se en trend</div>;
  }
  const wMin = Math.min(...points.map((p) => p.weight));
  const wMax = Math.max(...points.map((p) => p.weight));
  const pad = 4;
  const w = 100;
  const h = 44;
  const range = wMax - wMin || 1;
  // Jämna ut x över hela bredden, y inverterad (SVG y växer nedåt)
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((p.weight - wMin) / range) * (h - 2 * pad);
    return `${x},${y}`;
  });
  return (
    <svg className="dashboard-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#84cc16"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}

// Kalorier per dag. Y skalar från 0 till max i serien.
export function CalorieLineChart({ points }: { points: { date: string; calories: number }[] }) {
  if (points.length < 2) {
    return <div className="dashboard-chart-empty">Logga måltider för att se trenden</div>;
  }
  const cMin = 0;
  const cMax = Math.max(1, ...points.map((p) => p.calories));
  const pad = 4;
  const w = 100;
  const h = 44;
  const range = cMax - cMin || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((p.calories - cMin) / range) * (h - 2 * pad);
    return `${x},${y}`;
  });
  return (
    <svg className="dashboard-sparkline dashboard-sparkline--wide" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#f97316"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}
