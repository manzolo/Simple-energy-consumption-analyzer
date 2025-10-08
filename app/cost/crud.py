from flask import Blueprint, render_template, request, jsonify
from app import db
from app.models import Cost

bp = Blueprint('cost', __name__)

def ensure_null_for_empty(value):
    if value == '' or value is None:
        return None
    return value

# Existing API Routes
@bp.route('/cost', methods=['GET'])
def get_all_costs():
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=10, type=int)

    query = Cost.query.order_by(Cost.start.desc(), Cost.end.desc())
    paginated = query.paginate(page=page, per_page=page_size, error_out=False)
    
    result = [{
        'id': item.id_cost,
        'start': item.start.isoformat() if item.start else None,
        'end': item.end.isoformat() if item.end else None,
        'kwh': item.kwh,
        'smc': item.smc,
        'kwh_cost': item.kwh_cost,
        'smc_cost': item.smc_cost
    } for item in paginated.items]

    response_headers = {
        'X-Total-Count': str(paginated.total),
        'X-Total-Pages': str(paginated.pages),
        'X-Current-Page': str(page),
        'X-Page-Size': str(page_size)
    }

    return jsonify(result), 200, response_headers

@bp.route('/cost/<int:cost_id>', methods=['GET'])
def get_cost(cost_id):
    cost = Cost.query.get_or_404(cost_id)
    return jsonify({
        'start': cost.start.isoformat() if cost.start else None,
        'end': cost.end.isoformat() if cost.end else None,
        'kwh': cost.kwh,
        'smc': cost.smc,
        'kwh_cost': cost.kwh_cost,
        'smc_cost': cost.smc_cost
    })

@bp.route('/cost', methods=['POST'])
def add_cost():
    data = request.get_json()
    
    new_cost = Cost(
        start=data['start'],
        end=ensure_null_for_empty(data.get('end')),
        kwh=data['kwh'],
        smc=data['smc'],
        kwh_cost=data.get('kwh_cost'),
        smc_cost=data.get('smc_cost')
    )
    
    db.session.add(new_cost)
    db.session.commit()
    
    return jsonify({'status': 'add', 'id': new_cost.id_cost})

@bp.route('/cost/<int:cost_id>', methods=['PUT'])
def update_cost(cost_id):
    cost = Cost.query.get_or_404(cost_id)
    data = request.get_json()
    
    cost.start = data['start']
    cost.end = ensure_null_for_empty(data.get('end'))
    cost.kwh = data['kwh']
    cost.smc = data['smc']
    cost.kwh_cost = data.get('kwh_cost')
    cost.smc_cost = data.get('smc_cost')
    
    db.session.commit()
    
    return jsonify({'status': 'update', 'id': cost_id})

@bp.route('/cost/<int:cost_id>', methods=['DELETE'])
def delete_cost(cost_id):
    cost = Cost.query.get_or_404(cost_id)
    db.session.delete(cost)
    db.session.commit()
    
    return jsonify({'status': 'delete', 'id': cost_id})

# Ported Template-Rendering Routes
@bp.route('/example')
def example():
    return render_template('example.html')

@bp.route('/cost/create', methods=['GET'])
def create():
    return render_template('crud/cost/create.html')

@bp.route('/cost/list', methods=['GET'])
def list():
    return render_template('crud/cost/list.html')

@bp.route('/cost/edit/<int:cost_id>', methods=['GET'])
def update(cost_id):
    cost = Cost.query.get_or_404(cost_id)
    return render_template('crud/cost/edit.html', cost_id=cost_id)