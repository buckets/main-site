import sqlite3
import os
import shutil

project_root = os.path.join(os.path.dirname(__file__), '..')

def exportSqlite(engine, farm_id, sqlite_filename):
    base_buckets_files = os.path.join(project_root, 'porting/base.buckets')
    shutil.copy(base_buckets_files, sqlite_filename)

    conn = sqlite3.connect(sqlite_filename)
    # copy data over

    conn.close()
    return sqlite_filename
