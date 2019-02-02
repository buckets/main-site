To get the income data from Stripe and Paypal into the Google Drive spreadsheet:

1. Sign in to stripe.com
2. For both Buckets and SimpleFIN do the following:
   1. Click "Payments"
   2. Click "Export"
   3. Click "Previous month"
   4. Click "Export"
3. Sign in to paypal.com
   1. Click "Activity"
   2. Change "All transactions" to "Payments received"
   3. Change the date to the previous month
   4. Click "Download"
   5. Change "Transaction type" to "Completed payments"
   6. Click "Create Report"

4. Run `./convert-payment-csv.py ~/Desktop/payments*.csv ~/Desktop/Download.CSV`
5. Copy and paste the output into the buckets > Buckets Finances spreadsheet.



