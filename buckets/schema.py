from sqlalchemy import Table, Column, MetaData
from sqlalchemy import DateTime, String, Integer, Boolean, Date


from collections import OrderedDict

metadata = MetaData()

User = Table('user_', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('email', String),
    Column('email_verified', Boolean),
    Column('name', String),
    Column('last_login', DateTime),
    Column('want_newsletter', Boolean),
    Column('intro_completed', Boolean),
    Column('_pin', String),
)
Farm = Table('farm', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('creator_id', Integer),
    Column('name', String),
)
UserFarm = Table('user_farm_join', metadata,
    Column('user_id', Integer, primary_key=True),
    Column('farm_id', Integer, primary_key=True),
)


Account = Table('account', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('farm_id', Integer),
    Column('name', String),
    Column('balance', Integer),
    Column('currency', String),
)
Group = Table('bucket_group', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('farm_id', Integer),
    Column('name', String),
    Column('ranking', String, nullable=False),
)
Bucket = Table('bucket', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('farm_id', Integer),
    Column('name', String),
    Column('description', String),
    Column('balance', Integer, default=0),
    Column('out_to_pasture', Boolean),
    Column('group_id', Integer),
    Column('ranking', String),
    Column('kind', String, default=u''),
    Column('goal', Integer),
    Column('end_date', Date),
    Column('deposit', Integer),
    Column('color', String),
)
BucketTrans = Table('bucket_transaction', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('posted', DateTime),
    Column('bucket_id', Integer),
    Column('amount', Integer),
    Column('memo', String),
    Column('account_transaction_id', Integer),
)


PATCH_TABLE = '_schema_version'
patches = OrderedDict()
patches['init'] = [
    #-------------------------------------
    # user_
    #-------------------------------------
    '''CREATE TABLE user_ (
        id serial primary key,
        created timestamp default current_timestamp,
        email text,
        email_verified boolean default 'f',
        name text,
        last_login timestamp,
        want_newsletter boolean default 'f',
        intro_completed boolean default 'f',
        _pin text
    )''',
    '''CREATE UNIQUE INDEX user_lower_email_idx
        ON user_(lower(email))''',

    #-------------------------------------
    # farm
    #-------------------------------------
    '''CREATE TABLE farm (
        id serial primary key,
        created timestamp default current_timestamp,
        creator_id integer,
        name text
    )''',
    '''CREATE TABLE user_farm_join (
        user_id integer,
        farm_id integer,
        primary key(user_id, farm_id)
    )''',

    #-------------------------------------
    # account
    #-------------------------------------
    '''CREATE TABLE account (
        id serial primary key,
        created timestamp default current_timestamp,
        farm_id integer,
        name text,
        balance integer default '0' not null,
        currency varchar(3) default 'USD'
    )''',

    #-------------------------------------
    # group
    #-------------------------------------
    '''CREATE TABLE bucket_group (
        id serial primary key,
        created timestamp default current_timestamp,
        farm_id integer,
        name text,
        ranking text not null
    )''',
    '''CREATE UNIQUE INDEX bucket_group_farm_rank_udx
        ON bucket_group(farm_id, ranking)''',

    #-------------------------------------
    # bucket
    #-------------------------------------
    '''CREATE TABLE bucket (
        id serial primary key,
        created timestamp default current_timestamp,
        farm_id integer,
        name text,
        description text,
        balance integer default '0' not null,
        out_to_pasture boolean default 'f',
        group_id integer,
        ranking text default 'm',
        kind text default '',
        goal integer,
        end_date date,
        deposit integer,
        color text
    )''',
    '''CREATE TABLE bucket_transaction (
        id serial primary key,
        created timestamp default current_timestamp,
        posted timestamp default current_timestamp,
        bucket_id integer,
        amount integer,
        memo text,
        account_transaction_id integer
    )''',
    '''CREATE FUNCTION update_bucket_balance() RETURNS trigger AS $update_bucket_balance$
        BEGIN
            IF (TG_OP = 'DELETE') THEN
                UPDATE bucket
                    SET balance = (balance - OLD.amount)
                    WHERE id = OLD.bucket_id;
                RETURN OLD;
            ELSIF (TG_OP = 'UPDATE') THEN
                UPDATE bucket
                    SET balance = (balance - OLD.amount)
                    WHERE id = OLD.bucket_id;
                UPDATE bucket
                    SET balance = (balance + NEW.amount)
                    WHERE id = NEW.bucket_id;
                RETURN NEW;
            ELSIF (TG_OP = 'INSERT') THEN
                UPDATE bucket
                    SET balance = (balance + NEW.amount)
                    WHERE id = NEW.bucket_id;
                RETURN NEW;
            END IF;
            RETURN NULL;
        END;
    $update_bucket_balance$ LANGUAGE plpgsql''',
    '''CREATE TRIGGER update_bucket_balance
    AFTER
        INSERT
        OR UPDATE OF amount, bucket_id
        OR DELETE
    ON bucket_transaction
    FOR EACH ROW EXECUTE PROCEDURE update_bucket_balance();
    ''',
]


def upgrade_schema(engine, patches=patches, version_table=PATCH_TABLE):
    """
    @param patches: An OrderedDict where keys are patch names
        and values are list of sql statements.
    @param version_table: Name of the version table where patches
        will live.
    """
    if not isinstance(patches, OrderedDict):
        raise ValueError('patches must be an OrderedDict')

    patch_table_in_place = False
    with engine.connect() as conn:
        try:
            conn.execute('SELECT patch_name from {0}'.format(version_table))
            patch_table_in_place = True
        except:
            pass
    
    if not patch_table_in_place:
        engine.execute('''CREATE TABLE {0} (
            patch_name text primary key not null,
            created timestamp default current_timestamp
        )'''.format(version_table))

    r = engine.execute(
        'select patch_name from {0}'.format(version_table))
    applied = set([x[0] for x in r.fetchall()])
    for patch_name, sql_list in patches.items():
        if patch_name in applied:
            continue
        
        with engine.connect() as conn:
            for sql_statement in sql_list:
                conn.execute(sql_statement)
            conn.execute('INSERT INTO {0} (patch_name) values (%s)'.format(
                version_table), (patch_name,))

