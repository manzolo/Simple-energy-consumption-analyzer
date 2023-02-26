import os
from wsgiref.simple_server import make_server

from flask import Flask
from flask_bootstrap import Bootstrap5

import app.homepage
from app.database.functions import create_db


def create_app():
    myapp = Flask(__name__)
    bootstrap = Bootstrap5(myapp)

    from . import homepage
    myapp.register_blueprint(homepage.bp)

    from . import crud
    myapp.register_blueprint(crud.bp)

    return myapp


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
