import { useState } from "react";
import * as d3 from "d3";

export default function TimeSeriesLineChart({
  width,
  height,
  data,
  dateKey = "date",
  valueKey = "value",
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0 || width <= 0 || height <= 0) {
    return null;
  }

  const margin = { top: 18, right: 24, bottom: 42, left: 64 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const points = [...data]
    .map((d) => ({
      date: new Date(d[dateKey]),
      value: Number(d[valueKey] ?? 0),
    }))
    .sort((a, b) => a.date - b.date);

  const xDomain = d3.extent(points, (d) => d.date);
  const maxValue = d3.max(points, (d) => d.value) ?? 0;

  const xScale = d3.scaleTime().domain(xDomain).range([0, innerWidth]);
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.max(1, maxValue * 1.1)])
    .nice()
    .range([innerHeight, 0]);

  const lineGenerator = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  const areaGenerator = d3
    .area()
    .x((d) => xScale(d.date))
    .y0(innerHeight)
    .y1((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  const xTicks = xScale.ticks(Math.min(6, points.length));
  const yTicks = yScale.ticks(5);
  const formatTooltipDate = d3.timeFormat("%d/%m/%Y");

  return (
    <svg width={width} height={height} role="img" aria-label="Andamento prenotazioni nel tempo">
      <defs>
        <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(189,178,60,0.35)" />
          <stop offset="100%" stopColor="rgba(189,178,60,0.02)" />
        </linearGradient>
      </defs>

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <text
          x={-44}
          y={innerHeight / 2}
          transform={`rotate(-90, ${-44}, ${innerHeight / 2})`}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize="11"
          fontWeight="600"
        >
          Valore (prenotazioni)
        </text>

        {yTicks.map((tick) => (
          <g key={`y-grid-${tick}`}>
            <line
              x1={0}
              x2={innerWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="var(--border-soft)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <text
              x={-10}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--text-muted)"
              fontSize="11"
            >
              {tick}
            </text>
          </g>
        ))}

        <path d={areaGenerator(points) ?? ""} fill="url(#lineAreaGradient)" />
        <path
          d={lineGenerator(points) ?? ""}
          fill="none"
          stroke="#bdb23c"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => {
          const pointX = xScale(point.date);
          const pointY = yScale(point.value);

          return (
          <g key={`${point.date.toISOString()}-${point.value}`}>
            <circle
              cx={pointX}
              cy={pointY}
              r={4}
              fill="#9b9b00"
              stroke="var(--surface-04)"
              strokeWidth={2}
              onMouseEnter={() => setHoveredPoint({ ...point, x: pointX, y: pointY })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            {points.length <= 16 && (
              <text
                x={pointX}
                y={pointY - 10}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="10"
                fontWeight="700"
              >
                {point.value}
              </text>
            )}
          </g>
        );
        })}

        {hoveredPoint && (() => {
          const tooltipWidth = 150;
          const tooltipHeight = 52;
          const offsetX = hoveredPoint.x + 14;
          const offsetY = hoveredPoint.y - tooltipHeight - 14;
          const tooltipX = offsetX + tooltipWidth > innerWidth ? hoveredPoint.x - tooltipWidth - 14 : offsetX;
          const tooltipY = offsetY < 0 ? hoveredPoint.y + 14 : offsetY;

          return (
            <g transform={`translate(${tooltipX}, ${tooltipY})`} pointerEvents="none">
              <rect
                width={tooltipWidth}
                height={tooltipHeight}
                rx={10}
                fill="var(--panel-elevated)"
                stroke="var(--border-default)"
              />
              <text x={12} y={18} fill="var(--text-secondary)" fontSize="10" fontWeight="600">
                {formatTooltipDate(hoveredPoint.date)}
              </text>
              <text x={12} y={36} fill="var(--text-primary)" fontSize="12" fontWeight="700">
                Prenotazioni: {hoveredPoint.value}
              </text>
            </g>
          );
        })()}

        {xTicks.map((tick) => (
          <text
            key={`x-tick-${tick.toISOString()}`}
            x={xScale(tick)}
            y={innerHeight + 22}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="11"
          >
            {d3.timeFormat("%d/%m")(tick)}
          </text>
        ))}

        <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} stroke="var(--border-default)" strokeWidth={1} />

        <text
          x={innerWidth / 2}
          y={innerHeight + 38}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize="11"
          fontWeight="600"
        >
          Giorno
        </text>
      </g>
    </svg>
  );
}
