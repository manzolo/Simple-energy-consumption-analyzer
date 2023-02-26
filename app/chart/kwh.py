from app.chart.functions import buildChartData


def getKwh(query_data):
    return buildChartData(query_data, "kwh")


def getKwhUnitCost(query_data):
    return buildChartData(query_data, "kwh_unit_cost")


def getKwhMonthCost(query_data):
    return buildChartData(query_data, "kwh_month_cost")
