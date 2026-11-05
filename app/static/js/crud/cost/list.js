// Prices page: price periods, current values, stepped price charts.
const LOC = window.LOCALE || 'it-IT';
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const eur = (n, d = 2) => n == null ? '–' : '€ ' + Number(n).toLocaleString(LOC, { minimumFractionDigits: d, maximumFractionDigits: Math.max(d, 4), useGrouping: 'always' });
const price = (n) => n == null ? '–' : Number(n).toLocaleString(LOC, { minimumFractionDigits: 3, maximumFractionDigits: 4 });
const dshort = (s) => s ? new Date(s).toLocaleDateString(LOC, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
let allData = [];
const charts = {};

function renderData(c) {
  return `<tr data-id="${c.id}">
      <td>${dshort(c.start)} <span class="em-id">#${c.id}</span></td>
      <td>${c.end ? dshort(c.end) : `<span class="em-delta down">${T('current')}</span>`}</td>
      <td class="text-end"><strong>${eur(c.kwh)}</strong></td>
      <td class="text-end"><strong>${eur(c.smc)}</strong></td>
      <td class="text-end">${price(c.kwh_cost)}</td>
      <td class="text-end">${price(c.smc_cost)}</td>
      <td class="text-end text-nowrap">
        <button class="btn-icon" onclick="editCost(${c.id})" title="${T('edit')}"><i class="bi bi-pencil"></i></button>
        <button class="btn-icon danger" onclick="deleteCost(${c.id})" title="${T('delete')}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
}

function drawPrice(id, key, colorVar, unit) {
  if (charts[id]) charts[id].destroy();
  const color = css(colorVar), grid = css('--em-border'), muted = css('--em-muted');
  const P = [...allData].filter((p) => p[key] != null).sort((a, b) => a.start.localeCompare(b.start));
  charts[id] = new Chart(document.getElementById(id), {
    type: 'line',
    data: {
      labels: P.map((p) => new Date(p.start).toLocaleDateString(LOC, { month: 'short', year: '2-digit' })),
      datasets: [{ data: P.map((p) => p[key]), stepped: 'before', borderColor: color, backgroundColor: color + '22', fill: true, borderWidth: 2, pointRadius: 3, pointBackgroundColor: color }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        title: (it) => { const p = P[it[0].dataIndex]; return `${dshort(p.start)} → ${p.end ? dshort(p.end) : T('now')}`; },
        label: (c) => ` ${price(c.parsed.y)} ${unit}`,
      } } },
      scales: {
        x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
        y: { grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 5, callback: (v) => price(v) } },
      },
    },
  });
}

function updateStats(data) {
  $('#recordCount').text(data.length);
  if (!data.length) return;
  const sorted = [...data].sort((a, b) => a.start.localeCompare(b.start));
  $('#periodSpan').text(`${new Date(sorted[0].start).getFullYear()} – ${sorted[sorted.length - 1].end ? new Date(sorted[sorted.length - 1].end).getFullYear() : T('now')}`);
  const cur = data.find((i) => !i.end) || sorted[sorted.length - 1];
  $('#currentKwhPrice').text(price(cur.kwh_cost));
  $('#currentSmcPrice').text(price(cur.smc_cost));
  $('#currentRate').text(eur((cur.kwh || 0) + (cur.smc || 0)));
  $('#currentRateSplit').text(`${T('electricity')} ${eur(cur.kwh)} · ${T('gas')} ${eur(cur.smc)}`);
  const stats = (k) => { const v = data.map((i) => parseFloat(i[k])).filter((x) => !isNaN(x)); return [Math.max(...v), Math.min(...v), v.reduce((a, b) => a + b, 0) / v.length]; };
  const [kM, km, ka] = stats('kwh_cost'), [sM, sm, sa] = stats('smc_cost');
  $('#maxKwhPrice').text(price(kM)); $('#minKwhPrice').text(price(km)); $('#avgKwhPrice').text(price(ka));
  $('#maxSmcPrice').text(price(sM)); $('#minSmcPrice').text(price(sm)); $('#avgSmcPrice').text(price(sa));
  drawCharts();
}

function drawCharts() {
  if (typeof Chart === 'undefined' || !allData.length) return;
  drawPrice('kwhPriceChart', 'kwh_cost', '--em-kwh', '€/kWh');
  drawPrice('smcPriceChart', 'smc_cost', '--em-smc', '€/Smc');
}

function render() {
  const tb = $('#table-body').empty();
  tb.append(allData.length ? allData.map(renderData).join('') : `<tr><td colspan="7" class="em-empty"><i class="bi bi-inbox"></i> ${T('no_data')}</td></tr>`);
  $('#recordInfo').text(T('n_periods', { n: allData.length }));
  updateStats(allData);
}

function editCost(id) { window.location.href = `/cost/edit/${id}`; }
function addCost() { window.location.href = '/cost/create'; }
function exportCost() { window.location.href = '/cost/export'; }

function deleteCost(id) {
  const row = allData.find((r) => r.id === id);
  if (!confirm(T('confirm_delete_period', { d: row ? dshort(row.start) : `#${id}` }))) return;
  showLoading();
  fetch(`/cost/${id}`, { method: 'DELETE' })
    .then((r) => r.json())
    .then(() => { hideLoading(); allData = allData.filter((r) => r.id !== id); render(); toast(T('success'), T('period_deleted'), true, 5000, 'success'); })
    .catch((e) => { hideLoading(); console.error(e); toast(T('error'), T('delete_failed'), true, 5000, 'error'); });
}

document.addEventListener('em-theme', drawCharts);
$(function () {
  fetch('/cost?page=1&page_size=10000')
    .then((r) => r.json())
    .then((data) => { allData = data; render(); })
    .catch((e) => { console.error(e); toast(T('error'), T('load_failed'), true, 5000, 'error'); });
});
