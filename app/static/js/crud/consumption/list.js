// Readings list: loads every row once, filters client-side, shows decimals as stored.
const LOCALE = window.LOCALE || 'it-IT';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const monthName = (m, style = 'long') => cap(new Intl.DateTimeFormat(LOCALE, { month: style }).format(new Date(2000, m - 1, 1)));
const fmt = (n, d = 2) => Number(n || 0).toLocaleString(LOCALE, { maximumFractionDigits: d, useGrouping: 'always' });
let allData = [];

function renderData(c) {
  return `<tr data-id="${c.id}">
      <td><span class="em-month">${monthName(c.month)} ${c.year}</span> <span class="em-id">#${c.id}</span></td>
      <td class="text-end"><strong>${fmt(c.kwh)}</strong><span class="em-unit">kWh</span></td>
      <td class="text-end"><strong>${fmt(c.smc)}</strong><span class="em-unit">Smc</span></td>
      <td class="text-end text-nowrap">
        <button class="btn-icon" onclick="editConsumption(${c.id})" title="${T('edit')}"><i class="bi bi-pencil"></i></button>
        <button class="btn-icon danger" onclick="deleteConsumption(${c.id})" title="${T('delete')}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
}

function updateStats(data) {
  const k = data.reduce((a, i) => a + (parseFloat(i.kwh) || 0), 0);
  const s = data.reduce((a, i) => a + (parseFloat(i.smc) || 0), 0);
  $('#totalKwh').text(fmt(k, 0));
  $('#totalSmc').text(fmt(s, 0));
  $('#avgKwh').text(data.length ? fmt(k / data.length, 1) : '–');
  $('#avgSmc').text(data.length ? fmt(s / data.length, 1) : '–');
}

function applyFilters() {
  const q = $('#searchInput').val().toLowerCase().trim();
  const y = $('#yearFilter').val();
  const m = $('#monthFilter').val();
  const rows = allData.filter((i) => {
    const text = `${i.id} ${i.year} ${i.month} ${monthName(i.month)} ${i.kwh} ${i.smc} ${fmt(i.kwh)} ${fmt(i.smc)}`.toLowerCase();
    return (!q || text.includes(q)) && (!y || String(i.year) === y) && (!m || String(i.month) === m);
  });
  const tb = $('#table-body').empty();
  if (!rows.length) {
    tb.append(`<tr><td colspan="4" class="em-empty"><i class="bi bi-inbox"></i> ${T('no_readings_found')}</td></tr>`);
  } else {
    tb.append(rows.map(renderData).join(''));
  }
  $('#recordInfo').text(T('n_of_m_readings', { a: rows.length, b: allData.length }));
  updateStats(rows);
}

function clearFilters() {
  $('#searchInput').val(''); $('#yearFilter').val(''); $('#monthFilter').val('');
  applyFilters();
}

function editConsumption(id) { window.location.href = `/consumption/edit/${id}`; }
function addConsumption() { window.location.href = '/consumption/create'; }
function exportConsumption() { window.location.href = '/consumption/export'; }

function deleteConsumption(id) {
  const row = allData.find((r) => r.id === id);
  const label = row ? `${monthName(row.month)} ${row.year}` : `#${id}`;
  if (!confirm(T('confirm_delete_reading', { m: label }))) return;
  showLoading();
  fetch(`/consumption/${id}`, { method: 'DELETE' })
    .then((r) => r.json())
    .then(() => {
      hideLoading();
      allData = allData.filter((r) => r.id !== id);
      applyFilters();
      toast(T('success'), T('reading_deleted', { m: label }), true, 5000, 'success');
    })
    .catch((e) => { hideLoading(); console.error(e); toast(T('error'), T('delete_failed'), true, 5000, 'error'); });
}

$(function () {
  for (let m = 1; m <= 12; m++) $('#monthFilter').append(`<option value="${m}">${monthName(m)}</option>`);
  $('#searchInput').on('input', applyFilters);
  $('#yearFilter, #monthFilter').on('change', applyFilters);
  fetch('/consumption?page=1&page_size=10000')
    .then((r) => r.json())
    .then((data) => {
      allData = data;
      [...new Set(data.map((r) => r.year))].sort((a, b) => b - a)
        .forEach((y) => $('#yearFilter').append(`<option value="${y}">${y}</option>`));
      applyFilters();
    })
    .catch((e) => { console.error(e); toast(T('error'), T('load_failed'), true, 5000, 'error'); });
});
