CREATE TABLE IF NOT EXISTS consumption (
             id_consumption INTEGER PRIMARY KEY,
             year INTEGER NOT NULL DEFAULT (strftime('%Y', 'now')),
             month INTEGER NOT NULL DEFAULT (strftime('%Y', 'now')),
             kwh REAL NOT NULL,
             smc REAL NOT NULL
          );
