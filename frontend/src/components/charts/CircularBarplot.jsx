import * as d3 from "d3";

const TAU = 2 * Math.PI;

export default function CircularBarplot({
  width,
  height,
  data,
  valueKey = "value",
  nameKey = "name",
  innerRadius = 60,
  barPadding = 0.08,
}) {
  if (!data || data.length === 0 || width <= 0 || height <= 0) {
    return null;
  }

  const groups = data.map((d) => String(d[nameKey]));
  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const maxValue = d3.max(values) ?? 0;

  const outerRadius = Math.min(width, height) / 2 - 36;

  const xScale = d3
    .scaleBand()
    .domain(groups)
    .range([0, TAU])
    .padding(barPadding);

  const yScale = d3
    .scaleRadial()
    .domain([0, Math.max(maxValue, 1)])
    .range([innerRadius, outerRadius]);

  const arc = d3.arc();

  const bars = data.map((d) => {
    const group = String(d[nameKey]);
    const value = Number(d[valueKey] ?? 0);
    const startAngle = xScale(group) ?? 0;
    const endAngle = startAngle + xScale.bandwidth();

    const path =
      arc({
        innerRadius,
        outerRadius: yScale(value),
        startAngle,
        endAngle,
      }) ?? "";

    const labelAngle = startAngle + xScale.bandwidth() / 2;
    const labelDegrees = (labelAngle * 180) / Math.PI - 90;
    const labelRadius = yScale(value) + 12;
    const valueRadius = yScale(value) + 26;
    const flip = labelAngle > Math.PI;

    return {
      group,
      value,
      path,
      labelAngle,
      labelDegrees,
      labelRadius,
      valueRadius,
      flip,
    };
  });

  return (
    <svg width={width} height={height} role="img" aria-label="Andamento prenotazioni circolare">
      <g transform={`translate(${width / 2}, ${height / 2})`}>
        {bars.map((bar) => (
          <path
            key={bar.group}
            d={bar.path}
            fill="url(#circularBarplotGradient)"
            stroke="rgba(189,178,60,0.35)"
            strokeWidth={1}
          />
        ))}

        {bars.map((bar) => {
          const x = Math.cos(bar.labelAngle - Math.PI / 2) * bar.labelRadius;
          const y = Math.sin(bar.labelAngle - Math.PI / 2) * bar.labelRadius;

          return (
            <g key={`${bar.group}-label`} transform={`translate(${x}, ${y}) rotate(${bar.flip ? bar.labelDegrees + 180 : bar.labelDegrees})`}>
              <text
                textAnchor={bar.flip ? "end" : "start"}
                dominantBaseline="middle"
                fill="var(--text-muted)"
                fontSize="10"
                fontWeight="600"
              >
                {bar.group}
              </text>
            </g>
          );
        })}

        {bars.map((bar) => {
          const x = Math.cos(bar.labelAngle - Math.PI / 2) * bar.valueRadius;
          const y = Math.sin(bar.labelAngle - Math.PI / 2) * bar.valueRadius;
          return (
            <text
              key={`${bar.group}-value`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-primary)"
              fontSize="10"
              fontWeight="700"
            >
              {bar.value}
            </text>
          );
        })}

        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-secondary)"
          fontSize="11"
          fontWeight="700"
          y={-8}
        >
          Giorno
        </text>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-muted)"
          fontSize="10"
          y={10}
        >
          Valore = prenotazioni
        </text>

        <circle r={innerRadius - 6} fill="none" stroke="var(--border-default)" strokeWidth="1" />
      </g>

      <defs>
        <linearGradient id="circularBarplotGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bdb23c" />
          <stop offset="100%" stopColor="#7f7800" />
        </linearGradient>
      </defs>
    </svg>
  );
}
