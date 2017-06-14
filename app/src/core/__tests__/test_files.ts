import {BudgetFile} from '../files';
import {expect} from 'chai';
import 'mocha'

let bf;
beforeEach(() => {
  bf = new BudgetFile();
})

it('should know about windows', () => {
  expect(bf.windows).to.eq([]);
});
