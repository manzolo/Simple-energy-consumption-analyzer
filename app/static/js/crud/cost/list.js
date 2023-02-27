const tableBody = document.getElementById('table-body');
const paginationContainer = document.getElementById('pagination-container');
const urlParams = new URLSearchParams(window.location.search);

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

function getCosts(page, pageSize) {
  fetch(`/cost?page=${page}&page_size=${pageSize}`)
    .then(response => {
      // Get total count from response header
      const total_count = parseInt(response.headers.get('X-Total-Count'));
      const page_size = parseInt(response.headers.get('X-Page-Size'));
      const current_page = parseInt(response.headers.get('X-Current-Page'));
      const total_pages = parseInt(response.headers.get('X-Total-Pages'));

      // Add pagination metadata to response headers
      const response_headers = {
        'X-Total-Count': total_count.toString(),
        'X-Total-Pages': total_pages.toString(),
        'X-Current-Page': current_page.toString(),
        'X-Page-Size': page_size.toString()
      };

      return response.json().then(data => {
        // Render table rows
        let html = '';
        data.forEach(cost => {
          html += `<tr>
                     <td>${cost.id}</td>
                     <td>${cost.start}</td>
                     <td>${cost.end}</td>
                     <td>${cost.kwh}</td>
                     <td>${cost.smc}</td>
                     <td>${cost.kwh_cost}</td>
                     <td>${cost.smc_cost}</td>
                     <td>
                       <button class="btn btn-sm btn-warning" onclick="editCost(${cost.id})">Edit</button>
                       <button class="btn btn-sm btn-danger" onclick="deleteCost(${cost.id})">Delete</button>
                     </td>
                   </tr>`;
        });
        tableBody.innerHTML = html;

        const paginationHtml = generatePaginationLinks(current_page, total_count, page_size);
        paginationContainer.innerHTML = `<ul class="pagination">${paginationHtml}</ul>`;
        // Return data and response headers
        const result = { data, pagination: response_headers };
        return [result, 200, response_headers];
      });
    });
}

getCosts(urlParams.get('page'),urlParams.get('page_size'));

function createCost() {
location.href='/cost/create'
}

function deleteCost(id) {
  const confirmed = confirm("Are you sure you want to delete this record?");
  if (!confirmed) {
    return;
  }
  fetch(`/cost/${id}`, {
    method: 'DELETE',
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      // refresh the table after deletion
      location.reload();
    })
    .catch(error => console.error(error));
}

function editCost(id) {
location.href='/cost/edit/'+id
}
