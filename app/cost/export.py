import io
from datetime import datetime
import xlsxwriter
from flask import Response, jsonify, Blueprint
from app import db
from app.models import Cost

bp = Blueprint('cost_export', __name__)


@bp.route('/cost/export', methods=['GET'])
def export_all_costs():
    # Get all costs data usando SQLAlchemy
    costs = Cost.query.order_by(
        Cost.start.desc(), 
        Cost.end.desc()
    ).all()

    if costs:
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
        for row_num, cost in enumerate(costs):
            worksheet.write(row_num + 1, 0, cost.id_cost)
            
            # Format start date
            if cost.start:
                worksheet.write(row_num + 1, 1, cost.start, date_format)
            else:
                worksheet.write(row_num + 1, 1, '')
            
            # Format end date
            if cost.end:
                worksheet.write(row_num + 1, 2, cost.end, date_format)
            else:
                worksheet.write(row_num + 1, 2, '')
            
            worksheet.write(row_num + 1, 3, cost.kwh if cost.kwh else '')
            worksheet.write(row_num + 1, 4, cost.smc if cost.smc else '')
            worksheet.write(row_num + 1, 5, cost.kwh_cost if cost.kwh_cost else '')
            worksheet.write(row_num + 1, 6, cost.smc_cost if cost.smc_cost else '')
        
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