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
AuthToken = Table('user_auth_token', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('expires', DateTime),
    Column('user_id', Integer),
    Column('token', String),
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
AccountTrans = Table('account_transaction', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('posted', DateTime),
    Column('account_id', Integer),
    Column('amount', Integer, default=0),
    Column('memo', String),
    Column('fi_id', String),
    Column('general_cat', String, default=None),
    Column('cat_likely', Boolean, default=False),
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

Connection = Table('simplefin_connection', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('farm_id', Integer),
    Column('access_token', String),
    Column('last_used', DateTime),
)
AccountMapping = Table('account_mapping', metadata,
    Column('id', Integer, primary_key=True),
    Column('created', DateTime),
    Column('farm_id', Integer),
    Column('account_id', Integer),
    Column('account_hash', String),
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
    # user_auth_token
    #-------------------------------------
    '''CREATE TABLE user_auth_token (
        id serial primary key,
        created timestamp default current_timestamp,
        expires timestamp not null,
        user_id integer REFERENCES user_ ON DELETE CASCADE,
        token text unique
    )''',
    '''CREATE FUNCTION delete_expired_auth_tokens() RETURNS trigger AS $delete_expired_auth_tokens$
        BEGIN
            DELETE FROM user_auth_token
            WHERE expires <= current_timestamp;
            RETURN NULL;
        END;
    $delete_expired_auth_tokens$ LANGUAGE plpgsql''',
    '''CREATE TRIGGER delete_expired_auth_tokens
    AFTER
        INSERT
        OR UPDATE
    ON
        user_auth_token
    EXECUTE PROCEDURE delete_expired_auth_tokens()
    ''',

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
        user_id integer REFERENCES user_ ON DELETE RESTRICT,
        farm_id integer REFERENCES farm ON DELETE RESTRICT,
        primary key(user_id, farm_id)
    )''',

    #-------------------------------------
    # account
    #-------------------------------------
    '''CREATE TABLE account (
        id serial primary key,
        created timestamp default current_timestamp,
        farm_id integer REFERENCES farm ON DELETE RESTRICT,
        name text,
        balance integer default '0' not null,
        currency varchar(3) default 'USD'
    )''',
    '''CREATE INDEX account_farm_id_idx ON account(farm_id)''',
    '''CREATE TABLE account_transaction (
        id serial primary key,
        created timestamp default current_timestamp,
        posted timestamp default current_timestamp,
        account_id integer REFERENCES account ON DELETE RESTRICT,
        amount integer default 0,
        memo text,
        fi_id text,
        general_cat text default null,
        cat_likely boolean default 'f'
    )''',
    '''CREATE INDEX account_transaction_account_id_idx
        ON account_transaction(account_id)''',
    '''CREATE INDEX account_transaction_fi_id_idx
        ON account_transaction(fi_id)''',
    '''CREATE INDEX account_transaction_posted_idx
        ON account_transaction(posted)''',
    '''CREATE FUNCTION update_account_balance() RETURNS trigger AS $update_account_balance$
        BEGIN
            IF (TG_OP = 'DELETE') THEN
                UPDATE account
                    SET balance = (balance - OLD.amount)
                    WHERE id = OLD.account_id;
                RETURN OLD;
            ELSIF (TG_OP = 'UPDATE') THEN
                UPDATE account
                    SET balance = (balance - OLD.amount)
                    WHERE id = OLD.account_id;
                UPDATE account
                    SET balance = (balance + NEW.amount)
                    WHERE id = NEW.account_id;
                RETURN NEW;
            ELSIF (TG_OP = 'INSERT') THEN
                UPDATE account
                    SET balance = (balance + NEW.amount)
                    WHERE id = NEW.account_id;
                RETURN NEW;
            END IF;
            RETURN NULL;
        END;
    $update_account_balance$ LANGUAGE plpgsql''',
    '''CREATE TRIGGER update_account_balance
    AFTER
        INSERT
        OR UPDATE OF amount, account_id
        OR DELETE
    ON account_transaction
    FOR EACH ROW EXECUTE PROCEDURE update_account_balance();
    ''',

    #-------------------------------------
    # group
    #-------------------------------------
    '''CREATE TABLE bucket_group (
        id serial primary key,
        created timestamp default current_timestamp,
        farm_id integer REFERENCES farm ON DELETE RESTRICT,
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
        farm_id integer REFERENCES farm ON DELETE RESTRICT,
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
    '''CREATE INDEX bucket_farm_id_idx
        ON bucket(farm_id)''',
    '''CREATE TABLE bucket_transaction (
        id serial primary key,
        created timestamp default current_timestamp,
        posted timestamp default current_timestamp,
        bucket_id integer REFERENCES bucket ON DELETE RESTRICT,
        amount integer,
        memo text,
        account_transaction_id integer
            REFERENCES account_transaction ON DELETE CASCADE
    )''',
    '''CREATE INDEX bucket_transaction_bucket_id_idx
        ON bucket_transaction(bucket_id)''',
    '''CREATE INDEX bucket_transaction_posted_idx
        ON bucket_transaction(posted)''',
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

    #-------------------------------------
    # simplefin
    #-------------------------------------
    '''CREATE TABLE simplefin_connection (
        id serial primary key,
        created timestamp default current_timestamp,
        farm_id integer REFERENCES farm ON DELETE RESTRICT,
        access_token text,
        last_used timestamp
    )''',
    '''CREATE INDEX simplefin_connection_farm_id_idx
        ON simplefin_connection(farm_id)''',
    '''CREATE TABLE account_mapping (
        id serial primary key,
        created timestamp default current_timestamp,
        farm_id integer REFERENCES farm ON DELETE RESTRICT,
        account_id integer REFERENCES account ON DELETE RESTRICT,
        account_hash text
    )''',
    '''CREATE INDEX account_mapping_farm_id_idx
        ON account_mapping(farm_id)''',
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

