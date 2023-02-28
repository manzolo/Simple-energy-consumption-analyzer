SELECT c.year, c.month, CAST(c.kwh AS INT) Kwh, CAST(c.smc AS INT) Smc,
       CAST(cost.kwh AS INT) kwh_month_cost, CAST(cost.smc AS INT) smc_month_cost,
       cost.kwh_cost kwh_unit_cost, cost.smc_cost smc_unit_cost, c.id_consumption id
FROM consumption c
LEFT JOIN cost ON c.year || '-' || printf('%02d', c.month) || '-01' BETWEEN cost.start AND COALESCE(cost.end, date('now'))
WHERE c.year >= strftime('%Y', date('now', '-3 years'))
ORDER BY YEAR DESC, MONTH DESC;
