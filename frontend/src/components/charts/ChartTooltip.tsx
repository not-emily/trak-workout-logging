import { useState } from "react";
import type { DataPoint } from "./LineChart";

type Props = {
  data: DataPoint[];
  chartW: number;
  chartH: number;
  xToPx: (d: Date) => number;
  yToPx: (n: number) => number;
  yFormatter?: (n: number) => string;
  xFormatter?: (d: Date) => string;
};

export function ChartTooltip({
  data,
  chartW,
  chartH,
  xToPx,
  yToPx,
  yFormatter,
  xFormatter,
}: Props) {
  const [active, setActive] = useState<number | null>(null);
  const fmtY = yFormatter ?? ((n: number) => n.toLocaleString());
  const fmtX = xFormatter ?? ((d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = ((e.clientX - rect.left) / rect.width) * chartW;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const d = Math.abs(xToPx(data[i].x) - xPx);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    setActive(nearestIdx);
  }

  const point = active != null ? data[active] : null;

  return (
    <g>
      <rect
        x={0}
        y={0}
        width={chartW}
        height={chartH}
        fill="transparent"
        onPointerMove={onMove}
        onPointerLeave={() => setActive(null)}
        style={{ touchAction: "none" }}
      />
      {point && (
        <>
          <line
            x1={xToPx(point.x)}
            x2={xToPx(point.x)}
            y1={0}
            y2={chartH}
            stroke="#9ca3af"
            strokeDasharray="3 3"
          />
          <circle cx={xToPx(point.x)} cy={yToPx(point.y)} r={5} fill="#000" />
          <foreignObject
            x={Math.min(Math.max(xToPx(point.x) - 70, 0), chartW - 140)}
            y={Math.max(yToPx(point.y) - 48, 0)}
            width={140}
            height={44}
          >
            <div className="rounded-md bg-gray-900 px-2 py-1 text-center text-xs leading-tight text-white shadow-md">
              <div className="font-semibold">{fmtY(point.y)}</div>
              <div className="text-gray-300">{point.label ?? fmtX(point.x)}</div>
            </div>
          </foreignObject>
        </>
      )}
    </g>
  );
}
