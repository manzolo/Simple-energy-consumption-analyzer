function renderData(consumption) {
  return `<tr data-id="${consumption.id}">
            <td contenteditable="false">${consumption.id}</td>
            <td contenteditable="false">${consumption.year}</td>
            <td contenteditable="false">${consumption.month}</td>
            <td contenteditable="false">${consumption.kwh}</td>
            <td contenteditable="false">${consumption.smc}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editConsumption(${consumption.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteConsumption(${consumption.id})">Delete</button>
            </td>
          </tr>`;
}

function editConsumption(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const editBtn = row.querySelector('.btn-warning');

  // Change Edit button to Save button
  editBtn.textContent = 'Save';
  editBtn.classList.remove('btn-warning');
  editBtn.classList.add('btn-success');
  editBtn.onclick = saveConsumption;

  // Make cells editable
  const cells = row.querySelectorAll(`td[contenteditable]`);
  cells.forEach(cell => {
    cell.contentEditable = true;
  });
}

async function saveConsumption() {
  const row = this.parentNode.parentNode;
  const id = row.getAttribute('data-id');

  // Disable editing and change Save button back to Edit button
  const cells = row.querySelectorAll('td[contenteditable]');
  cells.forEach(cell => cell.contentEditable = false);

  const saveBtn = row.querySelector('.btn-success');
  saveBtn.textContent = 'Edit';
  saveBtn.classList.remove('btn-success');
  saveBtn.classList.add('btn-warning');
  saveBtn.onclick = () => editConsumption(id);

  // Retrieve updated values from the cells
  const year = row.children[1].textContent;
  const month = row.children[2].textContent;
  const kwh = parseFloat(row.children[3].textContent);
  const smc = parseFloat(row.children[4].textContent);

  // Send updated values to the server
  const response = await fetch(`/consumption/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ year, month, kwh, smc })
  });

  if (response.ok) {
    // Reload the data to update the table
    fetchData('consumption', urlParams.get('page'), urlParams.get('page_size'));
  } else {
    // Display an error message
    alert('Failed to update consumption');
  }
}

function addConsumption() {
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

fetchData('consumption', urlParams.get('page'), urlParams.get('page_size'));
