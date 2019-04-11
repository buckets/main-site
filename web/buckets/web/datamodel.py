import psycopg2
import psycopg2.pool
import contextlib
import os
import structlog
import random
logger = structlog.get_logger()

db_pool = None
def getpool():
    global db_pool
    if db_pool is None:
        db_pool = psycopg2.pool.ThreadedConnectionPool(0, 5, os.getenv('DATABASE_URL'))
    return db_pool

@contextlib.contextmanager
def database():
    conn = getpool().getconn()
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
        cursor.close()
    except:
        conn.rollback()
        raise
    finally:
        getpool().putconn(conn)


def upgradeSchema():
    with database() as c:
        c.execute('''CREATE TABLE IF NOT EXISTS _schema_version (
            id serial PRIMARY KEY,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP(0),
            name TEXT UNIQUE
        )''')

    applied = set()
    with database() as c:
        c.execute('''SELECT name FROM _schema_version''')
        applied = set([x[0] for x in c.fetchall()])
        logger.debug('got applied patches', applied=applied)

    for patch_name, sqls in patches:
        if patch_name not in applied:
            with database() as c:
                for sql in sqls:
                    c.execute(sql)
                c.execute('INSERT INTO _schema_version (name) VALUES (%s)', (patch_name,))
            logger.debug('applied', patch_name=patch_name)

#------------------------------------------------------------
# Coupon codes
#------------------------------------------------------------
code_alphabet = 'ABCDEFGHJKMNPQRTUVWXY23456789'

def randomCode(prefix, length):
    """
    Generate a random code of length N
    """
    ret = prefix
    for _ in range(length):
        ret += random.choice(code_alphabet)
    return ret

def formatCode(code, chunk_size=4):
    """
    Return a hyphen-delimited code
    """
    ret = []
    for i in range(0, len(code), chunk_size):
        ret.append(code[i:i+chunk_size])
    return '-'.join(ret).strip('-')

def generateCouponCodes(total_price, count=1):
    """
    Insert some coupon codes into the database that will require the
    user to pay the given price.
    """
    with database() as c:
        for i in range(count):
            code = randomCode('A', 15)
            c.execute('INSERT INTO coupon (code, total_price) VALUES (%s, %s)',
                (code, total_price))
            logger.debug('code', code=formatCode(code), total_price=total_price)

class NotFound(Exception): pass

def normalizedCode(code):
    return code.strip().replace('-', '').upper()

def priceForCode(code):
    """
    Return the price for the given code or raise NotFound if
    the code doesn't exist
    """
    code = normalizedCode(code)
    with database() as c:
        c.execute('SELECT total_price FROM coupon WHERE used IS NULL AND code = %s', (code,))
        row = c.fetchone()
        if not row:
            raise NotFound(code)
        else:
            return row[0]

def useCode(code):
    """
    Mark a code as having been used.
    """
    code = normalizedCode(code)
    with database() as c:
        c.execute('UPDATE coupon SET used=CURRENT_TIMESTAMP(0) WHERE code=%s AND used IS NULL', (code,))
        if c.rowcount != 1:
            raise NotFound(code)
        logger.debug('marking code as used', code=code)

patches = [
    ('init', [
        '''CREATE TABLE coupon (
            code TEXT UNIQUE PRIMARY KEY,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP(0),
            used TIMESTAMP DEFAULT NULL,
            total_price INTEGER DEFAULT 4900
        )''',
    ]),
]