function renderData(consumption) {
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `<tr data-id="${consumption.id}" class="consumption-row">
            <td><span class="badge bg-secondary">${consumption.id}</span></td>
            <td contenteditable="false">
              <strong>${consumption.year}</strong>
            </td>
            <td contenteditable="false">
              <span class="badge bg-info">${monthNames[consumption.month]}</span>
              <small class="text-muted">(${consumption.month})</small>
            </td>
            <td contenteditable="false" class="text-end">
              <strong>${parseFloat(consumption.kwh).toLocaleString('it-IT', {maximumFractionDigits: 0})}</strong>
              <small class="text-muted">kWh</small>
            </td>
            <td contenteditable="false" class="text-end">
              <strong>${parseFloat(consumption.smc).toLocaleString('it-IT', {maximumFractionDigits: 0})}</strong>
              <small class="text-muted">Smc</small>
            </td>
            <td class="text-center">
              <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-warning" onclick="editConsumption(${consumption.id})" 
                        data-bs-toggle="tooltip" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteConsumption(${consumption.id})"
                        data-bs-toggle="tooltip" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>`;
}

function editConsumption(id) {
  window.location.href = `/consumption/edit/${id}`;
}

function addConsumption() {
  window.location.href = '/consumption/create';
}

function exportConsumption() {
  showLoading();
  window.location.href = '/consumption/export';
  setTimeout(hideLoading, 2000);
}

function deleteConsumption(id) {
  if (!confirm("⚠️ Are you sure you want to delete this record?\n\nThis action cannot be undone.")) {
    return;
  }
  
  showLoading();
  
  fetch(`/consumption/${id}`, {
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

// Override fetchData to include stats update
fetchData = function(endpoint, page = 1, pageSize = 10) {
  page = page ?? 1;
  pageSize = pageSize ?? 10;
  
  showLoading();
  
  // Fetch ALL data for statistics (not paginated)
  fetch(`/${endpoint}?page=1&page_size=10000`)
    .then(response => response.json())
    .then(allData => {
      if (allData && allData.length > 0) {
        updateStats(allData);
      }
    })
    .catch(error => console.error('Error loading stats:', error));
  
  // Fetch paginated data for table
  getData(endpoint, renderData, page, pageSize).then(([result, status, headers]) => {
    hideLoading();
    
    // Update record info
    const totalCount = parseInt(headers['X-Total-Count']);
    const currentPage = parseInt(headers['X-Current-Page']);
    const pageSizeNum = parseInt(headers['X-Page-Size']);
    const start = (currentPage - 1) * pageSizeNum + 1;
    const end = Math.min(currentPage * pageSizeNum, totalCount);
    
    $('#recordInfo').text(`Showing ${start}-${end} of ${totalCount} records`);
    
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
  }).catch(error => {
    hideLoading();
    toast('Error', 'Failed to load data', true);
  });
};

fetchData('consumption', urlParams.get('page'), urlParams.get('page_size'));