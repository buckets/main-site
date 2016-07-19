'use strict';

describe("cents2decimal", function() {
  it("should leave null null", function() {
    expect(cents2decimal(null)).toBe(null);
    expect(cents2decimal(null, true)).toBe(null);
  });
  it("should make undefined null", function() {
    expect(cents2decimal(undefined)).toBe(null);
    expect(cents2decimal(undefined)).toBe(null);
  });
  it("should convert '' to null", function() {
    expect(cents2decimal('')).toBe(null);
    expect(cents2decimal('', true)).toBe(null);
  });
  it("should convert 'foo' to 0", function() {
    expect(cents2decimal('foo')).toBe('0');
    expect(cents2decimal('foo', true)).toBe('0.00');
  });
  it("should convert positive numbers", function() {
    expect(cents2decimal(123)).toBe('1.23');
  });
  it("should convert negative numbers", function() {
    expect(cents2decimal(-123)).toBe('-1.23');
  });
  it("should not show decimals by default", function() {
    expect(cents2decimal(1000)).toBe('10');
  });
  it("should let you force decimals", function() {
    expect(cents2decimal(1000, true)).toBe('10.00');
  });
  it("should show two decimals if any", function() {
    expect(cents2decimal(110)).toBe('1.10');
  });
  it("should put commas in", function() {
    expect(cents2decimal(150012)).toBe('1,500.12');
  });
  it("should let you leave commas out", function() {
    expect(cents2decimal(150012, undefined, false)).toBe('1500.12');
  })
});

describe("decimal2cents", function() {
  it("should treat blank as 0", function() {
    expect(decimal2cents('')).toBe(0);
  })
  it("should convert non-numbers to null", function() {
    expect(decimal2cents('foo')).toBe(null);
  });
  it("should work without decimals", function() {
    expect(decimal2cents('12')).toBe(1200);
  });
  it("should work with decimals", function() {
    expect(decimal2cents('12.31')).toBe(1231);
  });
  it("should work with goofy decimals", function() {
    expect(decimal2cents('12.5')).toBe(1250);
    expect(decimal2cents('12.')).toBe(1200);
  });
  it("should work without leading digits", function() {
    expect(decimal2cents('.2')).toBe(20);
  });
  it("should work with commas", function() {
    expect(decimal2cents('1,400,234.54')).toBe(140023454);
  });
  it("should work with negative commas", function() {
    expect(decimal2cents('-1,400.00')).toBe(-140000);
  });
  it("should work with negative cents", function() {
    expect(decimal2cents('-0.45')).toBe(-45);
  })
  it("should work with negative cents, no leading 0", function() {
    expect(decimal2cents('-.99')).toBe(-99);
  })
  it("should work with incorrect precision", function() {
    expect(decimal2cents('15.438')).toBe(1543);
  });
  it("should work without commas", function() {
    expect(decimal2cents('12345.23')).toBe(1234523);
  });
  it("should handle negative numbers", function() {
    expect(decimal2cents('-32.43')).toBe(-3243);
  });
  it("should ignore leading zeros", function() {
    expect(decimal2cents('0003')).toBe(300);
  });
  it("should strip leading and trailing whitespace", function() {
    expect(decimal2cents('   45.5   ')).toBe(4550);
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
//       expect(X('2+2')).toBe('4');
//     });
//     it("should handle commas", function() {
//       expect(X('-1,200.43')).toBe('-1200.43');
//     });
//     it("should handle commas in expressions", function() {
//       expect(X('20,000-18,000')).toBe('2000');
//     })
//   });
// });
