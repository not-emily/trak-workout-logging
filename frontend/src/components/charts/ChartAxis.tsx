type Props = {
  chartW: number;
  chartH: number;
  yTicks: number[];
  xTicks: { value: Date; x: number }[];
  yToPx: (y: number) => number;
  yFormatter?: (n: number) => string;
  xFormatter?: (d: Date) => string;
};

export function ChartAxis({
  chartW,
  chartH,
  yTicks,
  xTicks,
  yToPx,
  yFormatter,
  xFormatter,
}: Props) {
  const fmtY = yFormatter ?? ((n) => n.toLocaleString());
  const fmtX = xFormatter ?? ((d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));

  return (
    <g>
      {yTicks.map((t) => {
        const py = yToPx(t);
        return (
          <g key={t}>
            <line
              x1={0}
              x2={chartW}
              y1={py}
              y2={py}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={-8}
              y={py}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--color-fg-faint)"
              fontSize={11}
              fontFamily="var(--font-mono)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {fmtY(t)}
            </text>
          </g>
        );
      })}
      <line
        x1={0}
        x2={chartW}
        y1={chartH}
        y2={chartH}
        stroke="var(--color-line-strong)"
        strokeWidth={1}
      />
      {xTicks.map(({ value, x }, i) => (
        <text
          key={i}
          x={x}
          y={chartH + 16}
          textAnchor="middle"
          fill="var(--color-fg-subtle)"
          fontSize={11}
          fontFamily="var(--font-mono)"
        >
          {fmtX(value)}
        </text>
      ))}
    </g>
  );
}
