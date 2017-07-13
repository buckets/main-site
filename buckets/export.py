import sqlite3
import os
import shutil
import time
import calendar
from datetime import timedelta
from sqlalchemy import select, and_

from buckets.schema import Account, AccountTrans, Group, Bucket, BucketTrans
from buckets.schema import Connection, AccountMapping

project_root = os.path.join(os.path.dirname(__file__), '..')

def convertTimestamp(x):
    return x.replace(microsecond=0)

SECONDS_IN_A_DAY = 60 * 60 * 24
utc_offset = calendar.timegm(time.gmtime()) - calendar.timegm(time.localtime())

def convertPosted(posted, created):
    if posted.hour == 0 and posted.minute == 0 and posted.second == 0:
        # probably a fake time
        if abs((posted - created).total_seconds()) <= SECONDS_IN_A_DAY:
            # pretty close, use the created timestamp
            return convertTimestamp(created)
        else:
            # different day
            return convertTimestamp(posted + timedelta(seconds=utc_offset))
    else:
        return convertTimestamp(posted)



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
            convertPosted(trans.posted, trans.created),
            trans.account_id,
            trans.amount,
            trans.memo,
            trans.fi_id,
            trans.general_cat,
        ))

    # bucket group
    r = engine.execute(select([Group])
        .where(Group.c.farm_id == farm_id))
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
        .where(Bucket.c.farm_id == farm_id))
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
            else:
                kind = 'goal-date'
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
        conn.execute('''
        INSERT INTO bucket_transaction
        (id, created, posted, bucket_id, amount, memo, account_trans_id, transfer)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        ''', (
            trans.id,
            convertTimestamp(trans.created),
            convertPosted(trans.posted, trans.created),
            trans.bucket_id,
            trans.amount,
            trans.memo,
            trans.account_transaction_id,
        ))

    # simplefin connection
    r = engine.execute(select([Connection])
        .where(Connection.c.farm_id == farm_id))
    for connection in r.fetchall():
        conn.execute('''
        INSERT INTO simplefin_connection
        (id, created, access_token, last_used)
        VALUES (?, ?, ?, ?)
        ''', (
            connection.id,
            convertTimestamp(connection.created),
            connection.access_token,
            convertTimestamp(connection.last_used),
        ))

    # account mapping
    r = engine.execute(select([AccountMapping])
        .where(AccountMapping.c.farm_id == farm_id))
    for mapping in r.fetchall():
        conn.execute('''
        INSERT INTO simplefin_connection
        (id, created, account_id, account_hash)
        VALUES (?, ?, ?, ?)
        ''', (
            mapping.id,
            convertTimestamp(mapping.created),
            mapping.account_id,
            mapping.account_hash,
        ))        


    # adjust balances
    # account
    for account in accounts:
        conn.execute('UPDATE account SET balance=? WHERE id=?',
            (account.balance, account.id))

    # bucket
    for bucket in buckets:
        conn.execute('UPDATE bucket SET balance=? WHERE id=?',
            (bucket.balance, bucket.id))

    conn.commit()
    conn.close()
    return sqlite_filename
