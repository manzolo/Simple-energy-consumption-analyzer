function renderData(cost) {
  return `<tr data-id="${cost.id}">
            <td>${cost.id}</td>
            <td contenteditable="false">${new Date(cost.start).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
            <td contenteditable="false">${cost.end ? new Date(cost.end).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}) : ''}</td>
            <td contenteditable="false">${cost.kwh}</td>
            <td contenteditable="false">${cost.smc}</td>
            <td contenteditable="false">${cost.kwh_cost}</td>
            <td contenteditable="false">${cost.smc_cost}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editCost(${cost.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCost(${cost.id})">Delete</button>
            </td>
          </tr>`;
}

function editCost(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const editBtn = row.querySelector('.btn-warning');

  // Change Edit button to Save button
  editBtn.textContent = 'Save';
  editBtn.classList.remove('btn-warning');
  editBtn.classList.add('btn-success');
  editBtn.onclick = saveCost;

  // Make cells editable
  const cells = row.querySelectorAll(`td[contenteditable]`);
  cells.forEach(cell => {
    cell.contentEditable = true;
  });
}

async function saveCost() {
  const row = this.parentNode.parentNode;
  const id = row.getAttribute('data-id');

  // Disable editing and change Save button back to Edit button
  const cells = row.querySelectorAll('td[contenteditable]');
  cells.forEach(cell => cell.contentEditable = false);

  const saveBtn = row.querySelector('.btn-success');
  saveBtn.textContent = 'Edit';
  saveBtn.classList.remove('btn-success');
  saveBtn.classList.add('btn-warning');
  saveBtn.onclick = () => editCost(id);

  // Retrieve updated values from the cells
  const start = new Date(row.children[1].textContent.split('/').reverse().join('/'));
  const end = row.children[2].textContent ? new Date(row.children[2].textContent.split('/').reverse().join('/')) : null;
  const kwh = parseFloat(row.children[3].textContent);
  const smc = parseFloat(row.children[4].textContent);
  const kwh_cost = parseFloat(row.children[5].textContent);
  const smc_cost = parseFloat(row.children[6].textContent);

  // Send updated values to the server
  const response = await fetch(`/cost/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ start, end, kwh, smc, kwh_cost, smc_cost })
  });

  if (response.ok) {
    // Reload the data to update the table
    fetchData('cost', urlParams.get('page'), urlParams.get('page_size'));
  } else {
    // Display an error message
    alert('Failed to update cost');
  }
}

function exportCost() {
location.href='/cost/export'
}

function addCost() {
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
      // refresh the table after deletion
      fetchData('cost', urlParams.get('page'), urlParams.get('page_size'));
      //location.reload();
    })
    .catch(error => console.error(error));
}

fetchData('cost', urlParams.get('page'), urlParams.get('page_size'));