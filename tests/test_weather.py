"""Degree days from daily temperatures, and how the dashboard uses them (no network)."""
import os
import unittest
from datetime import date
from unittest import mock

from app import weather
from app.chart.dashboard import build_dashboard


class DegreeDays(unittest.TestCase):
    def test_sum_of_positive_gaps_below_20(self):
        days = ['2026-02-01', '2026-02-02', '2026-02-03']
        h = weather.hdd_by_month(days, [5.0, 21.5, None])        # 15 + 0, the None day is skipped
        self.assertEqual(h[(2026, 2)]['hdd'], 15.0)
        self.assertEqual(h[(2026, 2)]['tmean'], 13.2)             # (5 + 21.5) / 2 = 13.25
        self.assertEqual(h[(2026, 2)]['days'], 2)
        self.assertFalse(h[(2026, 2)]['complete'])

    def test_complete_month(self):
        days = [f'2025-11-{d:02d}' for d in range(1, 31)]
        h = weather.hdd_by_month(days, [10.0] * 30)
        self.assertEqual(h[(2025, 11)]['hdd'], 300.0)
        self.assertTrue(h[(2025, 11)]['complete'])

    def test_off_without_coordinates(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(weather.monthly_hdd(2020))

    def test_network_error_does_not_break(self):
        weather._cache.clear()
        with mock.patch.dict(os.environ, {'WEATHER_LAT': '44', 'WEATHER_LON': '11'}), \
             mock.patch.object(weather, '_fetch', side_effect=OSError('offline')):
            self.assertIsNone(weather.monthly_hdd(2020, today=date(2026, 11, 5)))


def full(y, m, v):
    return {'hdd': v, 'tmean': 0, 'days': 30, 'complete': True}


class DashboardWithWeather(unittest.TestCase):
    def setUp(self):
        cons = []
        for y in (2024, 2025):
            for m in range(1, 13):
                cons.append({'year': y, 'month': m, 'kwh': 100, 'smc': 100 if y == 2024 else 120})
        hdd = {(y, m): full(y, m, 400 if y == 2024 else 500) for y in (2023, 2024, 2025) for m in range(1, 13)}
        hdd[(2025, 12)] = {'hdd': 50, 'tmean': 0, 'days': 10, 'complete': False}
        self.d = build_dashboard(cons, [], today=date(2026, 1, 10), hdd=hdd)

    def test_yoy_degree_days(self):
        h = self.d['yoy']['2025']['hdd']
        self.assertEqual((h['cur'][0], h['prev'][0], h['diff'][0], h['pct'][0]), (500, 400, 100, 25.0))
        self.assertIsNone(h['cur'][11])                           # incomplete month is not compared

    def test_season_gas_per_degree_day(self):
        s = self.d['seasons']
        self.assertEqual([x['label'] for x in s], ['2024/25'])    # 2023/24 lacks Oct–Dec 2023 readings
        self.assertEqual(s[0]['smc'], 3 * 100 + 4 * 120)
        self.assertEqual(s[0]['hdd'], 3 * 400 + 4 * 500)
        self.assertEqual(s[0]['smc_per_hdd'], round(780 / 3200, 3))

    def test_weather_off(self):
        d = build_dashboard([{'year': 2025, 'month': 1, 'kwh': 1, 'smc': 1}], [], today=date(2026, 1, 1))
        self.assertFalse(d['weather'])
        self.assertEqual(d['seasons'], [])
