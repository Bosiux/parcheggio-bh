import * as d3 from "d3";

export default function RevenueByAreaBarChart({
  width,
  height,
  data,
  nameKey = "name",
  valueKey = "value",
}) {
  if (!data || data.length === 0 || width <= 0 || height <= 0) {
    return null;
  }

  const margin = { top: 20, right: 40, bottom: 24, left: 200 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const points = [...data]
    .map((d) => ({
      name: String(d[nameKey] ?? ""),
      value: Number(d[valueKey] ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  const yScale = d3
    .scaleBand()
    .domain(points.map((d) => d.name))
    .range([0, innerHeight])
    .padding(0.2);

  const maxValue = d3.max(points, (d) => d.value) ?? 0;
  const xScale = d3
    .scaleLinear()
    .domain([0, Math.max(1, maxValue * 1.1)])
    .nice()
    .range([0, innerWidth]);

  const xTicks = xScale.ticks(5);

  return (
    <svg width={width} height={height} role="img" aria-label="Ricavi giornalieri per area">
      <defs>
        <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#bdb23c" />
          <stop offset="100%" stopColor="#7f7800" />
        </linearGradient>
      </defs>

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {xTicks.map((tick) => (
          <g key={`x-grid-${tick}`}>
            <line
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={0}
              y2={innerHeight}
              stroke="var(--border-soft)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <text
              x={xScale(tick)}
              y={innerHeight + 16}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="11"
            >
              € {tick.toFixed(0)}
            </text>
          </g>
        ))}

        {points.map((point) => {
          const barY = yScale(point.name) ?? 0;
          const barHeight = yScale.bandwidth();
          const barWidth = xScale(point.value);

          return (
            <g key={point.name}>
              <text
                x={-10}
                y={barY + barHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--text-secondary)"
                fontSize="11"
                fontWeight="600"
              >
                {point.name}
              </text>

              <rect
                x={0}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx={8}
                fill="url(#revenueBarGradient)"
              />

              <text
                x={barWidth + 8}
                y={barY + barHeight / 2}
                dominantBaseline="middle"
                fill="var(--text-primary)"
                fontSize="11"
                fontWeight="700"
              >
                € {point.value.toFixed(2)}
              </text>
            </g>
          );
        })}

        <text
          x={innerWidth / 2}
          y={-6}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize="12"
          fontWeight="700"
        >
          Ricavi giornalieri per area
        </text>
      </g>
    </svg>
  );
}
