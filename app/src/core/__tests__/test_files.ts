import {BudgetFile} from '../files';
import {} from 'jest';

let bf;
beforeEach(() => {
  bf = new BudgetFile();
})

test('should know about windows', () => {
  expect(bf.windows).toEqual([]);
});
