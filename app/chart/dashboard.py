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


def build_dashboard(consumptions, costs, today=None, years_in_chart=4):
    today = today or date.today()
    rows = sorted(consumptions, key=lambda r: (r['year'], r['month']))
    by_ym = {(r['year'], r['month']): r for r in rows}
    out = {'last': None, 'ytd': None, 'rate': None, 'years': [], 'monthly': None, 'prices': []}
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

    out['prices'] = [{'start': c['start'].isoformat(), 'end': c['end'].isoformat() if c['end'] else None,
                      'kwh': _r(c['kwh']), 'smc': _r(c['smc']),
                      'kwh_cost': c['kwh_cost'], 'smc_cost': c['smc_cost']}
                     for c in sorted(costs, key=lambda c: c['start']) if c['start']]
    return out
