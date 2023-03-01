function renderData(consumption) {
  return `<tr>
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
}

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
      //console.log(data);
      // refresh the table after deletion
      location.reload();
    })
    .catch(error => console.error(error));
}

function editConsumption(id) {
location.href='/consumption/edit/'+id
}

fetchData('consumption', urlParams.get('page'), urlParams.get('page_size'));