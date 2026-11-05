"""Heating degree days (gradi giorno) per month from Open-Meteo's free historical archive.

Coordinates come from WEATHER_LAT / WEATHER_LON (the .env, never in git). Without them the
feature is simply off. Results are cached in memory for 12 hours; on a network error the last
good result (or nothing) is returned, so the page never breaks because of the weather.
"""
import calendar
import json
import os
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta

BASE_TEMP = 20.0          # Italian standard (DPR 412/93): sum of (20 °C − daily mean) when positive
ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'
TTL = 12 * 3600
_cache = {}


def coordinates():
    try:
        lat, lon = float(os.environ['WEATHER_LAT']), float(os.environ['WEATHER_LON'])
    except (KeyError, ValueError):
        return None
    return lat, lon


def hdd_by_month(days, temps, base=BASE_TEMP):
    """days: ['YYYY-MM-DD', …], temps: [°C or None] → {(y, m): {'hdd', 'tmean', 'days', 'complete'}}."""
    acc = {}
    for d, t in zip(days, temps):
        if t is None:
            continue
        y, m = int(d[:4]), int(d[5:7])
        a = acc.setdefault((y, m), {'hdd': 0.0, 'tsum': 0.0, 'days': 0})
        a['hdd'] += max(0.0, base - t)
        a['tsum'] += t
        a['days'] += 1
    return {k: {'hdd': round(a['hdd'], 1), 'tmean': round(a['tsum'] / a['days'], 1), 'days': a['days'],
                'complete': a['days'] == calendar.monthrange(*k)[1]}
            for k, a in acc.items()}


def _fetch(lat, lon, start, end):
    q = urllib.parse.urlencode({'latitude': lat, 'longitude': lon, 'start_date': start.isoformat(),
                                'end_date': end.isoformat(), 'daily': 'temperature_2m_mean', 'timezone': 'Europe/Rome'})
    with urllib.request.urlopen(f'{ARCHIVE_URL}?{q}', timeout=10) as r:
        d = json.load(r)['daily']
    return d['time'], d['temperature_2m_mean']


def monthly_hdd(first_year, today=None):
    """{(y, m): {...}} from January of first_year to a few days ago, or None if off/unavailable."""
    coords = coordinates()
    if not coords:
        return None
    today = today or date.today()
    start, end = date(first_year, 1, 1), today - timedelta(days=6)   # the archive lags a few days
    key = (coords, start, end)
    hit = _cache.get('hdd')
    if hit and hit['key'] == key and time.time() - hit['at'] < TTL:
        return hit['data']
    try:
        data = hdd_by_month(*_fetch(*coords, start, end))
    except Exception:
        return hit['data'] if hit else None
    _cache['hdd'] = {'key': key, 'at': time.time(), 'data': data}
    return data
