import { useState } from "react";
const RidesPerDayChart = ({ data = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const safeData = Array.isArray(data) && data.length > 0 ? data : [
    { date: "Nov 1", rides: 12, completed: 8 },
    { date: "Nov 5", rides: 18, completed: 14 },
    { date: "Nov 10", rides: 25, completed: 19 },
    { date: "Nov 15", rides: 38, completed: 28 },
    { date: "Nov 20", rides: 62, completed: 34 },
    { date: "Nov 22", rides: 89, completed: 42 }
  ];
  const maxRides = Math.max(...safeData.map((d) => d.rides), 10);
  const width = 800;
  const height = 200;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const points = safeData.map((d, i) => {
    const x = paddingX + i / Math.max(safeData.length - 1, 1) * chartWidth;
    const y = height - paddingY - d.rides / maxRides * chartHeight;
    return { x, y, ...d };
  });
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, "");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  return <div className="bg-white rounded-[10px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]/70 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-bold text-[#1A1A2E] flex items-center gap-2">
            <span>📈</span> Rides Per Day (Last 30 Days)
          </h3>
          <p className="text-[11px] text-[#8A8A9A]">
            Daily coordinated ride volume across student travel windows
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium text-[#4A4A5A]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3AAFA9]" /> Total Rides
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2B8A85]" /> Completed
          </span>
        </div>
      </div>

      <div className="relative w-full h-[180px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rideGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3AAFA9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3AAFA9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {
    /* Grid lines */
  }
          {[0, 0.33, 0.66, 1].map((ratio) => {
    const y = height - paddingY - ratio * chartHeight;
    const val = Math.round(ratio * maxRides);
    return <g key={ratio}>
                <line
      x1={paddingX}
      y1={y}
      x2={width - paddingX}
      y2={y}
      stroke="#F0F0F0"
      strokeDasharray="4 4"
      strokeWidth="1"
    />
                <text
      x={paddingX - 8}
      y={y + 3}
      textAnchor="end"
      fontSize="10"
      fill="#8A8A9A"
      fontFamily="inherit"
    >
                  {val}
                </text>
              </g>;
  })}

          {
    /* Area fill */
  }
          <path d={areaD} fill="url(#rideGradient)" />

          {
    /* Main Curve */
  }
          <path d={pathD} fill="none" stroke="#3AAFA9" strokeWidth="3" strokeLinecap="round" />

          {
    /* Data Points */
  }
          {points.map((p, i) => <g
    key={p.date}
    className="cursor-pointer"
    onMouseEnter={() => setHoveredIndex(i)}
    onMouseLeave={() => setHoveredIndex(null)}
  >
              <circle
    cx={p.x}
    cy={p.y}
    r={hoveredIndex === i ? 6 : 4}
    fill="#FFFFFF"
    stroke="#3AAFA9"
    strokeWidth="2.5"
    className="transition-all"
  />
              <text
    x={p.x}
    y={height - paddingY + 16}
    textAnchor="middle"
    fontSize="11"
    fontWeight="500"
    fill={hoveredIndex === i ? "#1A1A2E" : "#8A8A9A"}
    fontFamily="inherit"
  >
                {p.date}
              </text>
            </g>)}
        </svg>

        {
    /* Hover Tooltip */
  }
        {hoveredIndex !== null && <div
    className="absolute z-10 px-2.5 py-1.5 bg-[#1A1A2E] text-white text-[11px] rounded-[6px] shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full"
    style={{
      left: `${points[hoveredIndex].x / width * 100}%`,
      top: `${points[hoveredIndex].y / height * 100 - 8}%`
    }}
  >
            <div className="font-semibold text-[#3AAFA9]">{points[hoveredIndex].date}</div>
            <div>Total Rides: <strong>{points[hoveredIndex].rides}</strong></div>
            <div>Completed: <strong>{points[hoveredIndex].completed}</strong></div>
          </div>}
      </div>
    </div>;
};
export {
  RidesPerDayChart
};
