"""Known input → expected output for the overview numbers (python -m unittest)."""
import unittest
from datetime import date

from app.chart.dashboard import build_dashboard, cost_for_month

C = [  # (year, month, kwh, smc) — real values from the NeN bills
    (2025, 8, 238, 9), (2025, 9, 280, 13), (2025, 10, 327, 23),
    (2026, 1, 304, 297), (2026, 8, 296, 7.88), (2026, 9, 276, 10.84),
]
CONS = [{'year': y, 'month': m, 'kwh': k, 'smc': s} for y, m, k, s in C]
COSTS = [
    {'start': date(2024, 10, 31), 'end': date(2025, 10, 30), 'kwh': 99.64, 'smc': 107.34, 'kwh_cost': 0.136, 'smc_cost': 0.49},
    {'start': date(2025, 10, 31), 'end': date(2026, 10, 30), 'kwh': 102.97, 'smc': 134.53, 'kwh_cost': 0.124, 'smc_cost': 0.44},
    {'start': date(2026, 10, 31), 'end': None, 'kwh': 86.91, 'smc': 122.05, 'kwh_cost': 0.124, 'smc_cost': 0.46},
]
TODAY = date(2026, 11, 5)


class Dashboard(unittest.TestCase):
    def setUp(self):
        self.d = build_dashboard(CONS, COSTS, today=TODAY)

    def test_decimals_are_kept(self):
        self.assertEqual(self.d['last']['smc'], 10.84)
        self.assertEqual(self.d['monthly']['smc']['2026'][7], 7.88)

    def test_last_month_vs_same_month_last_year(self):
        L = self.d['last']
        self.assertEqual((L['year'], L['month'], L['kwh']), (2026, 9, 276))
        self.assertEqual((L['prev_kwh'], L['prev_smc']), (280, 13))
        self.assertEqual(L['kwh_pct'], -1.4)
        self.assertEqual(L['smc_pct'], -16.6)

    def test_ytd_compares_only_months_present_in_both_years(self):
        Y = self.d['ytd']
        self.assertEqual((Y['months'], Y['first_month'], Y['last_month']), (3, 1, 9))
        self.assertEqual(Y['kwh'], 876)            # 304 + 296 + 276
        self.assertEqual(Y['compared_months'], 2)  # Aug, Sep (no Jan 2025 here)
        self.assertEqual(Y['prev_kwh'], 518)       # 238 + 280
        self.assertEqual(Y['kwh_pct'], round((572 - 518) / 518 * 100, 1))

    def test_current_rate_is_the_open_period(self):
        R = self.d['rate']
        self.assertEqual((R['kwh'], R['smc'], R['total']), (86.91, 122.05, 208.96))

    def test_cost_period_for_a_month(self):
        self.assertEqual(cost_for_month(COSTS, 2025, 10, TODAY)['kwh'], 99.64)   # Oct 1st 2025 → old period
        self.assertEqual(cost_for_month(COSTS, 2025, 11, TODAY)['kwh'], 102.97)
        self.assertIsNone(cost_for_month(COSTS, 2020, 1, TODAY))

    def test_yearly_totals_and_cost(self):
        y26, y25 = self.d['years']
        self.assertEqual((y26['year'], y26['months'], y26['kwh'], y26['smc']), (2026, 3, 876, 315.72))
        self.assertEqual(y26['cost'], round(3 * (102.97 + 134.53), 2))
        self.assertEqual(y25['cost'], round(3 * (99.64 + 107.34), 2))

    def test_chart_has_twelve_slots_and_gaps(self):
        k = self.d['monthly']['kwh']['2026']
        self.assertEqual(len(k), 12)
        self.assertIsNone(k[1])
        self.assertEqual(k[0], 304)

    def test_monthly_price_and_installment_follow_the_period(self):
        M = self.d['monthly']
        self.assertEqual(M['kwh_bill']['2026'][8], 102.97)    # Sep 2026 → period 2025-10-31..2026-10-30
        self.assertEqual(M['smc_cost']['2025'][9], 0.49)      # Oct 2025 (1st) → period ending 2025-10-30
        self.assertEqual(M['kwh_cost']['2025'][10], None)     # Nov 2025 has no reading here
        self.assertIsNone(M['smc_bill']['2026'][1])           # Feb 2026: no reading

    def test_yoy_change_per_month(self):
        g = self.d['yoy']['2026']['smc']
        self.assertEqual(g['diff'][8], -2.16)       # Sep: 10.84 − 13
        self.assertEqual(g['pct'][8], -16.6)
        self.assertEqual(g['diff'][7], -1.12)       # Aug: 7.88 − 9
        self.assertIsNone(g['diff'][0])             # Jan 2025 missing → no change
        self.assertEqual(g['cur'][0], 297)          # but the value is still there
        self.assertEqual(self.d['yoy']['2026']['kwh']['diff'][8], -4)
        self.assertNotIn('2025', self.d['yoy'])     # no 2024 months to compare with

    def test_rolling_twelve_months_needs_a_full_window(self):
        self.assertEqual(self.d['rolling'], [])     # the sample never has 12 months in a row
        full = [{'year': 2025, 'month': m, 'kwh': 100, 'smc': 10} for m in range(1, 13)]
        full += [{'year': 2026, 'month': 1, 'kwh': 130, 'smc': 40}, {'year': 2026, 'month': 3, 'kwh': 1, 'smc': 1}]
        r = build_dashboard(full, [], today=TODAY)['rolling']
        self.assertEqual([(x['year'], x['month']) for x in r], [(2025, 12), (2026, 1)])  # Mar 2026: Feb missing
        self.assertEqual((r[0]['kwh'], r[0]['smc']), (1200, 120))
        self.assertEqual((r[1]['kwh'], r[1]['smc']), (1230, 150))                         # Jan 2025 out, Jan 2026 in

    def test_empty(self):
        d = build_dashboard([], [], today=TODAY)
        self.assertIsNone(d['last'])
        self.assertEqual(d['years'], [])


if __name__ == '__main__':
    unittest.main()
