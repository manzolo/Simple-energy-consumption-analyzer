import io
from datetime import datetime

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
        headers = ['ID', 'Start', 'End', 'KWH Bill (€)', 'SMC Bill (€)', 'KWH Cost (€/kWh)', 'SMC Cost (€/Smc)']
        for i, header in enumerate(headers):
            worksheet.write(0, i, header)

        # Create date format
        date_format = workbook.add_format({'num_format': 'dd/mm/yyyy'})

        # Write the cost data to the worksheet
        for row_num, row in enumerate(rows):
            for col_num, value in enumerate(row):
                # Format the date columns (1=start, 2=end)
                if 1 <= col_num <= 2 and value is not None:
                    try:
                        # Try parsing with time component first (ISO format)
                        if 'T' in value:
                            date_obj = datetime.fromisoformat(value.replace('Z', '+00:00'))
                            # Remove timezone info for Excel compatibility
                            date_obj = date_obj.replace(tzinfo=None)
                        else:
                            # Fallback to simple date format
                            date_obj = datetime.strptime(value, "%Y-%m-%d")
                        
                        worksheet.write(row_num + 1, col_num, date_obj, date_format)
                    except (ValueError, AttributeError) as e:
                        # If parsing fails, write as string
                        worksheet.write(row_num + 1, col_num, str(value))
                else:
                    worksheet.write(row_num + 1, col_num, value)
        
        # Close the workbook and write the output to a BytesIO object
        workbook.close()
        output.seek(0)

        # Set the response headers to indicate that this is an XLSX file
        response_headers = {
            'Content-Disposition': 'attachment; filename="costs.xlsx"',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }

        # Return the XLSX file as a response
        return Response(output.read(), headers=response_headers)

    else:
        return jsonify({'error': 'Cost records not found.'}), 404