import { test } from 'tap'
import { cents2decimal, decimal2cents, fancyEval } from './money';

test('cents2decimal', t => {
  // edge cases
  t.equal(cents2decimal(null), null)
  t.equal(cents2decimal(null, {show_decimal: true}), null)
  t.equal(cents2decimal(undefined), null)
  t.equal(cents2decimal(Infinity), '∞');
  t.equal(cents2decimal(''), null);
  t.equal(cents2decimal('foo'), '0');

  // numbers
  t.equal(cents2decimal(123), '1.23');
  t.equal(cents2decimal(-123), '-1.23');
  t.equal(cents2decimal(1000), '10');
  t.equal(cents2decimal(1000, {
    show_decimal: true,
  }), '10.00');
  t.equal(cents2decimal(110), '1.10');
  t.equal(cents2decimal(150012), '1,500.12');
  t.equal(cents2decimal(150012, {
    show_sep: false,
  }), '1500.12');
  t.equal(cents2decimal(2222, {round: true}), '22')
  t.equal(cents2decimal(2222, {round: true, show_decimal: true}), '22.00')
  t.end();
})
test('decimal2cents', t => {
  // edge cases
  t.equal(decimal2cents(''), 0);
  t.equal(decimal2cents('foo'), null);

  // numbers
  t.equal(decimal2cents('12'), 1200);
  t.equal(decimal2cents('12.31'), 1231);
  t.equal(decimal2cents('12.5'), 1250);
  t.equal(decimal2cents('12.'), 1200);
  t.equal(decimal2cents('.2'), 20);
  t.equal(decimal2cents('1,400,234.54'), 140023454);
  t.equal(decimal2cents('-1,400.00'), -140000);
  t.equal(decimal2cents('-0.45'), -45);
  t.equal(decimal2cents('-.99'), -99);
  t.equal(decimal2cents('15.438'), 1543);
  t.equal(decimal2cents('12345.23'), 1234523);
  t.equal(decimal2cents('-32.43'), -3243);
  t.equal(decimal2cents('0003'), 300);
  t.equal(decimal2cents('   45.5   '), 4550);
  t.end();
})
test('fancyEval', t => {
  t.equal(fancyEval('2+2'), "4");
  t.equal(fancyEval('-1,200.43'), "-1200.43");
  t.equal(fancyEval('20,000-18,000'), "2000");
  t.end();
})
