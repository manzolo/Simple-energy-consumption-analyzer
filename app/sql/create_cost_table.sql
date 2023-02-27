CREATE TABLE IF NOT EXISTS "cost" (
    "id_cost"    INTEGER,
    "start"    DATE,
    "end"    DATE,
    "kwh"    REAL NOT NULL,
    "smc"    REAL NOT NULL,
    "kwh_cost"    REAL,
    "smc_cost"    REAL,
    PRIMARY KEY("id_cost")
);