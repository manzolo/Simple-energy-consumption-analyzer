from config import app_dir


def get_consumption_query():
    # read the SQL queries from queries.sql
    with open(app_dir+'/sql/get_consumption_query.sql', 'r') as f:
        return f.read()


def create_consumption_table():
    with open(app_dir+'/sql/create_consumption_table.sql', 'r') as f:
        return f.read()


def create_cost_table():
    with open(app_dir+'/sql/create_cost_table.sql', 'r') as f:
        return f.read()
