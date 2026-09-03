const TripDirectionDonut = ({ data = [] }) => {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [
    { name: "UMich \u2192 DTW", count: 58, percentage: 65 },
    { name: "DTW \u2192 UMich", count: 31, percentage: 35 }
  ];
  const total = safeData.reduce((sum, item) => sum + (item?.count || 0), 0) || 1;
  const toAirport = safeData.find((d) => d?.name?.includes("\u2192 DTW")) || safeData[0] || { count: 58, percentage: 65, name: "UMich \u2192 DTW" };
  const fromAirport = safeData.find((d) => d?.name?.includes("DTW \u2192")) || safeData[1] || { count: 31, percentage: 35, name: "DTW \u2192 UMich" };
  const toPct = Math.round(toAirport.count / total * 100);
  const fromPct = 100 - toPct;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const toOffset = circumference - toPct / 100 * circumference;
  return <div className="bg-white rounded-[10px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]/70 flex flex-col justify-between min-h-[190px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-bold text-[#1A1A2E] flex items-center gap-1.5">
          <span>🍩</span> Trip Direction Split
        </h3>
        <span className="text-[11px] text-[#8A8A9A]">Total: {total}</span>
      </div>

      <div className="flex items-center justify-around py-2">
        {
    /* Donut graphic */
  }
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {
    /* Background circle / fromAirport */
  }
            <circle
    cx="50"
    cy="50"
    r={radius}
    fill="transparent"
    stroke="#F5C842"
    strokeWidth="14"
  />
            {
    /* ToAirport segment */
  }
            <circle
    cx="50"
    cy="50"
    r={radius}
    fill="transparent"
    stroke="#3AAFA9"
    strokeWidth="14"
    strokeDasharray={circumference}
    strokeDashoffset={toOffset}
    strokeLinecap="round"
  />
          </svg>
          <div className="absolute text-center">
            <span className="text-[14px] font-extrabold text-[#1A1A2E]">{toPct}%</span>
            <div className="text-[9px] text-[#8A8A9A] uppercase tracking-wider font-semibold">To DTW</div>
          </div>
        </div>

        {
    /* Legend */
  }
        <div className="space-y-2 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#3AAFA9]" />
            <div>
              <div className="font-semibold text-[#1A1A2E]">{toAirport.name}</div>
              <div className="text-[11px] text-[#8A8A9A]">{toAirport.count} trips ({toPct}%)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#F5C842]" />
            <div>
              <div className="font-semibold text-[#1A1A2E]">{fromAirport.name}</div>
              <div className="text-[11px] text-[#8A8A9A]">{fromAirport.count} trips ({fromPct}%)</div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#8A8A9A] text-center border-t border-[#F5F5F5] pt-2">
        High departure concentration on Nov 24 pre-break
      </p>
    </div>;
};
export {
  TripDirectionDonut
};
