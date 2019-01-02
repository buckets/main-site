# Buckets

This repository contains most Buckets code.

## Dependency tree

    app --> core --> nodebuckets --> ccore
                                      ^
                                      |
                                    mobile

## Update the Node Buckets lib

If you've made changes to the C Buckets library, you can roll a new Node library as follows:

    cd nodebuckets
    npm i
    make clean && make && make test
