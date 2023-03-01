function generatePaginationLinks(currentPage, totalRecords, pageSize) {
  const totalPages = Math.ceil(totalRecords / pageSize);
  let html = '';

  // Generate previous button
  if (currentPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="?page=${currentPage - 1}&page_size=${pageSize}">Prev</a></li>`;
  } else {
    html += `<li class="page-item disabled"><span class="page-link">Prev</span></li>`;
  }

  // Generate numbered page links
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
    } else {
      html += `<li class="page-item"><a class="page-link" href="?page=${i}&page_size=${pageSize}">${i}</a></li>`;
    }
  }

  // Generate next button
  if (currentPage < totalPages) {
    html += `<li class="page-item"><a class="page-link" href="?page=${currentPage + 1}&page_size=${pageSize}">Next</a></li>`;
  } else {
    html += `<li class="page-item disabled"><span class="page-link">Next</span></li>`;
  }

  return html;
}