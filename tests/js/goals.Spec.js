

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

    beforeEach(function() {
      input = {
        kind: "goal",
        deposit: 2000,
        goal: 2300,
        end_date: null,
        balance: 0
      };
    });

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
      input.today = "2001-01-01";
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
        input.today = "2001-01-01";
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
        input.today = "2001-01-01";
        input.goal = 2000;
        input.deposit = 1000;
        input.balance = 0;
        var res = compute(input);
        expect(res.end_date).toBe("2001-03-01");
      });

      it("should compute end_date for blank string end_date", function() {
        input.today = "2001-01-01";
        input.end_date = "";
        input.goal = 2000;
        input.deposit = 1000;
        input.balance = 0;
        var res = compute(input);
        expect(res.end_date).toBe("2001-03-01");
      });

      it("should compute the end date based on the balance", function() {
        input.today = "2001-01-01";
        input.goal = 2000;
        input.deposit = 1000;
        input.balance = 1500;
        var res = compute(input);
        expect(res.end_date).toBe("2001-02-01");
      });

      it("should know when the goal is done", function() {
        input.today = "2001-01-01";
        input.goal = 2000;
        input.deposit = 1000;
        input.balance = 3000;
        var res = compute(input);
        expect(res.end_date).toBe("2001-01-01");
      });

      it("should know when a goal will never be reached", function() {
        input.today = "2001-01-01";
        input.goal = 2000;
        input.deposit = 0;
        input.balance = 1999;
        var res = compute(input);
        expect(res.end_date).toBe(null);
      });

    });

    describe("when deposit is null", function() {

      beforeEach(function() {
        input.today = "2001-01-01";
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
