// Overview page: KPI tiles, charts per year, yearly table, price steps. Data comes from the server as JSON.
(function () {
  const D = JSON.parse(document.getElementById('dash-data').textContent);
  const LOC = window.LOCALE || 'it-IT';
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const num = (n, d = 2) => n == null ? '–' : Number(n).toLocaleString(LOC, { maximumFractionDigits: d, useGrouping: 'always' });
  const eur = (n) => n == null ? '–' : '€ ' + Number(n).toLocaleString(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthName = (m, style = 'long') => cap(new Intl.DateTimeFormat(LOC, { month: style }).format(new Date(2000, m - 1, 1)));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Each year keeps its own color everywhere (color follows the year, not its rank).
  const yearColor = (yr) => css(`--em-y${((Number(yr) % 4) + 4) % 4}`);

  function delta(pct, vs) {
    if (pct == null) return '';
    const cls = Math.abs(pct) < 1 ? 'flat' : (pct < 0 ? 'down' : 'up');
    const icon = cls === 'flat' ? 'bi-dash' : (pct < 0 ? 'bi-arrow-down-short' : 'bi-arrow-up-short');
    const sign = pct > 0 ? '+' : '';
    return `<span class="em-delta ${cls}" title="${esc(vs)}"><i class="bi ${icon}"></i>${sign}${num(pct, 1)}%</span>`;
  }

  // ---------- KPI tiles ----------
  function renderKpis() {
    const L = D.last, Y = D.ytd, R = D.rate;
    if (!L) {
      document.getElementById('kpis').innerHTML = `<div class="col-12"><div class="em-card em-empty">${T('no_readings')}</div></div>`;
      return;
    }
    const lastName = `${monthName(L.month)} ${L.year}`;
    document.getElementById('lastLabel').textContent = T('last_reading', { m: lastName });

    const tile = (dot, title, value, unit, prev, pct) => `
      <div class="em-kpi-label"><span class="em-dot ${dot}"></span> ${esc(title)} · ${esc(lastName)}</div>
      <div class="em-kpi-value num">${num(value)}<small>${unit}</small></div>
      <div class="em-kpi-foot">${prev != null
        ? `${delta(pct, `${monthName(L.month)} ${L.year - 1}`)} ${T('vs_in', { v: num(prev), u: unit, y: L.year - 1 })}`
        : T('no_same_month')}</div>`;
    document.getElementById('kpiKwh').innerHTML = tile('kwh', T('electricity'), L.kwh, 'kWh', L.prev_kwh, L.kwh_pct);
    document.getElementById('kpiSmc').innerHTML = tile('smc', T('gas'), L.smc, 'Smc', L.prev_smc, L.smc_pct);

    const span = Y.first_month === Y.last_month ? monthName(Y.first_month, 'short') : `${monthName(Y.first_month, 'short')}–${monthName(Y.last_month, 'short')}`;
    const same = T('same_months', { y: Y.year - 1 });
    document.getElementById('kpiYtd').innerHTML = `
      <div class="em-kpi-label"><span class="em-dot acc"></span> ${esc(T('so_far', { y: Y.year, span }))}</div>
      <div class="em-kpi-rows num">
        <div class="em-kpi-row"><span class="em-dot kwh"></span><strong>${num(Y.kwh, 0)}</strong><span class="text-muted">kWh</span>${delta(Y.kwh_pct, same)}</div>
        <div class="em-kpi-row"><span class="em-dot smc"></span><strong>${num(Y.smc, 0)}</strong><span class="text-muted">Smc</span>${delta(Y.smc_pct, same)}</div>
      </div>
      <div class="em-kpi-foot">${T('vs_same_months', { n: Y.compared_months, y: Y.year - 1 })}</div>`;

    document.getElementById('kpiRate').innerHTML = R ? `
      <div class="em-kpi-label"><i class="bi bi-receipt"></i> ${T('installments')}</div>
      <div class="em-kpi-value num">${eur(R.total)}</div>
      <div class="em-kpi-rows num small">
        <div class="em-kpi-row"><span class="em-dot kwh"></span>${eur(R.kwh)} <span class="text-muted">${T('electricity').toLowerCase()}</span></div>
        <div class="em-kpi-row"><span class="em-dot smc"></span>${eur(R.smc)} <span class="text-muted">${T('gas').toLowerCase()}</span></div>
      </div>
      <div class="em-kpi-foot">${T('since', { d: new Date(R.start).toLocaleDateString(LOC, { day: 'numeric', month: 'short', year: 'numeric' }) })}</div>`
      : `<div class="em-kpi-label"><i class="bi bi-receipt"></i> ${T('installments')}</div><div class="em-kpi-foot">${T('no_rate')}</div>`;
  }

  // ---------- Year table ----------
  function renderYears() {
    const tb = document.querySelector('#yearsTable tbody');
    const maxK = Math.max(...D.years.map((y) => y.kwh), 1);
    const maxS = Math.max(...D.years.map((y) => y.smc), 1);
    tb.innerHTML = D.years.map((y) => `
      <tr>
        <td><strong>${y.year}</strong>${y.months < 12 ? `<div class="small text-muted">${y.months} ${T('months')}</div>` : ''}</td>
        <td>${num(y.kwh, 0)} <span class="em-unit">kWh</span><div class="em-bar kwh"><span style="width:${(y.kwh / maxK * 100).toFixed(1)}%"></span></div></td>
        <td>${num(y.smc, 0)} <span class="em-unit">Smc</span><div class="em-bar smc"><span style="width:${(y.smc / maxS * 100).toFixed(1)}%"></span></div></td>
        <td class="r">${y.cost != null ? eur(y.cost) : '<span class="text-muted">–</span>'}${y.cost != null && y.costed_months < y.months ? `<div class="small text-muted">${T('of_months', { a: y.costed_months, b: y.months })}</div>` : ''}</td>
      </tr>`).join('') || `<tr><td colspan="4" class="em-empty">${T('no_data')}</td></tr>`;
  }

  // ---------- Charts ----------
  let mode = 'bar';
  try { const m = localStorage.getItem('em-chart-mode'); if (m === 'line' || m === 'bar') mode = m; } catch (e) {}
  const charts = {};

  function rgba(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function axes(fmtY, opts = {}) {
    const grid = css('--em-border'), muted = css('--em-muted');
    return {
      x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxRotation: 0, autoSkip: true, ...(opts.x || {}) } },
      y: { beginAtZero: opts.zero !== false, grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: opts.yTicks || 6, callback: fmtY } },
    };
  }

  function legend() {
    return { position: 'bottom', labels: { color: css('--em-muted'), usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 14, sort: (a, b) => a.text.localeCompare(b.text) } };
  }

  // One series per year, each in its own color. One year is emphasized: the hovered one, else the
  // clicked (locked) one, else the current year. Clicking a bar/point or a legend entry locks a year
  // across every month-by-month chart; clicking it again, or on empty space, unlocks.
  let focusYear = null;
  const yearCharts = new Set();

  function emphasized(chart) {
    return chart.$hoverYear ?? focusYear ?? chart.$newest;
  }

  function paint(datasets, bar, emph, locked) {
    datasets.forEach((ds) => {
      const c = yearColor(ds.year), strong = ds.year === emph;
      const fade = locked ? 0.16 : 0.38;
      ds.backgroundColor = bar ? (strong ? c : rgba(c, fade)) : rgba(c, 0.15);
      ds.borderColor = strong ? c : rgba(c, locked ? 0.22 : 0.55);
      ds.borderWidth = bar ? 0 : (strong ? 4 : 1.75);
      ds.pointRadius = bar ? 0 : (strong ? 4.5 : 0);
      ds.pointBackgroundColor = c;
      ds.hoverBackgroundColor = ds.backgroundColor;
      ds.hoverBorderColor = ds.borderColor;
      ds.order = bar ? 0 : (strong ? 0 : 1);
    });
  }

  function styleYears(chart) {
    paint(chart.data.datasets, chart.config.type === 'bar', emphasized(chart), chart.$hoverYear != null || focusYear != null);
  }

  function restyleAll() {
    yearCharts.forEach((ch) => { styleYears(ch); ch.update(); });
  }

  function yearAt(chart, evt) {
    const bar = chart.config.type === 'bar';
    const hit = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: bar, axis: bar ? 'x' : 'xy' }, false);
    return hit.length ? chart.data.datasets[hit[0].datasetIndex].year : null;
  }

  function toggleFocus(yr) {
    focusYear = (yr == null || yr === focusYear) ? null : yr;
    restyleAll();
  }

  function drawByYear(id, key, unit, digits, chartMode, extra = {}) {
    if (charts[id]) { yearCharts.delete(charts[id]); charts[id].destroy(); }
    const years = D.monthly ? D.monthly.years : [];
    const newest = years[years.length - 1];
    const surface = css('--em-surface');
    const bar = chartMode === 'bar';
    const datasets = years.map((yr) => ({
      year: yr, label: yr === newest ? `${yr} · ${T('in_progress')}` : String(yr), data: D.monthly[key][yr],
      pointHoverRadius: 6, pointBorderColor: surface, pointBorderWidth: 2,
      tension: 0.3, spanGaps: false, borderRadius: 4,
      stepped: bar ? false : (extra.stepped || false),
      barPercentage: 0.9, categoryPercentage: 0.82,
    }));
    paint(datasets, bar, focusYear ?? newest, focusYear != null);
    const lg = legend();
    lg.onClick = (e, item) => toggleFocus(datasets[item.datasetIndex].year);
    lg.onHover = (e) => { e.native.target.style.cursor = 'pointer'; };
    lg.onLeave = (e) => { e.native.target.style.cursor = ''; };
    const chart = new Chart(document.getElementById(id), {
      type: chartMode,
      data: { labels: Array.from({ length: 12 }, (_, i) => monthName(i + 1, 'short')), datasets },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        interaction: { mode: 'index', intersect: false },
        onHover: (evt, _els, ch) => {
          const yr = yearAt(ch, evt);
          ch.canvas.style.cursor = yr != null ? 'pointer' : '';
          if (yr !== ch.$hoverYear) { ch.$hoverYear = yr; styleYears(ch); ch.update(); }
        },
        onClick: (evt, _els, ch) => toggleFocus(yearAt(ch, evt)),
        plugins: {
          colors: { enabled: false },
          legend: lg,
          tooltip: {
            itemSort: (a, b) => b.dataset.year - a.dataset.year,
            callbacks: {
              title: (items) => items.length ? monthName(items[0].dataIndex + 1) : '',
              label: (c) => c.parsed.y == null ? null : ` ${c.dataset.year}: ${extra.money ? '€ ' : ''}${num(c.parsed.y, digits)}${unit ? ' ' + unit : ''}`,
            },
          },
        },
        scales: axes((v) => num(v, extra.tickDigits ?? 0), { zero: bar ? true : extra.zero, yTicks: extra.yTicks }),
      },
    });
    chart.$newest = newest;
    chart.$hoverYear = null;
    chart.canvas.addEventListener('mouseleave', () => {
      if (chart.$hoverYear != null) { chart.$hoverYear = null; styleYears(chart); chart.update(); }
    });
    styleYears(chart);
    chart.update('none');
    yearCharts.add(chart);
    charts[id] = chart;
  }

  function drawYearTotals(id, key, colorVar, unit) {
    if (charts[id]) charts[id].destroy();
    const ys = D.years.slice().reverse();
    const color = css(colorVar);
    charts[id] = new Chart(document.getElementById(id), {
      type: 'bar',
      data: { labels: ys.map((y) => String(y.year)), datasets: [{ data: ys.map((y) => y[key]), backgroundColor: ys.map((y) => y.months < 12 ? rgba(color, 0.4) : color), borderRadius: 4, barPercentage: 0.7 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        plugins: { legend: { display: false }, tooltip: { callbacks: {
          label: (c) => { const y = ys[c.dataIndex]; return ` ${num(c.parsed.y, 0)} ${unit}${y.months < 12 ? ` (${y.months} ${T('months')})` : ''}`; },
        } } },
        scales: axes((v) => num(v, 0), { yTicks: 4 }),
      },
    });
  }

  function drawPrices(id, key, colorVar, unit) {
    if (charts[id]) charts[id].destroy();
    const color = css(colorVar);
    const P = D.prices.filter((p) => p[key] != null);
    const labels = P.map((p) => new Date(p.start).toLocaleDateString(LOC, { month: 'short', year: '2-digit' }));
    charts[id] = new Chart(document.getElementById(id), {
      type: 'line',
      data: { labels, datasets: [{ data: P.map((p) => p[key]), stepped: 'before', borderColor: color, backgroundColor: rgba(color, 0.12), fill: true, borderWidth: 2, pointRadius: 3, pointBackgroundColor: color }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        plugins: { legend: { display: false }, tooltip: { callbacks: {
          title: (it) => { const p = P[it[0].dataIndex]; return `${p.start} → ${p.end || T('now')}`; },
          label: (c) => ` ${num(c.parsed.y, 4)} ${unit}`,
        } } },
        scales: axes((v) => num(v, 2), { x: { maxTicksLimit: 6 }, yTicks: 4 }),
      },
    });
  }

  function drawMain() {
    drawByYear('smcChart', 'smc', 'Smc', 2, mode);
    drawByYear('kwhChart', 'kwh', 'kWh', 2, mode);
    drawByYear('kwhCostChart', 'kwh_cost', '€/kWh', 4, mode, { stepped: 'middle', zero: false, tickDigits: 2, yTicks: 4 });
    drawByYear('smcCostChart', 'smc_cost', '€/Smc', 4, mode, { stepped: 'middle', zero: false, tickDigits: 2, yTicks: 4 });
    drawByYear('kwhBillChart', 'kwh_bill', '', 2, mode, { money: true, yTicks: 4 });
    drawByYear('smcBillChart', 'smc_bill', '', 2, mode, { money: true, yTicks: 4 });
  }

  function drawAll() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = css('--em-font') || 'system-ui';
    drawMain();
    drawYearTotals('kwhYearChart', 'kwh', '--em-kwh', 'kWh');
    drawYearTotals('smcYearChart', 'smc', '--em-smc', 'Smc');
    drawPrices('kwhPriceChart', 'kwh_cost', '--em-kwh', '€/kWh');
    drawPrices('smcPriceChart', 'smc_cost', '--em-smc', '€/Smc');
  }

  document.querySelectorAll('#chartMode button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#chartMode button').forEach((x) => x.classList.toggle('active', x === b));
    mode = b.dataset.mode;
    try { localStorage.setItem('em-chart-mode', mode); } catch (e) {}
    drawMain();
  }));
  document.addEventListener('em-theme', drawAll);

  document.querySelectorAll('#chartMode button').forEach((x) => x.classList.toggle('active', x.dataset.mode === mode));
  renderKpis();
  renderYears();
  drawAll();
})();
