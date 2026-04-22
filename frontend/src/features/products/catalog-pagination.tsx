'use client';

type CatalogPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="cursor-pointer rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-45"
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
        (page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`cursor-pointer h-11 min-w-11 rounded-full px-4 text-sm font-semibold transition ${
              page === currentPage
                ? 'bg-foreground text-background'
                : 'border border-border bg-white text-foreground hover:border-accent'
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="cursor-pointer rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-45"
      >
        Next
      </button>
    </div>
  );
}
