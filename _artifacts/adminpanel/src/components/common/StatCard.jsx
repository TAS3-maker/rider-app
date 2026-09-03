const StatCard = ({ num, label, change, changeType = "up", tooltip }) => {
  return <div
    className="bg-white rounded-[10px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]/40 transition-all hover:border-[#3AAFA9]/30"
    title={tooltip}
  >
      <div className="text-[24px] font-extrabold text-[#1A1A2E] tracking-tight leading-none">
        {num}
      </div>
      <div className="text-[11px] text-[#8A8A9A] mt-1.5 font-medium">{label}</div>
      {change && <div
    className={`text-[11px] mt-2 font-semibold flex items-center gap-1 ${changeType === "up" ? "text-[#2B8A85]" : changeType === "down" ? "text-[#FF6B6B]" : "text-[#8A8A9A]"}`}
  >
          {change}
        </div>}
    </div>;
};
export {
  StatCard
};
