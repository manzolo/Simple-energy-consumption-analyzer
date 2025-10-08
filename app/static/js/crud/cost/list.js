function renderData(cost) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '<span class="badge bg-secondary">Ongoing</span>';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'});
  };
  
  return `<tr data-id="${cost.id}" class="cost-row">
            <td><span class="badge bg-secondary">${cost.id}</span></td>
            <td contenteditable="false">
              <i class="bi bi-calendar-check"></i> ${formatDate(cost.start)}
            </td>
            <td contenteditable="false">
              ${cost.end ? '<i class="bi bi-calendar-x"></i> ' + formatDate(cost.end) : '<span class="badge bg-info">Current</span>'}
            </td>
            <td contenteditable="false" class="text-end">
              <strong>€ ${parseFloat(cost.kwh).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
            </td>
            <td contenteditable="false" class="text-end">
              <strong>€ ${parseFloat(cost.smc).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
            </td>
            <td contenteditable="false" class="text-end">
              <strong>€ ${parseFloat(cost.kwh_cost).toLocaleString('it-IT', {minimumFractionDigits: 3, maximumFractionDigits: 3})}</strong>
              <small class="text-muted">/kWh</small>
            </td>
            <td contenteditable="false" class="text-end">
              <strong>€ ${parseFloat(cost.smc_cost).toLocaleString('it-IT', {minimumFractionDigits: 3, maximumFractionDigits: 3})}</strong>
              <small class="text-muted">/Smc</small>
            </td>
            <td class="text-center">
              <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-warning" onclick="editCost(${cost.id})" 
                        data-bs-toggle="tooltip" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteCost(${cost.id})"
                        data-bs-toggle="tooltip" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>`;
}

function editCost(id) {
  window.location.href = `/cost/edit/${id}`;
}

function addCost() {
  window.location.href = '/cost/create';
}

function exportCost() {
  showLoading();
  window.location.href = '/cost/export';
  setTimeout(hideLoading, 2000);
}

function deleteCost(id) {
  if (!confirm("⚠️ Are you sure you want to delete this record?\n\nThis action cannot be undone.")) {
    return;
  }
  
  showLoading();
  
  fetch(`/cost/${id}`, {
    method: 'DELETE',
  })
    .then(response => response.json())
    .then(data => {
      hideLoading();
      toast('Success', `Record #${id} deleted successfully`, true);
      setTimeout(() => location.reload(), 1500);
    })
    .catch(error => {
      hideLoading();
      console.error(error);
      toast('Error', 'Failed to delete record', true);
    });
}