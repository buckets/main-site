

-- user_
INSERT INTO user_
    (id, created, email, email_verified, name, last_login, want_newsletter)
    (SELECT id, created, email, email_verified, name, last_login, want_newsletter
    FROM oldschema.user_account);

-- user_auth_token - NOTHING TO DO

-- farm
INSERT INTO farm
    (id, created, creator_id, name)
    (SELECT
        f.id,
        f.created,
        u.id,
        f.name
    FROM
        oldschema.farm as f
        left join oldschema.user_account as u
            on f.primary_email = u.email);

-- user_farm_join
INSERT INTO user_farm_join
    (user_id, farm_id)
    (SELECT user_id, farm_id
    FROM oldschema.user_farm_join);

-- account
INSERT INTO account
    (id, created, farm_id, name, balance, currency)
    (SELECT id, created, farm_id, name, coalesce(balance, 0), currency
    FROM oldschema.account);

-- account_transaction
INSERT INTO account_transaction
    (id, created, posted, account_id, amount, memo, fi_id, cat_likely, general_cat)
    (SELECT
        id, created, posted, account_id, amount, memo, fi_id, categories_likely,
        CASE
            WHEN skip_mirror is null or skip_mirror = false THEN
                null
            WHEN 1 <= (
                        SELECT
                            count(*)
                        FROM
                            oldschema.account_transaction as ati
                            left join oldschema.account as ai
                                on ati.account_id = ai.id
                            left join oldschema.account as bi
                                on at.account_id =
                                    bi.id
                        WHERE
                            ati.account_id <> at.account_id
                            and ai.farm_id = bi.farm_id
                            and ati.id <> at.id
                            and ati.amount = -at.amount
                            and abs(extract(epoch from (at.posted - ati.posted))) < extract(epoch from '1 month'::interval)
                        )
                THEN 'transfer'
            WHEN lower(memo) like '%transfer%'
                THEN 'transfer'
            WHEN amount > 0
                THEN 'income'
            ELSE 'unknown'
        END
    FROM oldschema.account_transaction as at)
;

-- account balance
UPDATE account as a
    SET balance=coalesce(olda.balance, 0)
    FROM oldschema.account as olda
    WHERE a.id = olda.id;

-- bucket_group
INSERT INTO bucket_group
    (id, created, farm_id, name, ranking)
    (SELECT id, created, farm_id, name, rank
    FROM oldschema.bucket_group);

-- bucket
INSERT INTO bucket
    (id, created, farm_id, name, description, balance, out_to_pasture, group_id, ranking, kind, goal, end_date, deposit, color)
    (SELECT id, created, farm_id, name, description, balance, out_to_pasture, group_id, group_rank, kind, goal, end_date, deposit, color
    FROM oldschema.bucket);

-- bucket_transaction
INSERT INTO bucket_transaction
    (id, created, bucket_id, amount, memo, account_transaction_id, posted)
    (SELECT id, created, bucket_id, amount, memo, account_transaction_id, null
    FROM oldschema.bucket_transaction);
UPDATE bucket_transaction as bt
    SET posted=at.posted
    FROM account_transaction as at
    WHERE bt.account_transaction_id = at.id;

-- bucket balance
UPDATE bucket as b
    SET balance=oldb.balance
    FROM oldschema.bucket as oldb
    WHERE b.id = oldb.id;

-- fix bucket_transaction.posted
DO $$
DECLARE
    r bucket_transaction%rowtype;
BEGIN
    FOR r IN
        (SELECT *
        FROM bucket_transaction
        WHERE posted is NULL
        ORDER BY created)
    LOOP
        -- can do some processing here
        RAISE NOTICE 'hey';
        --NEXT r;
    END LOOP;
    RETURN;
END;
$$
LANGUAGE 'plpgsql';

-- simplefin_connection
INSERT INTO simplefin_connection
    (id, created, farm_id, access_token, last_used)
    (SELECT id, created, farm_id, access_token, null
    FROM oldschema.simplefin);

-- account_mapping
INSERT INTO account_mapping
    (id, farm_id, account_id, account_hash)
    (SELECT id, farm_id, account_id, id_hash
    FROM oldschema.account_mapping);


-- fix sequences
SELECT 'SELECT SETVAL(' ||
       quote_literal(quote_ident(PGT.schemaname) || '.' || quote_ident(S.relname)) ||
       ', COALESCE(MAX(' ||quote_ident(C.attname)|| '), 1) ) FROM ' ||
       quote_ident(PGT.schemaname)|| '.'||quote_ident(T.relname)|| ';'
FROM pg_class AS S,
     pg_depend AS D,
     pg_class AS T,
     pg_attribute AS C,
     pg_tables AS PGT
WHERE S.relkind = 'S'
    AND S.oid = D.objid
    AND D.refobjid = T.oid
    AND D.refobjid = C.attrelid
    AND D.refobjsubid = C.attnum
    AND T.relname = PGT.tablename
ORDER BY S.relname;


-- stats
select count(*), coalesce(general_cat, 'nothing') from account_transaction group by 2;
select count(*), case when posted is null then 'NULL' ELSE 'SET' END FROM bucket_transaction group by 2;
