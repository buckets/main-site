import {expect} from 'chai';
import 'mocha';

import {cents2decimal, decimal2cents} from './money';


describe("cents2decimal", function() {
  it("should leave null null", function() {
    expect(cents2decimal(null)).to.eq(null);
    expect(cents2decimal(null, {
      show_decimal: true,
    })).to.eq(null);
  });
  it("should make undefined null", function() {
    expect(cents2decimal(undefined)).to.eq(null);
    expect(cents2decimal(undefined)).to.eq(null);
  });
  it("should convert '' to null", function() {
    expect(cents2decimal('')).to.eq(null);
    expect(cents2decimal('', {
      show_decimal: true,
    })).to.eq(null);
  });
  it("should convert 'foo' to 0", function() {
    expect(cents2decimal('foo')).to.eq('0');
    expect(cents2decimal('foo', {
      show_decimal: true,
    })).to.eq('0.00');
  });
  it("should convert positive numbers", function() {
    expect(cents2decimal(123)).to.eq('1.23');
  });
  it("should convert negative numbers", function() {
    expect(cents2decimal(-123)).to.eq('-1.23');
  });
  it("should not show decimals by default", function() {
    expect(cents2decimal(1000)).to.eq('10');
  });
  it("should let you force decimals", function() {
    expect(cents2decimal(1000, {
      show_decimal: true,
    })).to.eq('10.00');
  });
  it("should show two decimals if any", function() {
    expect(cents2decimal(110)).to.eq('1.10');
  });
  it("should put commas in", function() {
    expect(cents2decimal(150012)).to.eq('1,500.12');
  });
  it("should let you leave commas out", function() {
    expect(cents2decimal(150012, {
      show_sep: false,
    })).to.eq('1500.12');
  })
});

describe("decimal2cents", function() {
  it("should treat blank as 0", function() {
    expect(decimal2cents('')).to.eq(0);
  })
  it("should convert non-numbers to null", function() {
    expect(decimal2cents('foo')).to.eq(null);
  });
  it("should work without decimals", function() {
    expect(decimal2cents('12')).to.eq(1200);
  });
  it("should work with decimals", function() {
    expect(decimal2cents('12.31')).to.eq(1231);
  });
  it("should work with goofy decimals", function() {
    expect(decimal2cents('12.5')).to.eq(1250);
    expect(decimal2cents('12.')).to.eq(1200);
  });
  it("should work without leading digits", function() {
    expect(decimal2cents('.2')).to.eq(20);
  });
  it("should work with commas", function() {
    expect(decimal2cents('1,400,234.54')).to.eq(140023454);
  });
  it("should work with negative commas", function() {
    expect(decimal2cents('-1,400.00')).to.eq(-140000);
  });
  it("should work with negative cents", function() {
    expect(decimal2cents('-0.45')).to.eq(-45);
  })
  it("should work with negative cents, no leading 0", function() {
    expect(decimal2cents('-.99')).to.eq(-99);
  })
  it("should work with incorrect precision", function() {
    expect(decimal2cents('15.438')).to.eq(1543);
  });
  it("should work without commas", function() {
    expect(decimal2cents('12345.23')).to.eq(1234523);
  });
  it("should handle negative numbers", function() {
    expect(decimal2cents('-32.43')).to.eq(-3243);
  });
  it("should ignore leading zeros", function() {
    expect(decimal2cents('0003')).to.eq(300);
  });
  it("should strip leading and trailing whitespace", function() {
    expect(decimal2cents('   45.5   ')).to.eq(4550);
  });
});

// describe("mathjs", function() {
//   "use strict";
//   var _mathjs;

//   beforeEach(function() {
//     angular.module("config", []);
//     module("buckets");
//     inject(function(mathjs) {
//       _mathjs = mathjs;
//     });
//   });

//   describe("fancyEval", function() {
//     var X;
//     beforeEach(function() {
//       X = _mathjs.fancyEval;
//     })
//     it("should do simple math", function() {
//       expect(X('2+2')).to.eq('4');
//     });
//     it("should handle commas", function() {
//       expect(X('-1,200.43')).to.eq('-1200.43');
//     });
//     it("should handle commas in expressions", function() {
//       expect(X('20,000-18,000')).to.eq('2000');
//     })
//   });
// });
