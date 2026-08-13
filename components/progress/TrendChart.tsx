import type { WeeklyPoint } from "@/lib/progress/types";

/**
 * Lightweight responsive SVG line/area chart — no charting library. Used
 * for both the 7-day trend (with labels) and the 30-day view (bars,
 * labels hidden past a point to avoid crowding on mobile).
 */
export function TrendChart({
  points,
  showLabels = true,
  variant = "line",
}: {
  points: WeeklyPoint[];
  showLabels?: boolean;
  variant?: "line" | "bars";
}) {
  const width = 100; // percentage-based viewBox, scales with container
  const height = 40;
  const paddingTop = 6;
  const paddingBottom = showLabels ? 10 : 2;
  const plotHeight = height - paddingTop - paddingBottom;
  const step = points.length > 1 ? width / (points.length - 1) : 0;

  function yFor(score: number) {
    return paddingTop + plotHeight - (score / 100) * plotHeight;
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${yFor(p.score)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${(points.length - 1) * step} ${height - paddingBottom} L 0 ${height - paddingBottom} Z`
      : "";

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label="Progress trend"
      >
        {/* Baseline */}
        <line
          x1="0"
          y1={height - paddingBottom}
          x2={width}
          y2={height - paddingBottom}
          stroke="rgb(var(--color-border))"
          strokeWidth="0.3"
        />

        {variant === "bars" ? (
          points.map((p, i) => {
            const barWidth = Math.max(0.6, step * 0.5);
            const x = i * step - barWidth / 2;
            const y = yFor(p.score);
            return (
              <rect
                key={p.date}
                x={x < 0 ? 0 : x}
                y={y}
                width={barWidth}
                height={height - paddingBottom - y}
                rx="0.6"
                fill="rgb(var(--color-accent))"
                opacity={p.score > 0 ? 0.85 : 0.15}
              />
            );
          })
        ) : (
          <>
            <path d={areaPath} fill="rgb(var(--color-accent))" opacity="0.08" />
            <path
              d={linePath}
              fill="none"
              stroke="rgb(var(--color-accent))"
              strokeWidth="0.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <circle
                key={p.date}
                cx={i * step}
                cy={yFor(p.score)}
                r="0.9"
                fill="rgb(var(--color-accent))"
              />
            ))}
          </>
        )}

        {showLabels &&
          points.map((p, i) => (
            <text
              key={p.date}
              x={i * step}
              y={height - 1.5}
              fontSize="3"
              textAnchor="middle"
              fill="rgb(var(--color-muted))"
            >
              {p.label}
            </text>
          ))}
      </svg>
    </div>
  );
}
