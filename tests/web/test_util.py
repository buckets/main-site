import pytest

from buckets.web.util import fmtMoney, parseMoney, fmtMonth
from buckets.web.util import CSRF
from buckets.error import Forbidden
from datetime import date

from jose import JWTError


def test_fmtMoney():
    assert fmtMoney(5678) == '56.78'
    assert fmtMoney(-100) == '-1'
    assert fmtMoney(-100, True) == '-1.00'
    assert fmtMoney(123456789) == '1,234,567.89'
    assert fmtMoney(6500000) == '65,000'
    assert fmtMoney(1) == '0.01'
    assert fmtMoney(20) == '0.20'
    assert fmtMoney(None) == '0'
    assert fmtMoney(None, True) == '0.00'
    assert fmtMoney(5678, truncate=True) == '56'
    assert fmtMoney(100, truncate=True) == '1'


def test_parseMoney():
    assert parseMoney('56.78') == 5678
    assert parseMoney('-1') == -100
    assert parseMoney('-0.20') == -20
    assert parseMoney('-.20') == -20
    assert parseMoney('.20') == 20
    assert parseMoney('-.2') == -20
    assert parseMoney('0.04') == 4
    assert parseMoney('1,222,333.4') == 122233340
    assert parseMoney('1,2,3,44,5') == 12344500
    assert parseMoney('123.426') == 12342
    assert parseMoney(' -45') == -4500
    assert parseMoney('') == 0
    assert parseMoney(None) == 0


def test_fmtMonth():
    assert fmtMonth('2010-01-01') == 'Jan 2010'
    assert fmtMonth(date(2010, 1, 1)) == 'Jan 2010'
    assert fmtMonth(None) == ''
    assert fmtMonth('') == ''


def test_csrf():
    csrf = CSRF('SOME SECRET')
    token1 = csrf.create_csrf(15)
    csrf.verify_csrf(15, token1)
    with pytest.raises(Forbidden):
        csrf.verify_csrf(10, token1)

def test_signature():
    csrf1 = CSRF('SOME SECRET')
    csrf2 = CSRF('hello my guy')
    token1 = csrf1.create_csrf(15)
    with pytest.raises(JWTError):
        csrf2.verify_csrf(10, token1)
