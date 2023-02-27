from flask import Blueprint, render_template, request, jsonify

from consumption_app.database.functions import get_db

bp = Blueprint('consumption', __name__)


@bp.route('/example')
def example():
    return render_template('example.html')


# # Display all records
# @bp.route('/consumption', methods=['GET'])
# def get_all_consumptions():
#     database_connection = get_db()
#     cur = database_connection.cursor()
#     cur.execute(get_consumption_query())
#     rows = cur.fetchall()
#     database_connection.close()
#     # create a list of dictionaries with 'year' and 'month' keys and corresponding values from rows
#     result = {
#         row[8]: {
#             'year': row[0], 'month': row[1],
#             'kwh': row[2], 'smc': row[3],
#             'kwh_month_cost': row[4], 'smc_month_cost': row[5],
#             'kwh_unit_cost': row[6], 'smc_unit_cost': row[7],
#         } for row in rows
#     }
#     # use the jsonify function to return the dictionary as a JSON object
#     return jsonify(result)


@bp.route('/consumption', methods=['GET'])
def get_all_consumptions():
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=10, type=int)
    # print(page)
    # print(page_size)

    database_connection = get_db()
    cur = database_connection.cursor()

    # Count total number of records
    cur.execute('SELECT COUNT(*) FROM consumption')
    total_count = cur.fetchone()[0]

    # Calculate offset and limit for pagination
    offset = (page - 1) * page_size
    limit = page_size

    # Fetch paginated results
    cur.execute(
        'SELECT id_consumption, year, month, kwh, smc, COUNT(*) OVER() as total_count '
        'FROM consumption '
        'ORDER BY year desc, month desc '
        'LIMIT ? '
        'OFFSET ?',
        (limit, offset))
    rows = cur.fetchall()

    database_connection.close()

    if rows:
        result = []
        for row in rows:
            consumption = {'id': row[0], 'year': row[1], 'month': row[2], 'kwh': row[3], 'smc': row[4]}
            result.append(consumption)

        # Calculate total number of pages based on page size and total count
        total_pages = (total_count + page_size - 1) // page_size

        # Add pagination metadata to response headers
        response_headers = {
            'X-Total-Count': str(total_count),
            'X-Total-Pages': str(total_pages),
            'X-Current-Page': str(page),
            'X-Page-Size': str(page_size)
        }

        return jsonify(result), 200, response_headers
    else:
        return jsonify({'error': 'Consumption records not found.'}), 404


@bp.route('/consumption/<int:consumption_id>', methods=['GET'])
def get_consumption(consumption_id):
    database_connection = get_db()
    cur = database_connection.cursor()
    cur.execute('SELECT year, month, kwh, smc FROM consumption WHERE id_consumption=?', (consumption_id,))
    row = cur.fetchone()
    database_connection.close()
    if row:
        result = {'year': row[0], 'month': row[1], 'kwh': row[2], 'smc': row[3]}
        return jsonify(result)
    else:
        return jsonify({'error': 'Consumption record not found.'}), 404


@bp.route('/consumption/create', methods=['GET'])
def create():
    return render_template('crud/consumption/create.html')


@bp.route('/consumption/list', methods=['GET'])
def list():
    return render_template('crud/consumption/list.html')


@bp.route('/consumption/edit/<int:consumption_id>', methods=['GET'])
def update(consumption_id):
    return render_template('crud/consumption/edit.html', consumption_id=consumption_id)


# Add a new record
@bp.route('/consumption', methods=['POST'])
def add_consumption():
    data = request.get_json()
    database_connection = get_db()
    cur = database_connection.cursor()
    cur.execute('INSERT INTO consumption (year, month, kwh, smc) VALUES (?, ?, ?, ?)',
                (data['year'], data['month'], data['kwh'], data['smc']))
    database_connection.commit()
    database_connection.close()
    return jsonify({'status': 'add', 'id': cur.lastrowid})


# Update an existing record
@bp.route('/consumption/<int:consumption_id>', methods=['PUT'])
def update_consumption(consumption_id):
    data = request.get_json()
    database_connection = get_db()
    cur = database_connection.cursor()
    cur.execute('UPDATE consumption SET year=?, month=?, kwh=?, smc=? WHERE id_consumption=?',
                (data['year'], data['month'], data['kwh'], data['smc'], consumption_id))
    database_connection.commit()
    database_connection.close()
    return jsonify({'status': 'update', 'id': consumption_id})


# Delete a record
@bp.route('/consumption/<int:consumption_id>', methods=['DELETE'])
def delete_consumption(consumption_id):
    database_connection = get_db()
    cur = database_connection.cursor()
    cur.execute('DELETE FROM consumption WHERE id_consumption=?', (consumption_id,))
    database_connection.commit()
    database_connection.close()
    return jsonify({'status': 'delete', 'id': consumption_id})
