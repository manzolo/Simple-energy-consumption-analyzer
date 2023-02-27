import os
from wsgiref.simple_server import make_server

from dotenv import load_dotenv
from flask import Flask
from flask_bootstrap import Bootstrap5

from consumption_app.database.functions import create_db  # Move the import here


def create_app():
    app = Flask(__name__)
    configure_app(app)
    register_blueprints(app)
    create_db()  # Call create_db here
    return app


def configure_app(app):
    # Load environment variables
    load_dotenv()

    # Configure the Flask consumption_app here
    app.config['HTTP_PORT'] = int(os.environ.get('SERVER_PORT', 8080))
    app.config['APP_ENV'] = os.environ.get('APP_ENV', 'dev')

    # Initialize Bootstrap5 extensions
    Bootstrap5(app)


def register_blueprints(app):
    from consumption_app.chart.homepage import bp as chart_bp
    app.register_blueprint(chart_bp)

    # Register the rest of the blueprints
    from consumption_app.consumption.crud import bp as consumption_bp
    app.register_blueprint(consumption_bp)

    from consumption_app.consumption.export import bp as consumption_export_bp
    app.register_blueprint(consumption_export_bp)

    from consumption_app.cost.crud import bp as cost_bp
    app.register_blueprint(cost_bp)

    from consumption_app.cost.export import bp as cost_export_bp
    app.register_blueprint(cost_export_bp)


if __name__ == '__main__':
    flask_app = create_app()

    port = flask_app.config.get('HTTP_PORT')
    if flask_app.config.get('APP_ENV') == 'dev':
        flask_app.run(host='0.0.0.0', port=port, debug=True)
    else:
        print("Serving on port " + str(port) + "...")

        with make_server('', port, flask_app) as httpd:
            httpd.serve_forever()
