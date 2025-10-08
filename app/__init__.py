from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bootstrap import Bootstrap5
from dotenv import load_dotenv
import os
from wsgiref.simple_server import make_server

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
bootstrap = Bootstrap5()

def create_app():
    app = Flask(__name__)
    
    # Load configuration from environment variables
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['APP_ENV'] = os.getenv('APP_ENV', 'dev')  # Default to 'dev' if not set
    app.config['HTTP_PORT'] = int(os.getenv('HTTP_PORT', 8000))  # Default to 8000 if not set

    db.init_app(app)
    migrate.init_app(app, db)
    bootstrap.init_app(app)  # Inizializza Bootstrap

    # Importa i modelli
    from . import models
    
    # Registra i blueprint
    from .chart import homepage as chart_homepage
    from .consumption import crud as consumption_crud
    from .cost import crud as cost_crud
    from .consumption import export as consumption_export
    from .cost import export as cost_export
    
    # Blueprint per le homepage/charts
    app.register_blueprint(chart_homepage.bp)
    
    # Blueprint CRUD
    app.register_blueprint(consumption_crud.bp)
    app.register_blueprint(cost_crud.bp)
    
    # Blueprint Export
    app.register_blueprint(consumption_export.bp)
    app.register_blueprint(cost_export.bp)

    return app

if __name__ == '__main__':
    flask_app = create_app()

    port = flask_app.config.get('HTTP_PORT')
    if flask_app.config.get('APP_ENV') == 'dev':
        flask_app.run(host='0.0.0.0', port=port, debug=True)
    else:
        print(f"Serving on port {port}...")
        with make_server('', port, flask_app) as httpd:
            httpd.serve_forever()