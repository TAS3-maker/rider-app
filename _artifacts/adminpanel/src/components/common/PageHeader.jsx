const PageHeader = ({ title, subtitle, actions }) => {
  return <header className="px-7 py-5 bg-white border-b border-[#E8E8E8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-bold text-[#1A1A2E] leading-tight tracking-tight">{title}</h1>
        <p className="text-[13px] text-[#8A8A9A] mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </header>;
};
export {
  PageHeader
};
