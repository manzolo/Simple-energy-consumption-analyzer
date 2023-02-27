import io

import xlsxwriter
from flask import Response, jsonify, Blueprint

from app.database.functions import get_db

bp = Blueprint('consumption_export', __name__)


@bp.route('/consumption/export', methods=['GET'])
def export_xls():
    # Get all consumption records
    database_connection = get_db()
    cur = database_connection.cursor()
    cur.execute('SELECT * FROM consumption')
    rows = cur.fetchall()
    database_connection.close()

    if rows:

        # Create an in-memory Excel workbook and worksheet
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet()

        # Write headers
        worksheet.write(0, 0, 'ID')
        worksheet.write(0, 1, 'Year')
        worksheet.write(0, 2, 'Month')
        worksheet.write(0, 3, 'kWh')
        worksheet.write(0, 4, 'SMC')

        # Write data
        for i, row in enumerate(rows):
            worksheet.write(i + 1, 0, row[0])
            worksheet.write(i + 1, 1, row[1])
            worksheet.write(i + 1, 2, row[2])
            worksheet.write(i + 1, 3, row[3])
            worksheet.write(i + 1, 4, row[4])

        # Close the workbook
        workbook.close()

        # Set response headers for downloading the file
        response_headers = {
            'Content-Disposition': 'attachment; filename="consumptions.xlsx"',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }

        # Return the Excel file as a Flask response
        output.seek(0)
        return Response(output, headers=response_headers)

    else:

        return jsonify({'error': 'Cost records not found.'}), 404
