from consumption_app.chart.functions import buildChartData


def getSmc(query_data):
    return buildChartData(query_data, "smc")


def getSmcUnitCost(query_data):
    return buildChartData(query_data, "smc_unit_cost")


def getSmcMonthCost(query_data):
    return buildChartData(query_data, "smc_month_cost")
