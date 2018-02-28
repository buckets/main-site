<!-- THIS FILE IS AUTOMATICALLY UPDATED. SEE THE README -->
## v0.35.1

- **FIX:** Another fix for another kind of YNAB4 import failure.  ([#MpmFZutK](https://trello.com/c/MpmFZutK))

## v0.35.0

- **NEW:** Added *Start with a template* button for getting started with Buckets.  ([#2kWWcMGa](https://trello.com/c/2kWWcMGa))

- **FIX:** Handle CSV files that don't have a consistent number of columns throughout.  ([#TvFClGGM](https://trello.com/c/TvFClGGM))

- **FIX:** Fixed a bug when importing YNAB4 files with transactions that are split, but not split into categories ([#rJgT119e](https://trello.com/c/rJgT119e))

## v0.34.0

- **NEW:** Replaced confusing line and dot chart with a bar chart of historical expenses in Analysis > Recurring Expenses section.  Also, now you can choose the time period being shown.  ([#cY5uD7Y5](https://trello.com/c/cY5uD7Y5))

- **NEW:** You can now click on a bucket's balance to quickly set it to 0.  For instance, if the balance is -54 and you click it, it will prepare to deposit 54 into the bucket.  ([#WLOgdR67](https://trello.com/c/WLOgdR67))

- **NEW:** Now translated into Portuguese, graças a Carlos.  Obrigado!

- **NEW:** You can now attach screenshots to bug reports

- **NEW:** You can now undo/redo *most* actions that modify your budget.  So if you accidentally deposited $500 into the wrong bucket, press Control/Command Z to reverse the last change.  ([#JE9sINCG](https://trello.com/c/JE9sINCG))

- **FIX:** Balance chart for high numbers is now more than just a flat line ([#rYUgiuQh](https://trello.com/c/rYUgiuQh))

- **FIX:** Fixed bug where deleting an account would not always clean up associated records.

- **FIX:** Cents are shown by default now for all numbers ([#yUin1iGJ](https://trello.com/c/yUin1iGJ))

- **FIX:** Potentially fixed slowness when entering notes and goal/deposit amounts on buckets.  ([#AbqgETOV](https://trello.com/c/AbqgETOV))

- Now only the language you are using is loaded (resulting in slightly faster load times)

## v0.33.0

- **NEW:** You can now delete bucket groups ([#02VRaU99](https://trello.com/c/02VRaU99))

- **NEW:** The Buckets view now shows the amounts put in and taken out of each bucket.  ([#wU1gc6wz](https://trello.com/c/wU1gc6wz))

- **NEW:** If you attempt to use more rain than you have available, a warning is displayed and the 'Make it so' button requires confirmation.  ([#4T1eVgov](https://trello.com/c/4T1eVgov))

- **FIX:** Bucket balance chart will divide into more than just months if it makes sense ([#fVPOUQzl](https://trello.com/c/fVPOUQzl))

- **FIX:** The Buckets view is faster(less visual lag) when entering amounts to be deposited/withdrawn.

- **FIX:** You can now edit blank group/bucket names ([#7krRuUOo](https://trello.com/c/7krRuUOo))

- **FIX:** Fixed a timezone bug in Analysis > Recurring expenses that made 'Last month' always 0.  Also changed the labels to be explicit about which month is being shown.  ([#kxaoRW0W](https://trello.com/c/kxaoRW0W))

- **FIX:** In the Transactions view, you can now click on the words 'Show uncategorized' instead of having to hit the small checkbox ([#oEuSlRsZ](https://trello.com/c/oEuSlRsZ))

- **FIX:** Bucket transactions are now sorted the same (descending date) as account transactions ([#1y6rFkMD](https://trello.com/c/1y6rFkMD))

- **FIX:** Include more verbose debugging when YNAB4 import fails.

## v0.32.0

- **NEW:** You can delete bucket transactions (Issue [#q2PpU2iV](https://trello.com/c/q2PpU2iV))

- **NEW:** Added a 'Quit' option for Windows/Linux users.  ([#XjHhptE6](https://trello.com/c/XjHhptE6))

- **FIX:** Budget always opened to the month before the current month, by default.  Now it opens to the current month.  ([#tE6BlTgh](https://trello.com/c/tE6BlTgh))

- **FIX:** You can now adjust the Buckets License amount so that different currencies can be made to work ([#j8rA12Fu](https://trello.com/c/j8rA12Fu))

- **FIX:** Fixed math being wrong on money inputs ([#wtnk1A92](https://trello.com/c/wtnk1A92))

- **FIX:** When there are no recurring expense buckets, the analysis page no longer looks like a broken page.  ([#6snqIshs](https://trello.com/c/6snqIshs))

- **FIX:** Posted date of newly created transactions will now always be (by default) in the month you are looking at.  ([#LauMJXLI](https://trello.com/c/LauMJXLI))

## v0.31.2

- **FIX:** Fixed *Used in future* to not include kicked buckets.

- **FIX:** Fixed future rain missed update with multiple windows ([#dXwraTOl](https://trello.com/c/dXwraTOl))

- Moved to Trello for issue/bug tracking ([#JeaRIFN9](https://trello.com/c/JeaRIFN9))

## v0.31.1

- **FIX:** Fix error in want-to-buy message

## v0.31.0

- **NEW:** Added a transaction export tool.  (Issue [#28](https://github.com/buckets/application/issues/28))

- **NEW:** Rain in the current month now takes into account any amount spoken for in future months.  This allows for budgeting future months.  (Issue [#38](https://github.com/buckets/application/issues/38))

- **NEW:** When reopening buckets, the last set of opened windows is restored.  (Issue [#59](https://github.com/buckets/application/issues/59))

- **FIX:** Another attempt at the off by one problem.  (Issue [#40](https://github.com/buckets/application/issues/40))

## v0.30.0

- **NEW:** Date format is now suggested when importing from CSV

- **NEW:** Added a preference to disable money animations.

- **NEW:** When doing multiple buckets transactions at once, the math regarding what is happening now appears in the top action bar.  (Issue [#54](https://github.com/buckets/application/issues/54))

- **NEW:** Renamed 'Transact' to 'In/Out' on Buckets page.

- **FIX:** Long bucket/group names are no longer cut off (Issue [#14](https://github.com/buckets/application/issues/14))

- **FIX:** Fixed help prompt text-wrapping issue on Buckets tab Rain header.  (Issue [#57](https://github.com/buckets/application/issues/57))

- **FIX:** Default logging is more verbose

- **FIX:** Special misc group is no longer editable.  (Issue [#41](https://github.com/buckets/application/issues/41))

- **FIX:** Maybe fixed off by one month issue.  (Issue [#40](https://github.com/buckets/application/issues/40))

- **FIX:** Account-style parenthesis-delimited negative numbers are supported in CSV importing.  (Issue [#60](https://github.com/buckets/application/issues/60))

- **FIX:** Subheader on Buckets/Transactions/Accounts page is now always visible even when your scroll down.  (Issue [#58](https://github.com/buckets/application/issues/58))

- The Guide mentions that it's a work in progress now.  (Issue [#48](https://github.com/buckets/application/issues/48))

## v0.29.0

- **NEW:** Added a preference to disable money animations

- **NEW:** CSV importing is now supported.  (Issue [#5](https://github.com/buckets/application/issues/5))

## v0.28.0

- **NEW:** Now there's a way to submit bugs from within Buckets. (Issue [#43](https://github.com/buckets/application/issues/43))

### v0.27.1

- **NEW:** Added some options in the Help menu to allow for more verbose log reports.

- **FIX:** Fix some database schema issues.

## v0.27.0

- **FIX:** Check for updates, and version information is now available for Windows and Linux users.  (Issue [#43](https://github.com/buckets/application/issues/43))

- **FIX:** Fix a bug that prevented adding transactions in the account view.  (Issue [#44](https://github.com/buckets/application/issues/44))

- **FIX:** Make update window not be so small (especially on Windows) (Issue [#45](https://github.com/buckets/application/issues/45))

## v0.26.0

- **NEW:** Added Amazon reconciliation tool.  (Issue [#33](https://github.com/buckets/application/issues/33))

- **FIX:** Database migrations are less flakey now.

### v0.25.1

- **FIX:** Hopefully fix issue [#39](https://github.com/buckets/application/issues/39) so that importing from YNAB4 works.

- **FIX:** Make month selector more resilient to different timezones.  (Issue [#40](https://github.com/buckets/application/issues/40))

## v0.25.0

- **NEW:** Numbers in most tables are now always dollar-aligned with faded cents when it's an even dollar.

- **NEW:** Transactions can now be edited.  (Issue: [#10](https://github.com/buckets/application/issues/10))

- **NEW:** The Buckets Guide (still largely unwritten) is now mirrored online and in the Buckets app through the Help menu

- **NEW:** Now you can add notes to accounts, buckets, transactions and groups.  (Issue [#31](https://github.com/buckets/application/issues/31))

- **NEW:** Added a *Possible Duplicates* section to the *Transactions* tab (in the case where there are possible dupes).  (Issue [#37](https://github.com/buckets/application/issues/37))

- **NEW:** A running balance column has been added to transaction lists for single accounts and buckets. (Issue [#17](https://github.com/buckets/application/issues/17))

- **NEW:** There's now a search tab, for searching for transactions, accounts and buckets.  (Issue [#30](https://github.com/buckets/application/issues/30))

- **FIX:** When viewing account details, the pane takes up more space so you can see more of the transactions.  (Issue [#36](https://github.com/buckets/application/issues/36))

- **FIX:** Horizontal scrolling now works on all pages.  (Issue [#18](https://github.com/buckets/application/issues/18))

- **FIX:** On the Buckets page, the *New bucket* button does not make the graph icon cell stretch anymore.

## v0.24.0

- **FIX:** You can no longer make 0-amount bucket transactions (Issue [#22](https://github.com/buckets/application/issues/22))

- **FIX:** Include more information to distinguish between similar accounts when using SimpleFIN Sync

- **FIX:** Clarify that most U.S. banks are supported by SimpleFIN (Issue [#24](https://github.com/buckets/application/issues/24))

- NEW: Accounts can now be closed, and you can shoot yourself in the foot by completely deleting accounts and all linked transactions.  You're welcome.  (Issue [#2](https://github.com/buckets/application/issues/2))

## v0.23.0

- **FIX:** Account balance table aligns balance to the right.

- **FIX:** Report bug feature now works on Windows (Issue [#11](https://github.com/buckets/application/issues/11))

- **FIX:** Fix YNAB importing for budgets that have categories without subcategories. (Issue [#12](https://github.com/buckets/application/issues/12))

- NEW: When updating Buckets, release notes are shown in the notification window, a progress bar shows progress and you can opt to skip a version to prevent more notifications. (Issues [#3](https://github.com/buckets/application/issues/3), [#9](https://github.com/buckets/application/issues/9))

- NEW: Under *Analysis* the *Regular Expenses* section includes helpful number line charts and groups buckets according to whether expenses appear monthly v. yearly (or somewhat yearly) and groups them by relative budgeted amount.  In short, it's prettier :)

### v0.22.1

- **FIX:** Fix [issue #8](https://github.com/buckets/application/issues/8) by allowing users to select directories and files for import

## v0.22.0

- NEW: Added first (experimental) version of creating macros to download transaction data from banks automatically.  (Not yet translated into Spanish).

## v0.21.0

- **FIX:** Improved the explanation of what rain is

- NEW: Switch from bucketsisbetter.com to budgetwithbuckets.com

## v0.20.0

- **FIX:** Light grey on charts is now less light and more visible

- **FIX:** When turning a bucket from a specialized type back into a regular bucket, the rain is now reported correctly (as zero)

- **FIX:** Set default save directory to ~/Documents (or OS equivalent) so that the default is no longer /

- NEW: All budget-related menu options have been moved to a single 'Budget' menu (rather than being dispersed over several other menus)

- NEW: Buckets can now import You Need a Budget (YNAB) v4 budget files.

## v0.19.0

- **FIX:** Translate the preferences page

- NEW: Buckets files format is documented

- NEW: Auto-updating is now supported on Linux for AppImage installs

- NEW: Reduce license price from $40 to $29 (and intro price from $20 to $15)

## v0.18.0

- NEW: Buckets is now available in Spanish!

## v0.17.0

- **FIX:** Fixed a bug that prevented actually linking SimpleFIN accounts

- NEW: Added better logging for times where there are silent errors

## v0.16.0

- **FIX:** Got rid of scary balance-mismatch warnings that weren't actually actionable.  And a better explanation of what mismatches mean is included.

- **FIX:** Now, when you sync transactions, it will only sync the current month

- **FIX:** The update process is even *more* clear.

## v0.15.0

- **FIX:** If you try to open/create a file that's unreadable and error is displayed instead of failing silently


- NEW: You can now click 'Make it Rain' as many times as you want.  Each bucket will only take what it needs *per month*



- **FIX:** Fixed bug where 'Duplicate Window' would sometimes throw an error.

- **FIX:** Recurring expense report doesn't report false information for newly-made buckets anymore

- NEW: Added new charts to bucket information pages

- NEW: You can now explicitly mark bucket transactions as transfers


## v0.14.0

- **FIX:** When updating an account balance in a month that isn't the current month, it now does the right thing.

- **FIX:** Removed the mystery of what's going on during update download/install.

- NEW: Added a bucket expense analysis section.


## v0.13.0

- NEW: Added a new 'Analysis' section with helpful month-to-month and year-to-year charts

- NEW: Added *Chat with Matt* navigation item


## v0.12.0

- NEW: Now you can get instant help with the 'Chat...' option in the Help menu.

- NEW: Added *Effective Balance* column to buckets for when there are buckets in debt (so you don't think you have more money than you do).

- NEW: Windows are labeled with the filename now

- NEW: Linux installs will now be notified of updates, too


## v0.11.0

- **FIX:** Style fixes and extra tooltip helps

- **FIX:** Some menu items are disabled/enabled now when the context justifies it.

- **FIX:** Fixed bug where categorizing with math would sometimes make too many rows

- NEW: Categorizing is cleaner now

- NEW: Started changelog.

- NEW: Table rows are now highlighted when you hover over them

- NEW: You can now import OFX/QFX files

