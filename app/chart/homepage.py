from flask import Blueprint, render_template
from sqlalchemy import func, cast, String, Date
from datetime import datetime
from app import db
from app.models import Consumption, Cost
from app.chart.kwh import getKwh, getKwhYear, getKwhUnitCost, getKwhMonthCost
from app.chart.smc import getSmc, getSmcYear, getSmcUnitCost, getSmcMonthCost

bp = Blueprint('home', __name__)


@bp.route('/')
def index():
    # Data limite: ultimi 3 anni
    three_years_ago = datetime.now().year - 3
    
    # Query complessa che replica la logica SQL originale
    # JOIN tra consumption e cost basato su date range
    # FIX: Cast esplicito della stringa concatenata a DATE per PostgreSQL
    query_data = db.session.query(
        Consumption.year,
        Consumption.month,
        cast(Consumption.kwh, db.Integer).label('kwh'),
        cast(Consumption.smc, db.Integer).label('smc'),
        cast(Cost.kwh, db.Integer).label('kwh_month_cost'),
        cast(Cost.smc, db.Integer).label('smc_month_cost'),
        Cost.kwh_cost.label('kwh_unit_cost'),
        Cost.smc_cost.label('smc_unit_cost'),
        Consumption.id_consumption.label('id')
    ).outerjoin(
        Cost,
        db.and_(
            # Crea la data dal consumption (year-month-01) e casta a DATE
            cast(
                func.concat(
                    cast(Consumption.year, String),
                    '-',
                    func.lpad(cast(Consumption.month, String), 2, '0'),
                    '-01'
                ),
                Date  # Cast esplicito a DATE per PostgreSQL
            ).between(
                Cost.start,
                func.coalesce(Cost.end, func.current_date())
            )
        )
    ).filter(
        Consumption.year >= three_years_ago
    ).order_by(
        Consumption.year.desc(),
        Consumption.month.desc()
    ).all()
    
    kwh_data = getKwh(query_data)
    smc_data = getSmc(query_data)
    kwh_unit_data = getKwhUnitCost(query_data)
    smc_unit_data = getSmcUnitCost(query_data)
    kwh_month_data = getKwhMonthCost(query_data)
    smc_month_data = getSmcMonthCost(query_data)

    return render_template('chart.html',
                           kwh_data=kwh_data, 
                           smc_data=smc_data,
                           kwh_unit_data=kwh_unit_data, 
                           smc_unit_data=smc_unit_data,
                           kwh_month_data=kwh_month_data, 
                           smc_month_data=smc_month_data)


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