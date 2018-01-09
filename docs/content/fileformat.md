---
title: 'File Format'
date: 2018-01-09T11:36:13-07:00
draft: false
---

Buckets budget files are SQLite databases.  The schema is mostly self-explanatory, but this document points out some things that aren't.

<warning>
**WARNING:** The schema is not final and may change without warning in future versions of Buckets.
</warning>

If you still have questions after reading this, feel free to chat with me.

## Concurrency

It's not a good idea to do data-manipulating operations (`INSERT`, `UPDATE`, `DELETE`, etc...) on the same budget file from more than one process at a time.  So before you manipulate data outside of Buckets, close the budget file inside Buckets.


## Amounts

Amounts are stored as integers, not floats.  For USD (and most other currencies), this means that amounts are integer cents.

In this example, account 1 has a balance of $6,500:

{{< highlight text>}}
sqlite> SELECT balance FROM account WHERE id=1;
650000
sqlite> SELECT printf("%.2f", balance/100.0) AS balance FROM account WHERE id=1;
6500.00
{{< / highlight >}}


## Inserting transactions

Insert bank/account transactions into the `account_transaction` table.  Be aware of the following:

- The `fi_id` column represents an account-unique ID (typically assigned by the bank) for a transaction.
- `general_cat` should be one of the strings `""`, `"income"`, or `"transfer"`.

Account and bucket balances are automatically updated (by SQLite triggers) when transactions are inserted/updated/deleted.

