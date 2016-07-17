
from decimal import Decimal


def money(xint):
    d = Decimal('{0}'.format(xint)) / 100
    return str(d)


all_filters = {
    'money': money,
}