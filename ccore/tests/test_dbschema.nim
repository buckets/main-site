# This is just an example to get you started. You may wish to put all of your
# tests into a single file, or separate them into multiple `test1`, `test2`
# etc. files (better names are recommended, just make sure the name starts with
# the letter 't').
#
# To run these tests, simply execute `nimble test`.

import unittest
import os
import strformat
import buckets

import ./util

test "new file":
  let filename = tmpDir()/"newfile.buckets"
  discard openBudgetFile(filename)

test "reopen file":
  let filename = tmpDir()/"reopen.buckets"
  let bf = openBudgetFile(filename)
  bf.close()
  let bf2 = openBudgetFile(filename)
  check bf.id != bf2.id
