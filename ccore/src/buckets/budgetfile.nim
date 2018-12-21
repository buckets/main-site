import logging
import db_sqlite
import sqlite3 except close
import strformat
import sequtils
import strutils
import tables

import dbschema
import db

type
  BudgetFile* = ref object
    id*: int
    db*: DbConn
    filename*: string

var
  nextid: int
  id2BudgetFile = initTable[int, BudgetFile]()


proc upgradeSchema*(bf:Budgetfile) =
  ## Apply all database patches to this budget file
  logging.debug "Upgrading schema ..."
  
  # See what patches have already been applied
  bf.db.exec(sql"""
  CREATE TABLE IF NOT EXISTS _schema_version (
    id INTEGER PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT UNIQUE
  )""")
  var applied:seq[string]
  for row in bf.db.instantRows(sql"SELECT name FROM _schema_version"):
    applied.add(row[0])
  logging.debug &"Applied patches: {applied}"
  
  # Apply patches
  var order = 0
  for migration in migrations:
    inc(order)
    let padded_order = align(order.intToStr(), 4, '0')
    let fullname = &"{padded_order}-{migration.name}"
    if fullname in applied:
      logging.debug &"Patch {fullname} already applied."
      continue
    logging.debug &"applying patch: {fullname}"
    bf.db.exec(sql"BEGIN")
    try:
      migration.fn(bf.db)
      bf.db.exec(sql"INSERT INTO _schema_version (name) VALUES (?)", fullname)
      bf.db.exec(sql"COMMIT")
    except:
      logging.error &"error applying patch {fullname}: {getCurrentExceptionMsg()}"
      bf.db.exec(sql"ROLLBACK")
      raise
  logging.debug "Schema upgrade complete"
  logging.debug bf.db.fetchAll(sql"SELECT * from _schema_version")

proc openBudgetFile*(filename:string) : BudgetFile =
  new(result)
  logging.info &"Opening file {filename}"
  result.id = nextid
  inc(nextid)
  id2BudgetFile[result.id] = result
  result.db = db_sqlite.open(filename, "", "", "")
  result.filename = filename
  result.upgradeSchema()

proc getBudgetFile*(id:int):BudgetFile =
  ## Convert a budget file handle id to a BudgetFile object
  id2BudgetFile[id]

proc close*(bf:Budgetfile) =
  logging.info &"Closing file {bf.filename}"
  db_sqlite.close(bf.db)
  id2BudgetFile.del(bf.id)


  
