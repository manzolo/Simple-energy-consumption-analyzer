SELECT c.year, SUM(CAST(c.kwh AS INT)) Kwh, SUM(CAST(c.smc AS INT)) Smc
FROM consumption c
WHERE c.year >= strftime('%Y', date('now', '-3 years'))
GROUP BY c.year
ORDER BY c.year DESC;
