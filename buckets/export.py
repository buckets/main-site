import sqlite3
import os

def exportSqlite(engine, farm_id, sqlite_filename):
    init_sql_filename = os.path.join(os.path.dirname(__file__), '../app/migrations/001-initial.sql')
    init_sql = open(init_sql_filename, 'r').read()
    conn = sqlite3.connect(sqlite_filename)
    conn.executescript(init_sql)
    conn.close()
    return sqlite_filename