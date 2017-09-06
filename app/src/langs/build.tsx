// Auto-generated file

import * as React from 'react'
import * as moment from 'moment'
import { Date } from '../time'

interface IMsg<T> {
  val: T;
  translated: boolean;
  src: string[];
  h: string;
  newval?: T;
}
export interface IMessages {
  "accounts.balance_mismatch_msg": IMsg<string>;
  "accounts.name_placeholder": IMsg<string>;
  "accounts.more_link": IMsg<string>;
  "Account": IMsg<string>;
  "Balance": IMsg<string>;
  "Synced balance": IMsg<string>;
  "accounts.balance_mismatch_long_msg": IMsg<()=>string|JSX.Element>;
  "balance-as-of": IMsg<(d:any)=>string|JSX.Element>;
  "New account": IMsg<string>;
  "Connect to bank": IMsg<string>;
  "default account name": IMsg<string>;
  "Trial Version": IMsg<string>;
  "Accounts": IMsg<string>;
  "Transactions": IMsg<string>;
  "Buckets": IMsg<string>;
  "Kicked": IMsg<string>;
  "Analysis": IMsg<string>;
  "Recurring Expenses": IMsg<string>;
  "Connections": IMsg<string>;
  "Import": IMsg<string>;
  "Chat with Matt": IMsg<string>;
  "Rain": IMsg<string>;
  "Delete selected": IMsg<string>;
  "transactions.delete": IMsg<(size:number)=>string|JSX.Element>;
  "File": IMsg<string>;
  "New Budget...": IMsg<string>;
  "Open Budget...": IMsg<string>;
  "Open Recent...": IMsg<string>;
  "Duplicate Window": IMsg<string>;
  "Import Transactions...": IMsg<string>;
  "Learn More": IMsg<string>;
  "Show Log Files...": IMsg<string>;
  "Report Bug...": IMsg<string>;
  "Chat...": IMsg<string>;
  "Getting Started...": IMsg<string>;
  "Purchase Full Version...": IMsg<string>;
  "Enter License...": IMsg<string>;
  "Check For Updates...": IMsg<string>;
  "Enter Buckets License": IMsg<string>;
  "enter-license-prompt": IMsg<string>;
  "Submit": IMsg<string>;
  "Success!": IMsg<string>;
  "Restart Buckets": IMsg<string>;
  "Invalid license": IMsg<string>;
  "Buckets Updates": IMsg<string>;
  "Check for Updates": IMsg<string>;
  "Checking for updates...": IMsg<string>;
  "version-available": IMsg<(newv:string)=>string|JSX.Element>;
  "Download Update": IMsg<string>;
  "You are running the latest version!": IMsg<string>;
  "Downloading update...": IMsg<string>;
  "Update downloaded.": IMsg<string>;
  "Install and Relaunch Buckets": IMsg<string>;
  "There was an error.  Maybe try again?": IMsg<string>;
  "Recently used": IMsg<string>;
}
export const DEFAULTS:IMessages = {
  "accounts.balance_mismatch_msg": {
    val: "The most recent synced balance does not match the balance computed from transactions.  Click more for more information.",
    translated: false,
    src: ["src/budget/accounts.tsx line 33"],
    h: "cMuGJ8vkjW+HMm8Ac01xULd9Lwf/iVtXYPi3WBC2JS4=",
  },
  "accounts.name_placeholder": {
    val: "no name",
    translated: false,
    src: ["src/budget/accounts.tsx line 40","src/budget/accounts.tsx line 97"],
    h: "UwMHboI9q49SZQkwMN8ps9zBi6YOSdtwakjLJwudtyA=",
  },
  "accounts.more_link": {
    val: "more",
    translated: false,
    src: ["src/budget/accounts.tsx line 46"],
    h: "uiqCMjSdL1TgDZHPNYXLnfN/yZq59+kDR/wKZSAP0hU=",
  },
  "Account": {
    val: "Account",
    translated: false,
    src: ["src/budget/accounts.tsx line 52"],
    h: "ihCgI4A9UaFZ63kuiKXqFHoGsze2dYwzpgSVU0clMfQ=",
  },
  "Balance": {
    val: "Balance",
    translated: false,
    src: ["src/budget/accounts.tsx line 53","src/budget/accounts.tsx line 105"],
    h: "azvDWgVPY349dq4q8mbtpDhehRsFKYKNzMk/TcuOvEQ=",
  },
  "Synced balance": {
    val: "Synced balance",
    translated: false,
    src: ["src/budget/accounts.tsx line 77"],
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
    src: ["src/budget/accounts.tsx line 82"],
    h: "wR5L88lhIXbxAVDXEZbN1lwbnZjYUBkAifA2KtAg8dM=",
  },
  "balance-as-of": {
    val: (d:moment.Moment) => {
            return <span>as of <Date value={d} /></span>
            },
    translated: false,
    src: ["src/budget/accounts.tsx line 112"],
    h: "tGR0TmgHhvEicsb64nt3wh+45RmXix5cShzkt6B98sw=",
  },
  "New account": {
    val: "New account",
    translated: false,
    src: ["src/budget/accounts.tsx line 138"],
    h: "MtAiANg7ugdeUiGmiGklfBPG4T1igh1iChKeC0Mdxnc=",
  },
  "Connect to bank": {
    val: "Connect to bank",
    translated: false,
    src: ["src/budget/accounts.tsx line 139"],
    h: "0T7eA3oFvMxyPIOAkMZ2rDpJxQVORgxrLqrDx87L1ZY=",
  },
  "default account name": {
    val: "Savings",
    translated: false,
    src: ["src/budget/accounts.tsx line 164"],
    h: "zCYN8vtLT3Hhb9CbDDSL2xOOjqhzmmhMa5yWDTR7bCE=",
  },
  "Trial Version": {
    val: "Trial Version",
    translated: false,
    src: ["src/budget/budget.tsx line 79","src/mainprocess/menu.ts line 175"],
    h: "GtZIXrHILA84HlpKlxi3BErHwR7WIYkQ/e5BE0Fiaxg=",
  },
  "Accounts": {
    val: "Accounts",
    translated: false,
    src: ["src/budget/budget.tsx line 115"],
    h: "1oHDkv2zB1yiCABVTWBY5oX4Ccu36nJBCG7Q+JVg8TA=",
  },
  "Transactions": {
    val: "Transactions",
    translated: false,
    src: ["src/budget/budget.tsx line 116"],
    h: "4+yGUer/b71cfxTdeUa5QbonqN9ezC8Eii7KO22Ety0=",
  },
  "Buckets": {
    val: "Buckets",
    translated: false,
    src: ["src/budget/budget.tsx line 117"],
    h: "fMPIWzGvVEG0t7+bZX1ucgzulk8FaQfqioLgwLsj+oE=",
  },
  "Kicked": {
    val: "Kicked",
    translated: false,
    src: ["src/budget/budget.tsx line 119"],
    h: "cWApfoLlcBvoHizIFtrDQq3uwrZIYMXKO1iLMvv8szI=",
  },
  "Analysis": {
    val: "Analysis",
    translated: false,
    src: ["src/budget/budget.tsx line 121"],
    h: "+LNAOPSLW2rpFCrT+U1suhdnoYyZa1k8ALddRlddDlI=",
  },
  "Recurring Expenses": {
    val: "Recurring Expenses",
    translated: false,
    src: ["src/budget/budget.tsx line 124"],
    h: "yDp5Agru+QzDSy583s3kjOdZbbe6X1WDfMeSNXsYlaY=",
  },
  "Connections": {
    val: "Connections",
    translated: false,
    src: ["src/budget/budget.tsx line 127"],
    h: "1hPfKAqhO0JhEGc2rQ8tee2sqrIAP38KrxQcfLF3I1Y=",
  },
  "Import": {
    val: "Import",
    translated: false,
    src: ["src/budget/budget.tsx line 128"],
    h: "F3sijvfYz3oB4iz2rVHjUvNDLQs43MbXDVIr5VFA2/c=",
  },
  "Chat with Matt": {
    val: "Chat with Matt",
    translated: false,
    src: ["src/budget/budget.tsx line 136"],
    h: "9nQjbkjkf8l2mX6xeNaU///NYhxxWFqnvTKOmakMmRY=",
  },
  "Rain": {
    val: "Rain",
    translated: false,
    src: ["src/budget/budget.tsx line 172"],
    h: "fqeHyOaOYnCtGAcJlJbhAR37DG6YMrsasUNtiL6z8hc=",
  },
  "Delete selected": {
    val: "Delete selected",
    translated: false,
    src: ["src/budget/transactions.tsx line 84"],
    h: "bsJ1Vyhm8h3AT4g3iLkWOso1mGTLsIFexh1ymwKankw=",
  },
  "transactions.delete": {
    val: (size:number) => {
        return `Delete selected (${size})`
      },
    translated: false,
    src: ["src/budget/transactions.tsx line 86"],
    h: "/u86qzz5nT6n9ZqcgDLwC0GHmjDy0cELJjSzjBAim5g=",
  },
  "File": {
    val: "File",
    translated: false,
    src: ["src/mainprocess/menu.ts line 33"],
    h: "9XpUff7TtVQbIncvgmrfzVB2gkBh35RnM1ET/HFr3k0=",
  },
  "New Budget...": {
    val: "New Budget...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 36","src/wwwroot/misc/wizard.html line 0"],
    h: "daxIu+dqn7pfUDeB26rLQnPnAz2v5opSTHbAyBovaoI=",
  },
  "Open Budget...": {
    val: "Open Budget...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 43","src/wwwroot/misc/wizard.html line 0"],
    h: "67FfAce57aSIe2ncVfWeIeiiRLQQ8uuEUdDyI6UHxHU=",
  },
  "Open Recent...": {
    val: "Open Recent...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 50"],
    h: "Uf1w3VIwUvsmKvOkQtBwsGvbRzQ5gMbEq/iyNzv95cs=",
  },
  "Duplicate Window": {
    val: "Duplicate Window",
    translated: false,
    src: ["src/mainprocess/menu.ts line 63"],
    h: "tjwFTBARBKQ5uC9Fh0zm7ag/RViV95pptJBJn9eVqHE=",
  },
  "Import Transactions...": {
    val: "Import Transactions...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 72"],
    h: "PPLzf/61MKc3iWfDMTRo6ERH/TYu6TxBH2vmVbZD5Lk=",
  },
  "Learn More": {
    val: "Learn More",
    translated: false,
    src: ["src/mainprocess/menu.ts line 144"],
    h: "8bk7nEyrz+Q0vmMisWIPVuvHR4/TeW4DhemALir6s1o=",
  },
  "Show Log Files...": {
    val: "Show Log Files...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 148"],
    h: "In00T9z1A4xO6nLu8zAU5s3UzH3+IcK4XjRvrT9CGMs=",
  },
  "Report Bug...": {
    val: "Report Bug...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 154"],
    h: "i17nG0QruMiCn612ogDToWB1g4xqqei691Yeh/t8MIk=",
  },
  "Chat...": {
    val: "Chat...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 160"],
    h: "SytGirG0+cdtbPfjBma/G/tEOt4rdOj4mnjcaWsTbt8=",
  },
  "Getting Started...": {
    val: "Getting Started...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 166"],
    h: "XD8GQYEIDrNjTMPX4TjGeAbbCIEBcAONlYPd/D8Hz84=",
  },
  "Purchase Full Version...": {
    val: "Purchase Full Version...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 178"],
    h: "+6h2Y0QTHEVui0aUhwAlCsyJp/F+S0PYKMRlQysqjrk=",
  },
  "Enter License...": {
    val: "Enter License...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 184"],
    h: "A+/eZ8qTAh97iBouJPInRkCg7F0nOkteYEBO7+lFHHA=",
  },
  "Check For Updates...": {
    val: "Check For Updates...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 209"],
    h: "S/1p0syaOMqjAbHpmZa6gWaIh/9e29QR2cRJhiMadz0=",
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
    src: ["src/wwwroot/misc/enter_license.tsx line 26"],
    h: "6NxF/uD6sOEPkEbPFOHdBKRxj0ZXVbmnPkRXNJDy0zs=",
  },
  "Restart Buckets": {
    val: "Restart Buckets",
    translated: false,
    src: ["src/wwwroot/misc/enter_license.tsx line 27"],
    h: "TNcYWk7YxhZ0U9Q+mFMRedeWB36VsDXoYgBapDvZCgM=",
  },
  "Invalid license": {
    val: "Invalid license",
    translated: false,
    src: ["src/wwwroot/misc/enter_license.tsx line 30"],
    h: "BfJdh6NOzurSCMGRmCP8gb1VAXUlrSSsCFIGHGXtNiA=",
  },
  "Buckets Updates": {
    val: "Buckets Updates",
    translated: false,
    src: ["src/wwwroot/misc/updates.html line 0"],
    h: "/bdGAwJm/rYxsxx+n8mZcZ2R8TvkVU+hfEC7Acda0nk=",
  },
  "Check for Updates": {
    val: "Check for Updates",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 21"],
    h: "6vtxqhyfiDaIXgTBH0pdoPzTGftDDEoRFNGU082PhRk=",
  },
  "Checking for updates...": {
    val: "Checking for updates...",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 27"],
    h: "wjjhyYhYEFdJWUmwdJIEdxm0iAq2bwrWU79ANObzzZY=",
  },
  "version-available": {
    val: (newv:string) => `Version ${newv} available.`,
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 32"],
    h: "YCoofx1v0tRUHkHfhFnm6bV2xXfnsNT6QAyXqgkUa9c=",
  },
  "Download Update": {
    val: "Download Update",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 36"],
    h: "OvekDBh71chOkbTXqPs/V/x0lNbpc668s4hyXRF5G+I=",
  },
  "You are running the latest version!": {
    val: "You are running the latest version!",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 42"],
    h: "hShy87A6GAhRqqtK+8VdVeGD70zA64iiV0/SwectQ0I=",
  },
  "Downloading update...": {
    val: "Downloading update...",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 44"],
    h: "vTHXpZeFxjQhKPwUQPCm+eHcyYR6YjSmIm4mtV/5iTE=",
  },
  "Update downloaded.": {
    val: "Update downloaded.",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 49"],
    h: "DO2vE3TgW3xjiD8ZaOWeScL3qWCyiFPK8GENQ9NosYw=",
  },
  "Install and Relaunch Buckets": {
    val: "Install and Relaunch Buckets",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 53"],
    h: "bzusTDIT831mqEwmmM59eT12mfoNMYiGPbUfoIzaCwo=",
  },
  "There was an error.  Maybe try again?": {
    val: "There was an error.  Maybe try again?",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 62"],
    h: "l+W2GSV3tl8Gx19ZW+wOCziBj5/UeMCVO8tvh4P7LEo=",
  },
  "Recently used": {
    val: "Recently used",
    translated: false,
    src: ["src/wwwroot/misc/wizard.html line 0"],
    h: "tJ5cBjszrV/JztG5V1FUrgo0bfVgXfK5KB495TvGsYs=",
  },
}
