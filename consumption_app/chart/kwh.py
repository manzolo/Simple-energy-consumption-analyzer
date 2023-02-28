from consumption_app.chart.functions import buildChartData, buildChartYearData


def getKwh(query_data):
    return buildChartData(query_data, "kwh")


def getKwhYear(query_data):
    return buildChartYearData(query_data, "kwh_year")


def getKwhUnitCost(query_data):
    return buildChartData(query_data, "kwh_unit_cost")


def getKwhMonthCost(query_data):
    return buildChartData(query_data, "kwh_month_cost")
