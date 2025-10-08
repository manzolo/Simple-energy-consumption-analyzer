import io
import xlsxwriter
from flask import Response, jsonify, Blueprint
from app import db
from app.models import Consumption

bp = Blueprint('consumption_export', __name__)


@bp.route('/consumption/export', methods=['GET'])
def export_xls():
    # Get all consumption records usando SQLAlchemy
    consumptions = Consumption.query.order_by(
        Consumption.year.desc(), 
        Consumption.month.desc()
    ).all()

    if consumptions:
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
        for i, consumption in enumerate(consumptions):
            worksheet.write(i + 1, 0, consumption.id_consumption)
            worksheet.write(i + 1, 1, consumption.year)
            worksheet.write(i + 1, 2, consumption.month)
            worksheet.write(i + 1, 3, consumption.kwh)
            worksheet.write(i + 1, 4, consumption.smc)

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
        return jsonify({'error': 'Consumption records not found.'}), 404