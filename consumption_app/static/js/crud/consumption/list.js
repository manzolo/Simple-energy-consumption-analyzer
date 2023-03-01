const tableBody = document.getElementById('table-body');
const paginationContainer = document.getElementById('pagination-container');
const urlParams = new URLSearchParams(window.location.search);

function getConsumptions(page, pageSize) {
  fetch(`/consumption?page=${page}&page_size=${pageSize}`)
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
            data.forEach(consumption => {
              html += `<tr>
                         <td>${consumption.id}</td>
                         <td>${consumption.year}</td>
                         <td>${consumption.month}</td>
                         <td>${consumption.kwh}</td>
                         <td>${consumption.smc}</td>
                         <td>
                           <button class="btn btn-sm btn-warning" onclick="editConsumption(${consumption.id})">Edit</button>
                           <button class="btn btn-sm btn-danger" onclick="deleteConsumption(${consumption.id})">Delete</button>
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

getConsumptions(urlParams.get('page'),urlParams.get('page_size'));

function createConsumption() {
location.href='/consumption/create'
}

function exportConsumption() {
location.href='/consumption/export'
}

function deleteConsumption(id) {
  const confirmed = confirm("Are you sure you want to delete this record?");
  if (!confirmed) {
    return;
  }
  fetch(`/consumption/${id}`, {
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

function editConsumption(id) {
location.href='/consumption/edit/'+id
}
