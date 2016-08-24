import contextlib

from sqlalchemy.engine import Connection


def transaction_per_request(app, engine_getter=lambda app:app._engine):
    """
    Given an app with an `_engine` attribute that's an SQLAlchemy engine,
    make sure each request has access to a `g.engine` connection that
    lives within a transaction.

    XXX make this lazy (so that requests that don't use the db are
        fast)
    """
    from flask import g

    @app.before_request
    def begin():
        g.conn = app._engine.connect()
        g._dbtrans = g.conn.begin()

    @app.teardown_request
    def commit_or_rollback(response):
        if '_dbtrans' in g:
            try:
                g._dbtrans.commit()
            except Exception:
                g._dbtrans.rollback()
                raise
            finally:
                g.conn.close()
        return response


@contextlib.contextmanager
def begin(conn):
    """
    Uniform, nestable transaction beginning with with statements.

    Use like this:

        with begin(engine) as conn:
            ...

        with begin(connection) as conn:
            ...

    @param conn: Either a SQLAlchemy Engine or Connection
    """
    if isinstance(conn, Connection):
        # Connection
        trans = conn.begin()
        try:
            yield conn
            trans.commit()
        except:
            trans.rollback()
            raise
    else:
        # Engine
        engine = conn
        conn = engine.connect()
        trans = conn.begin()
        try:
            yield conn
            trans.commit()
        except:
            trans.rollback()
            raise
        finally:
            conn.close()

