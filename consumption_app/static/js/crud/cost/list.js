function renderData(cost) {
  return `<tr>
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
}

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

fetchData('cost', urlParams.get('page'), urlParams.get('page_size'));