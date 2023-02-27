import os
from flask import Flask
from flask_bootstrap import Bootstrap5
from wsgiref.simple_server import make_server

from app.chart.homepage import bp
from app.database.functions import create_db


def create_app():
    consumption_app = Flask(__name__)
    bootstrap = Bootstrap5(consumption_app)

    from . import chart
    consumption_app.register_blueprint(chart.homepage.bp)

    from app.consumption import crud
    consumption_app.register_blueprint(consumption.crud.bp)

    from app.cost import crud
    consumption_app.register_blueprint(cost.crud.bp)

    return consumption_app


port = int(os.environ.get('SERVER_PORT', 8080))
env = os.environ.get('APP_ENV', 'dev')
create_db()
flask_app = create_app()
if env == 'dev':
    flask_app.run(host='0.0.0.0', port=port, debug=True)
else:
    with make_server('', port, flask_app) as httpd:
        print("Serving on port " + str(port) + "...")
        httpd.serve_forever()
