import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
function DataTable({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No data found",
  emptySubtext = "Try adjusting your search query or filter options.",
  onRowClick,
  pageSize,
  currentPage = 1,
  onPageChange,
  totalItems,
  className = "",
  sortKey,
  sortOrder,
  onSort
}) {
  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }
  let displayData = data;
  if (pageSize && onPageChange === void 0) {
    const start = (currentPage - 1) * pageSize;
    displayData = data.slice(start, start + pageSize);
  }
  const effectiveTotal = totalItems !== void 0 ? totalItems : data.length;
  return <div className={`w-full bg-white rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]/70 overflow-hidden mb-5 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" role="table">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E8E8E8]">
              {columns.map((col) => {
    const isSorted = sortKey === col.key;
    return <th
      key={col.key}
      scope="col"
      onClick={() => col.sortable && onSort && onSort(col.key)}
      className={`text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8A9A] px-4 py-3 select-none ${col.sortable ? "cursor-pointer hover:text-[#1A1A2E]" : ""} ${col.className || ""}`}
    >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && <span className="text-[10px]">
                          {isSorted ? sortOrder === "asc" ? "\u25B2" : "\u25BC" : "\u2195"}
                        </span>}
                    </div>
                  </th>;
  })}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyMessage} description={emptySubtext} />
                </td>
              </tr> : displayData.map((row, index) => {
    const isClickable = !!onRowClick;
    return <tr
      key={keyExtractor(row)}
      onClick={() => onRowClick && onRowClick(row)}
      tabIndex={isClickable ? 0 : void 0}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onRowClick(row);
        }
      }}
      className={`border-b border-[#F5F5F5] last:border-b-0 transition-colors ${isClickable ? "cursor-pointer hover:bg-[#F9FAFB] focus-visible:bg-[#F0FDF4] focus-visible:outline-none" : ""}`}
    >
                    {columns.map((col, cIdx) => <td
      key={col.key}
      className={`px-4 py-3 text-[13px] text-[#4A4A5A] ${cIdx === 0 ? "font-medium text-[#1A1A2E]" : ""} ${col.className || ""}`}
    >
                        {col.render ? col.render(row, index) : row[col.key] ?? "\u2014"}
                      </td>)}
                  </tr>;
  })}
          </tbody>
        </table>
      </div>

      {pageSize && effectiveTotal > pageSize && <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#E8E8E8] flex items-center justify-between">
          <Pagination
    currentPage={currentPage}
    pageSize={pageSize}
    totalItems={effectiveTotal}
    onPageChange={onPageChange || (() => {
    })}
  />
        </div>}
    </div>;
}
export {
  DataTable
};
