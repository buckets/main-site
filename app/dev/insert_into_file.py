#!/usr/bin/env python
import click
import io
import sys

@click.command()
@click.option('-i', '--source-file', required=True)
@click.option('-d', '--data',
    help='Content to insert.  Will read from stdin if not provided.')
@click.option('-s', '--start-marker', required=True)
@click.option('-e', '--end-marker', required=True)
@click.option('--inplace', is_flag=True)
def insert(source_file, data, start_marker, end_marker, inplace):
    if type(data) == unicode:
        data = data.encode('utf8')
    res = ''
    with io.open(source_file, 'r', encoding='utf8') as fh:
        guts = fh.read()
        pre, rest = guts.split(start_marker, 1)
        _, post = rest.split(end_marker, 1)
        res = '{pre}{start_marker}{data}\n{end_marker}{post}'.format(**locals())
    if inplace:
        with io.open(source_file, 'wb') as fh:
            fh.write(res)
    else:
        sys.stdout.write(res)

if __name__ == '__main__':
    insert()