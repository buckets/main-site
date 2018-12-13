{.compile: "./sqlite3/sqlite3.c" .}
{.passC: "-dSQLITE_ENABLE_JSON1" .}
{.passC: "-dSQLITE_THREADSAFE=0" .}
{.passC: "-dSQLITE_DEFAULT_MEMSTATUS=0" .}
{.passC: "-dSQLITE_DEFAULT_WAL_SYNCHRONOUS=1" .}
{.passC: "-dSQLITE_LIKE_DOESNT_MATCH_BLOBS" .}
{.passC: "-dSQLITE_MAX_EXPR_DEPTH=0" .}
{.passC: "-dSQLITE_OMIT_DECLTYPE" .}
{.passC: "-dSQLITE_OMIT_DEPRECATED" .}
{.passC: "-dSQLITE_OMIT_PROGRESS_CALLBACK" .}
{.passC: "-dSQLITE_OMIT_SHARED_CACHE" .}
{.passC: "-dSQLITE_USE_ALLOCA" .}

import db_sqlite
export db_sqlite

