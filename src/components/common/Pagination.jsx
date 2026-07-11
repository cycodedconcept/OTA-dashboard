function buildVisiblePages(currentPage, lastPage) {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const visiblePages = new Set([1, lastPage, currentPage]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < lastPage) {
      visiblePages.add(page);
    }
  }

  if (currentPage <= 3) {
    visiblePages.add(2);
    visiblePages.add(3);
    visiblePages.add(4);
  }

  if (currentPage >= lastPage - 2) {
    visiblePages.add(lastPage - 1);
    visiblePages.add(lastPage - 2);
    visiblePages.add(lastPage - 3);
  }

  const sortedPages = [...visiblePages]
    .filter((page) => page > 0 && page <= lastPage)
    .sort((leftPage, rightPage) => leftPage - rightPage);
  const pagesWithBreaks = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      pagesWithBreaks.push(`ellipsis-${previousPage}-${page}`);
    }

    pagesWithBreaks.push(page);
  });

  return pagesWithBreaks;
}

function Pagination({
  currentPage,
  isLoading = false,
  lastPage = null,
  onPageChange,
  totalPages = null,
}) {
  const resolvedLastPage = Math.max(lastPage ?? totalPages ?? currentPage ?? 1, 1);
  const resolvedCurrentPage = Math.min(
    Math.max(currentPage ?? 1, 1),
    resolvedLastPage
  );
  const visiblePages = buildVisiblePages(resolvedCurrentPage, resolvedLastPage);

  if (resolvedLastPage <= 1) {
    return null;
  }

  function handlePageChange(nextPage) {
    if (
      isLoading ||
      nextPage === resolvedCurrentPage ||
      nextPage < 1 ||
      nextPage > resolvedLastPage
    ) {
      return;
    }

    onPageChange?.(nextPage);
  }

  return (
    <nav className="table-pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn devices-action-btn table-pagination__button"
        onClick={() => handlePageChange(resolvedCurrentPage - 1)}
        disabled={isLoading || resolvedCurrentPage === 1}
      >
        Previous
      </button>

      <div className="table-pagination__pages">
        {visiblePages.map((page) =>
          typeof page === 'number' ? (
            <button
              key={page}
              type="button"
              className={`btn devices-action-btn table-pagination__button ${
                page === resolvedCurrentPage ? 'is-active' : ''
              }`}
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
              aria-current={page === resolvedCurrentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ) : (
            <span
              key={page}
              className="table-pagination__ellipsis"
              aria-hidden="true"
            >
              …
            </span>
          )
        )}
      </div>

      <button
        type="button"
        className="btn devices-action-btn table-pagination__button"
        onClick={() => handlePageChange(resolvedCurrentPage + 1)}
        disabled={isLoading || resolvedCurrentPage === resolvedLastPage}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
