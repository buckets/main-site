import {MatcherMaster} from './routing';
import {expect} from 'chai';
import 'mocha';


describe('MatcherMaster', () => {
  let master:MatcherMaster;
  beforeEach(async () => {
    master = new MatcherMaster();
  })
  it('should match integers', () => {
    let matcher = master.makeMatcher('/<int:foo>');
    let match = matcher('/576');
    expect(match.matched_string).to.eq('/576');
    expect(match.params).to.deep.eq({foo: 576});
    expect(match.rest).to.eq('');
    expect(match.exact).to.eq(true);
  });
  it('should include the rest of the string', () => {
    let matcher = master.makeMatcher('/<int:foo>');
    let match = matcher('/576/hello');
    expect(match.matched_string).to.eq('/576');
    expect(match.params).to.deep.eq({foo: 576});
    expect(match.rest).to.eq('/hello');
    expect(match.exact).to.eq(false);
  })
  it('should match strings except /', () => {
    let matcher = master.makeMatcher('/<str:foo>');
    let match = matcher('/goofy/hello');
    expect(match.matched_string).to.eq('/goofy');
    expect(match.params).to.deep.eq({foo: 'goofy'});
    expect(match.rest).to.eq('/hello');
    expect(match.exact).to.eq(false);
  })
  it('should handle complex stuff', () => {
    let matcher = master.makeMatcher('/pre-<str:foo>-<int:num>/<int:id>');
    let match = matcher('/pre-hello-26/99');
    expect(match.matched_string).to.eq('/pre-hello-26/99');
    expect(match.params).to.deep.eq({
      foo: 'hello',
      num: 26,
      id: 99,
    });
    expect(match.rest).to.eq('');
    expect(match.exact).to.eq(true);
  })
  it("should not match if it doesn't match", () => {
    let matcher = master.makeMatcher('/pre-<str:foo>');
    let match = matcher('/goofy/hello');
    expect(match).to.eq(null);
  })
  it("should let you only match exactly", () => {
    let matcher = master.makeMatcher('/hello', {exact: true});
    let match = matcher('/hello/friends');
    expect(match).to.eq(null);
    match = matcher('/hello');
    expect(match.matched_string).to.eq('/hello');
  })
});