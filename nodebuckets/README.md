This Node module provides JS bindings for the Buckets Nim/C library.

To build, do:

    npm i
    make clean && make && make test

Changes in the buckets C library need to have corresponding changes in:

- ./jstonimbinding.cpp
- ./jssrc/main.ts
