import json

from consumption_app.date.functions import getMonthName


def getChartSettingsByType(type):
    data = {
        'kwh': {"query_index": 2, "data_title": "Kwh", "data_format": "0", "chart_title": "Consumo mensile Kwh"},
        'smc': {"query_index": 3, "data_title": "Smc", "data_format": "0", "chart_title": "Consumo mensile Smc"},
        'kwh_year': {"query_index": 1, "data_title": "Kwh", "data_format": "0", "chart_title": "Consumo annuale Kwh"},
        'smc_year': {"query_index": 2, "data_title": "Smc", "data_format": "0", "chart_title": "Consumo annuale Smc"},
        'kwh_month_cost': {"query_index": 4, "data_title": "Kwh month cost", "data_format": "0",
                           "chart_title": "Bolletta mensile Kwh"},
        'smc_month_cost': {"query_index": 5, "data_title": "Smc month cost", "data_format": "0",
                           "chart_title": "Bolletta mensile Smc"},
        'kwh_unit_cost': {"query_index": 6, "data_title": "Kwh unit cost", "data_format": "0.000",
                          "chart_title": "Costo mensile al Kwh"},
        'smc_unit_cost': {"query_index": 7, "data_title": "Smc unit cost", "data_format": "0.000",
                          "chart_title": "Costo mensile a Smc"},
    }
    return data.get(type)


def buildChartData(query_data, data_chart_type):
    # Build the data dictionary
    data = {}
    column_index = getChartSettingsByType(data_chart_type).get("query_index")
    chart_title = getChartSettingsByType(data_chart_type).get("chart_title")
    data_title = getChartSettingsByType(data_chart_type).get("data_title")
    data_format = getChartSettingsByType(data_chart_type).get("data_format")

    for row in query_data:
        year = row[0]
        month = row[1]
        value = row[column_index]
        if month not in data:
            data[month] = {}
        data[month][year] = value

    # Build the data table for the Google Chart
    header_row = ['Month'] + [year for year in sorted(set([str(row[0]) for row in query_data]))]
    chart_data = [header_row]
    for month in sorted(data.keys()):
        row = [getMonthName(month)]
        for year in sorted(set([row[0] for row in query_data])):
            if year in data[month]:
                row.append(data[month][year])
            else:
                row.append(None)
        chart_data.append(row)

    # Convert the data to JSON format
    chart_data = {
        'header': header_row,
        'body': chart_data[1:],
        'chart_title': chart_title,
        'data_title': data_title,
        'data_format': data_format

    }
    json_data = json.dumps(chart_data)

    return json_data


def buildChartYearData(query_data, data_chart_type):
    # Build the data dictionary
    column_index = getChartSettingsByType(data_chart_type).get("query_index")
    chart_title = getChartSettingsByType(data_chart_type).get("chart_title")
    data_title = getChartSettingsByType(data_chart_type).get("data_title")
    data_format = getChartSettingsByType(data_chart_type).get("data_format")

    # Build the data table for the Google Chart
    # year for year in sorted(set([str(row[0]) for row in query_data]))
    header_row = ['Year', data_title]
    body_row = []
    for row in query_data:
        body_row.append([str(row[0]), float(row[column_index])])

    # Convert the data to JSON format
    chart_data = {
        'header': header_row,
        'body': body_row,
        'chart_title': chart_title,
        'data_title': data_title,
        'data_format': data_format
    }
    json_data = json.dumps(chart_data)

    return json_data
