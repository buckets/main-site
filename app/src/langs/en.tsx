import { ILangPack } from './spec';

export const pack:ILangPack = {
  name: 'English',
  messages: {
    // Generic labels
    'labels.Trial Version': 'Trial Version',
    'labels.Rain': 'Rain',

    // Nav bar
    'nav.Accounts': 'Accounts',
    'nav.Transactions': 'Transactions',
    'nav.Buckets': 'Buckets',
    'nav.Kicked': 'Kicked',
    'nav.Analysis': 'Analysis',
    'nav.Recurring Expenses': 'Recurring Expenses',
    'nav.Connections': 'Connections',
    'nav.Import': 'Import',
    'nav.Chat with Matt': 'Chat with Matt',

    // Menu items
    'menu.file.label': 'File',
    'menu.file.NewBudget': 'New Budget...',
    'menu.file.OpenBudget': 'Open Budget...',
    'menu.file.OpenRecent': 'Open Recent',
    'menu.file.Duplicate Window': 'Duplicate Window',
    'menu.file.ImportTransactions': 'Import transactions...',

    'menu.register.PurchaseFullVersion': 'Purchase Full Version...',
    'menu.register.EnterLicense': 'Enter License...',
    
    'menu.help.LearnMore': 'Learn More',
    'menu.help.ShowLogFiles': 'Show Log Files...',
    'menu.help.ReportBug': 'Report Bug...',
    'menu.help.Chat': 'Chat...',
    
    // Wizard
    'wizard.Recently used': 'Recently used',

    // Accounts
    "accounts.balance_mismatch_msg": 'The most recent synced balance does not match the balance computed from transactions.  Click more for more information.',
    "accounts.name_placeholder": "no name",
    "accounts.more_link": "more",
  },
}
