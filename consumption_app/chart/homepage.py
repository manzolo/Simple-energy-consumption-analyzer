from flask import Blueprint, render_template

from consumption_app.chart.kwh import getKwh, getKwhUnitCost, getKwhMonthCost
from consumption_app.chart.smc import getSmc, getSmcUnitCost, getSmcMonthCost
from consumption_app.database.functions import get_db
from consumption_app.database.queries import get_consumption_query

bp = Blueprint('home', __name__)


@bp.route('/')
def index():
    # Connect to the database
    conn = get_db()
    c = conn.cursor()

    # Execute the query to retrieve the data
    query = get_consumption_query()
    c.execute(query)
    query_data = c.fetchall()
    # pprint(query_data)
    # Close the database connection
    conn.close()
    # Convert the data table to a DataTable object
    # pprint(query_data)
    kwh_data = getKwh(query_data)
    smc_data = getSmc(query_data)
    kwh_unit_data = getKwhUnitCost(query_data)
    smc_unit_data = getSmcUnitCost(query_data)
    kwh_month_data = getKwhMonthCost(query_data)
    smc_month_data = getSmcMonthCost(query_data)

    # pprint(data_list)
    return render_template('chart.html',
                           kwh_data=kwh_data, smc_data=smc_data,
                           kwh_unit_data=kwh_unit_data, smc_unit_data=smc_unit_data,
                           kwh_month_data=kwh_month_data, smc_month_data=smc_month_data,
                           )
