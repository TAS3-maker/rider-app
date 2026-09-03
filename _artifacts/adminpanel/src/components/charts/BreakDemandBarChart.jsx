const BreakDemandBarChart = ({ data = [] }) => {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [
    { breakName: "Fall Study Break", count: 18, demandLevel: "Medium" },
    { breakName: "Thanksgiving Recess", count: 89, demandLevel: "Very High" },
    { breakName: "Winter Break", count: 140, demandLevel: "Very High" },
    { breakName: "Spring Break", count: 45, demandLevel: "High" }
  ];
  const maxCount = Math.max(...safeData.map((d) => d.count || 0), 10);
  return <div className="bg-white rounded-[10px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]/70 flex flex-col justify-between min-h-[190px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-[#1A1A2E] flex items-center gap-1.5">
          <span>📊</span> Demand by Break Date
        </h3>
        <span className="text-[11px] text-[#8A8A9A]">Upcoming Travel Periods</span>
      </div>

      <div className="space-y-3 py-1">
        {safeData.map((item) => {
    const pct = Math.round(item.count / maxCount * 100);
    const isHighest = item.count === maxCount;
    return <div key={item.breakName} className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-[#1A1A2E] font-semibold">{item.breakName}</span>
                <div className="flex items-center gap-2">
                  <span
      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${item.demandLevel === "Very High" ? "bg-[#FFF0F0] text-[#D32F2F]" : item.demandLevel === "High" ? "bg-[#FFF8E1] text-[#B8860B]" : "bg-[#E8F6F5] text-[#2B8A85]"}`}
    >
                    {item.demandLevel}
                  </span>
                  <span className="text-[#4A4A5A] font-bold">{item.count} rides</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div
      className={`h-full rounded-full transition-all duration-500 ${isHighest ? "bg-[#3AAFA9]" : "bg-[#3AAFA9]/70"}`}
      style={{ width: `${pct}%` }}
    />
              </div>
            </div>;
  })}
      </div>

      <p className="text-[11px] text-[#8A8A9A] text-center border-t border-[#F5F5F5] pt-2">
        Break calendar events trigger automated 14d & 3d push notifications
      </p>
    </div>;
};
export {
  BreakDemandBarChart
};
