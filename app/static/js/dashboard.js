// Overview page: KPI tiles, monthly charts, yearly table, price steps. Data comes from the server as JSON.
(function () {
  const D = JSON.parse(document.getElementById('dash-data').textContent);
  const LOCALE = navigator.language || 'it-IT';
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const num = (n, d = 2) => n == null ? '–' : Number(n).toLocaleString('it-IT', { maximumFractionDigits: d, useGrouping: 'always' });
  const eur = (n) => n == null ? '–' : '€ ' + Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthName = (m, style = 'long') => cap(new Intl.DateTimeFormat(LOCALE, { month: style }).format(new Date(2000, m - 1, 1)));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function delta(pct, vs) {
    if (pct == null) return '';
    const cls = Math.abs(pct) < 1 ? 'flat' : (pct < 0 ? 'down' : 'up');
    const sign = pct > 0 ? '+' : '';
    return `<span class="em-delta ${cls}" title="vs ${esc(vs)}">${sign}${num(pct, 1)}%</span>`;
  }

  // ---------- KPI tiles ----------
  function renderKpis() {
    const L = D.last, Y = D.ytd, R = D.rate;
    if (!L) {
      document.getElementById('kpis').innerHTML = '<div class="col-12"><div class="em-card em-empty">No readings yet.</div></div>';
      return;
    }
    const lastName = `${monthName(L.month)} ${L.year}`;
    const prevName = `${monthName(L.month)} ${L.year - 1}`;
    document.getElementById('lastLabel').textContent = `Last reading: ${lastName}`;

    document.getElementById('kpiKwh').innerHTML = `
      <div class="em-kpi-label"><span class="em-dot kwh"></span> Electricity · ${esc(lastName)}</div>
      <div class="em-kpi-value num">${num(L.kwh)}<small>kWh</small></div>
      <div class="em-kpi-foot">${L.prev_kwh != null ? `${delta(L.kwh_pct, prevName)} vs ${num(L.prev_kwh)} kWh in ${L.year - 1}` : 'No data for the same month last year'}</div>`;

    document.getElementById('kpiSmc').innerHTML = `
      <div class="em-kpi-label"><span class="em-dot smc"></span> Gas · ${esc(lastName)}</div>
      <div class="em-kpi-value num">${num(L.smc)}<small>Smc</small></div>
      <div class="em-kpi-foot">${L.prev_smc != null ? `${delta(L.smc_pct, prevName)} vs ${num(L.prev_smc)} Smc in ${L.year - 1}` : 'No data for the same month last year'}</div>`;

    const span = Y.first_month === Y.last_month ? monthName(Y.first_month, 'short') : `${monthName(Y.first_month, 'short')}–${monthName(Y.last_month, 'short')}`;
    document.getElementById('kpiYtd').innerHTML = `
      <div class="em-kpi-label"><span class="em-dot acc"></span> ${Y.year} so far · ${esc(span)}</div>
      <div class="em-kpi-rows num">
        <div class="em-kpi-row"><span class="em-dot kwh"></span><strong>${num(Y.kwh, 0)}</strong><span class="text-muted">kWh</span>${delta(Y.kwh_pct, 'same months ' + (Y.year - 1))}</div>
        <div class="em-kpi-row"><span class="em-dot smc"></span><strong>${num(Y.smc, 0)}</strong><span class="text-muted">Smc</span>${delta(Y.smc_pct, 'same months ' + (Y.year - 1))}</div>
      </div>
      <div class="em-kpi-foot">vs the same ${Y.compared_months} months of ${Y.year - 1}</div>`;

    document.getElementById('kpiRate').innerHTML = R ? `
      <div class="em-kpi-label"><i class="bi bi-receipt"></i> Monthly installments</div>
      <div class="em-kpi-value num">${eur(R.total)}</div>
      <div class="em-kpi-rows num small">
        <div class="em-kpi-row"><span class="em-dot kwh"></span>${eur(R.kwh)} <span class="text-muted">electricity</span></div>
        <div class="em-kpi-row"><span class="em-dot smc"></span>${eur(R.smc)} <span class="text-muted">gas</span></div>
      </div>
      <div class="em-kpi-foot">since ${new Date(R.start).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })}</div>`
      : `<div class="em-kpi-label"><i class="bi bi-receipt"></i> Monthly installments</div><div class="em-kpi-foot">No current price period</div>`;
  }

  // ---------- Year table ----------
  function renderYears() {
    const tb = document.querySelector('#yearsTable tbody');
    const full = D.years.filter((y) => y.months === 12);
    const maxK = Math.max(...D.years.map((y) => y.kwh), 1);
    const maxS = Math.max(...D.years.map((y) => y.smc), 1);
    tb.innerHTML = D.years.map((y) => `
      <tr>
        <td><strong>${y.year}</strong>${y.months < 12 ? `<div class="small text-muted">${y.months} months</div>` : ''}</td>
        <td>${num(y.kwh, 0)} <span class="em-unit">kWh</span><div class="em-bar kwh"><span style="width:${(y.kwh / maxK * 100).toFixed(1)}%"></span></div></td>
        <td>${num(y.smc, 0)} <span class="em-unit">Smc</span><div class="em-bar smc"><span style="width:${(y.smc / maxS * 100).toFixed(1)}%"></span></div></td>
        <td class="r">${y.cost != null ? eur(y.cost) : '<span class="text-muted">–</span>'}${y.cost != null && y.costed_months < y.months ? `<div class="small text-muted">${y.costed_months} of ${y.months} months</div>` : ''}</td>
      </tr>`).join('') || '<tr><td colspan="4" class="em-empty">No data</td></tr>';
    void full;
  }

  // ---------- Charts ----------
  let mode = 'line';
  const charts = {};
  const ALPHAS = [1, 0.5, 0.3, 0.18];

  function rgba(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function baseOptions(unit) {
    const grid = css('--em-border'), muted = css('--em-muted');
    return {
      responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { color: muted, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 14 } },
        tooltip: {
          callbacks: {
            title: (items) => items.length ? monthName(items[0].dataIndex + 1) : '',
            label: (c) => c.parsed.y == null ? null : ` ${c.dataset.label}: ${num(c.parsed.y)} ${unit}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: true, grid: { color: grid }, border: { display: false }, ticks: { color: muted, callback: (v) => num(v, 0) } },
      },
    };
  }

  function drawMonthly(id, key, colorVar, unit) {
    if (charts[id]) charts[id].destroy();
    const color = css(colorVar);
    const years = D.monthly ? D.monthly.years.slice().reverse() : []; // newest first → strongest color
    const datasets = years.map((yr, i) => {
      const a = ALPHAS[Math.min(i, ALPHAS.length - 1)];
      return {
        label: String(yr), data: D.monthly[key][yr], order: i,
        borderColor: rgba(color, a), backgroundColor: rgba(color, mode === 'bar' ? a : a * 0.12),
        borderWidth: i === 0 ? 2.5 : 1.5, pointRadius: i === 0 ? 3 : 0, pointHoverRadius: 4,
        pointBackgroundColor: rgba(color, a), tension: 0.35, spanGaps: false,
        borderRadius: 3, fill: false,
      };
    }).reverse();
    charts[id] = new Chart(document.getElementById(id), {
      type: mode,
      data: { labels: Array.from({ length: 12 }, (_, i) => monthName(i + 1, 'short')), datasets },
      options: baseOptions(unit),
    });
  }

  function drawPrices(id, key, colorVar, unit) {
    if (charts[id]) charts[id].destroy();
    const color = css(colorVar), grid = css('--em-border'), muted = css('--em-muted');
    const P = D.prices.filter((p) => p[key] != null);
    const labels = P.map((p) => new Date(p.start).toLocaleDateString(LOCALE, { month: 'short', year: '2-digit' }));
    charts[id] = new Chart(document.getElementById(id), {
      type: 'line',
      data: { labels, datasets: [{ data: P.map((p) => p[key]), stepped: 'before', borderColor: color, backgroundColor: rgba(color, 0.12), fill: true, borderWidth: 2, pointRadius: 2.5, pointBackgroundColor: color }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            title: (it) => { const p = P[it[0].dataIndex]; return `${p.start} → ${p.end || 'now'}`; },
            label: (c) => ` ${num(c.parsed.y, 4)} ${unit}`,
          } },
        },
        scales: {
          x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
          y: { grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 4, callback: (v) => num(v, 2) } },
        },
      },
    });
  }

  function drawAll() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = css('--em-font') || 'system-ui';
    drawMonthly('smcChart', 'smc', '--em-smc', 'Smc');
    drawMonthly('kwhChart', 'kwh', '--em-kwh', 'kWh');
    drawPrices('kwhPriceChart', 'kwh_cost', '--em-kwh', '€/kWh');
    drawPrices('smcPriceChart', 'smc_cost', '--em-smc', '€/Smc');
  }

  document.querySelectorAll('#chartMode button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#chartMode button').forEach((x) => x.classList.toggle('active', x === b));
    mode = b.dataset.mode;
    drawMonthly('smcChart', 'smc', '--em-smc', 'Smc');
    drawMonthly('kwhChart', 'kwh', '--em-kwh', 'kWh');
  }));
  document.addEventListener('em-theme', drawAll);

  renderKpis();
  renderYears();
  drawAll();
})();
