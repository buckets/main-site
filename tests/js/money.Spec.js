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


describe("computeBucketDeposit", function() {
  var compute = computeBucketDeposit;

  // -----------------------------------------------------------------
  describe("for kind==", function() {
    var result;

    beforeEach(function() {
      result = compute({
        kind:"",
        deposit: 1200,
        goal: 3000,
        end_date: "2001-04-02",
        balance: null
      });
    });
    it("should have a null deposit", function() {
      expect(result.deposit).toBe(null);
    });
    it("should have a null goal", function() {
      expect(result.goal).toBe(null);
    });
    it("should have a null end_date", function() {
      expect(result.end_date).toBe(null);
    });
    it("should have a null goal_percent", function() {
      expect(result.goal_percent).toBe(null);
    });
  });

  // -----------------------------------------------------------------
  describe("for kind==deposit", function() {
    var result;

    beforeEach(function() {
      result = compute({
        kind: "deposit",
        deposit: 2000,
        goal: 2300,
        end_date: "2001-04-02",
        balance: null
      });
    });

    it("should have a deposit", function() {
      expect(result.deposit).toBe(2000);
    });
    it("should have a null goal", function() {
      expect(result.goal).toBe(null);
    });
    it("should have a null end_date", function() {
      expect(result.end_date).toBe(null);
    });
    it("should have a null goal_percent", function() {
      expect(result.goal_percent).toBe(null);
    });
  });

  // -----------------------------------------------------------------
  describe("for kind==goal", function() {
    var input;
    var setToday;
    var DateMath;

    beforeEach(inject(function(_DateMath_) {
      DateMath = _DateMath_;
      setToday = function(value) {
        DateMath.today = function() { return value; };
      };

      input = {
        kind: "goal",
        deposit: 2000,
        goal: 2300,
        end_date: null,
        balance: 0
      };
    }));

    it("should produce null values if everything is null", function() {
      input.goal = null;
      input.deposit = null;
      input.end_date = null;
      var res = compute(input);
      expect(res.goal).toBe(null);
      expect(res.deposit).toBe(null);
      expect(res.end_date).toBe(null);
      expect(res.goal_percent).toBe(null);
    });

    it("the date should be correct if the goal is reached", function() {
      input.goal = 10;
      input.deposit = 1;
      input.balance = 15;
      setToday("2001-01-01 10:55");
      var res = compute(input);
      expect(res.end_date).toBe("2001-01-01");
    });

    it("should regurgitate the goal", function() {
      var res = compute(input);
      expect(res.goal).toBe(2300);
    });

    it("should ignore invalid dates", function() {
      input.goal = 10;
      input.deposit = null;
      input.end_date = '23';
      var res = compute(input);
      expect(res.goal).toBe(10);
      expect(res.deposit).toBe(null);
      expect(res.end_date).toBe(null);
      expect(res.goal_percent).toBe(0);
    });

    describe("the goal_percent", function() {
      it("should exist", function() {
        input.balance = 1500;
        var res = compute(input);
        expect(res.goal_percent).toBe(100 * 1500 / 2300);
      });

      it("should handle goals of 0", function() {
        input.goal = 0;
        var res = compute(input);
        expect(res.goal_percent).toBe(null);
      });

      it("should not exceed 100", function() {
        input.goal = 20;
        input.balance = 2600;
        var res = compute(input);
        expect(res.goal_percent).toBe(100);
      });

      it("should not be lower than 0", function() {
        input.goal = 2500;
        input.balance = -2500;
        var res = compute(input);
        expect(res.goal_percent).toBe(0);
      });
    });

    describe("when end_date and deposit are null", function() {
      it("should leave them as null", function() {
        input.deposit = null;
        input.end_date = null;
        var res = compute(input);
        expect(res.end_date).toBe(null);
        expect(res.deposit).toBe(null);
      });
    });

    describe("when end_date and deposit are both set", function() {
      it("should favor end_date", function() {
        setToday("2001-01-01");
        input.goal = 2000;
        input.deposit = 123;
        input.balance = 0;
        input.end_date = "2001-03-01";
        var res = compute(input);
        expect(res.end_date).toBe("2001-03-01");
        expect(res.deposit).toBe(1000);
      });
    });

    describe("when end_date is null", function() {

      it("should carry the deposit through", function() {
        expect(compute(input).deposit).toBe(2000);
      });

      it("should compute the end date", function() {
        setToday("2001-01-01");
        input.goal = 2000;
        input.deposit = 1000;
        input.balance = 0;
        var res = compute(input);
        expect(res.end_date).toBe("2001-03-01");
      });

      it("should compute end_date for blank string end_date", function() {
        setToday("2001-01-01");
        input.end_date = "";
        input.goal = 2000;
        input.deposit = 1000;
        input.balance = 0;
        var res = compute(input);
        expect(res.end_date).toBe("2001-03-01");
      });

      it("should compute the end date based on the balance", function() {
        setToday("2001-01-01");
        input.goal = 2000;
        input.deposit = 1000;
        input.balance = 1500;
        var res = compute(input);
        expect(res.end_date).toBe("2001-02-01");
      });

      it("should know when the goal is done", function() {
        setToday("2001-01-01");
        input.goal = 2000;
        input.deposit = 1000;
        input.balance = 3000;
        var res = compute(input);
        expect(res.end_date).toBe("2001-01-01");
      });

      it("should know when a goal will never be reached", function() {
        setToday("2001-01-01");
        input.goal = 2000;
        input.deposit = 0;
        input.balance = 1999;
        var res = compute(input);
        expect(res.end_date).toBe(null);
      });

    });

    describe("when deposit is null", function() {

      beforeEach(function() {
        setToday("2001-01-01");
        input.deposit = null;
        input.end_date = "2001-03-01";
      });

      it("should carry the end_date through", function() {
        expect(compute(input).end_date).toBe("2001-03-01");
      });

      it("should compute based on end_date", function() {
        input.goal = 2000;
        input.balance = 0;
        var res = compute(input);
        expect(res.deposit).toBe(1000);
      });

      it("should know when the goal has already been reached", function() {
        input.goal = 2000;
        input.balance = 3500;
        expect(compute(input).deposit).toBe(0);
      });

      it("should know when the target date has passed", function() {
        input.goal = 2000;
        input.balance = 0;
        input.end_date = "2000-12-31";
        expect(compute(input).deposit).toBe(2000);
      });
    });

  });
});
