import io

import xlsxwriter
from flask import Response, jsonify, Blueprint

from consumption_app.database.functions import get_db

bp = Blueprint('cost_export', __name__)


@bp.route('/cost/export', methods=['GET'])
def export_all_costs():
    # Get all costs data
    database_connection = get_db()
    cur = database_connection.cursor()

    cur.execute(
        'SELECT id_cost, start, end, kwh, smc, kwh_cost, smc_cost '
        'FROM cost '
        'ORDER BY start desc, end desc '
    )
    rows = cur.fetchall()

    database_connection.close()

    if rows:
        # Create a new workbook and add a worksheet
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet()

        # Add column headers to the worksheet
        headers = ['ID', 'Start', 'End', 'KWH', 'SMC', 'KWH Cost', 'SMC Cost']
        for i, header in enumerate(headers):
            worksheet.write(0, i, header)

        # Write the cost data to the worksheet
        for row_num, row in enumerate(rows):
            for col_num, value in enumerate(row):
                worksheet.write(row_num + 1, col_num, value)

        # Close the workbook and write the output to a BytesIO object
        workbook.close()
        output.seek(0)

        # Set the response headers to indicate that this is an XLS file
        response_headers = {
            'Content-Disposition': 'attachment; filename="costs.xls"',
            'Content-Type': 'application/vnd.ms-excel'
        }

        # Return the XLS file as a response
        return Response(output.read(), headers=response_headers)

    else:
        return jsonify({'error': 'Cost records not found.'}), 404
