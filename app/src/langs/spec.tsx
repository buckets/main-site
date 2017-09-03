export interface IMessages {
  // Generic labels
  'labels.Trial Version': string,
  'labels.Rain': string,

  // Nav bar
  'nav.Accounts': string,
  'nav.Transactions': string,
  'nav.Buckets': string,
  'nav.Kicked': string,
  'nav.Analysis': string,
  'nav.Recurring Expenses': string,
  'nav.Connections': string,
  'nav.Import': string,
  'nav.Chat with Matt': string,

  // Menu items
  'menu.file.label': string,
  'menu.file.NewBudget': string,
  'menu.file.OpenBudget': string,
  'menu.file.OpenRecent': string,
  'menu.file.Duplicate Window': string,
  'menu.file.ImportTransactions': string,

  'menu.register.PurchaseFullVersion': string,
  'menu.register.EnterLicense': string,
  
  'menu.help.LearnMore': string,
  'menu.help.ShowLogFiles': string,
  'menu.help.ReportBug': string,
  'menu.help.Chat': string,
  
  // Wizard
  'wizard.Recently used': string,

  // Accounts
  "accounts.balance_mismatch_msg": string,
  "accounts.name_placeholder": string,
  "accounts.more_link": string,
  "accounts.Account": string,
}

export interface ILangPack {
  name: string;
  messages: IMessages;
}
