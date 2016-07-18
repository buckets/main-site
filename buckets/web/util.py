from decimal import Decimal
import sys

def fmtMoney(xint):
    sys.stdout.flush()
    xint = xint or 0
    d = Decimal('{0}'.format(xint)) / 100
    ret = '{:,}'.format(d)
    if '.' not in ret:
        ret += '.00'
    fore, aft = ret.split('.', 1)
    if len(aft) != 2:
        ret = '{0}.{1}'.format(fore, (aft + '00')[:2])
    sys.stdout.flush()
    return ret


def parseMoney(s):
    s = (s or '0').replace(',', '')
    d = Decimal(s)
    return int(d * 100)


all_filters = {
    'money': fmtMoney,
}
