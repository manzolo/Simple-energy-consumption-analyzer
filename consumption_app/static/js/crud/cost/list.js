const tableBody = document.getElementById('table-body');
const paginationContainer = document.getElementById('pagination-container');
const urlParams = new URLSearchParams(window.location.search);

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
        if (data.length > 0) {
            // Render table rows
            let html = '';
            data.forEach(cost => {
              html += `<tr>
                         <td>${cost.id}</td>
                         <td>${new Date(cost.start).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                         <td>${cost.end ? new Date(cost.end).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}) : ''}</td>
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
        }
        const paginationHtml = generatePaginationLinks(current_page, total_count, page_size);
        paginationContainer.innerHTML = `<ul class="pagination">${paginationHtml}</ul>`;
        // Return data and response headers
        const result = { data, pagination: response_headers };
        return [result, 200, response_headers];
      });
    });
}

getCosts(urlParams.get('page'),urlParams.get('page_size'));

function exportCost() {
location.href='/cost/export'
}

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
