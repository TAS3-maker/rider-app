const EmptyState = ({
  title = "No records found",
  description = "There are no items matching your current view or filter criteria.",
  action,
  icon = "\u{1F4C2}"
}) => {
  return <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center">
      <span className="text-3xl mb-2" role="img" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-[14px] font-semibold text-[#1A1A2E]">{title}</h3>
      <p className="text-[12px] text-[#8A8A9A] max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>;
};
export {
  EmptyState
};
