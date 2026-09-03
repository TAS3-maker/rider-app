const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) => {
  return <div className={`relative ${className}`}>
      <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    aria-label={placeholder}
    className="w-full bg-white border-[1.5px] border-[#E8E8E8] rounded-[8px] px-3 py-2 text-[13px] text-[#1A1A2E] placeholder-[#8A8A9A] focus:border-[#3AAFA9] focus:outline-none transition-colors"
  />
      {value && <button
    type="button"
    onClick={() => onChange("")}
    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A9A] hover:text-[#1A1A2E] text-[12px] p-0.5"
    aria-label="Clear search"
  >
          ✕
        </button>}
    </div>;
};
export {
  SearchInput
};
