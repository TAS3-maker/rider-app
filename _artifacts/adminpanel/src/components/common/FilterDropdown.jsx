const FilterDropdown = ({
  value,
  onChange,
  options,
  className = "",
  ariaLabel = "Filter options"
}) => {
  return <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={ariaLabel}
    className={`bg-white border-[1.5px] border-[#E8E8E8] rounded-[8px] px-3 py-2 text-[13px] text-[#4A4A5A] font-medium focus:border-[#3AAFA9] focus:outline-none transition-colors cursor-pointer ${className}`}
  >
      {options.map((opt) => <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>)}
    </select>;
};
export {
  FilterDropdown
};
