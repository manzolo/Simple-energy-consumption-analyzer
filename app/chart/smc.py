from app.chart.functions import buildChartData, buildChartYearData


def getSmc(query_data):
    return buildChartData(query_data, "smc")


def getSmcYear(query_data):
    return buildChartYearData(query_data, "smc_year")


def getSmcUnitCost(query_data):
    return buildChartData(query_data, "smc_unit_cost")


def getSmcMonthCost(query_data):
    return buildChartData(query_data, "smc_month_cost")
