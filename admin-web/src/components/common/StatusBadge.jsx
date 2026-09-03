const StatusBadge = ({ label, variant, className = "" }) => {
  let computedVariant = variant || "neutral";
  if (!variant) {
    const l = label.toLowerCase();
    if (["active", "live", "verified", "open", "delivered", "public", "group_joined", "trip_created", "rating_submitted", "ready", "confirmed"].includes(l)) {
      computedVariant = "active";
    } else if (["nearly full", "payment_sent", "medium", "forming", "requested", "booking pending", "draft"].includes(l)) {
      computedVariant = "med";
    } else if (["full", "very high", "user_flaked", "cancelled", "booking cancelled", "overdue", "failed"].includes(l)) {
      computedVariant = "high";
    } else if (["completed", "ride_completed", "booked", "paid"].includes(l)) {
      computedVariant = "completed";
    } else if (["private", "unverified", "inactive", "rider_left"].includes(l)) {
      computedVariant = "inactive";
    } else if (["in progress", "trip_matched", "booker_reassigned"].includes(l)) {
      computedVariant = "blue";
    }
  }
  const variantStyles = {
    active: "bg-[#E8F6F5] text-[#2B8A85]",
    inactive: "bg-[#F5F5F5] text-[#8A8A9A]",
    high: "bg-[#FFF0F0] text-[#D32F2F]",
    med: "bg-[#FFF8E1] text-[#B8860B]",
    low: "bg-[#E8F6F5] text-[#2B8A85]",
    completed: "bg-[#E3F2FD] text-[#1565C0]",
    blue: "bg-[#E0F2FE] text-[#0369A1]",
    warning: "bg-[#FEF3C7] text-[#D97706]",
    danger: "bg-[#FEE2E2] text-[#DC2626]",
    neutral: "bg-[#F3F4F6] text-[#4B5563]",
    purple: "bg-[#F3E8FF] text-[#7E22CE]"
  };
  return <span
    className={`inline-block px-2 py-0.5 rounded-[12px] text-[10px] font-semibold tracking-wide uppercase leading-normal ${variantStyles[computedVariant] || variantStyles.neutral} ${className}`}
  >
      {label}
    </span>;
};
export {
  StatusBadge
};
