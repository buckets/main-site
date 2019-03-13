import { test } from 'tap'
import { ofx2importable } from './ofx'
import * as moment from 'moment-timezone'
import { loadTS } from 'buckets-core/dist/time'


test('sample1', async t => {
  let data = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20121004210819
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1349428292
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>NZD
<BANKACCTFROM>
<BANKID>01
<BRANCHID>0123
<ACCTID>1234567-00
<ACCTTYPE>SAVINGS
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20120101
<DTEND>20121003
<STMTTRN>
<TRNTYPE>INT
<DTPOSTED>20120928
<TRNAMT>19.90
<FITID>20120928.0
<MEMO>Credit Interest Paid
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20120928
<TRNAMT>-1.01
<FITID>20120928.1
<MEMO>Withholding Tax
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20120907
<TRNAMT>-100.00
<FITID>20120907.0
<NAME>06 0773 0214764 33
<MEMO>Debit Transfer: Bike
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20120907
<TRNAMT>-71.99
<FITID>201209071
<NAME>Transfer
<MEMO>Debit Transfer: Postage
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20120104
<TRNAMT>-20.01
<FITID>20120104.6
<NAME>Transfer
<MEMO>Debit Transfer Party
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>4225.79
<DTASOF>20121004
</LEDGERBAL>
<AVAILBAL>
<BALAMT>12.79
<DTASOF>20121004
</AVAILBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`
  let accountset = await ofx2importable(data);
  let account = accountset.accounts[0];
  let transactions = account.transactions;
  t.equal(transactions.length, 5, "Should have 5 transactions");

  let [t0, t1, t2, t3, t4] = transactions;
  t.equal(account.currency, 'NZD')
  
  t.equal(t0.amount, 1990)
  t.equal(t0.memo, 'Credit Interest Paid')
  t.equal(t0.fi_id, '20120928.0')
  t.equal(loadTS(t0.posted).format(), moment.utc({y:2012,M:9-1,d:28}).format())

  t.equal(t1.amount, -101)
  t.equal(t1.memo, 'Withholding Tax')
  t.equal(t1.fi_id, '20120928.1')
  t.equal(loadTS(t1.posted).format(), moment.utc({y:2012,M:9-1,d:28}).format())

  t.equal(t2.amount, -10000)
  t.equal(t2.memo, 'Debit Transfer: Bike')
  t.equal(t2.fi_id, '20120907.0')
  t.equal(loadTS(t2.posted).format(), moment.utc({y:2012,M:9-1,d:7}).format())

  t.equal(t3.amount, -7199)
  t.equal(t3.memo, 'Debit Transfer: Postage')
  t.equal(t3.fi_id, '201209071')
  t.equal(loadTS(t3.posted).format(), moment.utc({y:2012,M:9-1,d:7}).format())

  t.equal(t4.amount, -2001)
  t.equal(t4.memo, 'Debit Transfer Party')
  t.equal(t4.fi_id, '20120104.6')
  t.equal(loadTS(t4.posted).format(), moment.utc({y:2012,M:1-1,d:4}).format())
})

test('sample2', async t => {
  let data = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0
        <SEVERITY>INFO
      </STATUS>
      <DTSERVER>20160509013234.900
      <LANGUAGE>ENG
      <DTPROFUP>20050531060000.000
      <FI>
        <ORG>GOOBYGOO
        <FID>1001
      </FI>
      <INTU.BID>99999
      <INTU.USERID>12345
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>0
      <STATUS>
        <CODE>0
        <SEVERITY>INFO
      </STATUS>
      <STMTRS>
        <CURDEF>USD
        <BANKACCTFROM>
          <BANKID>1111111111
          <ACCTID>55555555~1
          <ACCTTYPE>SAVINGS
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20160429060000.000
          <DTEND>20160508060000.000
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20160430120000.000
            <TRNAMT>0.17
            <FITID>0000760
            <NAME>DIVIDEND EARNED FOR PERIOD OF 04
            <MEMO>DIVIDEND EARNED FOR PERIOD OF 04/01/2016 THROUGH 04/30/2016 ANNUAL PERCENTAGE YIELD EARNED IS 0.10%
          </STMTTRN>
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>2068.04
          <DTASOF>20160509013234.900
        </LEDGERBAL>
        <AVAILBAL>
          <BALAMT>2067.04
          <DTASOF>20160509013234.900
        </AVAILBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`
  let accountset = await ofx2importable(data);
  let account = accountset.accounts[0];
  let transactions = account.transactions;
  t.equal(transactions.length, 1)

  let t0 = transactions[0];
  t.notEqual(account.label, null)
  t.ok(account.label.indexOf('55555555~1') !== -1, "Should have account number");
  t.ok(account.label.indexOf('GOOBYGOO') !== -1, "Should have bank");
  t.ok(account.label.indexOf('SAVINGS') !== -1, "Should have account name");
  
  t.equal(account.currency, 'USD')
  t.equal(t0.amount, 17)
  t.equal(t0.memo, 'DIVIDEND EARNED FOR PERIOD OF 04/01/2016 THROUGH 04/30/2016 ANNUAL PERCENTAGE YIELD EARNED IS 0.10%')
  t.equal(t0.fi_id, '0000760')
  t.equal(loadTS(t0.posted).format(), moment.utc({y:2016, M:4-1, d:30, h:12}).format())
})

test('sample3', async t => {
  let data = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20160509120000[0:GMT]
<LANGUAGE>ENG
<FI>
<ORG>ISC
<FID>10898
</FI>
<INTU.BID>11111
</SONRS>
</SIGNONMSGSRSV1>
<CREDITCARDMSGSRSV1>
<CCSTMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
<MESSAGE>Success
</STATUS>
<CCSTMTRS>
<CURDEF>USD
<CCACCTFROM>
<ACCTID>11111111111111111
</CCACCTFROM>
<BANKTRANLIST>
<DTSTART>20160430120000[0:GMT]
<DTEND>20160508120000[0:GMT]
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20160501120000[0:GMT]
<TRNAMT>-12.99
<FITID>2016050124224436122105002709067
<NAME>ETSY SELLER FEES
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20160506120000[0:GMT]
<TRNAMT>-36.22
<FITID>2016050624445006126100312436287
<NAME>BARNES &amp; NOBLE #2626
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>-1180.98
<DTASOF>20160509120000[0:GMT]
</LEDGERBAL>
<AVAILBAL>
<BALAMT>17797.30
<DTASOF>20160509120000[0:GMT]
</AVAILBAL>
</CCSTMTRS>
</CCSTMTTRNRS>
</CREDITCARDMSGSRSV1>
</OFX>
`
  let accountset = await ofx2importable(data);
  let account = accountset.accounts[0];
  let transactions = account.transactions;
  t.equal(transactions.length, 2)

  let t0 = transactions[0];
  t.notEqual(account.label, null)
  t.ok(account.label.indexOf('11111111111111111') !== -1, "Should have account number");
  t.ok(account.label.indexOf('ISC') !== -1, "Should have bank");
  t.equal(account.currency, 'USD')

  t.equal(t0.amount, -1299)
  t.equal(t0.memo, 'ETSY SELLER FEES')
  t.equal(t0.fi_id, '2016050124224436122105002709067')
  t.equal(loadTS(t0.posted).format(), moment.utc({y:2016, M:5-1, d:1, h:12}).format())

  let t1 = transactions[1];
  t.equal(t1.amount, -3622)
  t.equal(t1.memo, 'BARNES & NOBLE #2626')
  t.equal(t1.fi_id, '2016050624445006126100312436287')
  t.equal(loadTS(t1.posted).format(), moment.utc({y:2016, M:5-1, d:6, h:12}).format())
})

test('multi account per bank message', async t => {
  let data = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
 <SIGNONMSGSRSV1>
  <SONRS>
   <STATUS>
    <CODE>0
    <SEVERITY>INFO
   </STATUS>
   <DTSERVER>20180905094022.662
   <LANGUAGE>ENG
   <FI>
    <ORG>MACU
    <FID>000000000
   </FI>
  </SONRS>
 </SIGNONMSGSRSV1>
 <BANKMSGSRSV1>
  <STMTTRNRS>
   <TRNUID>0
   <STATUS>
    <CODE>0
    <SEVERITY>INFO
   </STATUS>
   <STMTRS>
    <CURDEF>USD
    <BANKACCTFROM>
     <BANKID>000000000
     <ACCTID>0000000000-S0001
     <ACCTTYPE>SAVINGS
    </BANKACCTFROM>
    <BANKTRANLIST>
     <DTSTART>20180309000000.000
     <DTEND>20180905000000.000
    </BANKTRANLIST>
    <LEDGERBAL>
     <BALAMT>5.00
     <DTASOF>20180905094022.693
    </LEDGERBAL>
   </STMTRS>
  </STMTTRNRS>
  <STMTTRNRS>
   <TRNUID>0
   <STATUS>
    <CODE>0
    <SEVERITY>INFO
   </STATUS>
   <STMTRS>
    <CURDEF>USD
    <BANKACCTFROM>
     <BANKID>000000000
     <ACCTID>0000000000-S0050
     <ACCTTYPE>CHECKING
    </BANKACCTFROM>
    <BANKTRANLIST>
     <DTSTART>20180309000000.000
     <DTEND>20180905000000.000
    </BANKTRANLIST>
    <LEDGERBAL>
     <BALAMT>7.94
     <DTASOF>20180905094022.709
    </LEDGERBAL>
   </STMTRS>
  </STMTTRNRS>
 </BANKMSGSRSV1>
 <CREDITCARDMSGSRSV1>
  <CCSTMTTRNRS>
   <TRNUID>0
   <STATUS>
    <CODE>0
    <SEVERITY>INFO
   </STATUS>
   <CCSTMTRS>
    <CURDEF>USD
    <CCACCTFROM>
     <ACCTID>0000000000-L0075
    </CCACCTFROM>
    <BANKTRANLIST>
     <DTSTART>20180309000000.000
     <DTEND>20180905000000.000
    </BANKTRANLIST>
    <LEDGERBAL>
     <BALAMT>0.00
     <DTASOF>20180905094022.724
    </LEDGERBAL>
   </CCSTMTRS>
  </CCSTMTTRNRS>
 </CREDITCARDMSGSRSV1>
</OFX>
`
  let accountset = await ofx2importable(data);
  t.equal(accountset.accounts.length, 3, "Should find all 3 accounts");

  let [account1, account2, account3] = accountset.accounts;
  t.equal(account1.transactions.length, 0);
  t.equal(account1.currency, 'USD');

  t.equal(account2.transactions.length, 0);
  t.equal(account2.currency, 'USD');

  t.equal(account3.transactions.length, 0);
  t.equal(account3.currency, 'USD');
})


test('gnucash', async t => {
  let data = `<?xml version="1.0" encoding="UTF-8"?><?OFX OFXHEADER="200" VERSION="211" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?><OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>0</TRNUID>
      <STMTRS>
        <CURDEF>EUR</CURDEF>
        <BANKACCTFROM>
          <BANKID>org.gnucash.android</BANKID>
          <ACCTID>1111111111</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20180710092414[+1:MEZ]</DTSTART>
          <DTEND>20180710092414[+1:MEZ]</DTEND>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20180709185236[+1:MEZ]</DTPOSTED>
            <DTUSER>20180709185236[+1:MEZ]</DTUSER>
            <TRNAMT>50.00</TRNAMT>
            <FITID>a1</FITID>
            <NAME>Humbug</NAME>
            <BANKACCTTO>
              <BANKID>org.gnucash.android</BANKID>
              <ACCTID>2222222222</ACCTID>
              <ACCTTYPE>SAVINGS</ACCTTYPE>
            </BANKACCTTO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20180709171248[+1:MEZ]</DTPOSTED>
            <DTUSER>20180709171248[+1:MEZ]</DTUSER>
            <TRNAMT>-5.00</TRNAMT>
            <FITID>a2</FITID>
            <NAME>Humbug</NAME>
            <BANKACCTTO>
              <BANKID>org.gnucash.android</BANKID>
              <ACCTID>2222222222</ACCTID>
              <ACCTTYPE>SAVINGS</ACCTTYPE>
            </BANKACCTTO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20180629190428[+1:MEZ]</DTPOSTED>
            <DTUSER>20180629190428[+1:MEZ]</DTUSER>
            <TRNAMT>-23.08</TRNAMT>
            <FITID>a7</FITID>
            <NAME>Getränke</NAME>
            <BANKACCTTO>
              <BANKID>org.gnucash.android</BANKID>
              <ACCTID>2222222222</ACCTID>
              <ACCTTYPE>SAVINGS</ACCTTYPE>
            </BANKACCTTO>
          </STMTTRN>
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>178.94</BALAMT>
          <DTASOF>20180710092414[+1:MEZ]</DTASOF>
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
`
  let accountset = await ofx2importable(data);
  t.equal(accountset.accounts.length, 1, "Only one account");

  let [checking] = accountset.accounts;
  t.equal(checking.currency, "EUR");
  t.ok(checking.label.indexOf('1111111111') !== -1, "Should have account number");
  t.ok(checking.label.indexOf('CHECKING') !== -1, "Should have account name");

  t.equal(checking.transactions.length, 3);
  let [t0, t1, t2] = checking.transactions;

  t.equal(t0.amount, 5000)
  t.equal(t0.memo, 'Humbug')
  t.equal(t0.fi_id, 'a1')
  t.equal(loadTS(t0.posted).format(), moment.utc({y:2018,M:7-1,d:9,h:17,m:52,s:36}).format()) // 20180709185236

  t.equal(t1.amount, -500)
  t.equal(t1.memo, 'Humbug')
  t.equal(t1.fi_id, 'a2')

  t.equal(t2.amount, -2308)
  t.equal(t2.fi_id, 'a7')
  t.equal(t2.memo, "Getränke")
})

test('no fitid', async t => {
  let data = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20190103061403
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>AUD
<BANKACCTFROM>
<BANKID>099099
<ACCTID>10101010
<ACCTTYPE>SAVINGS
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20181220000000
<DTEND>20181221000000
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20181220
<DTUSER>20181220
<TRNAMT>6275.86
<FITID>
<MEMO>Some other text for memo
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>270.74
<DTASOF>20190103061403
</LEDGERBAL>
<AVAILBAL>
<BALAMT>270.74
<DTASOF>20190103061403
</AVAILBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`
  let accountset = await ofx2importable(data);
  t.equal(accountset.accounts.length, 1, "Only one account");

  let [account0] = accountset.accounts;
  t.equal(account0.currency, "AUD");
  t.ok(account0.label.indexOf('10101010') !== -1, "Should have account number");
  t.ok(account0.label.indexOf('SAVINGS') !== -1, "Should have account name");

  t.equal(account0.transactions.length, 1);
  let [t0] = account0.transactions;

  t.equal(t0.amount, 627586)
  t.equal(t0.memo, 'Some other text for memo')
  t.notSame(t0.fi_id, null)
  t.equal(loadTS(t0.posted).format(), moment.utc({y:2018,M:12-1,d:20}).format())
})

// Test for Issue #378
// test('broken_ccstmtrs', async t => {
//   let data = `OFXHEADER:100
// DATA:OFXSGML
// VERSION:102
// SECURITY:NONE
// ENCODING:USASCII
// CHARSET:1252
// COMPRESSION:NONE
// OLDFILEUID:NONE
// NEWFILEUID:NONE
// <OFX>
// <SIGNONMSGSRSV1>
// <SONRS>
// <STATUS>
// <CODE>0
// <SEVERITY>INFO
// </STATUS>
// <DTSERVER>20190101091301
// <LANGUAGE>ENG
// </SONRS>
// </SIGNONMSGSRSV1>
// <BANKMSGSRSV1>
// <STMTTRNRS>
// <TRNUID>1
// <STATUS>
// <CODE>0
// <SEVERITY>INFO
// </STATUS>
// <CCSTMTRS>
// <CURDEF>AUD
// <BANKACCTFROM>
// <BANKID>111111
// <ACCTID>888888888
// <ACCTTYPE>CREDITLINE
// </BANKACCTFROM>
// <BANKTRANLIST>
// <DTSTART>20181225000000
// <DTEND>20190101000000
// <STMTTRN>
// <TRNTYPE>DEBIT
// <DTPOSTED>20181231
// <DTUSER>20181231
// <TRNAMT>-2500.00
// <FITID>N123189933533
// <MEMO>MISA Withdrawal NetBank
// </STMTTRN>
// <STMTTRN>
// <TRNTYPE>CREDIT
// <DTPOSTED>20181227
// <DTUSER>20181227
// <TRNAMT>850.00
// <FITID>N122589078320
// <MEMO>MISA Deposit NetBank Backdated to 25/12/18
// </STMTTRN>
// <STMTTRN>
// <TRNTYPE>CREDIT
// <DTPOSTED>20181224
// <DTUSER>20181224
// <TRNAMT>800.00
// <FITID>N122485564391
// <MEMO>MISA Deposit NetBank
// </STMTTRN>
// <STMTTRN>
// <TRNTYPE>CREDIT
// <DTPOSTED>20181224
// <DTUSER>20181224
// <TRNAMT>430.00
// <FITID>N122485556633
// <MEMO>MISA Deposit NetBank
// </STMTTRN>
// </BANKTRANLIST>
// <LEDGERBAL>
// <BALAMT>323052.00
// <DTASOF>20190101091301
// </LEDGERBAL>
// <AVAILBAL>
// <BALAMT>323052.00
// <DTASOF>20190101091301
// </AVAILBAL>
// </STMTRS>
// </STMTTRNRS>
// </BANKMSGSRSV1>
// </OFX>
// `
//   let accountset = await ofx2importable(data);
//   t.equal(accountset.accounts.length, 1, "Only one account");

//   let [account0] = accountset.accounts;
//   t.equal(account0.currency, "AUD");
//   t.ok(account0.label.indexOf('888888888') !== -1, "Should have account number");
//   t.ok(account0.label.indexOf('CREDITLINE') !== -1, "Should have account name");

//   t.equal(account0.transactions.length, 4);
//   let [t0, t1, t2, t3] = account0.transactions;

//   t.equal(t0.amount, -250000)
//   t.equal(t0.memo, 'MISA Withdrawal NetBank')
//   t.equal(t0.fi_id, 'N123189933533')
//   t.equal(loadTS(t0.posted).format(), moment.utc({y:2018,M:12-1,d:31}).format())

//   t.equal(t1.amount, 85000)

//   t.equal(t2.amount, 80000)

//   t.equal(t3.amount, 43000)
// })