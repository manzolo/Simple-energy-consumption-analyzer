import sqlite3

from app.database.queries import create_cost_table, create_consumption_table


def get_db():
    return sqlite3.connect('consumption.db')


def create_db():
    # Connessione al database
    conn = get_db()

    # Creazione della tabella consumo_mensile
    conn.execute(create_consumption_table())

    # Creazione della tabella costo_mensile
    conn.execute(create_cost_table())

    # Chiusura della connessione al database
    conn.close()
