"""Numbers for the overview page, computed from plain rows (no DB, no Flask): easy to test.

consumptions: [{'year', 'month', 'kwh', 'smc'}]
costs:        [{'start': date, 'end': date|None, 'kwh', 'smc', 'kwh_cost', 'smc_cost'}]
              kwh/smc = monthly installment in €, *_cost = unit price.
"""
from datetime import date


def _r(x, nd=2):
    return None if x is None else round(float(x), nd)


def _pct(cur, prev):
    if cur is None or not prev:
        return None
    return round((cur - prev) / prev * 100, 1)


def cost_for_month(costs, year, month, today):
    """Cost period covering the 1st of the month (same rule as the old SQL join)."""
    first = date(year, month, 1)
    best = None
    for c in costs:
        start, end = c['start'], c['end'] or today
        if start and start <= first <= end:
            if best is None or start > best['start']:
                best = c
    return best


def build_dashboard(consumptions, costs, today=None, years_in_chart=4, hdd=None):
    """hdd: optional {(y, m): {'hdd', 'tmean', 'complete'}} from app.weather."""
    today = today or date.today()
    rows = sorted(consumptions, key=lambda r: (r['year'], r['month']))
    by_ym = {(r['year'], r['month']): r for r in rows}
    out = {'last': None, 'ytd': None, 'rate': None, 'years': [], 'monthly': None, 'prices': [], 'yoy': {}, 'rolling': [],
           'weather': bool(hdd), 'seasons': []}
    hdd = hdd or {}
    gg = lambda y, m: hdd[(y, m)]['hdd'] if (y, m) in hdd and hdd[(y, m)]['complete'] else None
    if not rows:
        return out

    # Last recorded month vs same month one year earlier
    last = rows[-1]
    prev = by_ym.get((last['year'] - 1, last['month']))
    out['last'] = {
        'year': last['year'], 'month': last['month'],
        'kwh': _r(last['kwh']), 'smc': _r(last['smc']),
        'prev_kwh': _r(prev['kwh']) if prev else None,
        'prev_smc': _r(prev['smc']) if prev else None,
        'kwh_pct': _pct(last['kwh'], prev['kwh']) if prev else None,
        'smc_pct': _pct(last['smc'], prev['smc']) if prev else None,
    }

    # Year to date vs the same months of the previous year (only months present in both)
    y = last['year']
    months = [r['month'] for r in rows if r['year'] == y]
    pairs = [(by_ym[(y, m)], by_ym.get((y - 1, m))) for m in months]
    both = [(c, p) for c, p in pairs if p]
    kwh = sum(c['kwh'] for c, _ in pairs)
    smc = sum(c['smc'] for c, _ in pairs)
    pk = sum(p['kwh'] for _, p in both) if both else None
    ps = sum(p['smc'] for _, p in both) if both else None
    ck = sum(c['kwh'] for c, _ in both) if both else None
    cs = sum(c['smc'] for c, _ in both) if both else None
    out['ytd'] = {
        'year': y, 'months': len(months), 'first_month': min(months), 'last_month': max(months),
        'kwh': _r(kwh), 'smc': _r(smc),
        'prev_kwh': _r(pk), 'prev_smc': _r(ps),
        'kwh_pct': _pct(ck, pk), 'smc_pct': _pct(cs, ps),
        'compared_months': len(both),
    }

    # Current installment: open period or the latest one still covering today
    current = [c for c in costs if c['start'] and c['start'] <= today and (c['end'] is None or c['end'] >= today)]
    if current:
        c = max(current, key=lambda c: c['start'])
        out['rate'] = {'start': c['start'].isoformat(), 'kwh': _r(c['kwh']), 'smc': _r(c['smc']),
                       'total': _r((c['kwh'] or 0) + (c['smc'] or 0)),
                       'kwh_cost': c['kwh_cost'], 'smc_cost': c['smc_cost']}

    # Yearly totals, newest first; cost = sum of the installments of the recorded months
    for yr in sorted({r['year'] for r in rows}, reverse=True):
        yrows = [r for r in rows if r['year'] == yr]
        cost, costed = 0.0, 0
        for r in yrows:
            c = cost_for_month(costs, yr, r['month'], today)
            if c:
                cost += (c['kwh'] or 0) + (c['smc'] or 0)
                costed += 1
        out['years'].append({'year': yr, 'months': len(yrows),
                             'kwh': _r(sum(r['kwh'] for r in yrows)),
                             'smc': _r(sum(r['smc'] for r in yrows)),
                             'cost': _r(cost) if costed else None, 'costed_months': costed})

    # Month-by-month series for the last N years
    chart_years = sorted({r['year'] for r in rows})[-years_in_chart:]
    out['monthly'] = {
        'years': chart_years,
        'kwh': {str(yr): [_r(by_ym[(yr, m)]['kwh']) if (yr, m) in by_ym else None for m in range(1, 13)] for yr in chart_years},
        'smc': {str(yr): [_r(by_ym[(yr, m)]['smc']) if (yr, m) in by_ym else None for m in range(1, 13)] for yr in chart_years},
    }
    # Price and installment in force for each recorded month (as the old detail charts did)
    for key, field, nd in (('kwh_cost', 'kwh_cost', 4), ('smc_cost', 'smc_cost', 4), ('kwh_bill', 'kwh', 2), ('smc_bill', 'smc', 2)):
        series = {}
        for yr in chart_years:
            vals = []
            for m in range(1, 13):
                c = cost_for_month(costs, yr, m, today) if (yr, m) in by_ym else None
                vals.append(_r(c[field], nd) if c and c[field] is not None else None)
            series[str(yr)] = vals
        out['monthly'][key] = series

    # Year-over-year change per month: (this year − same month a year earlier), for every year that has one
    out['yoy'] = {}
    for yr in sorted({r['year'] for r in rows}):
        if not any((yr - 1, m) in by_ym and (yr, m) in by_ym for m in range(1, 13)):
            continue
        entry = {}
        for key in ('kwh', 'smc'):
            diff, pct, cur, prev = [], [], [], []
            for m in range(1, 13):
                c, p = by_ym.get((yr, m)), by_ym.get((yr - 1, m))
                if c and p:
                    diff.append(_r(c[key] - p[key])); pct.append(_pct(c[key], p[key]))
                    cur.append(_r(c[key])); prev.append(_r(p[key]))
                else:
                    diff.append(None); pct.append(None); cur.append(_r(c[key]) if c else None); prev.append(_r(p[key]) if p else None)
            entry[key] = {'diff': diff, 'pct': pct, 'cur': cur, 'prev': prev}
        if hdd:
            hc = [gg(yr, m) for m in range(1, 13)]
            hp = [gg(yr - 1, m) for m in range(1, 13)]
            entry['hdd'] = {'cur': hc, 'prev': hp,
                            'diff': [_r(c - p, 1) if c is not None and p is not None else None for c, p in zip(hc, hp)],
                            'pct': [_pct(c, p) if c is not None and p is not None else None for c, p in zip(hc, hp)]}
        out['yoy'][str(yr)] = entry

    # Rolling 12 months: sum of the 12 months ending at each month, only when all 12 are recorded
    out['rolling'] = []
    for r in rows:
        y, m = r['year'], r['month']
        window = []
        for k in range(12):
            mm, yy = m - k, y
            while mm < 1:
                mm += 12; yy -= 1
            window.append(by_ym.get((yy, mm)))
        if all(window):
            out['rolling'].append({'year': y, 'month': m,
                                   'kwh': _r(sum(w['kwh'] for w in window)),
                                   'smc': _r(sum(w['smc'] for w in window))})

    # Heating seasons (October → April): gas per degree day, only when all 7 months are known
    if hdd:
        for end_year in sorted({r['year'] for r in rows}):
            months = [(end_year - 1, m) for m in (10, 11, 12)] + [(end_year, m) for m in (1, 2, 3, 4)]
            if all(ym in by_ym and gg(*ym) is not None for ym in months):
                smc = sum(by_ym[ym]['smc'] for ym in months)
                deg = sum(gg(*ym) for ym in months)
                out['seasons'].append({'label': f'{end_year - 1}/{str(end_year)[2:]}', 'end_year': end_year,
                                       'smc': _r(smc), 'hdd': _r(deg, 0), 'smc_per_hdd': _r(smc / deg, 3) if deg else None})
        for prev, cur in zip(out['seasons'], out['seasons'][1:]):
            cur['pct'] = _pct(cur['smc_per_hdd'], prev['smc_per_hdd'])

    out['prices'] = [{'start': c['start'].isoformat(), 'end': c['end'].isoformat() if c['end'] else None,
                      'kwh': _r(c['kwh']), 'smc': _r(c['smc']),
                      'kwh_cost': c['kwh_cost'], 'smc_cost': c['smc_cost']}
                     for c in sorted(costs, key=lambda c: c['start']) if c['start']]
    return out
