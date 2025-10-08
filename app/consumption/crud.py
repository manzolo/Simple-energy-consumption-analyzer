from flask import Blueprint, render_template, request, jsonify
from app import db
from app.models import Consumption

bp = Blueprint('consumption', __name__)

# Existing API Routes
@bp.route('/consumption', methods=['GET'])
def get_all_consumptions():
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=10, type=int)

    # Query con SQLAlchemy
    query = Consumption.query.order_by(
        Consumption.year.desc(), 
        Consumption.month.desc()
    )
    
    paginated = query.paginate(page=page, per_page=page_size, error_out=False)
    
    result = [{
        'id': item.id_consumption,
        'year': item.year,
        'month': item.month,
        'kwh': item.kwh,
        'smc': item.smc
    } for item in paginated.items]

    response_headers = {
        'X-Total-Count': str(paginated.total),
        'X-Total-Pages': str(paginated.pages),
        'X-Current-Page': str(page),
        'X-Page-Size': str(page_size)
    }

    return jsonify(result), 200, response_headers

@bp.route('/consumption/<int:consumption_id>', methods=['GET'])
def get_consumption(consumption_id):
    consumption = Consumption.query.get_or_404(consumption_id)
    return jsonify({
        'year': consumption.year,
        'month': consumption.month,
        'kwh': consumption.kwh,
        'smc': consumption.smc
    })

@bp.route('/consumption', methods=['POST'])
def add_consumption():
    data = request.get_json()
    
    new_consumption = Consumption(
        year=data['year'],
        month=data['month'],
        kwh=data['kwh'],
        smc=data['smc']
    )
    
    db.session.add(new_consumption)
    db.session.commit()
    
    return jsonify({'status': 'add', 'id': new_consumption.id_consumption})

@bp.route('/consumption/<int:consumption_id>', methods=['PUT'])
def update_consumption(consumption_id):
    consumption = Consumption.query.get_or_404(consumption_id)
    data = request.get_json()
    
    consumption.year = data['year']
    consumption.month = data['month']
    consumption.kwh = data['kwh']
    consumption.smc = data['smc']
    
    db.session.commit()
    
    return jsonify({'status': 'update', 'id': consumption_id})

@bp.route('/consumption/<int:consumption_id>', methods=['DELETE'])
def delete_consumption(consumption_id):
    consumption = Consumption.query.get_or_404(consumption_id)
    db.session.delete(consumption)
    db.session.commit()
    
    return jsonify({'status': 'delete', 'id': consumption_id})

# Ported Template-Rendering Routes
@bp.route('/example')
def example():
    return render_template('example.html')

@bp.route('/example_year')
def example_year():
    return render_template('example_year.html')

@bp.route('/consumption/create', methods=['GET'])
def create():
    return render_template('crud/consumption/create.html')

@bp.route('/consumption/list', methods=['GET'])
def list():
    return render_template('crud/consumption/list.html')

@bp.route('/consumption/edit/<int:consumption_id>', methods=['GET'])
def update(consumption_id):
    consumption = Consumption.query.get_or_404(consumption_id)
    return render_template('crud/consumption/edit.html', consumption_id=consumption_id)