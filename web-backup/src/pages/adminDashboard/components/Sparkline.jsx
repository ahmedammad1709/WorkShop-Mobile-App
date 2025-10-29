import React from "react";

export default function Sparkline({
  points = [30, 50, 70, 20, 40], // sample data
  height = 192,
  padding = 30,
  maxY = 100,
  stepY = 25,
}) {
  const width = 1100;

  const normalizeY = (value) => {
    return (
      height -
      padding -
      ((value - 0) / (maxY - 0)) * (height - padding * 2)
    );
  };

  const xStep = (width - padding * 2) / (points.length - 1);

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${padding + i * xStep} ${normalizeY(p)}`
    )
    .join(" ");

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Horizontal grid lines & y-axis labels */}
        {Array.from({ length: maxY / stepY + 1 }, (_, i) => {
          const yVal = i * stepY;
          const y = normalizeY(yVal);
          return (
            <g key={yVal}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#d1d5db" /* Tailwind gray-300 */
                strokeWidth="1"
                strokeDasharray="4,4" /* dotted line */
              />
              <text
                x={padding - 6}
                y={y + 4}
                fontSize="10"
                textAnchor="end"
                fill="#6b7280" /* Tailwind gray-500 */
              >
                {yVal}
              </text>
            </g>
          );
        })}

        {/* Vertical grid lines */}
        {points.map((_, i) => {
          const x = padding + i * xStep;
          return (
            <line
              key={i}
              x1={x}
              y1={padding}
              x2={x}
              y2={height - padding}
              stroke="#d1d5db"
              strokeWidth="1"
              strokeDasharray="4,4" /* dotted line */
            />
          );
        })}

        {/* Area under the line */}
        <path
          d={`${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
          fill="rgba(132, 239, 132, 0.2)" // lighter green (pastel) fill
        />

        {/* Main line */}
        <path
          d={path}
          fill="none"
          stroke="#22c55e" // Tailwind green-500 (brighter, matching screenshot)
          strokeWidth="2"
        />

        {/* Data point circles */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={padding + i * xStep}
            cy={normalizeY(p)}
            r="4"
            fill="white"
            stroke="#3b82f6" // Tailwind blue-500
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
