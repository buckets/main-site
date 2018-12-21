import unittest
import os
import strformat
import buckets

import ./util

test "new file":
  let filename = tmpDir()/"newfile.buckets"
  let bf = openBudgetFile(filename)

test "reopen file":
  let filename = tmpDir()/"reopen.buckets"
  let bf = openBudgetFile(filename)
  bf.close()
  let bf2 = openBudgetFile(filename)
  check bf.id != bf2.id
