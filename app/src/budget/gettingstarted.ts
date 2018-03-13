import { manager } from './appstate'
import { sss } from '../i18n'
import { localNow, parseLocalTime, ts2utcdb } from '../time'
import { Bucket } from '../models/bucket'

export async function createTemplateBucketSet() {
  const store = manager
  .checkpoint(sss('Create Template'))

  const template = [
    {
      name: sss('Needs'),
      buckets: [
        {
          name: sss("Charity"),
          kind: 'deposit',
        },
        {
          name: sss("Rent/Mortgage"),
          kind: 'deposit',
        },
        {
          name: sss("Groceries"),
          kind: 'deposit',
        },
        {
          name: sss("Fuel"),
          kind: 'deposit',
        },
        {
          name: sss("Phone"),
          kind: 'deposit',
        },
        {
          name: sss("Electricity"),
          kind: 'deposit',
        },
        {
          name: sss("Water"),
          kind: 'deposit',
        },
        {
          name: sss("Natural gas/propane/oil"),
          kind: 'deposit',
        },
        {
          name: sss("Medical"),
          kind: 'deposit',
        },
        {
          name: sss("Clothing"),
          kind: 'deposit',
        },
        {
          name: sss("Household goods"),
          kind: 'deposit',
        },
        {
          name: sss("Diapers"),
          kind: 'deposit',
        },
        {
          name: sss("Spending Money"),
          kind: 'deposit',
        },
        {
          name: sss("Babysitting"),
          kind: 'deposit',
        },
        {
          name: sss("Tuition"),
          kind: 'goal-date',
          goal: 300000,
          end_date: localNow().add(6, 'months').startOf('month').format(),
        },
        {
          name: sss("Any other monthly bills you have?"),
          kind: 'deposit',
        },
      ]
    },
    {
      name: sss('Debt'),
      buckets: [
        {
          name: sss("Car Payment"),
          kind: 'deposit',
        },
        {
          name: sss("Student Loan Payment"),
          kind: 'deposit',
        },
        {
          name: sss("Personal Loan Payment"),
          kind: 'deposit',
        },
      ]
    },
    {
      name: sss('Preparation'),
      buckets: [
        {
          name: sss("Car Insurance"),
          kind: 'deposit',
        },
        {
          name: sss("Car Maintenance"),
          kind: 'deposit',
        },
        {
          name: sss("Life Insurance"),
          kind: 'deposit',
        },
        {
          name: sss("Health Insurance"),
          kind: 'deposit',
        },
        {
          name: sss("Year's Supply"),
          kind: 'goal-deposit',
          goal: 1000000,
          deposit: 10000,
        },
      ]
    },
    {
      name: sss('Wants'),
      buckets: [
        {
          name: sss("Eating out"),
          kind: 'deposit',
        },
        {
          name: sss("Internet"),
          kind: 'deposit',
        },
        {
          name: sss("Cable TV"),
          kind: 'deposit',
        },
        {
          name: sss("Holidays"),
          kind: 'deposit',
        },
        {
          name: sss("Birthdays"),
          kind: 'deposit',
        },
        {
          name: sss("Vacation "),
          kind: 'deposit',
        },
        {
          name: sss("New car"),
          kind: 'goal-deposit',
          goal: 3000000,
          deposit: 25000,
        },
        {
          name: sss("New phone"),
          kind: 'deposit',
        },
        {
          name: sss("New computer"),
          kind: 'deposit',
        },
        {
          name: sss("New roof"),
          kind: 'deposit',
        },

      ]
    }
  ]

  for (const group_template of template) {
    const group = await store.buckets.addGroup({name: group_template.name});

    for (const btmpl of group_template.buckets) {
      let bucket = await store.buckets.add({
        name: btmpl.name,
        group_id: group.id,
      })
      const update = btmpl as Partial<Bucket>;
      if (update.end_date) {
        update.end_date = ts2utcdb(parseLocalTime(update.end_date))
      }
      await store.buckets.update(bucket.id, update)
    }
  }
}