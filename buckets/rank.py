
from itertools import izip_longest


def rankBetween(start, end):
    start = start or 'a'
    end = end or 'z'
    start, end = sorted([start, end])
    if start == end:
        raise ValueError("Can't rank between equal values: {0} {1}".format(start, end))
    ret = []
    for (a,b) in izip_longest(start, end, fillvalue=None):
        a = ord(a or 'a')
        b = ord(b or 'z')
        if a == b:
            ret.append(chr(a))
        else:
            num = (b - a) / 2 + a
            ret.append(chr(num))
    ret = ''.join(ret)
    if ret == start:
        ret += 'm'
    return ret
