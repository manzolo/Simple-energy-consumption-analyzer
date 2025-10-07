from flask import Blueprint, render_template, request, jsonify

from consumption_app.database.functions import get_db

bp = Blueprint('cost', __name__)

def ensure_null_for_empty(value):
    """Converts empty string or None to None for proper SQLite NULL handling."""
    if value == '' or value is None:
        return None
    return value

@bp.route('/example')
def example():
    return render_template('example.html')


@bp.route('/cost', methods=['GET'])
def get_all_costs():
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=10, type=int)
    # print(page)
    # print(page_size)

    database_connection = get_db()
    cur = database_connection.cursor()

    # Count total number of records
    cur.execute('SELECT COUNT(*) FROM cost')
    total_count = cur.fetchone()[0]

    # Calculate offset and limit for pagination
    offset = (page - 1) * page_size
    limit = page_size

    # Fetch paginated results
    cur.execute(
        'SELECT id_cost, start, end, kwh, smc, kwh_cost, smc_cost, COUNT(*) OVER() as total_count '
        'FROM cost '
        'ORDER BY start desc, end desc '
        'LIMIT ? '
        'OFFSET ?',
        (limit, offset))
    rows = cur.fetchall()

    database_connection.close()

    if rows:
        result = []
        for row in rows:
            cost = {'id': row[0], 'start': row[1], 'end': row[2], 'kwh': row[3], 'smc': row[4], 'kwh_cost': row[5], 'smc_cost': row[6]}
            result.append(cost)

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
        return jsonify({'error': 'Cost records not found.'}), 404


@bp.route('/cost/<int:cost_id>', methods=['GET'])
def get_cost(cost_id):
    database_connection = get_db()
    cur = database_connection.cursor()
    cur.execute('SELECT start, end, kwh, smc, kwh_cost, smc_cost FROM cost WHERE id_cost=?', (cost_id,))
    row = cur.fetchone()
    database_connection.close()
    if row:
        result = {'start': row[0], 'end': row[1], 'kwh': row[2], 'smc': row[3], 'kwh_cost': row[4], 'smc_cost': row[5]}
        return jsonify(result)
    else:
        return jsonify({'error': 'Cost record not found.'}), 404


@bp.route('/cost/create', methods=['GET'])
def create():
    return render_template('crud/cost/create.html')


@bp.route('/cost/list', methods=['GET'])
def list():
    return render_template('crud/cost/list.html')


@bp.route('/cost/edit/<int:cost_id>', methods=['GET'])
def update(cost_id):
    return render_template('crud/cost/edit.html', cost_id=cost_id)


# Add a new record
@bp.route('/cost', methods=['POST'])
def add_cost():
    data = request.get_json()
    
    # 🌟 MODIFICA QUI
    end_date = ensure_null_for_empty(data.get('end')) # Usa .get() per sicurezza
    
    database_connection = get_db()
    cur = database_connection.cursor()
    
    # Inserisci end_date al posto di data['end']
    cur.execute('INSERT INTO cost (start, end, kwh, smc, kwh_cost, smc_cost) VALUES (?, ?, ?, ?, ?, ?)',
                (data['start'], end_date, data['kwh'], data['smc'], data['kwh_cost'], data['smc_cost']))
    
    database_connection.commit()
    database_connection.close()
    return jsonify({'status': 'add', 'id': cur.lastrowid})


# Update an existing record
@bp.route('/cost/<int:cost_id>', methods=['PUT'])
def update_cost(cost_id):
    data = request.get_json()

    # 🌟 MODIFICA QUI
    end_date = ensure_null_for_empty(data.get('end'))
    
    database_connection = get_db()
    cur = database_connection.cursor()
    
    # Aggiorna con end_date al posto di data['end']
    cur.execute('UPDATE cost SET start=?, end=?, kwh=?, smc=?, kwh_cost=?, smc_cost=? WHERE id_cost=?',
                (data['start'], end_date, data['kwh'], data['smc'], data['kwh_cost'], data['smc_cost'], cost_id))
    
    database_connection.commit()
    database_connection.close()
    return jsonify({'status': 'update', 'id': cost_id})


# Delete a record
@bp.route('/cost/<int:cost_id>', methods=['DELETE'])
def delete_cost(cost_id):
    database_connection = get_db()
    cur = database_connection.cursor()
    cur.execute('DELETE FROM cost WHERE id_cost=?', (cost_id,))
    database_connection.commit()
    database_connection.close()
    return jsonify({'status': 'delete', 'id': cost_id})
