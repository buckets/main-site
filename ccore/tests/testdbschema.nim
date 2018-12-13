# This is just an example to get you started. You may wish to put all of your
# tests into a single file, or separate them into multiple `test1`, `test2`
# etc. files (better names are recommended, just make sure the name starts with
# the letter 't').
#
# To run these tests, simply execute `nimble test`.

import unittest
import os
import random
import strformat
import logging

var L = newConsoleLogger()
addHandler(L)

randomize()

proc tmpDir(): string {.used.} =
  result = os.getTempDir() / &"bucketstest{random.rand(10000000)}"
  result.createDir()

proc pathToWiishRoot(): string =
  currentSourcePath.absolutePath.parentDir.parentDir


import buckets

test "new file":
  let filename = tmpDir()/"budget.buckets"
  discard openBudgetFile(filename)

test "reopen file":
  let filename = tmpDir()/"budget.buckets"
  let bf = openBudgetFile(filename)
  bf.close()
  discard openBudgetFile(filename)
