#!/usr/bin/env python
import csv
import sys
import io
from datetime import datetime
from decimal import Decimal as D

output = []

stripe_csv_filenames = sys.argv[1:]
for filename in stripe_csv_filenames:
    with io.open(filename, 'rb') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if 'Seller Message' in row:
                # Stripe
                if row['Status'] != 'Paid':
                    continue
                # From the google spreadsheet
                # Date, Payer, Account, Description, Gross, Net, ID
                amount = D(row['Converted Amount'])
                fee = D(row['Fee'])
                d = datetime.strptime(row['Created (UTC)'][:10], '%Y-%m-%d').date()
                output.append([
                    d.isoformat(),
                    row['Customer Email'][:4] + '...',
                    'Stripe',
                    row['Description'],
                    str(amount),
                    str(amount - fee),
                    row['id'],
                ])
            elif 'Transaction ID' in row:
                # PayPal
                gross = D(row['Gross'])
                if gross <= 0:
                    # not a payment
                    continue
                if row['Status'] != 'Completed':
                    continue
                net = D(row['Net'])
                d = datetime.strptime(row['\xef\xbb\xbf"Date"'], '%m/%d/%Y').date()
                output.append([
                    d.isoformat(),
                    row['Name'][:5] + '...',
                    'PayPal',
                    row['Item Title'],
                    str(gross),
                    str(net),
                    row['Transaction ID'],
                ])

output = sorted(output, key=lambda x:x[0])

for row in output:
    print '\t'.join(row)
