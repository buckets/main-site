import sqlite3
import os
import shutil
#import sqlalchemy
from sqlalchemy import select, and_
#, and_, func, text

from buckets.schema import Account, AccountTrans, Group, Bucket, BucketTrans

project_root = os.path.join(os.path.dirname(__file__), '..')

def convertTimestamp(x):
    return x.replace(microsecond=0)

def exportSqlite(engine, farm_id, sqlite_filename):
    base_buckets_files = os.path.join(project_root, 'porting/base.buckets')
    shutil.copy(base_buckets_files, sqlite_filename)

    conn = sqlite3.connect(sqlite_filename)
    
    # accounts
    r = engine.execute(select([Account])
        .where(Account.c.farm_id == farm_id))
    accounts = list(r.fetchall())
    for account in accounts:
        conn.execute('''
        INSERT INTO account (id, created, name, balance, currency)
        VALUES (?, ?, ?, ?, ?)
        ''', (account.id, convertTimestamp(account.created), account.name, account.balance, account.currency))

    # transactions
    r = engine.execute(select([AccountTrans])
        .where(and_(
            AccountTrans.c.account_id == Account.c.id,
            Account.c.farm_id == farm_id)))
    for trans in r.fetchall():
        conn.execute('''
        INSERT INTO account_transaction
        (id, created, posted, account_id, amount, memo, fi_id, general_cat)
        VALUES (?,?,?,?,?,?,?,?)
        ''', (
            trans.id,
            convertTimestamp(trans.created),
            convertTimestamp(trans.posted),
            trans.account_id,
            trans.amount,
            trans.memo,
            trans.fi_id,
            trans.general_cat,
        ))

    # bucket group
    r = engine.execute(select([Group])
        .where(Group.farm_id == farm_id))
    for group in r.fetchall():
        conn.execute('''
        INSERT INTO bucket_group
        (id, created, name, ranking)
        VALUES (?, ?, ?, ?)
        ''', (
            group.id,
            convertTimestamp(group.created),
            group.name,
            group.ranking,
        ))

    # buckets
    r = engine.execute(select([Bucket])
        .where(Bucket.farm_id == farm_id))
    buckets = list(r.fetchall())
    for bucket in buckets:
        kind = ''
        if bucket.kind == 'deposit':
            kind = 'deposit'
        elif bucket.kind == 'goal':
            if bucket.goal and bucket.end_date:
                kind = 'goal-date'
            elif bucket.goal and bucket.deposit:
                kind = 'goal-deposit'
            elif bucket.deposit and bucket.end_date:
                kind = 'deposit-date'
        conn.execute('''
        INSERT INTO bucket
        (id, created, name, notes, balance, kicked, group_id, ranking, kind, goal, end_date, deposit, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            bucket.id,
            convertTimestamp(bucket.created),
            bucket.name,
            bucket.description,
            bucket.balance,
            bucket.out_to_pasture,
            bucket.group_id,
            bucket.ranking,
            kind,
            bucket.goal,
            bucket.end_date,
            bucket.deposit,
            bucket.color,
        ))

    # bucket transactions
    r = engine.execute(select([BucketTrans])
        .where(and_(
            BucketTrans.c.bucket_id == Bucket.c.id,
            Bucket.c.farm_id == farm_id)))
    for trans in r.fetchall():
        MATT, you're right here

    # adjust balances
    # account
    # bucket

    import sys
    sys.stdout.flush()

    conn.commit()
    conn.close()
    return sqlite_filename
