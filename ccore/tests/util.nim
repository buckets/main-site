import os
import random
import strformat
import logging

var L = newConsoleLogger()
addHandler(L)

randomize()

proc tmpDir*(): string =
  result = os.getTempDir() / &"bucketstest{random.rand(10000000)}"
  result.createDir()
