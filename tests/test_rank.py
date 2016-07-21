import pytest
from buckets.rank import rankBetween


def test_None_None():
    rank = rankBetween(None, None)
    assert rank is not None
    assert rank > 'a'
    assert rank < 'z'

def test_None_letter():
    rank = rankBetween(None, 'z')
    assert rank > 'a'
    assert rank < 'z'

def test_letter_None():
    rank = rankBetween('a', None)
    assert rank > 'a'
    assert rank < 'z'

def test_letter_letter():
    rank = rankBetween('b', 'd')
    assert rank > 'b'
    assert rank < 'd'

def test_double_letter():
    rank = rankBetween('b', 'c')
    assert rank > 'b'
    assert rank < 'c'

def test_many_many():
    rank = rankBetween('bbbb', 'bbc')
    assert rank > 'bbbb'
    assert rank < 'bbc'

def test_uneven():
    rank = rankBetween('a', 'hhh')
    assert rank > 'a'
    assert rank < 'hhh'

def test_wrong_order():
    rank = rankBetween('c', 'b')
    assert rank > 'b'
    assert rank < 'c'

def test_same_letter():
    with pytest.raises(Exception):
        rankBetween('b', 'b')

def test_whole_bunch():
    things = ['b']
    for i in xrange(10):
        things.append(rankBetween(things[-1], None))
    assert things == sorted(things), "Should stay in order"