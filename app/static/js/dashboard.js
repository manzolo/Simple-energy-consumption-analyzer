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
  try { const m = localStorage.getItem('em-chart-mode'); if (m === 'yoy' || m === 'bar') mode = m; } catch (e) {}
  const yoyYears = Object.keys(D.yoy || {}).map(Number).sort((a, b) => b - a);
  let yoyYear = yoyYears[0] ?? null;
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
    if (mode === 'yoy') drawMain();
  }

  function yearAt(chart, evt) {
    const bar = chart.config.type === 'bar';
    const hit = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: bar, axis: bar ? 'x' : 'xy' }, false);
    return hit.length ? chart.data.datasets[hit[0].datasetIndex].year : null;
  }

  function toggleFocus(yr) {
    focusYear = (yr == null || yr === focusYear) ? null : yr;
    if (focusYear != null && yoyYears.includes(focusYear)) yoyYear = focusYear;
    restyleAll();
  }

  // Year-over-year: one bar per month = this year minus the same month a year earlier.
  function drawYoy(id, key, unit) {
    if (charts[id]) { yearCharts.delete(charts[id]); charts[id].destroy(); }
    const E = yoyYear != null ? D.yoy[String(yoyYear)][key] : { diff: [], pct: [], cur: [], prev: [] };
    const good = css('--em-good'), bad = css('--em-bad');
    const colors = E.diff.map((v) => v == null ? 'transparent' : (v <= 0 ? good : bad));
    charts[id] = new Chart(document.getElementById(id), {
      type: 'bar',
      data: { labels: Array.from({ length: 12 }, (_, i) => monthName(i + 1, 'short')),
              datasets: [{ data: E.diff, backgroundColor: colors, hoverBackgroundColor: colors, borderRadius: 4, barPercentage: 0.7 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        plugins: {
          colors: { enabled: false },
          legend: { display: false },
          tooltip: { callbacks: {
            title: (it) => it.length ? monthName(it[0].dataIndex + 1) : '',
            label: (c) => {
              const i = c.dataIndex, d = E.diff[i];
              if (d == null) return null;
              const sign = d > 0 ? '+' : '', p = E.pct[i];
              const lines = [` ${yoyYear}: ${num(E.cur[i])} ${unit}`, ` ${yoyYear - 1}: ${num(E.prev[i])} ${unit}`,
                      ` ${T('variation')}: ${sign}${num(d)} ${unit}${p != null ? ` (${sign}${num(p, 1)}%)` : ''}`];
              const H = key === 'smc' && D.yoy[String(yoyYear)].hdd;
              if (H && H.cur[i] != null && H.prev[i] != null) {
                const hp = H.pct[i];
                lines.push(` ${T('degree_days')}: ${num(H.cur[i], 0)} / ${num(H.prev[i], 0)}${hp != null ? ` (${hp > 0 ? '+' : ''}${num(hp, 1)}%)` : ''}`);
              }
              return lines;
            },
          } },
        },
        scales: axes((v) => (v > 0 ? '+' : '') + num(v, 0), {}),
      },
    });
  }

  // Gas vs cold: % change of gas next to % change of degree days, heating months only (≥ 30 degree days).
  const MIN_HDD = 30;
  const coldYears = yoyYears.filter((y) => D.yoy[String(y)].hdd && D.yoy[String(y)].hdd.cur.some((v, i) => v != null && D.yoy[String(y)].hdd.prev[i] != null));
  let coldYear = coldYears[0] ?? null;

  function pctStr(p) { return p == null ? '–' : `${p > 0 ? '+' : ''}${num(p, 1)}%`; }

  function drawCold() {
    const id = 'coldChart';
    if (!document.getElementById(id)) return;
    if (charts[id]) charts[id].destroy();
    const out = document.getElementById('coldSummary');
    if (coldYear == null) { out.textContent = T('no_cold_months'); return; }
    const G = D.yoy[String(coldYear)].smc, H = D.yoy[String(coldYear)].hdd;
    const ok = (i) => G.cur[i] != null && G.prev[i] != null && H.cur[i] != null && H.prev[i] != null && H.prev[i] >= MIN_HDD && H.cur[i] >= MIN_HDD;
    const gas = G.pct.map((v, i) => ok(i) ? v : null), deg = H.pct.map((v, i) => ok(i) ? v : null);
    const idx = gas.map((v, i) => v != null ? i : -1).filter((i) => i >= 0);
    if (!idx.length) { out.textContent = T('no_cold_months'); return; }
    const sum = (a) => idx.reduce((s, i) => s + a[i], 0);
    const gC = sum(G.cur), gP = sum(G.prev), hC = sum(H.cur), hP = sum(H.prev);
    const gp = (gC - gP) / gP * 100, hp = (hC - hP) / hP * 100, np = ((gC / hC) / (gP / hP) - 1) * 100;
    const verdict = `${pctStr(Math.round(np * 10) / 10)}`;
    out.innerHTML = T('cold_summary', { y: coldYear, p: coldYear - 1, g: `<strong>${pctStr(Math.round(gp * 10) / 10)}</strong>`,
      h: `<strong>${pctStr(Math.round(hp * 10) / 10)}</strong> (${hp >= 0 ? T('cold_colder') : T('cold_milder')})`,
      n: delta(Math.round(np * 10) / 10, verdict) || verdict });
    const smc = css('--em-smc'), cold = css('--em-cold');
    charts[id] = new Chart(document.getElementById(id), {
      type: 'bar',
      data: { labels: Array.from({ length: 12 }, (_, i) => monthName(i + 1, 'short')), datasets: [
        { label: T('gas'), data: gas, backgroundColor: smc, hoverBackgroundColor: smc, borderRadius: 4 },
        { label: T('degree_days'), data: deg, backgroundColor: cold, hoverBackgroundColor: cold, borderRadius: 4 },
      ] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          colors: { enabled: false }, legend: legend(),
          tooltip: { callbacks: {
            title: (it) => it.length ? `${monthName(it[0].dataIndex + 1)} ${coldYear} / ${coldYear - 1}` : '',
            label: (c) => {
              const i = c.dataIndex;
              if (c.parsed.y == null) return null;
              return c.datasetIndex === 0
                ? ` ${T('gas')}: ${num(G.cur[i])} / ${num(G.prev[i])} Smc (${pctStr(c.parsed.y)})`
                : ` ${T('degree_days')}: ${num(H.cur[i], 0)} / ${num(H.prev[i], 0)} (${pctStr(c.parsed.y)})`;
            },
          } },
        },
        scales: axes((v) => (v > 0 ? '+' : '') + num(v, 0) + '%', { yTicks: 5 }),
      },
    });
  }

  function drawSeasons() {
    const id = 'seasonChart';
    if (!document.getElementById(id)) return;
    if (charts[id]) charts[id].destroy();
    const S = D.seasons || [];
    if (!S.length) { document.getElementById(id).parentElement.innerHTML = `<div class="em-empty">${T('no_seasons')}</div>`; return; }
    const smc = css('--em-smc');
    charts[id] = new Chart(document.getElementById(id), {
      type: 'bar',
      data: { labels: S.map((s) => s.label), datasets: [{ data: S.map((s) => s.smc_per_hdd), backgroundColor: smc, hoverBackgroundColor: smc, borderRadius: 4, barPercentage: 0.7 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        plugins: { colors: { enabled: false }, legend: { display: false }, tooltip: { callbacks: {
          label: (c) => {
            const s = S[c.dataIndex];
            const out = [` ${T('smc_per_hdd')}: ${num(s.smc_per_hdd, 3)}`, ` ${T('gas')}: ${num(s.smc, 0)} Smc`, ` ${T('degree_days')}: ${num(s.hdd, 0)}`];
            if (s.pct != null) out.push(` ${pctStr(s.pct)} ${T('vs_prev_season')}`);
            return out;
          },
        } } },
        scales: axes((v) => num(v, 2), { yTicks: 4 }),
      },
    });
  }

  // Rolling 12 months: one line through all the history; flat = stable, rising = consuming more.
  function drawRolling(id, key, colorVar, unit, nowId) {
    if (charts[id]) charts[id].destroy();
    const R = D.rolling || [];
    const el = document.getElementById(nowId);
    if (!R.length) { el.textContent = T('no_rolling'); return; }
    const color = css(colorVar);
    const last = R[R.length - 1];
    const yearAgo = R.find((r) => r.year === last.year - 1 && r.month === last.month);
    const pct = yearAgo ? (last[key] - yearAgo[key]) / yearAgo[key] * 100 : null;
    el.innerHTML = `${T('rolling_now', { v: num(last[key], 0), u: unit })} ${delta(pct != null ? Math.round(pct * 10) / 10 : null, T('rolling_vs'))}`;
    charts[id] = new Chart(document.getElementById(id), {
      type: 'line',
      data: { labels: R.map((r) => `${monthName(r.month, 'short')} ${String(r.year).slice(2)}`),
              datasets: [{ data: R.map((r) => r[key]), borderColor: color, backgroundColor: rgba(color, 0.1), fill: true, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: color, tension: 0.25 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        interaction: { mode: 'index', intersect: false },
        plugins: { colors: { enabled: false }, legend: { display: false }, tooltip: { callbacks: {
          title: (it) => { const r = R[it[0].dataIndex]; return T('rolling_tip', { m: `${monthName(r.month)} ${r.year}` }); },
          label: (c) => ` ${num(c.parsed.y, 0)} ${unit}`,
        } } },
        scales: axes((v) => num(v, 0), { zero: false, x: { maxTicksLimit: 8 }, yTicks: 5 }),
      },
    });
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
    const yoy = mode === 'yoy';
    document.querySelectorAll('.em-yoy-legend').forEach((e) => e.classList.toggle('d-none', !yoy));
    const sel = document.getElementById('yoyYear');
    sel.classList.toggle('d-none', !yoy || !yoyYears.length);
    sel.value = yoyYear;
    document.getElementById('modeHint').textContent = yoy ? T('yoy_hint') : T('focus_hint');
    if (yoy) {
      drawYoy('smcChart', 'smc', 'Smc');
      drawYoy('kwhChart', 'kwh', 'kWh');
    } else {
      drawByYear('smcChart', 'smc', 'Smc', 2, 'bar');
      drawByYear('kwhChart', 'kwh', 'kWh', 2, 'bar');
    }
  }

  function drawDetails() {
    drawByYear('kwhCostChart', 'kwh_cost', '€/kWh', 4, 'bar', { tickDigits: 2, yTicks: 4 });
    drawByYear('smcCostChart', 'smc_cost', '€/Smc', 4, 'bar', { tickDigits: 2, yTicks: 4 });
    drawByYear('kwhBillChart', 'kwh_bill', '', 2, 'bar', { money: true, yTicks: 4 });
    drawByYear('smcBillChart', 'smc_bill', '', 2, 'bar', { money: true, yTicks: 4 });
  }

  function drawAll() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = css('--em-font') || 'system-ui';
    drawMain();
    drawDetails();
    drawCold();
    drawSeasons();
    drawRolling('smcRollChart', 'smc', '--em-smc', 'Smc', 'smcRollNow');
    drawRolling('kwhRollChart', 'kwh', '--em-kwh', 'kWh', 'kwhRollNow');
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
  const coldSel = document.getElementById('coldYear');
  if (coldSel) {
    coldSel.innerHTML = coldYears.map((y) => `<option value="${y}">${esc(T('yoy_vs', { y, p: y - 1 }))}</option>`).join('');
    coldSel.addEventListener('change', () => { coldYear = Number(coldSel.value); drawCold(); });
  }
  const yoySel = document.getElementById('yoyYear');
  yoySel.innerHTML = yoyYears.map((y) => `<option value="${y}">${esc(T('yoy_vs', { y, p: y - 1 }))}</option>`).join('');
  yoySel.addEventListener('change', () => { yoyYear = Number(yoySel.value); drawMain(); });
  renderKpis();
  renderYears();
  drawAll();
})();
