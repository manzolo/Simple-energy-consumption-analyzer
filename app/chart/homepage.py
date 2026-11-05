from flask import Blueprint, render_template
from sqlalchemy import func, cast, String, Date
from datetime import datetime
from app import db
from app.models import Consumption, Cost
from app.chart.kwh import getKwh, getKwhYear, getKwhUnitCost, getKwhMonthCost
from app.chart.smc import getSmc, getSmcYear, getSmcUnitCost, getSmcMonthCost
from app.chart.dashboard import build_dashboard
from app.weather import monthly_hdd

bp = Blueprint('home', __name__)


@bp.route('/')
def index():
    consumptions = [{'year': c.year, 'month': c.month, 'kwh': c.kwh, 'smc': c.smc}
                    for c in Consumption.query.all()]
    costs = [{'start': c.start, 'end': c.end, 'kwh': c.kwh, 'smc': c.smc,
              'kwh_cost': c.kwh_cost, 'smc_cost': c.smc_cost}
             for c in Cost.query.all()]
    first_year = min((c['year'] for c in consumptions), default=datetime.now().year)
    hdd = monthly_hdd(first_year)
    return render_template('chart.html', dashboard=build_dashboard(consumptions, costs, hdd=hdd))


@bp.route('/year')
def year_index():
    # Data limite: ultimi 3 anni
    three_years_ago = datetime.now().year - 3
    
    # Query annuale con somme
    query_data = db.session.query(
        Consumption.year,
        cast(func.sum(Consumption.kwh), db.Integer).label('kwh_year'),
        cast(func.sum(Consumption.smc), db.Integer).label('smc_year')
    ).filter(
        Consumption.year >= three_years_ago
    ).group_by(
        Consumption.year
    ).order_by(
        Consumption.year.desc()
    ).all()

    kwh_data = getKwhYear(query_data)
    smc_data = getSmcYear(query_data)

    return render_template('chart_year.html',
                           kwh_data=kwh_data,
                           smc_data=smc_data)