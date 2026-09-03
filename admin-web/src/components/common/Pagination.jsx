import React from "react";
const Pagination = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  return <div className="w-full flex items-center justify-between text-[12px] text-[#8A8A9A]">
      <span>
        Showing <strong className="font-semibold text-[#1A1A2E]">{startItem}</strong> to{" "}
        <strong className="font-semibold text-[#1A1A2E]">{endItem}</strong> of{" "}
        <strong className="font-semibold text-[#1A1A2E]">{totalItems}</strong> entries
      </span>

      <div className="flex items-center gap-1.5">
        <button
    type="button"
    disabled={currentPage <= 1}
    onClick={() => onPageChange(currentPage - 1)}
    className="px-2.5 py-1 rounded border border-[#E8E8E8] bg-white text-[#4A4A5A] hover:border-[#3AAFA9] hover:text-[#3AAFA9] disabled:opacity-40 disabled:pointer-events-none transition-colors"
    aria-label="Previous page"
  >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((page, idx, arr) => {
    const prev = arr[idx - 1];
    const isEllipsis = prev && page - prev > 1;
    return <React.Fragment key={page}>
                {isEllipsis && <span className="px-1 text-[#8A8A9A]">…</span>}
                <button
      type="button"
      onClick={() => onPageChange(page)}
      aria-current={currentPage === page ? "page" : void 0}
      className={`w-7 h-7 flex items-center justify-center rounded text-[12px] font-semibold transition-colors ${currentPage === page ? "bg-[#3AAFA9] text-white" : "bg-white border border-[#E8E8E8] text-[#4A4A5A] hover:border-[#3AAFA9]"}`}
    >
                  {page}
                </button>
              </React.Fragment>;
  })}

        <button
    type="button"
    disabled={currentPage >= totalPages}
    onClick={() => onPageChange(currentPage + 1)}
    className="px-2.5 py-1 rounded border border-[#E8E8E8] bg-white text-[#4A4A5A] hover:border-[#3AAFA9] hover:text-[#3AAFA9] disabled:opacity-40 disabled:pointer-events-none transition-colors"
    aria-label="Next page"
  >
          Next
        </button>
      </div>
    </div>;
};
export {
  Pagination
};
