def get_consumption_query():
    return """SELECT c.year, c.month, CAST(c.kwh AS INT) Kwh, CAST(c.smc AS INT) Smc, 
           CAST(cost.kwh AS INT) kwh_month_cost, CAST(cost.smc AS INT) smc_month_cost, 
           cost.kwh_cost kwh_unit_cost, cost.smc_cost smc_unit_cost, c.id_consumption id
    FROM consumption c
    LEFT JOIN cost ON c.year || '-' || printf('%02d', c.month) || '-01' BETWEEN cost.start AND COALESCE(cost.end, date('now'))
    ORDER BY YEAR DESC, MONTH DESC
    """


def create_consumption_table():
    return '''CREATE TABLE IF NOT EXISTS consumption (
                 id_consumption INTEGER PRIMARY KEY,
                 year INTEGER NOT NULL DEFAULT (strftime('%Y', 'now')),
                 month INTEGER NOT NULL DEFAULT (strftime('%Y', 'now')),
                 kwh REAL NOT NULL,
                 smc REAL NOT NULL
              )'''


def create_cost_table():
    return '''CREATE TABLE IF NOT EXISTS "cost" (
	"id_cost"	INTEGER,
	"start"	DATE,
	"end"	DATE,
	"kwh"	REAL NOT NULL,
	"smc"	REAL NOT NULL,
	"kwh_cost"	REAL,
	"smc_cost"	REAL,
	PRIMARY KEY("id_cost")
)'''
