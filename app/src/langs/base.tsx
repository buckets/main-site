// Auto-generated file

import * as React from 'react'
import * as moment from 'moment'

interface IMsg<T> {
  val: T;
  translated: boolean;
  src: string[];
  h: string;
  newval?: T;
}
export interface IMessages {
  "Reopen": IMsg<string>;
  "more": IMsg<string>;
  "You have no closed accounts.": IMsg<string>;
  "Account": IMsg<string>;
  "accounts.balance_mismatch_msg": IMsg<string>;
  "accounts.name_placeholder": IMsg<string>;
  "accounts.more_link": IMsg<string>;
  "Balance": IMsg<string>;
  "single-account Closed": IMsg<string>;
  "Delete account": IMsg<string>;
  "Account and transactions deleted": IMsg<string>;
  "Confirm delete": IMsg<string>;
  "(This can't be undone)": IMsg<string>;
  "Close account": IMsg<string>;
  "Account deleted completely": IMsg<string>;
  "Account closed": IMsg<string>;
  "Confirm close": IMsg<string>;
  "Synced balance": IMsg<string>;
  "accounts.balance_mismatch_long_msg": IMsg<()=>string|JSX.Element>;
  "balance-as-of": IMsg<(date:any)=>string|JSX.Element>;
  "getting-started-link": IMsg<(clickhandler:any)=>string|JSX.Element>;
  "New account": IMsg<string>;
  "Connect to bank": IMsg<string>;
  "default account name": IMsg<string>;
  "toast.updated-trans": IMsg<(count:any)=>string|JSX.Element>;
  "sync.toast.syncing": IMsg<(start:any,end:any)=>string|JSX.Element>;
  "Sync complete": IMsg<string>;
  "Account created: ": IMsg<string>;
  "Unknown account: ": IMsg<string>;
  "Un-kick": IMsg<string>;
  "You haven't kicked the bucket yet...": IMsg<string>;
  "Bucket": IMsg<string>;
  "In": IMsg<string>;
  "Out": IMsg<string>;
  "Net": IMsg<string>;
  "If Net is 0, the bucket transactions will be marked as transfers rather than as income or expenses.": IMsg<string>;
  "Rain left": IMsg<string>;
  "Make it so": IMsg<string>;
  "Self debt": IMsg<string>;
  "Amount of money over-allocated in buckets.": IMsg<string>;
  "Make it rain!": IMsg<string>;
  "action.New bucket": IMsg<string>;
  "action.New group": IMsg<string>;
  "Rain": IMsg<string>;
  "Total amount your buckets expect each month.": IMsg<string>;
  "default new bucket name": IMsg<string>;
  "default new group name": IMsg<string>;
  "Goal:": IMsg<string>;
  "Target date:": IMsg<string>;
  "Monthly deposit:": IMsg<string>;
  "Bucket type:": IMsg<string>;
  "buckettype.plain": IMsg<string>;
  "buckettype.deposit": IMsg<string>;
  "buckettype.goal-date": IMsg<string>;
  "buckettype.goal-deposit": IMsg<string>;
  "buckettype.deposit-date": IMsg<string>;
  "Goal completion:": IMsg<string>;
  "some day...": IMsg<string>;
  "Required deposit:": IMsg<string>;
  "Ending amount:": IMsg<string>;
  "Goal: 0": IMsg<string>;
  "rainfall-received-this-month": IMsg<(money:any,percent:number)=>string|JSX.Element>;
  "This is a special group for all the buckets without a group.": IMsg<string>;
  "Effective": IMsg<string>;
  "effective.help": IMsg<string>;
  "In/Out": IMsg<string>;
  "bucketrain.help": IMsg<string>;
  "bucket.detailslabel": IMsg<string>;
  "misc group name": IMsg<string>;
  "single-bucket Kicked": IMsg<string>;
  "Bucket deleted completely": IMsg<string>;
  "Kick the bucket": IMsg<string>;
  "Balance:": IMsg<string>;
  "Rainfall this month:": IMsg<string>;
  "Posted": IMsg<string>;
  "Memo": IMsg<string>;
  "Amount": IMsg<string>;
  "noun.transfer": IMsg<string>;
  "bucket.transfer.help": IMsg<string>;
  "Misc": IMsg<string>;
  "Trial Version": IMsg<string>;
  "Accounts": IMsg<string>;
  "Closed": IMsg<string>;
  "Transactions": IMsg<string>;
  "Buckets": IMsg<string>;
  "Kicked": IMsg<string>;
  "Analysis": IMsg<string>;
  "Recurring Expenses": IMsg<string>;
  "Import": IMsg<string>;
  "Tools": IMsg<string>;
  "Search": IMsg<string>;
  "Export": IMsg<string>;
  "Chat with Matt": IMsg<string>;
  "Used in future": IMsg<string>;
  "rain.help.pos": IMsg<(abs_amount:any)=>string|JSX.Element>;
  "rain.help.neg": IMsg<(abs_amount:any)=>string|JSX.Element>;
  "Income": IMsg<string>;
  "Expenses": IMsg<string>;
  "months gain/loss label": IMsg<(gain:any)=>string|JSX.Element>;
  "in the bank": IMsg<string>;
  "I'm exporting data so that I can ": IMsg<string>;
  "daterange.all": IMsg<string>;
  "daterange.thismonth": IMsg<string>;
  "daterange.fromlastmonth": IMsg<string>;
  "daterange.from2monthsago": IMsg<string>;
  "daterange.from3monthsago": IMsg<string>;
  "export.why": IMsg<string>;
  "Thank you for the feedback!": IMsg<string>;
  "Submit feedback": IMsg<string>;
  "From": IMsg<string>;
  "To": IMsg<string>;
  "File saved: ": IMsg<string>;
  "match-count": IMsg<(current_match:number,total_matches:number)=>string|JSX.Element>;
  "Sync": IMsg<string>;
  "Syncing...": IMsg<string>;
  "A sync is already in progress": IMsg<string>;
  "Error running sync": IMsg<string>;
  "Sync has not yet been set up.": IMsg<string>;
  "simplefin-connect-intro": IMsg<string>;
  "simplefin-get-token": IMsg<(mklink:any)=>string|JSX.Element>;
  "simplefin-paste": IMsg<string>;
  "Connecting...": IMsg<string>;
  "Unlinked Accounts": IMsg<string>;
  "Macros": IMsg<string>;
  "SimpleFIN Connections": IMsg<string>;
  "CSV Fields": IMsg<string>;
  "CSV Account": IMsg<string>;
  "Cancel sync": IMsg<string>;
  "Test Toast": IMsg<string>;
  "Create macro": IMsg<string>;
  "Connect": IMsg<string>;
  "Connection saved!": IMsg<string>;
  "On": IMsg<string>;
  "When \"On\" this macro will be run during a normal sync.": IMsg<string>;
  "Name": IMsg<string>;
  "Confirm delete?": IMsg<string>;
  "ID": IMsg<string>;
  "Last used": IMsg<string>;
  "Description": IMsg<string>;
  "Create new account": IMsg<string>;
  "action.link-account": IMsg<string>;
  "Month to Month": IMsg<string>;
  "Year to Year": IMsg<string>;
  "Avg:": IMsg<string>;
  "Net Transfers": IMsg<string>;
  "net-transfers.help": IMsg<string>;
  "Tot:": IMsg<string>;
  "Gain/Loss": IMsg<string>;
  "Ending Balance": IMsg<string>;
  "Yearly expenses": IMsg<string>;
  "Monthly expenses": IMsg<string>;
  "Budgeted": IMsg<string>;
  "This year": IMsg<string>;
  "Last month": IMsg<string>;
  "Average": IMsg<string>;
  "Period": IMsg<string>;
  "Budgeted:": IMsg<string>;
  "Average:": IMsg<string>;
  "Last:": IMsg<string>;
  "period-display": IMsg<(n:number,unit:any)=>string|JSX.Element>;
  "Note": IMsg<string>;
  "Account Transactions": IMsg<string>;
  "Bucket Transactions": IMsg<string>;
  "Nothing found matching:": IMsg<string>;
  "Searching...": IMsg<string>;
  "Search:": IMsg<string>;
  "No matches found": IMsg<string>;
  "Successfully imported Amazon Items report": IMsg<string>;
  "Successfully imported Amazon Orders report": IMsg<string>;
  "Successfully imported Amazon Refunds report": IMsg<string>;
  "Import Amazon Reports": IMsg<string>;
  "Amazon Reconciliation": IMsg<string>;
  "Amazon.com Reconciliation": IMsg<string>;
  "Delete selected": IMsg<string>;
  "transactions.delete": IMsg<(size:number)=>string|JSX.Element>;
  "Possible Duplicates": IMsg<string>;
  "Show uncategorized": IMsg<string>;
  "Import file": IMsg<string>;
  "Category": IMsg<string>;
  "sync-symbol help": IMsg<string>;
  "Deposit": IMsg<string>;
  "Withdrawl": IMsg<string>;
  "Cancel": IMsg<string>;
  "Save": IMsg<string>;
  "noun.income": IMsg<string>;
  "noin.income": IMsg<string>;
  "Categorize": IMsg<string>;
  "Identify the data each column contains using the drop downs below.": IMsg<string>;
  "You must have at least one column each set to Amount, Memo and Date Posted.": IMsg<string>;
  "For Date Posted, you must also choose the date format.": IMsg<string>;
  "If multiple columns are selected for Amount, the first non-zero value will be used.  This is helpful if the CSV contains separate Credit and Debit columns.": IMsg<string>;
  "Only select a column for Unique ID if you are sure it contains bank-assigned, unique transaction IDs.  Most CSVs will not have this field.": IMsg<string>;
  "Click the \"Set mapping\" to continue.": IMsg<string>;
  "Date Posted": IMsg<string>;
  "Unique ID": IMsg<string>;
  "(optional)": IMsg<string>;
  "Set mapping": IMsg<string>;
  "Invalid": IMsg<string>;
  "Select the account these transactions belong to.": IMsg<string>;
  "edit.mapping": IMsg<(onClick:any)=>string|JSX.Element>;
  "Account name": IMsg<string>;
  "Provide a name for the new account.": IMsg<string>;
  "Finish import": IMsg<string>;
  "Error": IMsg<string>;
  "There has been an error.": IMsg<string>;
  "error-detail": IMsg<string>;
  "action.ignore": IMsg<string>;
  "action.chat": IMsg<string>;
  "action.report bug": IMsg<string>;
  "OK": IMsg<string>;
  "File type not recognized.": IMsg<string>;
  "Buckets License": IMsg<string>;
  "Unregistered Version": IMsg<string>;
  "Hello!  Thanks for trying out Buckets.": IMsg<string>;
  "nag-message": IMsg<()=>string|JSX.Element>;
  "Later": IMsg<string>;
  "Purchase": IMsg<string>;
  "Unable to open the file:": IMsg<string>;
  "Open Transaction File": IMsg<string>;
  "File does not exist:": IMsg<string>;
  "Open Buckets Budget": IMsg<string>;
  "budget-file-type-name": IMsg<string>;
  "Buckets Budget Filename": IMsg<string>;
  "No file chosen": IMsg<string>;
  "File": IMsg<string>;
  "New Budget...": IMsg<string>;
  "Open Budget...": IMsg<string>;
  "Open Recent...": IMsg<string>;
  "Edit": IMsg<string>;
  "Undo": IMsg<string>;
  "Redo": IMsg<string>;
  "Cut": IMsg<string>;
  "Copy": IMsg<string>;
  "Paste": IMsg<string>;
  "Paste and Match Style": IMsg<string>;
  "Delete": IMsg<string>;
  "Select All": IMsg<string>;
  "Find...": IMsg<string>;
  "Find Next": IMsg<string>;
  "Find Previous": IMsg<string>;
  "View": IMsg<string>;
  "Reload": IMsg<string>;
  "Force Reload": IMsg<string>;
  "Toggle Developer Tools": IMsg<string>;
  "Actual Size": IMsg<string>;
  "Zoom In": IMsg<string>;
  "Zoom Out": IMsg<string>;
  "Toggle Full Screen": IMsg<string>;
  "Window": IMsg<string>;
  "Minimize": IMsg<string>;
  "Close Window": IMsg<string>;
  "Budget": IMsg<string>;
  "Duplicate Window": IMsg<string>;
  "Import Transactions...": IMsg<string>;
  "Import From YNAB4...": IMsg<string>;
  "Help": IMsg<string>;
  "Learn More": IMsg<string>;
  "Getting Started...": IMsg<string>;
  "Buckets Guide": IMsg<string>;
  "Chat...": IMsg<string>;
  "Show Log Files...": IMsg<string>;
  "Report Bug...": IMsg<string>;
  "Report Translation Error...": IMsg<string>;
  "It says:": IMsg<string>;
  "It should say:": IMsg<string>;
  "Purchase Full Version...": IMsg<string>;
  "Enter License...": IMsg<string>;
  "About Buckets": IMsg<string>;
  "Check For Updates...": IMsg<string>;
  "Preferences...": IMsg<string>;
  "Services": IMsg<string>;
  "Hide Buckets": IMsg<string>;
  "Hide Others": IMsg<string>;
  "Show All": IMsg<string>;
  "Quit Buckets": IMsg<string>;
  "Speech": IMsg<string>;
  "Start Speaking": IMsg<string>;
  "Stop Speaking": IMsg<string>;
  "Zoom": IMsg<string>;
  "Bring All to Front": IMsg<string>;
  "Update Available": IMsg<string>;
  "version-available": IMsg<(newv:string)=>string|JSX.Element>;
  "Download": IMsg<string>;
  "Confirm password:": IMsg<string>;
  "Passwords did not match": IMsg<string>;
  "Create budget password:": IMsg<string>;
  "Sync failed": IMsg<string>;
  "Unexpected sync error": IMsg<string>;
  "Invalid SimpleFIN Token": IMsg<string>;
  "Unable to claim access token": IMsg<string>;
  "Error fetching data": IMsg<string>;
  "Error parsing response": IMsg<string>;
  "/mo": IMsg<string>;
  "Enter Buckets License": IMsg<string>;
  "enter-license-prompt": IMsg<string>;
  "Submit": IMsg<string>;
  "Success!": IMsg<string>;
  "Restart Buckets": IMsg<string>;
  "Invalid license": IMsg<string>;
  "Preferences": IMsg<string>;
  "Language:": IMsg<string>;
  "System Default": IMsg<string>;
  "Animation:": IMsg<string>;
  "(Restart Buckets for the change to take effect.)": IMsg<string>;
  "Prompt": IMsg<string>;
  "Report Bug": IMsg<string>;
  "Your email address:": IMsg<string>;
  "Message:": IMsg<string>;
  "Other details:": IMsg<string>;
  "Include log file": IMsg<string>;
  "Send Report": IMsg<string>;
  "\n        If you wish to provide screenshots or other information, email bugs@budgetwithbuckets.com\n      ": IMsg<string>;
  "Check for Updates": IMsg<string>;
  "There was an error.  Maybe try again?": IMsg<string>;
  "Checking for updates...": IMsg<string>;
  "Skip This Version": IMsg<string>;
  "Download Update": IMsg<string>;
  "You are running the latest version!": IMsg<string>;
  "Downloading update...": IMsg<string>;
  "Update downloaded.": IMsg<string>;
  "Install and Relaunch Buckets": IMsg<string>;
  "Recently used": IMsg<string>;
  "EXPERIMENTAL Buckets Macro Maker": IMsg<string>;
  "navigatestep": IMsg<(url:any)=>string|JSX.Element>;
  "off": IMsg<string>;
  "on": IMsg<string>;
  "Paused": IMsg<string>;
  "Recording": IMsg<string>;
  "Playing": IMsg<string>;
  "notify-downloaded-file": IMsg<(filename:any)=>string|JSX.Element>;
  "Step took too long": IMsg<string>;
  "Error running recording": IMsg<string>;
  "Open YNAB4 File": IMsg<string>;
  "Error importing": IMsg<string>;
}
export const DEFAULTS:IMessages = {
  "Reopen": {
    val: "Reopen",
    translated: false,
    src: ["src/budget/accounts.tsx line 30","src/budget/accounts.tsx line 129"],
    h: "5497b4yxPFO2M524tL0qmmNk47Qv/aca/7n0zMEeX/o=",
  },
  "more": {
    val: "more",
    translated: false,
    src: ["src/budget/accounts.tsx line 32","src/budget/buckets.tsx line 47"],
    h: "uiqCMjSdL1TgDZHPNYXLnfN/yZq59+kDR/wKZSAP0hU=",
  },
  "You have no closed accounts.": {
    val: "You have no closed accounts.",
    translated: false,
    src: ["src/budget/accounts.tsx line 38"],
    h: "8BZG+UdW1Rrd/+2zFNv7SskiNpD6DtlNa8LwQulqX5s=",
  },
  "Account": {
    val: "Account",
    translated: false,
    src: ["src/budget/accounts.tsx line 45","src/budget/accounts.tsx line 98","src/budget/importpage.tsx line 444","src/budget/searchpage.tsx line 119","src/budget/searchpage.tsx line 143","src/budget/transactions.tsx line 215"],
    h: "ihCgI4A9UaFZ63kuiKXqFHoGsze2dYwzpgSVU0clMfQ=",
  },
  "accounts.balance_mismatch_msg": {
    val: "The most recent synced balance does not match the balance computed from transactions.  Click more for more information.",
    translated: false,
    src: ["src/budget/accounts.tsx line 78"],
    h: "cMuGJ8vkjW+HMm8Ac01xULd9Lwf/iVtXYPi3WBC2JS4=",
  },
  "accounts.name_placeholder": {
    val: "no name",
    translated: false,
    src: ["src/budget/accounts.tsx line 85","src/budget/accounts.tsx line 181"],
    h: "UwMHboI9q49SZQkwMN8ps9zBi6YOSdtwakjLJwudtyA=",
  },
  "accounts.more_link": {
    val: "more",
    translated: false,
    src: ["src/budget/accounts.tsx line 91"],
    h: "uiqCMjSdL1TgDZHPNYXLnfN/yZq59+kDR/wKZSAP0hU=",
  },
  "Balance": {
    val: "Balance",
    translated: false,
    src: ["src/budget/accounts.tsx line 99","src/budget/accounts.tsx line 189","src/budget/buckets.tsx line 796","src/budget/buckets.tsx line 1091","src/budget/transactions.tsx line 218"],
    h: "azvDWgVPY349dq4q8mbtpDhehRsFKYKNzMk/TcuOvEQ=",
  },
  "single-account Closed": {
    val: "Closed",
    translated: false,
    src: ["src/budget/accounts.tsx line 130"],
    h: "8pZrnvzAUQTJhDN/XX31DLvx0wIs1Ww3fV6pktEKEHs=",
  },
  "Delete account": {
    val: "Delete account",
    translated: false,
    src: ["src/budget/accounts.tsx line 132"],
    h: "aJP8/jR9vxjzpjDV69qVSi1XWSXKUhiJJUOrI1iunMg=",
  },
  "Account and transactions deleted": {
    val: "Account and transactions deleted",
    translated: false,
    src: ["src/budget/accounts.tsx line 137"],
    h: "iwS2+dAqfDOEtU5SUm1d1oPFTe0+JT5NCm4nH2SrglE=",
  },
  "Confirm delete": {
    val: "Confirm delete",
    translated: false,
    src: ["src/budget/accounts.tsx line 140","src/wwwroot/record/record.tsx line 418"],
    h: "dKo5kMigc5p6w58RgAMwEVjNB+uwU3D0zse0HbHbiQU=",
  },
  "(This can't be undone)": {
    val: "(This can't be undone)",
    translated: false,
    src: ["src/budget/accounts.tsx line 140"],
    h: "/4Il5W0T06BPrx7oYqwPwrgFgRrJmAM5Oa+80d9DxRg=",
  },
  "Close account": {
    val: "Close account",
    translated: false,
    src: ["src/budget/accounts.tsx line 144"],
    h: "7HdV8X8++teDNW33urE2eccDw3VLdSpvII89zC/sfu4=",
  },
  "Account deleted completely": {
    val: "Account deleted completely",
    translated: false,
    src: ["src/budget/accounts.tsx line 151"],
    h: "LswJ+SxzkHRVy6+Et4Wga6r/Io1P6MBlTiwdjUAUj48=",
  },
  "Account closed": {
    val: "Account closed",
    translated: false,
    src: ["src/budget/accounts.tsx line 153"],
    h: "l9xs5wLKF3KIgunL1SJh9r9XDYpWkC7LYrL4KUUFm3M=",
  },
  "Confirm close": {
    val: "Confirm close",
    translated: false,
    src: ["src/budget/accounts.tsx line 156"],
    h: "bUeSrlfpINVBumCe1M6dEwQcQTlnoe2bi4rmGjYP3QM=",
  },
  "Synced balance": {
    val: "Synced balance",
    translated: false,
    src: ["src/budget/accounts.tsx line 161"],
    h: "yyCVeQRle/vbcZ1/QyVYtL+ZmyQ5WanHCYKZpJqFd6o=",
  },
  "accounts.balance_mismatch_long_msg": {
    val: () => {
            return (<span>
              The "Balance" above is this account's balance as of the latest entered transaction.
              The "Synced balance" is the this account's balance <i>as reported by the bank.</i>
              Some banks always report <i>today's balance</i> as the "Synced balance" even though <i>today's transactions</i> haven't been sent to Buckets yet.
              So this mismatch will usually resolve itself once all the transactions in your bank have been synced into Buckets.
          </span>)},
    translated: false,
    src: ["src/budget/accounts.tsx line 166"],
    h: "wR5L88lhIXbxAVDXEZbN1lwbnZjYUBkAifA2KtAg8dM=",
  },
  "balance-as-of": {
    val: (date:JSX.Element) => {
            return <span>as of {date}</span>
          },
    translated: false,
    src: ["src/budget/accounts.tsx line 196"],
    h: "zfEhD0nTmeclrDPBvF4YQvThWfdELzmW0m1T1UJNEKw=",
  },
  "getting-started-link": {
    val: (clickhandler) => {
          return <span>First time using Buckets?  Check out the <a href="#" onClick={clickhandler}>Getting Started Videos.</a></span>
        },
    translated: false,
    src: ["src/budget/accounts.tsx line 225"],
    h: "9NGQRvIxlAaOF9i+zWPXMFQubcY+5jtA7Td/lii16aM=",
  },
  "New account": {
    val: "New account",
    translated: false,
    src: ["src/budget/accounts.tsx line 236"],
    h: "MtAiANg7ugdeUiGmiGklfBPG4T1igh1iChKeC0Mdxnc=",
  },
  "Connect to bank": {
    val: "Connect to bank",
    translated: false,
    src: ["src/budget/accounts.tsx line 237"],
    h: "0T7eA3oFvMxyPIOAkMZ2rDpJxQVORgxrLqrDx87L1ZY=",
  },
  "default account name": {
    val: "Savings",
    translated: false,
    src: ["src/budget/accounts.tsx line 266"],
    h: "zCYN8vtLT3Hhb9CbDDSL2xOOjqhzmmhMa5yWDTR7bCE=",
  },
  "toast.updated-trans": {
    val: count => `Updated/created ${count} transactions`,
    translated: false,
    src: ["src/budget/appstate.ts line 297"],
    h: "bBKDE3rQIV5P80cYEL6mkLmIvgxjzVHCIf3aFa+KtmU=",
  },
  "sync.toast.syncing": {
    val: (start:moment.Moment, end:moment.Moment) => {
        return `Syncing transactions from ${start.format('ll')} to ${end.format('ll')}`;
      },
    translated: false,
    src: ["src/budget/appstate.ts line 308"],
    h: "f7R9zSdK0q5+lZ8I9QRhiwN5ENKyWFnrmUG6Gltegfs=",
  },
  "Sync complete": {
    val: "Sync complete",
    translated: false,
    src: ["src/budget/appstate.ts line 326"],
    h: "e2VXpLTi1mhVSVqDkExwdM5j8PhfW0MHeOqBwabU4Zo=",
  },
  "Account created: ": {
    val: "Account created: ",
    translated: false,
    src: ["src/budget/appstate.ts line 372"],
    h: "AJEfsK8U+n7xnyBkG2FG3cmZZipr4kpQX5mgCZ0Qwi4=",
  },
  "Unknown account: ": {
    val: "Unknown account: ",
    translated: false,
    src: ["src/budget/appstate.ts line 425"],
    h: "1pPv2ePlW/PBrqgYgGCM3lU9qnmnbplR3AzSDDG4TLs=",
  },
  "Un-kick": {
    val: "Un-kick",
    translated: false,
    src: ["src/budget/buckets.tsx line 45","src/budget/buckets.tsx line 972"],
    h: "P5Z1ij4jmS06jNOQiHymi+/D+uYJktoalTdw+AHGukM=",
  },
  "You haven't kicked the bucket yet...": {
    val: "You haven't kicked the bucket yet...",
    translated: false,
    src: ["src/budget/buckets.tsx line 53"],
    h: "mtaAsLJ7BgWZcbIkRmZ4ZPSSRGXj6vJ2H8+diLhIba4=",
  },
  "Bucket": {
    val: "Bucket",
    translated: false,
    src: ["src/budget/buckets.tsx line 60","src/budget/buckets.tsx line 795","src/budget/reports.tsx line 652","src/budget/searchpage.tsx line 96","src/budget/searchpage.tsx line 172"],
    h: "APPSgbsmF5H9B7YIJDaPcEVh4T7ctWU+hxQv/eG1Dg0=",
  },
  "In": {
    val: "In",
    translated: false,
    src: ["src/budget/buckets.tsx line 99"],
    h: "TcCPpYF7/U7vM5pPmpqvJipZt0WPk3A/vC7Ec8pfDvo=",
  },
  "Out": {
    val: "Out",
    translated: false,
    src: ["src/budget/buckets.tsx line 105"],
    h: "v4Oj0CQx7cmHP4mcJsZX4xMTzMzeFS81XA9gU3qOFKU=",
  },
  "Net": {
    val: "Net",
    translated: false,
    src: ["src/budget/buckets.tsx line 117"],
    h: "QITdwYnhK1fVfALCDc6jQhY2jLIUBpPp0/bSHOX6p9M=",
  },
  "If Net is 0, the bucket transactions will be marked as transfers rather than as income or expenses.": {
    val: "If Net is 0, the bucket transactions will be marked as transfers rather than as income or expenses.",
    translated: false,
    src: ["src/budget/buckets.tsx line 117"],
    h: "/btREV6/jPJtrc1ERDwLUyJAowC8+v6gUB7bmJJYzT4=",
  },
  "Rain left": {
    val: "Rain left",
    translated: false,
    src: ["src/budget/buckets.tsx line 125"],
    h: "+xrBpD9ex3fqQgh+YuNxsFxWyrbE8G1236f81k2whuY=",
  },
  "Make it so": {
    val: "Make it so",
    translated: false,
    src: ["src/budget/buckets.tsx line 132","src/budget/buckets.tsx line 134"],
    h: "XRTIWjylWKAy5BW8/0C0rOSW5S1QC+CxmgmFfhi81pk=",
  },
  "Self debt": {
    val: "Self debt",
    translated: false,
    src: ["src/budget/buckets.tsx line 157"],
    h: "zRWPLHqBTGcGqHHBHWdXpN2eOUUhRhvCyeAccFlR9Z4=",
  },
  "Amount of money over-allocated in buckets.": {
    val: "Amount of money over-allocated in buckets.",
    translated: false,
    src: ["src/budget/buckets.tsx line 157"],
    h: "kFucvPefN9Kae7dArnle8i0rTZZq1U+3d8w81lDNVKw=",
  },
  "Make it rain!": {
    val: "Make it rain!",
    translated: false,
    src: ["src/budget/buckets.tsx line 190"],
    h: "GCU3Hru9VCit7F+BYEMKmg5U8gsc1/UZ+o5wsbMAkeY=",
  },
  "action.New bucket": {
    val: "New bucket",
    translated: false,
    src: ["src/budget/buckets.tsx line 191","src/budget/buckets.tsx line 805"],
    h: "aIKjDQtVbUMjIHU/6fccfiWBUIwUBnAofdzRJTCuytI=",
  },
  "action.New group": {
    val: "New group",
    translated: false,
    src: ["src/budget/buckets.tsx line 192"],
    h: "054RU7JImk6Pavh27xHA9CgGIgjmP0dYIgXez2UWx34=",
  },
  "Rain": {
    val: "Rain",
    translated: false,
    src: ["src/budget/buckets.tsx line 195","src/budget/buckets.tsx line 799","src/budget/budget.tsx line 211","src/budget/budget.tsx line 234"],
    h: "fqeHyOaOYnCtGAcJlJbhAR37DG6YMrsasUNtiL6z8hc=",
  },
  "Total amount your buckets expect each month.": {
    val: "Total amount your buckets expect each month.",
    translated: false,
    src: ["src/budget/buckets.tsx line 195"],
    h: "UtK2gxh+N9D/p1G6dLyhcKMP5Df5XCyEp0jM0c+qoUw=",
  },
  "default new bucket name": {
    val: "New Bucket",
    translated: false,
    src: ["src/budget/buckets.tsx line 226","src/budget/buckets.tsx line 810"],
    h: "FchHrB6weykpHiqRVxc5QKb6BEdhH4DXrc+t6RNcF8M=",
  },
  "default new group name": {
    val: "New Group",
    translated: false,
    src: ["src/budget/buckets.tsx line 229"],
    h: "1dmXA/VlW+tjhojOGcypAy70L2wupHf9EdVjUByvpmA=",
  },
  "Goal:": {
    val: "Goal:",
    translated: false,
    src: ["src/budget/buckets.tsx line 376","src/budget/buckets.tsx line 503"],
    h: "77+E2dn/Mw53xjGhNc6irsiq1WULAiC4yIyt4NaO0DM=",
  },
  "Target date:": {
    val: "Target date:",
    translated: false,
    src: ["src/budget/buckets.tsx line 393"],
    h: "InmNQoNHlJkDpjvEB+J1XPqDWRqnfNIUwTQ86iNiOGc=",
  },
  "Monthly deposit:": {
    val: "Monthly deposit:",
    translated: false,
    src: ["src/budget/buckets.tsx line 408"],
    h: "GKlnbgfjEkmlOI0TT0pyfI30T1/0jrXjT01JZrBTpP0=",
  },
  "Bucket type:": {
    val: "Bucket type:",
    translated: false,
    src: ["src/budget/buckets.tsx line 428"],
    h: "NMC+sjsH6UgNhNtiqYeiHDi4zDK/+S5h5yMfZ5CQk1c=",
  },
  "buckettype.plain": {
    val: "Plain old bucket",
    translated: false,
    src: ["src/budget/buckets.tsx line 435"],
    h: "AqvTaZK8lidyI8PZ9JXBBQABazz8uxM+uQM6iEuyO6w=",
  },
  "buckettype.deposit": {
    val: "Recurring expense",
    translated: false,
    src: ["src/budget/buckets.tsx line 436"],
    h: "3HXotB9ZHFm14ArdM0RfCT0merw8+KuXthbzotnPRec=",
  },
  "buckettype.goal-date": {
    val: "Save X by Y date",
    translated: false,
    src: ["src/budget/buckets.tsx line 437"],
    h: "+boZHIer4ggkvJ8A5cSl1EVyWRwKigC9UkBFn4WSEdg=",
  },
  "buckettype.goal-deposit": {
    val: "Save X by depositing Z/mo",
    translated: false,
    src: ["src/budget/buckets.tsx line 438"],
    h: "BUzPSZsbi+lN/3tb6eF63oa7CEzS94r6ee5jf5G7inA=",
  },
  "buckettype.deposit-date": {
    val: "Save Z/mo until Y date",
    translated: false,
    src: ["src/budget/buckets.tsx line 439"],
    h: "zdWdEX9eN5qpFDboBF+wi9EIguwYsB9nQCzN9GjrxMc=",
  },
  "Goal completion:": {
    val: "Goal completion:",
    translated: false,
    src: ["src/budget/buckets.tsx line 452"],
    h: "v+G5gj6B+MtHwQovNmj/BWbpnQncARZGo+swhE1fbtg=",
  },
  "some day...": {
    val: "some day...",
    translated: false,
    src: ["src/budget/buckets.tsx line 454"],
    h: "4K+3SY48UwcktULX4xiGt6J8Q8Hys3JjUR3t62WI6mo=",
  },
  "Required deposit:": {
    val: "Required deposit:",
    translated: false,
    src: ["src/budget/buckets.tsx line 463"],
    h: "Q34JZduUI2Lx8xxjkeH/Md92nqWgEcbPFZjgf5m7tXA=",
  },
  "Ending amount:": {
    val: "Ending amount:",
    translated: false,
    src: ["src/budget/buckets.tsx line 475"],
    h: "0IUvXk9nogxjdL1n0VZPrxcMOUZODNXMlGrlpyXq8bI=",
  },
  "Goal: 0": {
    val: "Goal: 0",
    translated: false,
    src: ["src/budget/buckets.tsx line 497"],
    h: "rtvJnJFYA7lHYjPjGpF27/h2So3pRdrRLjfnkg78woQ=",
  },
  "rainfall-received-this-month": {
    val: (money:JSX.Element, percent:number) => {
          return <span>Rainfall received this month: {money} ({percent}%)</span>
        },
    translated: false,
    src: ["src/budget/buckets.tsx line 583"],
    h: "8WyxY5Vv9Dh9oCx1HkelgzuyfrAW/ynIxBz0ocmoEl4=",
  },
  "This is a special group for all the buckets without a group.": {
    val: "This is a special group for all the buckets without a group.",
    translated: false,
    src: ["src/budget/buckets.tsx line 783"],
    h: "QP5fEqFwlvHWJyjzrIWUJFlMvhFDxxSsl1vnej/p30I=",
  },
  "Effective": {
    val: "Effective",
    translated: false,
    src: ["src/budget/buckets.tsx line 797"],
    h: "Iu58QrugjAc/VqZhXc0aKtmSC8KziRWTzVTiliXpAL0=",
  },
  "effective.help": {
    val: "This would be the balance if no buckets were in debt.",
    translated: false,
    src: ["src/budget/buckets.tsx line 797"],
    h: "D6V8nTUoyPCGCdFMHiUFZiACXp8Lpz5MFDbiujAlfSc=",
  },
  "In/Out": {
    val: "In/Out",
    translated: false,
    src: ["src/budget/buckets.tsx line 798"],
    h: "G/e+QHikQOjTM9bcDBrmUZj6ONRstDFt17sNXu9zUd8=",
  },
  "bucketrain.help": {
    val: "This is how much money these buckets want each month.  The little box indicates how much they have received.",
    translated: false,
    src: ["src/budget/buckets.tsx line 799"],
    h: "3dbOFkUiGaEoD01CP7kIWDQHgUbULWexjdEKdEAF3sA=",
  },
  "bucket.detailslabel": {
    val: "Details",
    translated: false,
    src: ["src/budget/buckets.tsx line 800"],
    h: "68e/QPEuI36iIEcTWmKDrVU9KBReQ3EjFzF1F06KQMA=",
  },
  "misc group name": {
    val: "Misc",
    translated: false,
    src: ["src/budget/buckets.tsx line 936"],
    h: "DPoc7CIbzLHJxuar3WnaidO3Ryy1QtYkCswRzVHtVBg=",
  },
  "single-bucket Kicked": {
    val: "Kicked",
    translated: false,
    src: ["src/budget/buckets.tsx line 968"],
    h: "cWApfoLlcBvoHizIFtrDQq3uwrZIYMXKO1iLMvv8szI=",
  },
  "Bucket deleted completely": {
    val: "Bucket deleted completely",
    translated: false,
    src: ["src/budget/buckets.tsx line 981"],
    h: "gBMlSFTWDRRSWZeZ3fuxDhpJnhv2MoF3EvZSwo1BZHg=",
  },
  "Kick the bucket": {
    val: "Kick the bucket",
    translated: false,
    src: ["src/budget/buckets.tsx line 984"],
    h: "IvzeGJ9G+Rns8Rbnal26flTFzd+yBNSEBQSptdNy8t8=",
  },
  "Balance:": {
    val: "Balance:",
    translated: false,
    src: ["src/budget/buckets.tsx line 1033"],
    h: "hHHAAGXs0oscbD5jkMQSQUQ5sLsgo/sPaBumUBAq+CA=",
  },
  "Rainfall this month:": {
    val: "Rainfall this month:",
    translated: false,
    src: ["src/budget/buckets.tsx line 1034"],
    h: "S6dFwRYAFyRMUh4i6My2aNacGwMh8taa7neVTx9aiAM=",
  },
  "Posted": {
    val: "Posted",
    translated: false,
    src: ["src/budget/buckets.tsx line 1088","src/budget/searchpage.tsx line 142","src/budget/searchpage.tsx line 171","src/budget/transactions.tsx line 214","src/csvimport.tsx line 504"],
    h: "h6jjM8ytGdEj+QfDnTVzEdq+0oLSE9zd+MArY7gtjzU=",
  },
  "Memo": {
    val: "Memo",
    translated: false,
    src: ["src/budget/buckets.tsx line 1089","src/budget/searchpage.tsx line 144","src/budget/searchpage.tsx line 173","src/budget/transactions.tsx line 216","src/csvimport.tsx line 334","src/csvimport.tsx line 505"],
    h: "9yClwoAwAV0+DXl8NnkkAnlUi+Ebp2soPwN5meYKgWY=",
  },
  "Amount": {
    val: "Amount",
    translated: false,
    src: ["src/budget/buckets.tsx line 1090","src/budget/searchpage.tsx line 145","src/budget/searchpage.tsx line 174","src/budget/transactions.tsx line 217","src/csvimport.tsx line 333","src/csvimport.tsx line 506"],
    h: "DHNNaJF4hWTWIFdaMdMhUT4aSdti7ZfaNexABzxWWzc=",
  },
  "noun.transfer": {
    val: "Transfer",
    translated: false,
    src: ["src/budget/buckets.tsx line 1092","src/budget/transactions.tsx line 632","src/budget/transactions.tsx line 648"],
    h: "B5GGqjnE8KOjYJjhsFV7zs5TGmGmVPqjihzMVxHJ3sI=",
  },
  "bucket.transfer.help": {
    val: "A transfer is a transaction from one bucket to another.  If the transaction isn't income or an expense, it's likely a transfer.",
    translated: false,
    src: ["src/budget/buckets.tsx line 1092"],
    h: "dh5nslkaB1wNR4tJ5zAn6Hms+9oJqBDmAIR5k6WE6iY=",
  },
  "Misc": {
    val: "Misc",
    translated: false,
    src: ["src/budget/buckets.tsx line 1093"],
    h: "DPoc7CIbzLHJxuar3WnaidO3Ryy1QtYkCswRzVHtVBg=",
  },
  "Trial Version": {
    val: "Trial Version",
    translated: false,
    src: ["src/budget/budget.tsx line 120","src/mainprocess/menu.ts line 250"],
    h: "GtZIXrHILA84HlpKlxi3BErHwR7WIYkQ/e5BE0Fiaxg=",
  },
  "Accounts": {
    val: "Accounts",
    translated: false,
    src: ["src/budget/budget.tsx line 148","src/budget/budget.tsx line 215","src/budget/searchpage.tsx line 115"],
    h: "1oHDkv2zB1yiCABVTWBY5oX4Ccu36nJBCG7Q+JVg8TA=",
  },
  "Closed": {
    val: "Closed",
    translated: false,
    src: ["src/budget/budget.tsx line 150"],
    h: "8pZrnvzAUQTJhDN/XX31DLvx0wIs1Ww3fV6pktEKEHs=",
  },
  "Transactions": {
    val: "Transactions",
    translated: false,
    src: ["src/budget/budget.tsx line 152","src/budget/exportpage.tsx line 147"],
    h: "4+yGUer/b71cfxTdeUa5QbonqN9ezC8Eii7KO22Ety0=",
  },
  "Buckets": {
    val: "Buckets",
    translated: false,
    src: ["src/budget/budget.tsx line 153","src/budget/budget.tsx line 220","src/budget/searchpage.tsx line 92"],
    h: "fMPIWzGvVEG0t7+bZX1ucgzulk8FaQfqioLgwLsj+oE=",
  },
  "Kicked": {
    val: "Kicked",
    translated: false,
    src: ["src/budget/budget.tsx line 155"],
    h: "cWApfoLlcBvoHizIFtrDQq3uwrZIYMXKO1iLMvv8szI=",
  },
  "Analysis": {
    val: "Analysis",
    translated: false,
    src: ["src/budget/budget.tsx line 157"],
    h: "+LNAOPSLW2rpFCrT+U1suhdnoYyZa1k8ALddRlddDlI=",
  },
  "Recurring Expenses": {
    val: "Recurring Expenses",
    translated: false,
    src: ["src/budget/budget.tsx line 160"],
    h: "yDp5Agru+QzDSy583s3kjOdZbbe6X1WDfMeSNXsYlaY=",
  },
  "Import": {
    val: "Import",
    translated: false,
    src: ["src/budget/budget.tsx line 163"],
    h: "F3sijvfYz3oB4iz2rVHjUvNDLQs43MbXDVIr5VFA2/c=",
  },
  "Tools": {
    val: "Tools",
    translated: false,
    src: ["src/budget/budget.tsx line 164"],
    h: "mPsch0seV0ZNaU+41My/wS+DkAGfYqzWpPlJpfT1sBs=",
  },
  "Search": {
    val: "Search",
    translated: false,
    src: ["src/budget/budget.tsx line 167"],
    h: "vembE+Cp1aKCKR2j2LCJD29QyiQxfGPUcGI1I8l5/5Y=",
  },
  "Export": {
    val: "Export",
    translated: false,
    src: ["src/budget/budget.tsx line 168","src/budget/exportpage.tsx line 97"],
    h: "mZJs0iE089tMZ5BWqTUBp+2aJ90wKL4act4hUPt7zkA=",
  },
  "Chat with Matt": {
    val: "Chat with Matt",
    translated: false,
    src: ["src/budget/budget.tsx line 174"],
    h: "9nQjbkjkf8l2mX6xeNaU///NYhxxWFqnvTKOmakMmRY=",
  },
  "Used in future": {
    val: "Used in future",
    translated: false,
    src: ["src/budget/budget.tsx line 225"],
    h: "O0zGsqv23d44/pWJqCSt+qkDtG/nBrBI2W0aRA9XoDw=",
  },
  "rain.help.pos": {
    val: (abs_amount:JSX.Element) => {
                                      return <span>
                                      You have {abs_amount} left to put into buckets.
                                      </span>
                                    },
    translated: false,
    src: ["src/budget/budget.tsx line 241"],
    h: "boezbSGkVm3dnfFvodJOAeCgAEMIQN9L+8TwEHLpU/o=",
  },
  "rain.help.neg": {
    val: (abs_amount:JSX.Element) => {
                                      return <span>
                                      You have put {abs_amount} too much money into buckets.  If all transactions have been categorized this month, remove {abs_amount} from buckets of your choosing.
                                      </span>
                                    },
    translated: false,
    src: ["src/budget/budget.tsx line 246"],
    h: "tqXmJxZXqyA0mN/8ugZkpCyspyO7XlPnGlEYGWgQ7jk=",
  },
  "Income": {
    val: "Income",
    translated: false,
    src: ["src/budget/budget.tsx line 261","src/budget/reports.tsx line 213"],
    h: "D2fJbta5d1Z5QYuRC5zzkBHsItZOOgY4FKrFJ64BvRs=",
  },
  "Expenses": {
    val: "Expenses",
    translated: false,
    src: ["src/budget/budget.tsx line 266","src/budget/reports.tsx line 224"],
    h: "d6aKytFAPwPUzFOv41R0itfcMu11VdE29vkM05dnpBU=",
  },
  "months gain/loss label": {
    val: (gain) => {
                        return gain >= 0 ? "Month's gain" : "Month's loss";
                      },
    translated: false,
    src: ["src/budget/budget.tsx line 271"],
    h: "lGcEnJfZJau2h5ohbKNxY1FjL0vJoW3oJOJQwSCt+Kg=",
  },
  "in the bank": {
    val: "in the bank",
    translated: false,
    src: ["src/budget/budget.tsx line 277"],
    h: "7gl7ZdgJ3HfhOcQMiU7hVkFpXIR3KFxXtlMhKyE/Irw=",
  },
  "I'm exporting data so that I can ": {
    val: "I'm exporting data so that I can ",
    translated: false,
    src: ["src/budget/exportpage.tsx line 24"],
    h: "I5s/a+WZelEoEbDU6z2RwMHJGBkfJJ7zZEZcw89IBck=",
  },
  "daterange.all": {
    val: "All time",
    translated: false,
    src: ["src/budget/exportpage.tsx line 42"],
    h: "Fz1lBhxlewLJ5bSKTiIzzaW3CAtAPxkUWWKU0BVqgAA=",
  },
  "daterange.thismonth": {
    val: "This month",
    translated: false,
    src: ["src/budget/exportpage.tsx line 47"],
    h: "jqSPxB9W3Xqmvb/7MIrwKgcCTUR0zgU3qqTqJFET1e0=",
  },
  "daterange.fromlastmonth": {
    val: "From last month",
    translated: false,
    src: ["src/budget/exportpage.tsx line 52"],
    h: "tIBgx9VgMgV21a9XhH7L7TIe/PfdgcW3fdfGaGOeVMo=",
  },
  "daterange.from2monthsago": {
    val: "From 2 months ago",
    translated: false,
    src: ["src/budget/exportpage.tsx line 57"],
    h: "zb4vtJXSL+UcXZTjSbkQueS8khVvJO2MDoFKKPuuDPM=",
  },
  "daterange.from3monthsago": {
    val: "From 3 months ago",
    translated: false,
    src: ["src/budget/exportpage.tsx line 62"],
    h: "4957XI6fjMtXcCqj3IRSUSQzX4ZlEucDTuwgu2krTLw=",
  },
  "export.why": {
    val: "Perhaps what you're doing with exported data could be built into Buckets.  Mind sending a note?",
    translated: false,
    src: ["src/budget/exportpage.tsx line 70"],
    h: "mv9GxRVjWShYHYo8kb/wvNU8eEYBGE2QtfUTxTsdP0I=",
  },
  "Thank you for the feedback!": {
    val: "Thank you for the feedback!",
    translated: false,
    src: ["src/budget/exportpage.tsx line 88"],
    h: "8bEPNAScct0pvqY775nF665zylB3/fKo1h3MqoWzXIQ=",
  },
  "Submit feedback": {
    val: "Submit feedback",
    translated: false,
    src: ["src/budget/exportpage.tsx line 94"],
    h: "ksa09D0YEXUycx+K+ZODvbWRCP78R2W7ClHhOaX4LmM=",
  },
  "From": {
    val: "From",
    translated: false,
    src: ["src/budget/exportpage.tsx line 101"],
    h: "cCFAY2/zl3pq5fMwrP/2LBsrrL36SYzS+6in7mvWyvY=",
  },
  "To": {
    val: "To",
    translated: false,
    src: ["src/budget/exportpage.tsx line 118"],
    h: "syFKIORaeu0FezL85oAbo76XXa8k7bxITMbNowi8ba0=",
  },
  "File saved: ": {
    val: "File saved: ",
    translated: false,
    src: ["src/budget/exportpage.tsx line 142"],
    h: "e6UDV8UzF5qqysQpN3OrcspjD8zPNn72zKd1CH1lFe8=",
  },
  "match-count": {
    val: (current_match:number, total_matches:number) => {
        return `${current_match} of ${total_matches}`;
      },
    translated: false,
    src: ["src/budget/finding.tsx line 129"],
    h: "gGpkwXhLiDpxY0YOCXAFl6Q8D6sb7BX93TqgFRObOqo=",
  },
  "Sync": {
    val: "Sync",
    translated: false,
    src: ["src/budget/importpage.tsx line 28","src/budget/importpage.tsx line 183"],
    h: "zJAmFTCwHue7APF8kCb39YCX8J17Tsy3mxyhpQQhge8=",
  },
  "Syncing...": {
    val: "Syncing...",
    translated: false,
    src: ["src/budget/importpage.tsx line 32"],
    h: "kuwg7vpvp082IqBtRakekOVu7bqB4PYxhnFVsoBDt/g=",
  },
  "A sync is already in progress": {
    val: "A sync is already in progress",
    translated: false,
    src: ["src/budget/importpage.tsx line 40"],
    h: "z6CqgxENo0xxB0LPp8P8rmnLPp1m2NElecEaJM8GDfI=",
  },
  "Error running sync": {
    val: "Error running sync",
    translated: false,
    src: ["src/budget/importpage.tsx line 46"],
    h: "LB/WNzHp4orPsbCVEJuDzUPsQUfNRDNXw7sFnbzfguw=",
  },
  "Sync has not yet been set up.": {
    val: "Sync has not yet been set up.",
    translated: false,
    src: ["src/budget/importpage.tsx line 51"],
    h: "B5XIfqqMdt0gMHz2zsZr9GTj9vSRAS5R2akgGce+fsg=",
  },
  "simplefin-connect-intro": {
    val: "To connect, do the following:",
    translated: false,
    src: ["src/budget/importpage.tsx line 88"],
    h: "421gz/BziKZhsIy2YKRFNtwoqPcbQ7uhFZWWfd6ReBg=",
  },
  "simplefin-get-token": {
    val: (mklink) => {
              return <span>Get a SimpleFIN Token from the {mklink('SimpleFIN Bridge')}</span>
            },
    translated: false,
    src: ["src/budget/importpage.tsx line 92"],
    h: "VEeKjngcHxowWbB2xWy5oNH4MXIfJQ7EqpiomT6V0fg=",
  },
  "simplefin-paste": {
    val: "Then paste your SimpleFIN Token here:",
    translated: false,
    src: ["src/budget/importpage.tsx line 102"],
    h: "vAoRsY20OBqs8bleaXD3auq8VnO9gQj7gXz5p+p71EI=",
  },
  "Connecting...": {
    val: "Connecting...",
    translated: false,
    src: ["src/budget/importpage.tsx line 107"],
    h: "fYdj0RfOQMPN3n28gswFnK4aOvozPH0hqm9oqd+NcWI=",
  },
  "Unlinked Accounts": {
    val: "Unlinked Accounts",
    translated: false,
    src: ["src/budget/importpage.tsx line 122"],
    h: "BPAjsiEkATiwSf9f6kde3yZwSmmyiPDLiZ7Rr+3Zv/A=",
  },
  "Macros": {
    val: "Macros",
    translated: false,
    src: ["src/budget/importpage.tsx line 130"],
    h: "yo4VuLKqBNhvEBgUZKyI2WypDrv1loL/wA1qO3u4Zq4=",
  },
  "SimpleFIN Connections": {
    val: "SimpleFIN Connections",
    translated: false,
    src: ["src/budget/importpage.tsx line 141"],
    h: "yzXdwvSSNy+FUFHW5+bAqRMq+j6krsNUFb/uFreKPNY=",
  },
  "CSV Fields": {
    val: "CSV Fields",
    translated: false,
    src: ["src/budget/importpage.tsx line 149"],
    h: "oqAayNv4L3OeWfsN66FDAh9MWIsR//voLRTEotp3GUQ=",
  },
  "CSV Account": {
    val: "CSV Account",
    translated: false,
    src: ["src/budget/importpage.tsx line 159"],
    h: "iUtlYMX6nlvjb8WPFElRbcnOQ/BXPc6BjaHKp6b6GUM=",
  },
  "Cancel sync": {
    val: "Cancel sync",
    translated: false,
    src: ["src/budget/importpage.tsx line 183"],
    h: "8xFWyPShIifEhumOA/PeoTtccm5TTtbQmWFViIGcPQA=",
  },
  "Test Toast": {
    val: "Test Toast",
    translated: false,
    src: ["src/budget/importpage.tsx line 191"],
    h: "5SbiliirLaAKLdgRThX+cO2RwGuC87t3Z1O0xT2WsAE=",
  },
  "Create macro": {
    val: "Create macro",
    translated: false,
    src: ["src/budget/importpage.tsx line 214"],
    h: "9xZZAswDH8zePPUhfsaSEDJ21GU1yhILKhDWtvnUlr0=",
  },
  "Connect": {
    val: "Connect",
    translated: false,
    src: ["src/budget/importpage.tsx line 235"],
    h: "pCLQy6ZAsZnJ3ff5r+iD+O2vHQhIJEEUHUhiY1NrMP0=",
  },
  "Connection saved!": {
    val: "Connection saved!",
    translated: false,
    src: ["src/budget/importpage.tsx line 311"],
    h: "wAgyeIQsbaI/kFPgBf8sWlKK1mf/VcP7BjHpC9TNYuc=",
  },
  "On": {
    val: "On",
    translated: false,
    src: ["src/budget/importpage.tsx line 326"],
    h: "nMAfqtecKNqqRD1YLNX1F32SXJy1exEgm1QvpnZLBQQ=",
  },
  "When \"On\" this macro will be run during a normal sync.": {
    val: "When \"On\" this macro will be run during a normal sync.",
    translated: false,
    src: ["src/budget/importpage.tsx line 326"],
    h: "HnJ7qVSPXxIg3/lygw1Ln/VvBMBs8roJwXlCpP2KnMw=",
  },
  "Name": {
    val: "Name",
    translated: false,
    src: ["src/budget/importpage.tsx line 327"],
    h: "bMXfNfAzjiMOnmM+rZmR8I9iyrRaMmSXja7cZ0eGcwU=",
  },
  "Confirm delete?": {
    val: "Confirm delete?",
    translated: false,
    src: ["src/budget/importpage.tsx line 384","src/budget/importpage.tsx line 408"],
    h: "m+7d5sl049xaPiNCOrhWnQKaw3HfiPQOZ5x7tuKVVd8=",
  },
  "ID": {
    val: "ID",
    translated: false,
    src: ["src/budget/importpage.tsx line 416"],
    h: "ge86Jcy26vcv5uPFI29MfLOxHh8ctACck6nRdrl9aM4=",
  },
  "Last used": {
    val: "Last used",
    translated: false,
    src: ["src/budget/importpage.tsx line 417"],
    h: "G5a6Jdor9jRT/Wtcg9SfXQsvqL7VFvnVD2+gq7yT1Jg=",
  },
  "Description": {
    val: "Description",
    translated: false,
    src: ["src/budget/importpage.tsx line 443"],
    h: "bg0ZDIR+z+PEkinc/ZyqkERMsVZcFFm3NhQoIqZH+WM=",
  },
  "Create new account": {
    val: "Create new account",
    translated: false,
    src: ["src/budget/importpage.tsx line 480","src/csvimport.tsx line 469"],
    h: "SmoVFbeAWSO4cW1YQJbuDJQz8kenVz5++WTJEkS6Vos=",
  },
  "action.link-account": {
    val: "Link",
    translated: false,
    src: ["src/budget/importpage.tsx line 485"],
    h: "unfAYQpjuyuTjjRCodr+S+jNjRmz3nahjZ91u/j5HfE=",
  },
  "Month to Month": {
    val: "Month to Month",
    translated: false,
    src: ["src/budget/reports.tsx line 67"],
    h: "VYq/DQYARQsjblXvXMijYnVbyFbLkqoRYmQ8IHhTbDQ=",
  },
  "Year to Year": {
    val: "Year to Year",
    translated: false,
    src: ["src/budget/reports.tsx line 79"],
    h: "YBGCdB/QACmMM/QS2qMrGlC8qtfWz9bhue7sgDaIRHg=",
  },
  "Avg:": {
    val: "Avg:",
    translated: false,
    src: ["src/budget/reports.tsx line 220","src/budget/reports.tsx line 231"],
    h: "EVMZyhHQEFPlI2ib8VqTJo25bJBk8gHsgZR1SZ2Jcj0=",
  },
  "Net Transfers": {
    val: "Net Transfers",
    translated: false,
    src: ["src/budget/reports.tsx line 235"],
    h: "4FYbJ2rCxhrWW9XBurKbS2mOSTwlxIXH/jCv5FDofeM=",
  },
  "net-transfers.help": {
    val: "Net transfers are the sum total of all transactions marked as a transfer.  It should be 0.  If it's not, click through to make sure there aren't duplicate transactions or transactions miscategorized as transfers.",
    translated: false,
    src: ["src/budget/reports.tsx line 235"],
    h: "2P3jr/VPQ35tlPa/uDMqi1spXO4Rinn76fgfVOegiA8=",
  },
  "Tot:": {
    val: "Tot:",
    translated: false,
    src: ["src/budget/reports.tsx line 242","src/budget/reports.tsx line 380"],
    h: "saHMHdDjhEhiq86BBPRvnL+Rb3M/qOu30ZLtUk20QIM=",
  },
  "Gain/Loss": {
    val: "Gain/Loss",
    translated: false,
    src: ["src/budget/reports.tsx line 373"],
    h: "Kop7hNPijjGN5jXxpDmcP32CJy22tzVz1qXWTjNxVg0=",
  },
  "Ending Balance": {
    val: "Ending Balance",
    translated: false,
    src: ["src/budget/reports.tsx line 432"],
    h: "bwan2qqqdDloluCkgp+UPYWSAeOQk9zkaNwb2p0kUDk=",
  },
  "Yearly expenses": {
    val: "Yearly expenses",
    translated: false,
    src: ["src/budget/reports.tsx line 648"],
    h: "W3uzJb/bdMxa/o4IKEKVOWp7OQOGS7ry0h2rz8iPzoM=",
  },
  "Monthly expenses": {
    val: "Monthly expenses",
    translated: false,
    src: ["src/budget/reports.tsx line 648"],
    h: "lRQupgq3/amJQmfkf9uUeT0IsRZu/ItiYG/EpDFhpbg=",
  },
  "Budgeted": {
    val: "Budgeted",
    translated: false,
    src: ["src/budget/reports.tsx line 653"],
    h: "aP72arzLN/j79zGtL8DWE7wcBGciRcWqMOR1aTHJmNo=",
  },
  "This year": {
    val: "This year",
    translated: false,
    src: ["src/budget/reports.tsx line 654"],
    h: "tyLfSOqGxN8pzOFyp86CGrYZjNShj7I5+Jt+cZf1sow=",
  },
  "Last month": {
    val: "Last month",
    translated: false,
    src: ["src/budget/reports.tsx line 654"],
    h: "1sq1B50c3wJfgKUL6HnwzskKsFcpjdWvyeQX1/HmS9g=",
  },
  "Average": {
    val: "Average",
    translated: false,
    src: ["src/budget/reports.tsx line 655"],
    h: "zLxQhptvlIYtt0l/prvWMqnsQHh7N1gxh33WeorRi2w=",
  },
  "Period": {
    val: "Period",
    translated: false,
    src: ["src/budget/reports.tsx line 656"],
    h: "hfDqPEJ79UozdsoxEfonMjVDqZQXPzQBbmDwoKYutvo=",
  },
  "Budgeted:": {
    val: "Budgeted:",
    translated: false,
    src: ["src/budget/reports.tsx line 733"],
    h: "bTtWXmUkwbhbFLeckHBWA4GKlgok1A9UhOuat+uSsyU=",
  },
  "Average:": {
    val: "Average:",
    translated: false,
    src: ["src/budget/reports.tsx line 747"],
    h: "cjkXL/zpI+dQWkGrhO9+31XBHKDYu26Sb2ce60wR8+w=",
  },
  "Last:": {
    val: "Last:",
    translated: false,
    src: ["src/budget/reports.tsx line 758"],
    h: "vd4w6yiveUoFIgWprGJfN0nrT8tNDMck5dOojPgHQNs=",
  },
  "period-display": {
    val: (n:number, unit:'year'|'month') => {
        return `${n}${unit === 'year' ? 'yr' : 'mo'}`;
    },
    translated: false,
    src: ["src/budget/reports.tsx line 813"],
    h: "fK5jMz0cZJ/y+/XlVn62srIYfD9sHxqK0lOBExYeM1o=",
  },
  "Note": {
    val: "Note",
    translated: false,
    src: ["src/budget/searchpage.tsx line 97","src/budget/searchpage.tsx line 120","src/budget/searchpage.tsx line 146","src/budget/searchpage.tsx line 175"],
    h: "omcHOlFDF1aMLf9t2/tJ9R1dYEFSQC9IiPuXLXuFwEk=",
  },
  "Account Transactions": {
    val: "Account Transactions",
    translated: false,
    src: ["src/budget/searchpage.tsx line 138"],
    h: "GPJhFDki3xJdCOMqCkqdUDX7SfEZcg9wGee8KMIuIno=",
  },
  "Bucket Transactions": {
    val: "Bucket Transactions",
    translated: false,
    src: ["src/budget/searchpage.tsx line 167"],
    h: "5hMoGWO5uTeCOujLdFnRx4w3D6Zka/avSxnH14UmJiI=",
  },
  "Nothing found matching:": {
    val: "Nothing found matching:",
    translated: false,
    src: ["src/budget/searchpage.tsx line 196"],
    h: "NF10b/Nmjj8holFGK7KIiaJhSb8bsL9Zt/Fa8fFy4gk=",
  },
  "Searching...": {
    val: "Searching...",
    translated: false,
    src: ["src/budget/searchpage.tsx line 200"],
    h: "7gAp07Zv3EjrgHoWJ04wEdRefy/aQ0zT8Y2EgQrnbHo=",
  },
  "Search:": {
    val: "Search:",
    translated: false,
    src: ["src/budget/searchpage.tsx line 208"],
    h: "OHBHBOVnuMjmjWHZURDrna8FWv+geQYMQuobRo4tkq0=",
  },
  "No matches found": {
    val: "No matches found",
    translated: false,
    src: ["src/budget/tools/amazon.tsx line 132","src/budget/tools/amazon.tsx line 176"],
    h: "p4er9wMKH/YiF5PrBRKpfEzR8HINC3N0d9Iol4zqgtQ=",
  },
  "Successfully imported Amazon Items report": {
    val: "Successfully imported Amazon Items report",
    translated: false,
    src: ["src/budget/tools/amazon.tsx line 202"],
    h: "zcIlaWv/ZpEjOL5xQHbD/Q8+nNhqDbq4oJsVr0hLKcI=",
  },
  "Successfully imported Amazon Orders report": {
    val: "Successfully imported Amazon Orders report",
    translated: false,
    src: ["src/budget/tools/amazon.tsx line 205"],
    h: "jD2nczKNctIdPeGX20WLyUGOlIl/MbKqKpP5hCxbtt8=",
  },
  "Successfully imported Amazon Refunds report": {
    val: "Successfully imported Amazon Refunds report",
    translated: false,
    src: ["src/budget/tools/amazon.tsx line 208"],
    h: "cL1VAhdyv9ML3nJT0QY3lg6QrxkJ/UQf0gbcokIDJGU=",
  },
  "Import Amazon Reports": {
    val: "Import Amazon Reports",
    translated: false,
    src: ["src/budget/tools/amazon.tsx line 217"],
    h: "Mlif1y6Q52PbHr5bzc3mqcxGJBv1uosR7E+eLTi79kA=",
  },
  "Amazon Reconciliation": {
    val: "Amazon Reconciliation",
    translated: false,
    src: ["src/budget/tools/amazon.tsx line 224"],
    h: "S+wC/RTatD+cq4mogt2XBek9Zw6sSUrQX2eNL62gzVE=",
  },
  "Amazon.com Reconciliation": {
    val: "Amazon.com Reconciliation",
    translated: false,
    src: ["src/budget/tools/toolspage.tsx line 21"],
    h: "SS/vhEAqfP5cTcprv5/4dDYZCEsTIMySGfXEngOoMj0=",
  },
  "Delete selected": {
    val: "Delete selected",
    translated: false,
    src: ["src/budget/transactions.tsx line 88"],
    h: "bsJ1Vyhm8h3AT4g3iLkWOso1mGTLsIFexh1ymwKankw=",
  },
  "transactions.delete": {
    val: (size:number) => {
        return `Delete selected (${size})`
      },
    translated: false,
    src: ["src/budget/transactions.tsx line 90"],
    h: "/u86qzz5nT6n9ZqcgDLwC0GHmjDy0cELJjSzjBAim5g=",
  },
  "Possible Duplicates": {
    val: "Possible Duplicates",
    translated: false,
    src: ["src/budget/transactions.tsx line 98"],
    h: "ofGzHt7c7jfCo867EwNvCl3vCUJPLeLhFiC5Fmgrgp4=",
  },
  "Show uncategorized": {
    val: "Show uncategorized",
    translated: false,
    src: ["src/budget/transactions.tsx line 130"],
    h: "ZHhB69+qL72sD+upbAXLXIDMlEWXgSbwb5RupMV5K0c=",
  },
  "Import file": {
    val: "Import file",
    translated: false,
    src: ["src/budget/transactions.tsx line 139"],
    h: "iaQvPnsbTKu/ItmjoC8ctwpVbyumVe15GLL8nCbe25Q=",
  },
  "Category": {
    val: "Category",
    translated: false,
    src: ["src/budget/transactions.tsx line 220"],
    h: "/frArhrZL+bxdiiBKi/1cYdR/tSD7rhbMHJLgHQQdNQ=",
  },
  "sync-symbol help": {
    val: "This symbol means the transaction came from an import/sync",
    translated: false,
    src: ["src/budget/transactions.tsx line 343"],
    h: "S3tDRls+AJYj6f8jSNSCa1FVyNY+ngn6Db1EQJ3dpLE=",
  },
  "Deposit": {
    val: "Deposit",
    translated: false,
    src: ["src/budget/transactions.tsx line 349"],
    h: "m1MGQLRYdNxU9nxvjA8qOlurdztaw7NQI15XBoTWhN8=",
  },
  "Withdrawl": {
    val: "Withdrawl",
    translated: false,
    src: ["src/budget/transactions.tsx line 351"],
    h: "PYAfiGRUsqYlItWQgBtWG3zimuUt57IOlS42TrZ2sf4=",
  },
  "Cancel": {
    val: "Cancel",
    translated: false,
    src: ["src/budget/transactions.tsx line 627"],
    h: "wHdMGFBg/BNmqwwBSIr4TrXk4fT1kilDHgZN5z4N5sU=",
  },
  "Save": {
    val: "Save",
    translated: false,
    src: ["src/budget/transactions.tsx line 628","src/wwwroot/record/record.tsx line 489"],
    h: "wduD0WXtkIpIb6B4R8AA7ph724u3/Gtv27uaky6rEAU=",
  },
  "noun.income": {
    val: "Income",
    translated: false,
    src: ["src/budget/transactions.tsx line 631"],
    h: "D2fJbta5d1Z5QYuRC5zzkBHsItZOOgY4FKrFJ64BvRs=",
  },
  "noin.income": {
    val: "Income",
    translated: false,
    src: ["src/budget/transactions.tsx line 643"],
    h: "D2fJbta5d1Z5QYuRC5zzkBHsItZOOgY4FKrFJ64BvRs=",
  },
  "Categorize": {
    val: "Categorize",
    translated: false,
    src: ["src/budget/transactions.tsx line 671"],
    h: "mA6/TefxgXpo2M+OUx/ATLQ4QYHv4t1+8vy3MmV+EQg=",
  },
  "Identify the data each column contains using the drop downs below.": {
    val: "Identify the data each column contains using the drop downs below.",
    translated: false,
    src: ["src/csvimport.tsx line 294"],
    h: "59JoGSJaPOdtgmCL+QLp8U/e6y+OGGM8fdEX4sClrpk=",
  },
  "You must have at least one column each set to Amount, Memo and Date Posted.": {
    val: "You must have at least one column each set to Amount, Memo and Date Posted.",
    translated: false,
    src: ["src/csvimport.tsx line 295"],
    h: "k5NuGeKNgPfZs7xUbwp5PgfPr6dosV0ZTVxAnphHH6E=",
  },
  "For Date Posted, you must also choose the date format.": {
    val: "For Date Posted, you must also choose the date format.",
    translated: false,
    src: ["src/csvimport.tsx line 296"],
    h: "G2XPMMlP2JPnutFhPAo1RnCQMTzdukxPSc+FjoF2Vjs=",
  },
  "If multiple columns are selected for Amount, the first non-zero value will be used.  This is helpful if the CSV contains separate Credit and Debit columns.": {
    val: "If multiple columns are selected for Amount, the first non-zero value will be used.  This is helpful if the CSV contains separate Credit and Debit columns.",
    translated: false,
    src: ["src/csvimport.tsx line 297"],
    h: "bxc4+JxhDrm2oYWek0ISeJDxq173KLfpcnOT4GEMWGQ=",
  },
  "Only select a column for Unique ID if you are sure it contains bank-assigned, unique transaction IDs.  Most CSVs will not have this field.": {
    val: "Only select a column for Unique ID if you are sure it contains bank-assigned, unique transaction IDs.  Most CSVs will not have this field.",
    translated: false,
    src: ["src/csvimport.tsx line 298"],
    h: "MUc4sPlkaqyooNhJKZ15rbBQdclJSNbaarHERiW1hrs=",
  },
  "Click the \"Set mapping\" to continue.": {
    val: "Click the \"Set mapping\" to continue.",
    translated: false,
    src: ["src/csvimport.tsx line 299"],
    h: "17QBrVZk8kjbKoqmqsbEBBHyjcoru22TcYanag65Jrw=",
  },
  "Date Posted": {
    val: "Date Posted",
    translated: false,
    src: ["src/csvimport.tsx line 335"],
    h: "3A+vhaBB21UASdnwmNYVGMV9qH/U43D3DCsVSXlWasY=",
  },
  "Unique ID": {
    val: "Unique ID",
    translated: false,
    src: ["src/csvimport.tsx line 336"],
    h: "UZsJmQ28mtEO349l3zdNHoAtb0JT1LT9e7EjedqptSE=",
  },
  "(optional)": {
    val: "(optional)",
    translated: false,
    src: ["src/csvimport.tsx line 336"],
    h: "njVpYkgCdiB755Pxnsk1D8GELOWqw1mBBYG+YQr7e98=",
  },
  "Set mapping": {
    val: "Set mapping",
    translated: false,
    src: ["src/csvimport.tsx line 364"],
    h: "0GImzkG1VPzFzjFdepzZz8+Ysis4xn7QQRVGlxVrQIw=",
  },
  "Invalid": {
    val: "Invalid",
    translated: false,
    src: ["src/csvimport.tsx line 392","src/csvimport.tsx line 395","src/csvimport.tsx line 406"],
    h: "TTWlQj/xySwj3x3tLJd80Tl+VmJXWWdhFpMq90hNbfg=",
  },
  "Select the account these transactions belong to.": {
    val: "Select the account these transactions belong to.",
    translated: false,
    src: ["src/csvimport.tsx line 447"],
    h: "qkaCMMw9CYakrPrLxgfkBp3KsfadBdGLYgZB8urPaC4=",
  },
  "edit.mapping": {
    val: (onClick) => {
          return <span>Or <a href="#" onClick={onClick}>edit the mapping.</a></span>
        },
    translated: false,
    src: ["src/csvimport.tsx line 447"],
    h: "hFYUKKIqC+nYQ+RRKwNu3/PGxbtuHzNHoigSJwCK8d4=",
  },
  "Account name": {
    val: "Account name",
    translated: false,
    src: ["src/csvimport.tsx line 478"],
    h: "Wo+ZnjRTxGkow1m4BGCavACj82/UajUNs6oLDXB++sU=",
  },
  "Provide a name for the new account.": {
    val: "Provide a name for the new account.",
    translated: false,
    src: ["src/csvimport.tsx line 487"],
    h: "WFHwJzRVIraGkeqDS03YjWe0vMsPsiRE1qM6V/Ef/xE=",
  },
  "Finish import": {
    val: "Finish import",
    translated: false,
    src: ["src/csvimport.tsx line 498"],
    h: "4xsUuxEj2AOOfV6aSUBcosl89BFoAZ+srMPIeWzIjUI=",
  },
  "Error": {
    val: "Error",
    translated: false,
    src: ["src/errors.ts line 120","src/errors.ts line 144"],
    h: "/ErBlknw7o83xx0uIDCjdDA4u5bAwnNZuhFd2GV1Zcw=",
  },
  "There has been an error.": {
    val: "There has been an error.",
    translated: false,
    src: ["src/errors.ts line 121"],
    h: "viN5uLRSpgzhvoD9KO9g1cr7ihLQ0Men9LiUpy9RcwE=",
  },
  "error-detail": {
    val: "If this error keeps happening or doesn't make sense, please report a bug or chat with us.",
    translated: false,
    src: ["src/errors.ts line 122"],
    h: "10Kk29tlHpBnhcTf7RRMfq1OZPGZgvPPguRlInaLNoY=",
  },
  "action.ignore": {
    val: "Ignore",
    translated: false,
    src: ["src/errors.ts line 123"],
    h: "K8sAh2XND1/tJOuX9xTLmr1fQjUOB70cfc9GwI62fEs=",
  },
  "action.chat": {
    val: "Chat",
    translated: false,
    src: ["src/errors.ts line 124"],
    h: "Ct9w1d0AYWvEp42SCfVm7DFmet6f43eJOSWwg17o+7A=",
  },
  "action.report bug": {
    val: "Report Bug",
    translated: false,
    src: ["src/errors.ts line 125"],
    h: "RxuE9Dh0Dadda2PtjUPD0dQ7b8aQok84Ytvw31ABBRU=",
  },
  "OK": {
    val: "OK",
    translated: false,
    src: ["src/errors.ts line 146"],
    h: "mMSSK7ZBxlx6MLe8r98jC5sAtmk2McVhRqslsnhu5KM=",
  },
  "File type not recognized.": {
    val: "Import Failed",
    translated: false,
    src: ["src/importing.ts line 74"],
    h: "Z6QnadHff9fEji/vnFxKuxbfAKGNb263Hm13z3txfSM=",
  },
  "Buckets License": {
    val: "Buckets License",
    translated: false,
    src: ["src/mainprocess/dbstore.ts line 36","src/mainprocess/dbstore.ts line 70"],
    h: "sym++hSpJ7LeHTQAaiYRAK41eYIw9pfMFO2EbYTHGxo=",
  },
  "Unregistered Version": {
    val: "Unregistered Version",
    translated: false,
    src: ["src/mainprocess/drm.ts line 88"],
    h: "x9ekMClqI57T6jREU5VJurBCzlD+hBNJ8pHNQ0zMB1U=",
  },
  "Hello!  Thanks for trying out Buckets.": {
    val: "Hello!  Thanks for trying out Buckets.",
    translated: false,
    src: ["src/mainprocess/drm.ts line 89"],
    h: "0m9VvMGwLCqD3lmZ24GbzlkRxPX1kf/DsbWA9kkBWX0=",
  },
  "nag-message": {
    val: () => `This is an unregistered trial version, and although the trial is untimed, a license must be purchased for continued use.

Would you like to purchase a license now?`,
    translated: false,
    src: ["src/mainprocess/drm.ts line 90"],
    h: "cugeP6FVXqdiCtOers5rslG0mDD5t/Rfl1ZWslfhD48=",
  },
  "Later": {
    val: "Later",
    translated: false,
    src: ["src/mainprocess/drm.ts line 93","src/mainprocess/updater.ts line 189"],
    h: "wZUl6R8m08S1l0zLg0xgDG2XE1sodemTuRDbalIB4VM=",
  },
  "Purchase": {
    val: "Purchase",
    translated: false,
    src: ["src/mainprocess/drm.ts line 94"],
    h: "SfwhUMXO5ckJhwUkBjdC9n17k8zH4+hoAlFoUdOwE/g=",
  },
  "Unable to open the file:": {
    val: "Unable to open the file:",
    translated: false,
    src: ["src/mainprocess/files.ts line 197"],
    h: "MxbgnQR4Cyi549ltzzIDDAI1qRGqoeRm0zOApQMS2DY=",
  },
  "Open Transaction File": {
    val: "Open Transaction File",
    translated: false,
    src: ["src/mainprocess/files.ts line 477"],
    h: "8teUT2P/KToCDoMTqS88JNVtG9PTE/5PojtS1SGmokw=",
  },
  "File does not exist:": {
    val: "File does not exist:",
    translated: false,
    src: ["src/mainprocess/files.ts line 498"],
    h: "RPeWW9lCHkg+d6XybADj3OH2jxrYcSOhrA3+QHEcYz0=",
  },
  "Open Buckets Budget": {
    val: "Open Buckets Budget",
    translated: false,
    src: ["src/mainprocess/files.ts line 639"],
    h: "5odppwzoA5bC5nAM3F+GDOVrAq3NfjGxrE0ZFXseCDg=",
  },
  "budget-file-type-name": {
    val: "Buckets Budget",
    translated: false,
    src: ["src/mainprocess/files.ts line 641"],
    h: "g2jeytcuhPOlEo6R2OlTzT3vNdE7sVWGnXuffEioq4c=",
  },
  "Buckets Budget Filename": {
    val: "Buckets Budget Filename",
    translated: false,
    src: ["src/mainprocess/files.ts line 658"],
    h: "PMqvee/qJsh/OYtRi+hbcH4fgl07SR6XM0wx4c1C+sU=",
  },
  "No file chosen": {
    val: "No file chosen",
    translated: false,
    src: ["src/mainprocess/files.ts line 664"],
    h: "MKsAG2u3PyHfYzTNB+XEA8Myeu1DiSU2HNpIW8QXTpc=",
  },
  "File": {
    val: "File",
    translated: false,
    src: ["src/mainprocess/menu.ts line 22"],
    h: "9XpUff7TtVQbIncvgmrfzVB2gkBh35RnM1ET/HFr3k0=",
  },
  "New Budget...": {
    val: "New Budget...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 25","src/wwwroot/misc/wizard.html line 0"],
    h: "daxIu+dqn7pfUDeB26rLQnPnAz2v5opSTHbAyBovaoI=",
  },
  "Open Budget...": {
    val: "Open Budget...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 32","src/wwwroot/misc/wizard.html line 0"],
    h: "67FfAce57aSIe2ncVfWeIeiiRLQQ8uuEUdDyI6UHxHU=",
  },
  "Open Recent...": {
    val: "Open Recent...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 39"],
    h: "Uf1w3VIwUvsmKvOkQtBwsGvbRzQ5gMbEq/iyNzv95cs=",
  },
  "Edit": {
    val: "Edit",
    translated: false,
    src: ["src/mainprocess/menu.ts line 53"],
    h: "9+ZynTDPePvsJX4rW8Mn0wEzk0GRQ+udON01NKHVsQU=",
  },
  "Undo": {
    val: "Undo",
    translated: false,
    src: ["src/mainprocess/menu.ts line 57"],
    h: "Z1A2vTdYwfdLsWS25iSchnHOHa1VfbQg7u8MDGHk4yo=",
  },
  "Redo": {
    val: "Redo",
    translated: false,
    src: ["src/mainprocess/menu.ts line 61"],
    h: "7buMF65dyGtKDY/ZW/Lkn7eUmdudCsdGV3KR2lYLLA0=",
  },
  "Cut": {
    val: "Cut",
    translated: false,
    src: ["src/mainprocess/menu.ts line 66"],
    h: "+kuX06pgC809fwr+5h9VbC8sVgVWo6EXgg6bzfXXtJs=",
  },
  "Copy": {
    val: "Copy",
    translated: false,
    src: ["src/mainprocess/menu.ts line 70"],
    h: "T2DR4UKv+pyVWY8GzF/WWjk5XqMXgZ0gDyXkZmYczHw=",
  },
  "Paste": {
    val: "Paste",
    translated: false,
    src: ["src/mainprocess/menu.ts line 74"],
    h: "n2Hnio0AcQPZejqQ+hm35GthBg0zYDNoxd8RCFRUhu4=",
  },
  "Paste and Match Style": {
    val: "Paste and Match Style",
    translated: false,
    src: ["src/mainprocess/menu.ts line 78"],
    h: "w8hRIxBBNWtXNPcYtQ4t/mTHfPF66U/mJbVpOiIDgYE=",
  },
  "Delete": {
    val: "Delete",
    translated: false,
    src: ["src/mainprocess/menu.ts line 82"],
    h: "sm3jcrSw6qxgICiEpy25imvm6QNueF6oZ+oBxfeSEJg=",
  },
  "Select All": {
    val: "Select All",
    translated: false,
    src: ["src/mainprocess/menu.ts line 86"],
    h: "tLJuQPindRFUyvGGdMLJbBHcVpAODsfT5p2gDnpB/Oo=",
  },
  "Find...": {
    val: "Find...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 90"],
    h: "aUU1pzvlZzKNgYZP2ZpPtQMImBOStbFnK33P3YwXTNs=",
  },
  "Find Next": {
    val: "Find Next",
    translated: false,
    src: ["src/mainprocess/menu.ts line 97"],
    h: "LALfI5V4TsQo0DcGJwmNmrm3xNPtY5PmQuxB1voZo34=",
  },
  "Find Previous": {
    val: "Find Previous",
    translated: false,
    src: ["src/mainprocess/menu.ts line 104"],
    h: "0n6Dq5KDTxxsTAKrJE+RDdgi9ln6FyfUEPNBJ6ejZ5o=",
  },
  "View": {
    val: "View",
    translated: false,
    src: ["src/mainprocess/menu.ts line 113"],
    h: "paIseOhKCT2+NaUBPKk98vQB/lphf7jIGeERV77doDg=",
  },
  "Reload": {
    val: "Reload",
    translated: false,
    src: ["src/mainprocess/menu.ts line 117"],
    h: "hUVVd3tppLGqwgo2OeC3h334aTF0Y+/GHbuL/I1clYk=",
  },
  "Force Reload": {
    val: "Force Reload",
    translated: false,
    src: ["src/mainprocess/menu.ts line 121"],
    h: "ktBJY2UXO+2r0ZvmbQXhArN51bSTnyaNnnBNR9PQ5K8=",
  },
  "Toggle Developer Tools": {
    val: "Toggle Developer Tools",
    translated: false,
    src: ["src/mainprocess/menu.ts line 125"],
    h: "IYSSUL9ezB58nRuajYVa+zH4ucrmXQOB92zA7sDlrJc=",
  },
  "Actual Size": {
    val: "Actual Size",
    translated: false,
    src: ["src/mainprocess/menu.ts line 130"],
    h: "k1ZfUj7bmT4XwiALRlZo7ztl2d+e7JcLt3WCnvjpBYg=",
  },
  "Zoom In": {
    val: "Zoom In",
    translated: false,
    src: ["src/mainprocess/menu.ts line 134"],
    h: "p3yHl1qkGVfRDPsLKitBuZhRJIDaTy3fV/vbWqOzo24=",
  },
  "Zoom Out": {
    val: "Zoom Out",
    translated: false,
    src: ["src/mainprocess/menu.ts line 138"],
    h: "hRo1uzcSNStVll7ef2xHOB6PqFh+q7Sg/VHiGcK4M8M=",
  },
  "Toggle Full Screen": {
    val: "Toggle Full Screen",
    translated: false,
    src: ["src/mainprocess/menu.ts line 143"],
    h: "2ZRq+R5E0Cp4QI+y5jCefU1IOiYvNWLrN/iiJq6hGr8=",
  },
  "Window": {
    val: "Window",
    translated: false,
    src: ["src/mainprocess/menu.ts line 149"],
    h: "qjw17TPhgeX5msjicdTljyCEeBLFbQvz/oyOunMLJnQ=",
  },
  "Minimize": {
    val: "Minimize",
    translated: false,
    src: ["src/mainprocess/menu.ts line 153","src/mainprocess/menu.ts line 352"],
    h: "ELhkWGGY5oNKpfCzoXXW6TgkfS1nI0ZuJbWyYLmT+ro=",
  },
  "Close Window": {
    val: "Close Window",
    translated: false,
    src: ["src/mainprocess/menu.ts line 157","src/mainprocess/menu.ts line 348"],
    h: "hrPxvP/hrVgtNNTMX4sv5sljx57neTy+2p0U1TKGuCE=",
  },
  "Budget": {
    val: "Budget",
    translated: false,
    src: ["src/mainprocess/menu.ts line 163"],
    h: "zOO4DqNSFLa6Z9vlmfaz8OnwggHn8wJeP058V5mUKbE=",
  },
  "Duplicate Window": {
    val: "Duplicate Window",
    translated: false,
    src: ["src/mainprocess/menu.ts line 166"],
    h: "tjwFTBARBKQ5uC9Fh0zm7ag/RViV95pptJBJn9eVqHE=",
  },
  "Import Transactions...": {
    val: "Import Transactions...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 174"],
    h: "PPLzf/61MKc3iWfDMTRo6ERH/TYu6TxBH2vmVbZD5Lk=",
  },
  "Import From YNAB4...": {
    val: "Import From YNAB4...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 185"],
    h: "z10Vp9BzEC6CkLTNtR8xywSTNYGMBbGFZMD7XUEbrVs=",
  },
  "Help": {
    val: "Help",
    translated: false,
    src: ["src/mainprocess/menu.ts line 200"],
    h: "TvUUB7AuCuFJ9IWiz2SbsjnUvYoDPZAaMPxup/rwosM=",
  },
  "Learn More": {
    val: "Learn More",
    translated: false,
    src: ["src/mainprocess/menu.ts line 203"],
    h: "8bk7nEyrz+Q0vmMisWIPVuvHR4/TeW4DhemALir6s1o=",
  },
  "Getting Started...": {
    val: "Getting Started...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 207"],
    h: "XD8GQYEIDrNjTMPX4TjGeAbbCIEBcAONlYPd/D8Hz84=",
  },
  "Buckets Guide": {
    val: "Buckets Guide",
    translated: false,
    src: ["src/mainprocess/menu.ts line 214"],
    h: "iK/jSwFsIOO0YBANlaqC8+gTWFX+9IBYpc+HuiQ2U/c=",
  },
  "Chat...": {
    val: "Chat...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 221"],
    h: "SytGirG0+cdtbPfjBma/G/tEOt4rdOj4mnjcaWsTbt8=",
  },
  "Show Log Files...": {
    val: "Show Log Files...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 227"],
    h: "In00T9z1A4xO6nLu8zAU5s3UzH3+IcK4XjRvrT9CGMs=",
  },
  "Report Bug...": {
    val: "Report Bug...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 233"],
    h: "i17nG0QruMiCn612ogDToWB1g4xqqei691Yeh/t8MIk=",
  },
  "Report Translation Error...": {
    val: "Report Translation Error...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 239"],
    h: "/jSK7LcBLJ1FsOYb9ntsVYAxwAyGLLUZXlTL/zrC020=",
  },
  "It says:": {
    val: "It says:",
    translated: false,
    src: ["src/mainprocess/menu.ts line 242"],
    h: "gbWdWRhcKGQzFCi8CcKy9Bmfg2oYqz1zGMHQzSU8jQE=",
  },
  "It should say:": {
    val: "It should say:",
    translated: false,
    src: ["src/mainprocess/menu.ts line 242"],
    h: "RjwjZtmUgFzGUxR0zMmyXh0cHzpzsbj4nk6R7tGe+i4=",
  },
  "Purchase Full Version...": {
    val: "Purchase Full Version...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 253"],
    h: "+6h2Y0QTHEVui0aUhwAlCsyJp/F+S0PYKMRlQysqjrk=",
  },
  "Enter License...": {
    val: "Enter License...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 259"],
    h: "A+/eZ8qTAh97iBouJPInRkCg7F0nOkteYEBO7+lFHHA=",
  },
  "About Buckets": {
    val: "About Buckets",
    translated: false,
    src: ["src/mainprocess/menu.ts line 279"],
    h: "9bzPsx+kCkNUeLTSVjaygyWCkm3VCdsFaAFRvdS+xEU=",
  },
  "Check For Updates...": {
    val: "Check For Updates...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 282"],
    h: "S/1p0syaOMqjAbHpmZa6gWaIh/9e29QR2cRJhiMadz0=",
  },
  "Preferences...": {
    val: "Preferences...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 288"],
    h: "6iQxyJ1WC9/Z0f0saApfwL5hmhgN5YgJeikLAYqCGBI=",
  },
  "Services": {
    val: "Services",
    translated: false,
    src: ["src/mainprocess/menu.ts line 307"],
    h: "Y5+GuNZXfFSynDsHvAY8cr0RqU+moaHZNmOk2eQrsNs=",
  },
  "Hide Buckets": {
    val: "Hide Buckets",
    translated: false,
    src: ["src/mainprocess/menu.ts line 312"],
    h: "38YdGXFjndmgDFgXTpfUZ0F+W/D9e267YaAvzYZm4O8=",
  },
  "Hide Others": {
    val: "Hide Others",
    translated: false,
    src: ["src/mainprocess/menu.ts line 316"],
    h: "RpKz0G7Y8OE5oyGm0/zRffPdr7RQkneZCYrikLHIZ+U=",
  },
  "Show All": {
    val: "Show All",
    translated: false,
    src: ["src/mainprocess/menu.ts line 320"],
    h: "Kng6HqlojyhuqEK6kaB3KPtAs1w0LcpFWkJYrscali0=",
  },
  "Quit Buckets": {
    val: "Quit Buckets",
    translated: false,
    src: ["src/mainprocess/menu.ts line 325"],
    h: "QILEHXgAk6vuNPV3rqkbn2QRZ8WKrPnAZnscp7n8WaM=",
  },
  "Speech": {
    val: "Speech",
    translated: false,
    src: ["src/mainprocess/menu.ts line 332"],
    h: "i4Qm95bH8zVEbjpkUi7jvQiLtDzGkW9z90XEkiglzHM=",
  },
  "Start Speaking": {
    val: "Start Speaking",
    translated: false,
    src: ["src/mainprocess/menu.ts line 336"],
    h: "v8sFOpEAoczjEjGparKZylHWHoxHMVQriwuhJaec2rY=",
  },
  "Stop Speaking": {
    val: "Stop Speaking",
    translated: false,
    src: ["src/mainprocess/menu.ts line 340"],
    h: "Pme2/qME7bKdVrHTIEBQYt1Fu/SXRNGyy6sLBfKpqqk=",
  },
  "Zoom": {
    val: "Zoom",
    translated: false,
    src: ["src/mainprocess/menu.ts line 356"],
    h: "Zjzswxbrkbj1TLPOYCtimoyh/aJlkF/mxeghbzdheSs=",
  },
  "Bring All to Front": {
    val: "Bring All to Front",
    translated: false,
    src: ["src/mainprocess/menu.ts line 361"],
    h: "vXNLSncC5dTsDdfhZY5dhbev+Y3PpqQEy1fwxTkGWU0=",
  },
  "Update Available": {
    val: "Update Available",
    translated: false,
    src: ["src/mainprocess/updater.ts line 187"],
    h: "FKOD6i3t69T8rvTwVJ5VSnLfkQPBcceuuk2X4ZsNKMY=",
  },
  "version-available": {
    val: (newv:string) => `Version ${newv} available.`,
    translated: false,
    src: ["src/mainprocess/updater.ts line 188","src/wwwroot/misc/updates.tsx line 56"],
    h: "YCoofx1v0tRUHkHfhFnm6bV2xXfnsNT6QAyXqgkUa9c=",
  },
  "Download": {
    val: "Download",
    translated: false,
    src: ["src/mainprocess/updater.ts line 190"],
    h: "QVM3NKWnuJ19cWUaN3y9fVCbkiQTygWbOYuFMklAwNc=",
  },
  "Confirm password:": {
    val: "Confirm password:",
    translated: false,
    src: ["src/models/bankmacro.ts line 42"],
    h: "Px/rLFgkE/Sv1Z+Xm0frULVV3lxvrEc7ABJaDzmv670=",
  },
  "Passwords did not match": {
    val: "Passwords did not match",
    translated: false,
    src: ["src/models/bankmacro.ts line 48"],
    h: "PyUeXNOVYhNDM/De1HIPLeiwy6d+x7bkZphOo5ZqR6Q=",
  },
  "Create budget password:": {
    val: "Create budget password:",
    translated: false,
    src: ["src/models/bankmacro.ts line 86"],
    h: "Bf9XVrpN9UpVSKpZNRpBUw/IaFjMkNCmH4gpAfhYFkY=",
  },
  "Sync failed": {
    val: "Sync failed",
    translated: false,
    src: ["src/models/simplefin.ts line 108"],
    h: "jBGq60u/Y2WKAulnVvspUq9tLPFtXOnQYczjXXViGA0=",
  },
  "Unexpected sync error": {
    val: "Unexpected sync error",
    translated: false,
    src: ["src/models/simplefin.ts line 117"],
    h: "78kYsQMTfGS8BNaZVuqYaRojJlTpcmN6CF9PQKKO0ME=",
  },
  "Invalid SimpleFIN Token": {
    val: "Invalid SimpleFIN Token",
    translated: false,
    src: ["src/models/simplefin.ts line 237"],
    h: "C6BzeT0S0G+xUVzgdubtVeH39oIVS4hUaVBd2gKS3Uo=",
  },
  "Unable to claim access token": {
    val: "Unable to claim access token",
    translated: false,
    src: ["src/models/simplefin.ts line 249"],
    h: "Gao95RuT9JvhdAoZ5winV9os7iMaPIex3Vq9CMSjhzs=",
  },
  "Error fetching data": {
    val: "Error fetching data",
    translated: false,
    src: ["src/models/simplefin.ts line 265"],
    h: "z94B0956dECmmaMVLZFW0oZMVtA92etw+2ZqumR4K9Q=",
  },
  "Error parsing response": {
    val: "Error parsing response",
    translated: false,
    src: ["src/models/simplefin.ts line 272"],
    h: "PsIRbom+m8Y5OIEPW2rzJYVlNA2NQrZmEQnpW7Y/9KI=",
  },
  "/mo": {
    val: "/mo",
    translated: false,
    src: ["src/time.tsx line 64"],
    h: "ggq7na5vMB1wOjQQo0Wq0o7ctwbMUiiJr1tRRKphHss=",
  },
  "Enter Buckets License": {
    val: "Enter Buckets License",
    translated: false,
    src: ["src/wwwroot/misc/enter_license.html line 0"],
    h: "QPy/bCk+yTP2DzZAmXWbRYj2KC5QbrLq/XeXrysIX6Q=",
  },
  "enter-license-prompt": {
    val: "\n      Please enter your Buckets License below.  Don&apos;t have a license?  <a href=\"#\" id=\"clicktobuy\">Click here to purchase one.</a>\n    ",
    translated: false,
    src: ["src/wwwroot/misc/enter_license.html line 0"],
    h: "bQ5kF1mLhFNyrJzVhTf5Cz5lxO8mRww7nwMpeCy9HC8=",
  },
  "Submit": {
    val: "Submit",
    translated: false,
    src: ["src/wwwroot/misc/enter_license.html line 0"],
    h: "/plzMiu0xhKwtFcT4VqbJMoCd2dB03dB9EJhijEA284=",
  },
  "Success!": {
    val: "Success!",
    translated: false,
    src: ["src/wwwroot/misc/enter_license.tsx line 28"],
    h: "6NxF/uD6sOEPkEbPFOHdBKRxj0ZXVbmnPkRXNJDy0zs=",
  },
  "Restart Buckets": {
    val: "Restart Buckets",
    translated: false,
    src: ["src/wwwroot/misc/enter_license.tsx line 29"],
    h: "TNcYWk7YxhZ0U9Q+mFMRedeWB36VsDXoYgBapDvZCgM=",
  },
  "Invalid license": {
    val: "Invalid license",
    translated: false,
    src: ["src/wwwroot/misc/enter_license.tsx line 32"],
    h: "BfJdh6NOzurSCMGRmCP8gb1VAXUlrSSsCFIGHGXtNiA=",
  },
  "Preferences": {
    val: "Preferences",
    translated: false,
    src: ["src/wwwroot/misc/preferences.html line 0"],
    h: "g621xQsjA9sSCp1y6ZMsd3RolFp3OMEblL/gPz1k0v8=",
  },
  "Language:": {
    val: "Language:",
    translated: false,
    src: ["src/wwwroot/misc/preferences.tsx line 27"],
    h: "Xcdts2Yh+LAPXO+KLTuFxMiNsv+xxIJPLlbCDbLrink=",
  },
  "System Default": {
    val: "System Default",
    translated: false,
    src: ["src/wwwroot/misc/preferences.tsx line 37"],
    h: "UB0KL/QZH4CikHbpWgyv1qC4YgSqsZGmS6lmmgTTiFw=",
  },
  "Animation:": {
    val: "Animation:",
    translated: false,
    src: ["src/wwwroot/misc/preferences.tsx line 43"],
    h: "11MkZLAqpQ4eVU9BzD6XMqSxlyIqQU+lodDdxwNkAag=",
  },
  "(Restart Buckets for the change to take effect.)": {
    val: "(Restart Buckets for the change to take effect.)",
    translated: false,
    src: ["src/wwwroot/misc/preferences.tsx line 56"],
    h: "IYHFL+R57iN4UW8AS35balApUouS8GdkRIQ3uEa6wT8=",
  },
  "Prompt": {
    val: "Prompt",
    translated: false,
    src: ["src/wwwroot/misc/prompt.html line 0"],
    h: "56HrS6R0zfyg5ruiVb/J04UP3T8O2V99V+mXHvVfEZ0=",
  },
  "Report Bug": {
    val: "Report Bug",
    translated: false,
    src: ["src/wwwroot/misc/reportbug.html line 0"],
    h: "RxuE9Dh0Dadda2PtjUPD0dQ7b8aQok84Ytvw31ABBRU=",
  },
  "Your email address:": {
    val: "Your email address:",
    translated: false,
    src: ["src/wwwroot/misc/reportbug.html line 0"],
    h: "/ip+dZCEKXdLQFW5CAt/fB8OBf/rD+67pz8etOXlJXc=",
  },
  "Message:": {
    val: "Message:",
    translated: false,
    src: ["src/wwwroot/misc/reportbug.html line 0"],
    h: "diHIZWoENBF9rHrI1aF27cogBvFLnxRZpngijYudLEY=",
  },
  "Other details:": {
    val: "Other details:",
    translated: false,
    src: ["src/wwwroot/misc/reportbug.html line 0"],
    h: "Mbobi2Pa+QhvkyOnp84ysWorcKRCCEcNuiDS8w537WY=",
  },
  "Include log file": {
    val: "Include log file",
    translated: false,
    src: ["src/wwwroot/misc/reportbug.html line 0"],
    h: "rjy01ggb0uSRPn/tmrf/BVwGQiXaaSc6Nh+o92BIU3U=",
  },
  "Send Report": {
    val: "Send Report",
    translated: false,
    src: ["src/wwwroot/misc/reportbug.html line 0"],
    h: "aLgG0qubuw0p0tGIUYKjgxecVsL0e3AKvQ5+W2JZg18=",
  },
  "\n        If you wish to provide screenshots or other information, email bugs@budgetwithbuckets.com\n      ": {
    val: "\n        If you wish to provide screenshots or other information, email bugs@budgetwithbuckets.com\n      ",
    translated: false,
    src: ["src/wwwroot/misc/reportbug.html line 0"],
    h: "Xxt85SrdWlwACoTLSWWi71up1b4ga6B8UE9nGFFrpNA=",
  },
  "Check for Updates": {
    val: "Check for Updates",
    translated: false,
    src: ["src/wwwroot/misc/updates.html line 0","src/wwwroot/misc/updates.tsx line 48"],
    h: "6vtxqhyfiDaIXgTBH0pdoPzTGftDDEoRFNGU082PhRk=",
  },
  "There was an error.  Maybe try again?": {
    val: "There was an error.  Maybe try again?",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 42"],
    h: "l+W2GSV3tl8Gx19ZW+wOCziBj5/UeMCVO8tvh4P7LEo=",
  },
  "Checking for updates...": {
    val: "Checking for updates...",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 52"],
    h: "wjjhyYhYEFdJWUmwdJIEdxm0iAq2bwrWU79ANObzzZY=",
  },
  "Skip This Version": {
    val: "Skip This Version",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 60"],
    h: "YnC7GSI4QITirt1GGV/Tc1FvTbJYICkEeF3zj4u4eak=",
  },
  "Download Update": {
    val: "Download Update",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 63"],
    h: "OvekDBh71chOkbTXqPs/V/x0lNbpc668s4hyXRF5G+I=",
  },
  "You are running the latest version!": {
    val: "You are running the latest version!",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 69"],
    h: "hShy87A6GAhRqqtK+8VdVeGD70zA64iiV0/SwectQ0I=",
  },
  "Downloading update...": {
    val: "Downloading update...",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 72"],
    h: "vTHXpZeFxjQhKPwUQPCm+eHcyYR6YjSmIm4mtV/5iTE=",
  },
  "Update downloaded.": {
    val: "Update downloaded.",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 83"],
    h: "DO2vE3TgW3xjiD8ZaOWeScL3qWCyiFPK8GENQ9NosYw=",
  },
  "Install and Relaunch Buckets": {
    val: "Install and Relaunch Buckets",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 87"],
    h: "bzusTDIT831mqEwmmM59eT12mfoNMYiGPbUfoIzaCwo=",
  },
  "Recently used": {
    val: "Recently used",
    translated: false,
    src: ["src/wwwroot/misc/wizard.html line 0"],
    h: "tJ5cBjszrV/JztG5V1FUrgo0bfVgXfK5KB495TvGsYs=",
  },
  "EXPERIMENTAL Buckets Macro Maker": {
    val: "EXPERIMENTAL Buckets Macro Maker",
    translated: false,
    src: ["src/wwwroot/record/record.html line 0","src/wwwroot/record/record.tsx line 836"],
    h: "NZPVXQ+Dw1vv0fLXY+Z4R1KiEkXjDZtSmY3tVz5L1VI=",
  },
  "navigatestep": {
    val: (url) => `Go to ${url}`,
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 354"],
    h: "nI/J4GfYlL6BgRZRSiPFfA5o7ASdx2VVYW6x3vgCuKE=",
  },
  "off": {
    val: "off",
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 361"],
    h: "nzvsum5LFYOz4ZRB3eTVliJTfZvVSpTSImJ4XkhThNA=",
  },
  "on": {
    val: "on",
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 363"],
    h: "mQwjhouWWBSxF8+abE3+RUUurcIXHh+YGGXr/ITxByQ=",
  },
  "Paused": {
    val: "Paused",
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 526"],
    h: "sMAADusAjpKEUapa7bSzeAnEAbEGpH+NKBgGh068Ifw=",
  },
  "Recording": {
    val: "Recording",
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 532"],
    h: "s1hytW8ZlaU8eRtoTfV+4aCpW5biiyifheE3t0kouUo=",
  },
  "Playing": {
    val: "Playing",
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 538"],
    h: "69elN/r6NyshRWtcjLOKso9OmdOJhvg/ix+Xy/fE+Z0=",
  },
  "notify-downloaded-file": {
    val: filename => `Downloaded file: ${filename}`,
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 747"],
    h: "HwxJ2TVx57Qef6bXYySekL/eoBzvIEFUqBxQdxgcyCs=",
  },
  "Step took too long": {
    val: "Step took too long",
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 770"],
    h: "Py3rsk0guEg0d8Ce9Lbfwzf1zP7E4Z8YPSOu165mOc0=",
  },
  "Error running recording": {
    val: "Error running recording",
    translated: false,
    src: ["src/wwwroot/record/record.tsx line 774"],
    h: "eE9Fw8G4vQpND3fFWnfGNvtN5LxCcQQecWO6fQgBmpM=",
  },
  "Open YNAB4 File": {
    val: "Open YNAB4 File",
    translated: false,
    src: ["src/ynab.ts line 377"],
    h: "BrKgvN0SgW410a7e11V3gP+FgW67iTGIY+o/cKI1Ftk=",
  },
  "Error importing": {
    val: "Error importing",
    translated: false,
    src: ["src/ynab.ts line 392"],
    h: "rekzwWcY0HRZEhFebX1fJrp4aDJ/NTPxIwWaCYAk+7k=",
  },
}
