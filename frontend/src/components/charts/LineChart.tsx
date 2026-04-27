import { ChartAxis } from "./ChartAxis";
import { ChartTooltip } from "./ChartTooltip";

export type DataPoint = { x: Date; y: number; label?: string };

type Props = {
  data: DataPoint[];
  height?: number;
  yFormatter?: (n: number) => string;
  xFormatter?: (d: Date) => string;
};

const VB_W = 600;
const MARGIN = { top: 12, right: 16, bottom: 28, left: 44 };
const MAX_X_TICKS = 5;

export function LineChart({ data, height = 220, yFormatter, xFormatter }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
        No data yet.
      </div>
    );
  }

  const chartW = VB_W - MARGIN.left - MARGIN.right;
  const chartH = height - MARGIN.top - MARGIN.bottom;

  const xs = data.map((d) => d.x.getTime());
  const ys = data.map((d) => d.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMinRaw = Math.min(...ys);
  const yMaxRaw = Math.max(...ys);
  const yPad = (yMaxRaw - yMinRaw) * 0.08 || Math.max(1, Math.abs(yMaxRaw) * 0.1) || 1;
  const yMin = yMinRaw - yPad;
  const yMax = yMaxRaw + yPad;

  const xToPx = (d: Date): number =>
    xMax === xMin ? chartW / 2 : ((d.getTime() - xMin) / (xMax - xMin)) * chartW;
  const yToPx = (y: number): number =>
    yMax === yMin ? chartH / 2 : chartH - ((y - yMin) / (yMax - yMin)) * chartH;

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xToPx(d.x).toFixed(2)},${yToPx(d.y).toFixed(2)}`)
    .join(" ");

  // 4 horizontal gridlines spaced through the y range
  const yTicks: number[] = [];
  for (let i = 0; i <= 4; i++) yTicks.push(yMin + ((yMax - yMin) * i) / 4);

  // ~5 evenly spaced x-axis labels by index
  const stride = Math.max(1, Math.ceil(data.length / MAX_X_TICKS));
  const xTicks: { value: Date; x: number }[] = [];
  for (let i = 0; i < data.length; i += stride) {
    xTicks.push({ value: data[i].x, x: xToPx(data[i].x) });
  }
  const lastTick = xTicks[xTicks.length - 1];
  if (!lastTick || lastTick.value.getTime() !== data[data.length - 1].x.getTime()) {
    xTicks.push({ value: data[data.length - 1].x, x: xToPx(data[data.length - 1].x) });
  }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${height}`}
      className="w-full"
      role="img"
      aria-label="Progress chart"
    >
      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        <ChartAxis
          chartW={chartW}
          chartH={chartH}
          yTicks={yTicks}
          xTicks={xTicks}
          yToPx={yToPx}
          yFormatter={yFormatter}
          xFormatter={xFormatter}
        />
        <path d={path} stroke="#000" strokeWidth={2} fill="none" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xToPx(d.x)}
            cy={yToPx(d.y)}
            r={2.5}
            fill="#fff"
            stroke="#000"
            strokeWidth={1.5}
          />
        ))}
        <ChartTooltip
          data={data}
          chartW={chartW}
          chartH={chartH}
          xToPx={xToPx}
          yToPx={yToPx}
          yFormatter={yFormatter}
          xFormatter={xFormatter}
        />
      </g>
    </svg>
  );
}
