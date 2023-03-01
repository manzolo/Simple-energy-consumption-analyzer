const tableBody = document.getElementById('table-body');
const paginationContainer = document.getElementById('pagination-container');
const urlParams = new URLSearchParams(window.location.search);

async function fetchData(endpoint, page = 1, pageSize = 10) {
  const [data, status, headers] = await getData(endpoint, renderData, page, pageSize);
}

function fetchData(endpoint, page = 1, pageSize = 10) {
  page = page ?? 1;
  pageSize = pageSize ?? 10;
  getData(endpoint, renderData, page, pageSize);
}

async function getData(endpoint, renderFunction, page, pageSize) {
  const response = await fetch(`/${endpoint}?page=${page}&page_size=${pageSize}`);

  const total_count = parseInt(response.headers.get('X-Total-Count'));
  const page_size = parseInt(response.headers.get('X-Page-Size'));
  const current_page = parseInt(response.headers.get('X-Current-Page'));
  const total_pages = parseInt(response.headers.get('X-Total-Pages'));

  const response_headers = {
    'X-Total-Count': total_count.toString(),
    'X-Total-Pages': total_pages.toString(),
    'X-Current-Page': current_page.toString(),
    'X-Page-Size': page_size.toString()
  };

  const data = await response.json();

  if (data.length > 0) {
    const renderedData = data.map(item => renderFunction(item)).join('');
    tableBody.innerHTML = renderedData;
  }

  const paginationHtml = generatePaginationLinks(current_page, total_count, page_size);
  paginationContainer.innerHTML = `<ul class="pagination">${paginationHtml}</ul>`;

  const result = { data, pagination: response_headers };
  return [result, 200, response_headers];
}

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