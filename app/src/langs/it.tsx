import * as React from 'react'
import * as moment from 'moment'

import { ILangPack } from '@iffycan/i18n'
import { IMessages } from './spec'

// Contributors, include your name and optionally a link to
// a website as you want it to appear in any credits.
const contributors = [
  {
    name: 'Emanuele',
  }
  // {
  //   name: '',
  //   // href: '', /* optional */
  // }
];

const messages:IMessages = {
  "\n        Though filling out this form is preferrable, you can also email bugs@budgetwithbuckets.com\n      ": {
    val: "\n        Anche se riempire questo modulo sarebbe preferibile, puoi anche inviare una mail a bugs@budgetwithbuckets.com\n      ",
    translated: true,
    h: "05fPQ/cX0e4UXnYsbNTo8b6FUwq/WZ1URc7ixr6WlV8=",
  },
  "(Drop files or click)": {
    val: "(Clicca o trascina file)",
    translated: true,
    h: "cn8vjUpkolK+X1qsHPyR11Qj7uQWZVR6eWnhPRb/zfw=",
  },
  "(If you want a response)": {
    val: "(Se vuoi una risposta)",
    translated: true,
    h: "Ij4mQm0L5WO4Iunvl3fKwbhLwjTodc3Chq81GsFM+T0=",
  },
  "(optional)": {
    val: "(opzionale)",
    translated: true,
    h: "njVpYkgCdiB755Pxnsk1D8GELOWqw1mBBYG+YQr7e98=",
  },
  "/mo": {
    val: "/mo",
    translated: false,
    h: "ggq7na5vMB1wOjQQo0Wq0o7ctwbMUiiJr1tRRKphHss=",
  },
  "A sync is already in progress": {
    val: "Una sincronizzazione è già in corso",
    translated: true,
    h: "z6CqgxENo0xxB0LPp8P8rmnLPp1m2NElecEaJM8GDfI=",
  },
  "About Buckets": {
    val: "About Buckets",
    translated: false,
    h: "9bzPsx+kCkNUeLTSVjaygyWCkm3VCdsFaAFRvdS+xEU=",
  },
  "Account": {
    val: "Account",
    translated: true,
    h: "ihCgI4A9UaFZ63kuiKXqFHoGsze2dYwzpgSVU0clMfQ=",
  },
  "Account Transactions": {
    val: "Transazioni Account",
    translated: true,
    h: "GPJhFDki3xJdCOMqCkqdUDX7SfEZcg9wGee8KMIuIno=",
  },
  "Account and transactions deleted": {
    val: "Account e Transazioni cancellate",
    translated: true,
    h: "iwS2+dAqfDOEtU5SUm1d1oPFTe0+JT5NCm4nH2SrglE=",
  },
  "Account closed": {
    val: "Account chiuso",
    translated: true,
    h: "l9xs5wLKF3KIgunL1SJh9r9XDYpWkC7LYrL4KUUFm3M=",
  },
  "Account created: ": {
    val: "Account creato: ",
    translated: true,
    h: "AJEfsK8U+n7xnyBkG2FG3cmZZipr4kpQX5mgCZ0Qwi4=",
  },
  "Account deleted completely": {
    val: "Account cancellato completamente",
    translated: true,
    h: "LswJ+SxzkHRVy6+Et4Wga6r/Io1P6MBlTiwdjUAUj48=",
  },
  "Account name": {
    val: "Nome account",
    translated: true,
    h: "Wo+ZnjRTxGkow1m4BGCavACj82/UajUNs6oLDXB++sU=",
  },
  "Accounts": {
    val: "Account",
    translated: true,
    h: "1oHDkv2zB1yiCABVTWBY5oX4Ccu36nJBCG7Q+JVg8TA=",
  },
  "Actions": {
    val: "Azioni",
    translated: true,
    h: "qm2CvbPMHZpeVCriZp/vJ2kAGatdeyDxfZ8TMaapQvo=",
  },
  "Activity": {
    val: "Attività",
    translated: true,
    h: "jfKSYDWvDxzcenHtImEM9HokIu7tBJbMki25BNTynTI=",
  },
  "Actual Size": {
    val: "Actual Size",
    translated: false,
    h: "k1ZfUj7bmT4XwiALRlZo7ztl2d+e7JcLt3WCnvjpBYg=",
  },
  "Amazon.com Reconciliation": {
    val: "Reconciliazione per Amazon.com",
    translated: true,
    h: "SS/vhEAqfP5cTcprv5/4dDYZCEsTIMySGfXEngOoMj0=",
  },
  "Amount": {
    val: "Importo",
    translated: true,
    h: "DHNNaJF4hWTWIFdaMdMhUT4aSdti7ZfaNexABzxWWzc=",
  },
  "Amount of money over-allocated in buckets.": {
    val: "Amount of money over-allocated in buckets.",
    translated: false,
    h: "kFucvPefN9Kae7dArnle8i0rTZZq1U+3d8w81lDNVKw=",
  },
  "Analysis": {
    val: "Analisi",
    translated: true,
    h: "+LNAOPSLW2rpFCrT+U1suhdnoYyZa1k8ALddRlddDlI=",
  },
  "Animation": {
    /* Label for application preference enabling/disabling animations */
    val: "Animazioni",
    translated: true,
    h: "Vk4XaMgXNIEY4+Gcal1n+qdnamgr4Q5af/+wzFRoIHU=",
  },
  "Any other monthly bills you have?": {
    val: "Hai altre spese mensili?",
    translated: true,
    h: "rmA9D10bvYOVj3U4kE7U6jALpz7WpqBJTv6HZaI4T/M=",
  },
  "Attached files are too large.": {
    val: "I file allegati sono troppo grandi.",
    translated: true,
    h: "HfDI7uw+P4uLUPkDu0rxQhxJqjqcriWmD9EWYaiUqvY=",
  },
  "Average": {
    val: "Media",
    translated: true,
    h: "zLxQhptvlIYtt0l/prvWMqnsQHh7N1gxh33WeorRi2w=",
  },
  "Avg:": {
    val: "Avg:",
    translated: false,
    h: "EVMZyhHQEFPlI2ib8VqTJo25bJBk8gHsgZR1SZ2Jcj0=",
  },
  "Babysitting": {
    val: "Babysitting",
    translated: false,
    h: "yOfOnHbye/Uhao1fb5jtfP4z0XPyc757kdBFt32Uwrc=",
  },
  "Balance": {
    val: "Bilancio",
    translated: true,
    h: "azvDWgVPY349dq4q8mbtpDhehRsFKYKNzMk/TcuOvEQ=",
  },
  "Balance:": {
    val: "Bilancio:",
    translated: true,
    h: "hHHAAGXs0oscbD5jkMQSQUQ5sLsgo/sPaBumUBAq+CA=",
  },
  "Birthdays": {
    val: "Compleanni",
    translated: true,
    h: "rzI9rIMV5VD86pAzRZf+uFAA8rWYhz1rIH5N9fDesSk=",
  },
  "Break Import Links": {
    val: "Break Import Links",
    translated: false,
    h: "XQYKw3qJ7xKoR/DX6K6NdZxbJLHVJhxy9mFVV8r1ZU4=",
  },
  "Bring All to Front": {
    val: "Bring All to Front",
    translated: false,
    h: "vXNLSncC5dTsDdfhZY5dhbev+Y3PpqQEy1fwxTkGWU0=",
  },
  "Bucket": {
    val: "Bucket",
    translated: false,
    h: "APPSgbsmF5H9B7YIJDaPcEVh4T7ctWU+hxQv/eG1Dg0=",
  },
  "Bucket Transactions": {
    val: "Bucket Transactions",
    translated: false,
    h: "5hMoGWO5uTeCOujLdFnRx4w3D6Zka/avSxnH14UmJiI=",
  },
  "Bucket deleted completely": {
    val: "Bucket deleted completely",
    translated: false,
    h: "gBMlSFTWDRRSWZeZ3fuxDhpJnhv2MoF3EvZSwo1BZHg=",
  },
  "Bucket type:": {
    val: "Bucket type:",
    translated: false,
    h: "NMC+sjsH6UgNhNtiqYeiHDi4zDK/+S5h5yMfZ5CQk1c=",
  },
  "Buckets": {
    val: "Buckets",
    translated: false,
    h: "fMPIWzGvVEG0t7+bZX1ucgzulk8FaQfqioLgwLsj+oE=",
  },
  "Buckets Budget Filename": {
    val: "Buckets Budget Filename",
    translated: false,
    h: "PMqvee/qJsh/OYtRi+hbcH4fgl07SR6XM0wx4c1C+sU=",
  },
  "Buckets Guide": {
    val: "Buckets Guide",
    translated: false,
    h: "iK/jSwFsIOO0YBANlaqC8+gTWFX+9IBYpc+HuiQ2U/c=",
  },
  "Buckets License": {
    val: "Buckets License",
    translated: false,
    h: "sym++hSpJ7LeHTQAaiYRAK41eYIw9pfMFO2EbYTHGxo=",
  },
  "Budget": {
    val: "Budget",
    translated: false,
    h: "zOO4DqNSFLa6Z9vlmfaz8OnwggHn8wJeP058V5mUKbE=",
  },
  "Budget Settings": {
    /* Title for budget settings page */
    val: "Budget Settings",
    translated: false,
    h: "zuw0HcpRRRdvF6TOHxlpW20VLJgfbPvUcTImp1laiKA=",
  },
  "Budgeted": {
    val: "Budgeted",
    translated: false,
    h: "aP72arzLN/j79zGtL8DWE7wcBGciRcWqMOR1aTHJmNo=",
  },
  "CSV Account": {
    val: "Account CSV",
    translated: true,
    h: "iUtlYMX6nlvjb8WPFElRbcnOQ/BXPc6BjaHKp6b6GUM=",
  },
  "CSV Fields": {
    val: "Campi CSV",
    translated: true,
    h: "oqAayNv4L3OeWfsN66FDAh9MWIsR//voLRTEotp3GUQ=",
  },
  "Cable TV": {
    val: "Cable TV",
    translated: false,
    h: "wISz6Dh0vnQ1Tjhr9GWcJ2rhiif2af6NXsAzEAXYxfo=",
  },
  "Cancel": {
    val: "Annulla",
    translated: true,
    h: "wHdMGFBg/BNmqwwBSIr4TrXk4fT1kilDHgZN5z4N5sU=",
  },
  "Cancel sync": {
    val: "Annulla sincronizzazione",
    translated: true,
    h: "8xFWyPShIifEhumOA/PeoTtccm5TTtbQmWFViIGcPQA=",
  },
  "Car Insurance": {
    val: "Assicurazione Automobile",
    translated: true,
    h: "x3xbGNEH/vHcpYAm2HXTUhRRuz2sb6yfH0gBYFFkqc4=",
  },
  "Car Maintenance": {
    val: "Manutenzione Auto",
    translated: true,
    h: "Lsok3+kX1L7SXMumFWNo+oxBgfmGJcWg1CdSDw6byx8=",
  },
  "Car Payment": {
    val: "Pagamenti Auto",
    translated: true,
    h: "wp49ZoinRgifzKQ+N9RrJ6LG/9Yw6hkw1RCwXwHc6tA=",
  },
  "Categorization": {
    val: "Categorizzazione",
    translated: true,
    h: "DShuYOF3daz37AE7lGCN1TajYU1VyorRCvLwh4bM1r8=",
  },
  "Categorize": {
    val: "Categorizza",
    translated: true,
    h: "mA6/TefxgXpo2M+OUx/ATLQ4QYHv4t1+8vy3MmV+EQg=",
  },
  "Category": {
    val: "Categoria",
    translated: true,
    h: "/frArhrZL+bxdiiBKi/1cYdR/tSD7rhbMHJLgHQQdNQ=",
  },
  "Charity": {
    val: "Beneficenza",
    translated: true,
    h: "5OqY1JRI3brWCHQyu9VDY9hpjXzg1cVB1oQnXLQjZ4U=",
  },
  "Chat with Matt": {
    /* If "Chat with Matt" is too wide, you can translate this as just "Chat" */
    val: "Chat",
    translated: true,
    h: "9nQjbkjkf8l2mX6xeNaU///NYhxxWFqnvTKOmakMmRY=",
  },
  "Chat...": {
    val: "Chat...",
    translated: true,
    h: "SytGirG0+cdtbPfjBma/G/tEOt4rdOj4mnjcaWsTbt8=",
  },
  "Check For Updates...": {
    val: "Controllo Aggiornamenti...",
    translated: true,
    h: "S/1p0syaOMqjAbHpmZa6gWaIh/9e29QR2cRJhiMadz0=",
  },
  "Check for Updates": {
    val: "Controlla Aggiornamenti",
    translated: true,
    h: "6vtxqhyfiDaIXgTBH0pdoPzTGftDDEoRFNGU082PhRk=",
  },
  "Checking for updates...": {
    val: "Controllo degli aggiornamenti...",
    translated: true,
    h: "wjjhyYhYEFdJWUmwdJIEdxm0iAq2bwrWU79ANObzzZY=",
  },
  "Cleared": {
    val: "Cleared",
    translated: false,
    h: "j1SmbPuDDBP04XfOH9NNFCDzXmB9xAzSoVG7RcHcdBg=",
  },
  "Click the \"Set mapping\" to continue.": {
    val: "Clicca su \"Imposta mappatura\" per continuare.",
    translated: true,
    h: "17QBrVZk8kjbKoqmqsbEBBHyjcoru22TcYanag65Jrw=",
  },
  "Close Account": {
    val: "Chiudi Account",
    translated: true,
    h: "qTJEf8mdhLx1bU9LZPYaTtrT8pMLqxemoL/YqbhjESI=",
  },
  "Close Window": {
    val: "Chiudi Finestra",
    translated: true,
    h: "hrPxvP/hrVgtNNTMX4sv5sljx57neTy+2p0U1TKGuCE=",
  },
  "Close account": {
    val: "Chiudi account",
    translated: true,
    h: "7HdV8X8++teDNW33urE2eccDw3VLdSpvII89zC/sfu4=",
  },
  "Closed": {
    /* ! Label for list of closed accounts */
    val: "Chiuso",
    translated: true,
    h: "8pZrnvzAUQTJhDN/XX31DLvx0wIs1Ww3fV6pktEKEHs=",
  },
  "Clothing": {
    val: "Abbigliamento",
    translated: true,
    h: "as4CQmPu3VF2LxSvA5djgiAPatdFRqwmOt0NiHJCe7E=",
  },
  "Confirm password:": {
    val: "Conferma password:",
    translated: true,
    h: "Px/rLFgkE/Sv1Z+Xm0frULVV3lxvrEc7ABJaDzmv670=",
  },
  "Connect": {
    val: "Connetti",
    translated: true,
    h: "pCLQy6ZAsZnJ3ff5r+iD+O2vHQhIJEEUHUhiY1NrMP0=",
  },
  "Connect to bank": {
    val: "Connetti alla banca",
    translated: true,
    h: "0T7eA3oFvMxyPIOAkMZ2rDpJxQVORgxrLqrDx87L1ZY=",
  },
  "Connecting...": {
    val: "Connettendo...",
    translated: true,
    h: "fYdj0RfOQMPN3n28gswFnK4aOvozPH0hqm9oqd+NcWI=",
  },
  "Connection saved!": {
    val: "Connessione salvata!",
    translated: true,
    h: "wAgyeIQsbaI/kFPgBf8sWlKK1mf/VcP7BjHpC9TNYuc=",
  },
  "Copy": {
    val: "Copia",
    translated: true,
    h: "T2DR4UKv+pyVWY8GzF/WWjk5XqMXgZ0gDyXkZmYczHw=",
  },
  "Create Account": {
    val: "Crea Account",
    translated: true,
    h: "0N2I0sNdMLVk7zC9FqlNYoA1G6RDgQDvQErp/TjAnRA=",
  },
  "Create Backup": {
    val: "Crea Backup",
    translated: true,
    h: "tUZEq5sa8Ggh6lIgsWzX8Blj6/unJ8dhl9sKpfwxRYY=",
  },
  "Create Backup and Start Over": {
    val: "Crea Backup e Ricomincia da Zeror",
    translated: true,
    h: "55tb3CtVKNADQpK4SdoMMPQvHu1ftBosd/dP8lFHV/o=",
  },
  "Create Macro": {
    val: "Crea Macro",
    translated: true,
    h: "F6PDykaoACWoqQ+oKUyJyhERAe1FjT6A3OkxL+S5l8k=",
  },
  "Create Template": {
    val: "Crea Modello",
    translated: true,
    h: "gAbtUL3vhxk+yCSp7fzAF4Z9tV0I4x7Uq5xDJ4nm2Uk=",
  },
  "Create Transaction": {
    val: "Crea Transazione",
    translated: true,
    h: "G5NDAP857MBDE66GWUREcFAJc2pCogndYa6y+m6PRfE=",
  },
  "Create budget password:": {
    val: "Create password del budget:",
    translated: true,
    h: "Bf9XVrpN9UpVSKpZNRpBUw/IaFjMkNCmH4gpAfhYFkY=",
  },
  "Create macro": {
    val: "Crea macro",
    translated: true,
    h: "9xZZAswDH8zePPUhfsaSEDJ21GU1yhILKhDWtvnUlr0=",
  },
  "Create new account": {
    val: "Crea nuovo account",
    translated: true,
    h: "SmoVFbeAWSO4cW1YQJbuDJQz8kenVz5++WTJEkS6Vos=",
  },
  "Currency symbol": {
    /* Label for currency symbol setting */
    val: "Currency symbol",
    translated: false,
    h: "/zaBMXJh747DLHbqocisO7iV5wDJpVTSCx8RhH7Ye0E=",
  },
  "Cut": {
    val: "Taglia",
    translated: true,
    h: "+kuX06pgC809fwr+5h9VbC8sVgVWo6EXgg6bzfXXtJs=",
  },
  "Date Posted": {
    val: "Date Posted",
    translated: false,
    h: "3A+vhaBB21UASdnwmNYVGMV9qH/U43D3DCsVSXlWasY=",
  },
  "Debt": {
    val: "Debito",
    translated: true,
    h: "y9kslXhW17gMMFZ9Dq8g/tabfINzlmzT+39QNbWiWGA=",
  },
  "Delete": {
    val: "Elimina",
    translated: true,
    h: "sm3jcrSw6qxgICiEpy25imvm6QNueF6oZ+oBxfeSEJg=",
  },
  "Delete Account": {
    val: "Elimina Account",
    translated: true,
    h: "zTJTocYLEbNVwJ0ojyPCB6M0JpGx6fe6AZHWtuVJv0M=",
  },
  "Delete Connection": {
    val: "Elimina Connessione",
    translated: true,
    h: "o6bxlUpjZFFTleiRLA4ykeB3yEHsAiXW9usUdJ9jh1g=",
  },
  "Delete Group": {
    val: "Elimina Gruppo",
    translated: true,
    h: "VaefOk8g8N64N+Td8TEorhhMQBe0AuWmfRz7u7+Q1Ko=",
  },
  "Delete Macro": {
    val: "Elimina Macro",
    translated: true,
    h: "Qb7shd6fRLybaDzPvdr0Z4VfVek/fHVV556kEcNZrH8=",
  },
  "Delete Transactions": {
    val: "Elimina Transazioni",
    translated: true,
    h: "5rAWRNk97CWy9OfDP5IWSE/T2Ao461w7C3z/IDV154I=",
  },
  "Delete all": {
    val: "Elimina tutto",
    translated: true,
    h: "nKzti1takFUxZyWfLTGqgvdL3dJMx6CdNwVfBH1jUYE=",
  },
  "Description": {
    val: "Descrizione",
    translated: true,
    h: "bg0ZDIR+z+PEkinc/ZyqkERMsVZcFFm3NhQoIqZH+WM=",
  },
  "Diapers": {
    val: "Pannolini",
    translated: true,
    h: "Vr53xwIeHjIIuMymcxrQ3l1RsDE6ra+ZTFT4dbR/rlI=",
  },
  "Disable Macro": {
    val: "Disabilita Macro",
    translated: true,
    h: "k0HEkS8+oirJJHylM2fcT1D1/IqnGFVX3cGlU3d3G50=",
  },
  "Done": {
    val: "Fatto",
    translated: true,
    h: "FlUsJYC76LgtNYLenrPiDvDgAVk3wLT14rwyk2hHYiY=",
  },
  "Download": {
    val: "Download",
    translated: true,
    h: "QVM3NKWnuJ19cWUaN3y9fVCbkiQTygWbOYuFMklAwNc=",
  },
  "Download Update": {
    val: "Download Aggiornamento",
    translated: true,
    h: "OvekDBh71chOkbTXqPs/V/x0lNbpc668s4hyXRF5G+I=",
  },
  "Downloading update...": {
    val: "Scaricando l'aggiornamento...",
    translated: true,
    h: "vTHXpZeFxjQhKPwUQPCm+eHcyYR6YjSmIm4mtV/5iTE=",
  },
  "Duplicate Window": {
    val: "Duplica Finestra",
    translated: true,
    h: "tjwFTBARBKQ5uC9Fh0zm7ag/RViV95pptJBJn9eVqHE=",
  },
  "EXPERIMENTAL Buckets Macro Maker": {
    val: "SPERIMENTALE Creatore di Macro Buckets",
    translated: true,
    h: "NZPVXQ+Dw1vv0fLXY+Z4R1KiEkXjDZtSmY3tVz5L1VI=",
  },
  "Eating out": {
    val: "Mangiare fuori",
    translated: true,
    h: "aiQggrM+Wb8WtkoJykeSDnNiCBgzGqVGc1Hvkf5Uzg8=",
  },
  "Edit": {
    val: "Modifica",
    translated: true,
    h: "9+ZynTDPePvsJX4rW8Mn0wEzk0GRQ+udON01NKHVsQU=",
  },
  "Electricity": {
    val: "Elettricità",
    translated: true,
    h: "D85G++Fy1hUUGZfHiKAUcNRlXmLcdkKK7RtxnwJ110U=",
  },
  "Enable Macro": {
    val: "Abilita Macro",
    translated: true,
    h: "9SWFr96CNVD21JQ30lw4cj1JCAZ44RNlKkDzQJ/RyuE=",
  },
  "Ending Balance": {
    val: "Bilancio Finale",
    translated: true,
    h: "bwan2qqqdDloluCkgp+UPYWSAeOQk9zkaNwb2p0kUDk=",
  },
  "Ending amount:": {
    val: "Importo finale:",
    translated: true,
    h: "0IUvXk9nogxjdL1n0VZPrxcMOUZODNXMlGrlpyXq8bI=",
  },
  "Enter Buckets License": {
    val: "Inserisci licenza Buckets",
    translated: true,
    h: "QPy/bCk+yTP2DzZAmXWbRYj2KC5QbrLq/XeXrysIX6Q=",
  },
  "Enter License...": {
    val: "Inserisci Licenza...",
    translated: true,
    h: "A+/eZ8qTAh97iBouJPInRkCg7F0nOkteYEBO7+lFHHA=",
  },
  "Error": {
    val: "Errore",
    translated: true,
    h: "/ErBlknw7o83xx0uIDCjdDA4u5bAwnNZuhFd2GV1Zcw=",
  },
  "Error fetching data": {
    val: "Error fetching data",
    translated: false,
    h: "z94B0956dECmmaMVLZFW0oZMVtA92etw+2ZqumR4K9Q=",
  },
  "Error importing": {
    val: "Errore nell'importanzione",
    translated: true,
    h: "rekzwWcY0HRZEhFebX1fJrp4aDJ/NTPxIwWaCYAk+7k=",
  },
  "Error parsing response": {
    val: "Errore nell'analisi della risposta",
    translated: true,
    h: "PsIRbom+m8Y5OIEPW2rzJYVlNA2NQrZmEQnpW7Y/9KI=",
  },
  "Error running recording": {
    val: "Error running recording",
    translated: false,
    h: "eE9Fw8G4vQpND3fFWnfGNvtN5LxCcQQecWO6fQgBmpM=",
  },
  "Error running sync": {
    val: "Error running sync",
    translated: false,
    h: "LB/WNzHp4orPsbCVEJuDzUPsQUfNRDNXw7sFnbzfguw=",
  },
  "Expenses": {
    val: "Spese",
    translated: true,
    h: "d6aKytFAPwPUzFOv41R0itfcMu11VdE29vkM05dnpBU=",
  },
  "Export": {
    val: "Esportazione",
    translated: true,
    h: "mZJs0iE089tMZ5BWqTUBp+2aJ90wKL4act4hUPt7zkA=",
  },
  "File": {
    val: "File",
    translated: true,
    h: "9XpUff7TtVQbIncvgmrfzVB2gkBh35RnM1ET/HFr3k0=",
  },
  "File does not exist:": {
    val: "Il file non esiste:",
    translated: true,
    h: "RPeWW9lCHkg+d6XybADj3OH2jxrYcSOhrA3+QHEcYz0=",
  },
  "File saved: ": {
    val: "File salvato: ",
    translated: true,
    h: "e6UDV8UzF5qqysQpN3OrcspjD8zPNn72zKd1CH1lFe8=",
  },
  "File type not recognized.": {
    val: "Import Failed",
    translated: false,
    h: "Z6QnadHff9fEji/vnFxKuxbfAKGNb263Hm13z3txfSM=",
  },
  "Find Next": {
    val: "Trova Successivo",
    translated: true,
    h: "LALfI5V4TsQo0DcGJwmNmrm3xNPtY5PmQuxB1voZo34=",
  },
  "Find Previous": {
    val: "Trova Precedente",
    translated: true,
    h: "0n6Dq5KDTxxsTAKrJE+RDdgi9ln6FyfUEPNBJ6ejZ5o=",
  },
  "Find...": {
    val: "Trova...",
    translated: true,
    h: "aUU1pzvlZzKNgYZP2ZpPtQMImBOStbFnK33P3YwXTNs=",
  },
  "Finish import": {
    val: "Completa importazione",
    translated: true,
    h: "4xsUuxEj2AOOfV6aSUBcosl89BFoAZ+srMPIeWzIjUI=",
  },
  "For Date Posted, you must also choose the date format.": {
    val: "For Date Posted, you must also choose the date format.",
    translated: false,
    h: "G2XPMMlP2JPnutFhPAo1RnCQMTzdukxPSc+FjoF2Vjs=",
  },
  "Force Reload": {
    val: "Force Reload",
    translated: false,
    h: "ktBJY2UXO+2r0ZvmbQXhArN51bSTnyaNnnBNR9PQ5K8=",
  },
  "From": {
    val: "Da",
    translated: true,
    h: "cCFAY2/zl3pq5fMwrP/2LBsrrL36SYzS+6in7mvWyvY=",
  },
  "Fuel": {
    val: "Carburante",
    translated: true,
    h: "lU9dO2a3oisfgHqd0n39sKC/wl7ymSV/XprtLhQLEiI=",
  },
  "Gain/Loss": {
    val: "Guadagni/Perdite",
    translated: true,
    h: "Kop7hNPijjGN5jXxpDmcP32CJy22tzVz1qXWTjNxVg0=",
  },
  "Getting Started...": {
    val: "Getting Started...",
    translated: false,
    h: "XD8GQYEIDrNjTMPX4TjGeAbbCIEBcAONlYPd/D8Hz84=",
  },
  "Goal completion:": {
    val: "Completamento obiettivo:",
    translated: true,
    h: "v+G5gj6B+MtHwQovNmj/BWbpnQncARZGo+swhE1fbtg=",
  },
  "Goal:": {
    val: "Obiettivo:",
    translated: true,
    h: "77+E2dn/Mw53xjGhNc6irsiq1WULAiC4yIyt4NaO0DM=",
  },
  "Goal: 0": {
    val: "Obiettivo: 0",
    translated: true,
    h: "rtvJnJFYA7lHYjPjGpF27/h2So3pRdrRLjfnkg78woQ=",
  },
  "Groceries": {
    val: "Generi alimentari",
    translated: true,
    h: "T6Kz6/FDxQkeIUJq8SVGn0T7OPdZ7B0YjPD3qHqW5p4=",
  },
  "Header row": {
    /* Label for checkbox indicating whether a CSV file has a header row or not */
    val: "Header row",
    translated: false,
    h: "uRtdJlb7w3q8Zl9lZhtY0JReqNVI7CfOdo5I9SW5lfw=",
  },
  "Health Insurance": {
    val: "Assicurazione Sanitaria",
    translated: true,
    h: "nsWIG2Kbb9OtoQkBvgkFh5MfMVNfbuGKhZypQ3uoQJw=",
  },
  "Hello!  Thanks for trying out Buckets.": {
    val: "Hello!  Thanks for trying out Buckets.",
    translated: false,
    h: "0m9VvMGwLCqD3lmZ24GbzlkRxPX1kf/DsbWA9kkBWX0=",
  },
  "Help": {
    val: "Aiuto",
    translated: true,
    h: "TvUUB7AuCuFJ9IWiz2SbsjnUvYoDPZAaMPxup/rwosM=",
  },
  "Hide Buckets": {
    val: "Nascondi Buckets",
    translated: true,
    h: "38YdGXFjndmgDFgXTpfUZ0F+W/D9e267YaAvzYZm4O8=",
  },
  "Hide Others": {
    val: "Nascondi Altri",
    translated: true,
    h: "RpKz0G7Y8OE5oyGm0/zRffPdr7RQkneZCYrikLHIZ+U=",
  },
  "Holidays": {
    val: "Vacanze",
    translated: true,
    h: "HTQ10E8CaKVUu71N6uLx9J+Y6naLLRX37v0oQkesV3k=",
  },
  "Household goods": {
    val: "Household goods",
    translated: false,
    h: "UK1mJCSwg2XnGpH47pKFFD8NlrCfcd3bQb1bJt2RXEg=",
  },
  "I'm exporting data so that I can ": {
    val: "I'm exporting data so that I can ",
    translated: false,
    h: "I5s/a+WZelEoEbDU6z2RwMHJGBkfJJ7zZEZcw89IBck=",
  },
  "ID": {
    val: "ID",
    translated: true,
    h: "ge86Jcy26vcv5uPFI29MfLOxHh8ctACck6nRdrl9aM4=",
  },
  "Identify the data each column contains using the drop downs below.": {
    val: "Identifica le informazioni che contiene ogni colonna utilizzando i menù a tendina.",
    translated: true,
    h: "59JoGSJaPOdtgmCL+QLp8U/e6y+OGGM8fdEX4sClrpk=",
  },
  "If Net is 0, the bucket transactions will be marked as transfers rather than as income or expenses.": {
    val: "If Net is 0, the bucket transactions will be marked as transfers rather than as income or expenses.",
    translated: false,
    h: "/btREV6/jPJtrc1ERDwLUyJAowC8+v6gUB7bmJJYzT4=",
  },
  "If multiple columns are selected for Amount, the first non-zero value will be used.  This is helpful if the CSV contains separate Credit and Debit columns.": {
    val: "If multiple columns are selected for Amount, the first non-zero value will be used.  This is helpful if the CSV contains separate Credit and Debit columns.",
    translated: false,
    h: "bxc4+JxhDrm2oYWek0ISeJDxq173KLfpcnOT4GEMWGQ=",
  },
  "Import": {
    val: "Importa",
    translated: true,
    h: "F3sijvfYz3oB4iz2rVHjUvNDLQs43MbXDVIr5VFA2/c=",
  },
  "Import From YNAB4...": {
    val: "Importa da YNAB4...",
    translated: true,
    h: "z10Vp9BzEC6CkLTNtR8xywSTNYGMBbGFZMD7XUEbrVs=",
  },
  "Import Transactions...": {
    val: "Importa Transazioni...",
    translated: true,
    h: "PPLzf/61MKc3iWfDMTRo6ERH/TYu6TxBH2vmVbZD5Lk=",
  },
  "Import all Amazon Reports": {
    val: "Importa tutti i resoconti di Amazon",
    translated: true,
    h: "EwzV2gCi/cxxLtdXGeSBJLDZhAhXqomL1rdi7QPOQxA=",
  },
  "Import an Amazon Items report to see order details.": {
    val: "Import an Amazon Items report to see order details.",
    translated: false,
    h: "wYXwxlFC+5KEx6+/6kqpqcHLs1Xfkt7mHrY683QmQPk=",
  },
  "Import file": {
    val: "Importa file",
    translated: true,
    h: "iaQvPnsbTKu/ItmjoC8ctwpVbyumVe15GLL8nCbe25Q=",
  },
  "Import from YNAB4": {
    val: "Importa da YNAB4",
    translated: true,
    h: "FJ55mGfxitbc5YeY1s6YEji8I54ILSi3sfzQALSx50I=",
  },
  "Import links broken": {
    /* Notification indicating that the links between imported transaction files and a particular account have been broken. */
    val: "Import links broken",
    translated: false,
    h: "rLgGF32tMx7KSWu+vRLEbr+IbkedxhS8ELcYZhNCqTs=",
  },
  "In": {
    val: "In",
    translated: false,
    h: "TcCPpYF7/U7vM5pPmpqvJipZt0WPk3A/vC7Ec8pfDvo=",
  },
  "In/Out": {
    val: "In/Out",
    translated: false,
    h: "G/e+QHikQOjTM9bcDBrmUZj6ONRstDFt17sNXu9zUd8=",
  },
  "Include log file": {
    val: "Include log file",
    translated: false,
    h: "rjy01ggb0uSRPn/tmrf/BVwGQiXaaSc6Nh+o92BIU3U=",
  },
  "Income": {
    val: "Entrate",
    translated: true,
    h: "D2fJbta5d1Z5QYuRC5zzkBHsItZOOgY4FKrFJ64BvRs=",
  },
  "Install and Relaunch Buckets": {
    val: "Installa e Riapri Buckets",
    translated: true,
    h: "bzusTDIT831mqEwmmM59eT12mfoNMYiGPbUfoIzaCwo=",
  },
  "Internet": {
    val: "Internet",
    translated: true,
    h: "LUwTAW8PsV34HKGrTUopI7v3NFK8iWKpv5Nb8EOtU1E=",
  },
  "Invalid": {
    val: "Non Valido",
    translated: true,
    h: "TTWlQj/xySwj3x3tLJd80Tl+VmJXWWdhFpMq90hNbfg=",
  },
  "Invalid SimpleFIN Token": {
    val: "Invalid SimpleFIN Token",
    translated: false,
    h: "C6BzeT0S0G+xUVzgdubtVeH39oIVS4hUaVBd2gKS3Uo=",
  },
  "Invalid categorization.  Categories not set.": {
    val: "Invalid categorization.  Categories not set.",
    translated: false,
    h: "DykWhCxgeqeIt2i+Lc2sRdURMNIgRgohpjs83umwH9Y=",
  },
  "Invalid license": {
    val: "Licenza non valido",
    translated: true,
    h: "BfJdh6NOzurSCMGRmCP8gb1VAXUlrSSsCFIGHGXtNiA=",
  },
  "It says:": {
    val: "It says:",
    translated: false,
    h: "gbWdWRhcKGQzFCi8CcKy9Bmfg2oYqz1zGMHQzSU8jQE=",
  },
  "It should say:": {
    val: "It should say:",
    translated: false,
    h: "RjwjZtmUgFzGUxR0zMmyXh0cHzpzsbj4nk6R7tGe+i4=",
  },
  "Item": {
    /* Amazon order item description label */
    val: "Prodotto",
    translated: true,
    h: "J0Og6dJ0OAeNyx49ggQ07tKx/Pu/fyej6BKciFOMU0s=",
  },
  "Keep account transactions": {
    val: "Keep account transactions",
    translated: false,
    h: "SA/tgP2OPX7K6/Rztew4oai82mmt7fqOHpOuCWNrPZU=",
  },
  "Keep accounts": {
    val: "Keep accounts",
    translated: false,
    h: "iQX3g3XL9mIf7uX5wDrQIhLNJ464eieqHwhtKtfSuoA=",
  },
  "Keep bucket transactions": {
    val: "Keep bucket transactions",
    translated: false,
    h: "0LwH6beBDlpdXvsVWW7nGj/5/tkz7gDk+Sm4Kltx3rQ=",
  },
  "Keep buckets": {
    val: "Keep buckets",
    translated: false,
    h: "4lGk6/xvGOvn8z5vLVpqCLE6WQwpEoizH0LM95z1Tvo=",
  },
  "Kick Bucket": {
    val: "Kick Bucket",
    translated: false,
    h: "3hmOuv1hNsjpQJ5cSDTlSqN4jGOGFnSPw9r0bK68RWY=",
  },
  "Kick the bucket": {
    val: "Kick the bucket",
    translated: false,
    h: "IvzeGJ9G+Rns8Rbnal26flTFzd+yBNSEBQSptdNy8t8=",
  },
  "Kicked": {
    val: "Kicked",
    translated: false,
    h: "cWApfoLlcBvoHizIFtrDQq3uwrZIYMXKO1iLMvv8szI=",
  },
  "Language": {
    /* Label for application language preference */
    val: "Lingua",
    translated: true,
    h: "H6JLSQVzeo1QvqYd6ewWITP1MyGheSF5eFCeaP6nQwk=",
  },
  "Language default": {
    val: "Lingua predefinita",
    translated: true,
    h: "B22VmGf23mHOBpC02z4zdK4P34035w3nWPUR86u0Dgg=",
  },
  "Last used": {
    val: "Last used",
    translated: false,
    h: "G5a6Jdor9jRT/Wtcg9SfXQsvqL7VFvnVD2+gq7yT1Jg=",
  },
  "Later": {
    val: "Later",
    translated: false,
    h: "wZUl6R8m08S1l0zLg0xgDG2XE1sodemTuRDbalIB4VM=",
  },
  "Learn More": {
    val: "Learn More",
    translated: false,
    h: "8bk7nEyrz+Q0vmMisWIPVuvHR4/TeW4DhemALir6s1o=",
  },
  "Life Insurance": {
    val: "Assicurazione sulla vita",
    translated: true,
    h: "CafgTI2ogIOqH6sg0xYnwgpDXmZ5SZQAsRY2jlTsp9c=",
  },
  "Link Account": {
    val: "Collega Account",
    translated: true,
    h: "Kq3pmMt0lHo1Or0xDzOxrUYLyhXtTVmVmcm/qGByIuk=",
  },
  "Macros": {
    val: "Macro",
    translated: true,
    h: "yo4VuLKqBNhvEBgUZKyI2WypDrv1loL/wA1qO3u4Zq4=",
  },
  "Make Account Off Budget": {
    val: "Make Account Off Budget",
    translated: false,
    h: "jw6HPdaDScqY+QIMmJ35WzXfjHVXwsPaWjv1EgCZC/M=",
  },
  "Make Account On Budget": {
    val: "Make Account On Budget",
    translated: false,
    h: "6gjcSYfUh5rPE2oFISLmP498V1RohOYnE0M2uhE47NM=",
  },
  "Make Transfer": {
    val: "Make Transfer",
    translated: false,
    h: "Rmor5ffKqQTdDQSwA2x/hHhrr0zL7MceXGsR1vHe6b4=",
  },
  "Make it rain!": {
    val: "Make it rain!",
    translated: false,
    h: "GCU3Hru9VCit7F+BYEMKmg5U8gsc1/UZ+o5wsbMAkeY=",
  },
  "Make it so": {
    val: "Make it so",
    translated: false,
    h: "XRTIWjylWKAy5BW8/0C0rOSW5S1QC+CxmgmFfhi81pk=",
  },
  "Mark Cleared": {
    val: "Mark Cleared",
    translated: false,
    h: "Z+NICH1z9EYN3Ub7Z9idiTw/t+QaDF9n3h9br9WhjgE=",
  },
  "Mark Not Cleared": {
    val: "Mark Not Cleared",
    translated: false,
    h: "4VoXUMr4nLIoyueiB8YlIR9HFGPYBhYxJq/cqqwDLs0=",
  },
  "Medical": {
    val: "Spese Mediche",
    translated: true,
    h: "TcuCD6n7/CmRm/jdGZQLDvEdAVaJ2cDy2CahpUk9pCQ=",
  },
  "Memo": {
    val: "Memo",
    translated: false,
    h: "9yClwoAwAV0+DXl8NnkkAnlUi+Ebp2soPwN5meYKgWY=",
  },
  "Minimize": {
    val: "Minimizza",
    translated: true,
    h: "ELhkWGGY5oNKpfCzoXXW6TgkfS1nI0ZuJbWyYLmT+ro=",
  },
  "Misc": {
    val: "Varie",
    translated: true,
    h: "DPoc7CIbzLHJxuar3WnaidO3Ryy1QtYkCswRzVHtVBg=",
  },
  "Month to Month": {
    val: "Mese a Mese",
    translated: true,
    h: "VYq/DQYARQsjblXvXMijYnVbyFbLkqoRYmQ8IHhTbDQ=",
  },
  "Monthly deposit:": {
    val: "Deposito mensile:",
    translated: true,
    h: "GKlnbgfjEkmlOI0TT0pyfI30T1/0jrXjT01JZrBTpP0=",
  },
  "Months": {
    val: "Mesi",
    translated: true,
    h: "wW/jCiA3sxpdbZ8SZ50pYiOvxUk2Ix8T6WB3ZXkAS4s=",
  },
  "Move Bucket": {
    val: "Move Bucket",
    translated: false,
    h: "6lJYNJMplvVHQuXlFYBD81+4kgQQb1SwZ0s13hvlIfI=",
  },
  "Move Group": {
    val: "Move Group",
    translated: false,
    h: "zSmn/C+X/cbh/GqqDMPetNfBb8iTmlwFh9Dsbc9qe9k=",
  },
  "Name": {
    val: "Nome",
    translated: true,
    h: "bMXfNfAzjiMOnmM+rZmR8I9iyrRaMmSXja7cZ0eGcwU=",
  },
  "Natural gas/propane/oil": {
    val: "Gas naturale/propano/olio",
    translated: true,
    h: "CMjkKDPUYAAymOaPiz0PkXS6Ec3BTRWuNZJQ34kHA5s=",
  },
  "Need ideas for getting started?": {
    val: "Hai bisogno di idee per iniziare?",
    translated: true,
    h: "JLW3ar4riykgYXyTGeMCNqL+wes0evHH6RERa+qXPaw=",
  },
  "Needs": {
    val: "Bisogni",
    translated: true,
    h: "RbGrwaVYaT8OdEbNo5YBRWxoGZNYzZKjiDz7JrZVuuc=",
  },
  "Negative": {
    /* Label for choosing the word/symbol that signifies a negative number */
    val: "Negative",
    translated: false,
    h: "uu+tZJYytTWkRjWGnhq7P28TYmWJ58RmQcbAv4QEakg=",
  },
  "Net": {
    val: "Netto",
    translated: true,
    h: "QITdwYnhK1fVfALCDc6jQhY2jLIUBpPp0/bSHOX6p9M=",
  },
  "Net Transfers": {
    val: "Net Transfers",
    translated: false,
    h: "4FYbJ2rCxhrWW9XBurKbS2mOSTwlxIXH/jCv5FDofeM=",
  },
  "New Bucket": {
    val: "New Bucket",
    translated: false,
    h: "FchHrB6weykpHiqRVxc5QKb6BEdhH4DXrc+t6RNcF8M=",
  },
  "New Budget...": {
    val: "Nuovo Budget...",
    translated: true,
    h: "daxIu+dqn7pfUDeB26rLQnPnAz2v5opSTHbAyBovaoI=",
  },
  "New Group": {
    val: "Nuovo Gruppo",
    translated: true,
    h: "1dmXA/VlW+tjhojOGcypAy70L2wupHf9EdVjUByvpmA=",
  },
  "New account": {
    val: "Nuovo account",
    translated: true,
    h: "MtAiANg7ugdeUiGmiGklfBPG4T1igh1iChKeC0Mdxnc=",
  },
  "New bucket": {
    val: "New bucket",
    translated: false,
    h: "aIKjDQtVbUMjIHU/6fccfiWBUIwUBnAofdzRJTCuytI=",
  },
  "New car": {
    val: "Automobile nuova",
    translated: true,
    h: "Bp27l6cn2XdsJhTwsG7CqndX5v6581sQjpY4tMVeh88=",
  },
  "New computer": {
    val: "Computer nuovo",
    translated: true,
    h: "zrx1OP3GJYjfIIZU0Sa31Mm3aQjGco6OnX25VqxnLlY=",
  },
  "New phone": {
    val: "Cellulare nuovo",
    translated: true,
    h: "v6DgXaDFo1Yjq7Cyz8tC29KXNgr704sFNCnXIedKsHw=",
  },
  "New roof": {
    val: "Tetto nuovo",
    translated: true,
    h: "AzV1g+0ivzcHHsk+jxoIrHthrDJ7wuVUOfurDtwV3j8=",
  },
  "No file chosen": {
    val: "No file chosen",
    translated: false,
    h: "MKsAG2u3PyHfYzTNB+XEA8Myeu1DiSU2HNpIW8QXTpc=",
  },
  "No matches found": {
    val: "No matches found",
    translated: false,
    h: "p4er9wMKH/YiF5PrBRKpfEzR8HINC3N0d9Iol4zqgtQ=",
  },
  "Not Transfer": {
    val: "Not Transfer",
    translated: false,
    h: "GJsf5+RmvoXTk3dewQIb90+6xb+mujI/mpSM8cmgUEI=",
  },
  "Not yet cleared": {
    val: "Not yet cleared",
    translated: false,
    h: "Hf/KSsxHfxvXx0udkqgCw/QkkE8Vi5ex9pdYnX6qzEU=",
  },
  "Note": {
    val: "Nota",
    translated: true,
    h: "omcHOlFDF1aMLf9t2/tJ9R1dYEFSQC9IiPuXLXuFwEk=",
  },
  "Nothing found matching:": {
    val: "Nothing found matching:",
    translated: false,
    h: "NF10b/Nmjj8holFGK7KIiaJhSb8bsL9Zt/Fa8fFy4gk=",
  },
  "Number format": {
    /* Label for application number formatting preference */
    val: "Formato dei numeri",
    translated: true,
    h: "RxooctpubAJr5NcKn57a5kjGBEdlPT5b2h6PUFLqxxE=",
  },
  "OK": {
    val: "OK",
    translated: true,
    h: "mMSSK7ZBxlx6MLe8r98jC5sAtmk2McVhRqslsnhu5KM=",
  },
  "Off Budget Accounts": {
    val: "Off Budget Accounts",
    translated: false,
    h: "EQ0I5sn/xpO55GIvIhUF8/XeTi0g5sxvvyE7TiynJDQ=",
  },
  "Off budget": {
    val: "Off budget",
    translated: false,
    h: "cw3ZD6kn6Mat0qZqOZP0Is9hg7xmOxrKqKCD8CIjmz4=",
  },
  "On": {
    val: "On",
    translated: false,
    h: "nMAfqtecKNqqRD1YLNX1F32SXJy1exEgm1QvpnZLBQQ=",
  },
  "Only select a column for Unique ID if you are sure it contains bank-assigned, unique transaction IDs.  Most CSVs will not have this field.": {
    val: "Only select a column for Unique ID if you are sure it contains bank-assigned, unique transaction IDs.  Most CSVs will not have this field.",
    translated: false,
    h: "MUc4sPlkaqyooNhJKZ15rbBQdclJSNbaarHERiW1hrs=",
  },
  "Open Buckets Budget": {
    val: "Open Buckets Budget",
    translated: false,
    h: "5odppwzoA5bC5nAM3F+GDOVrAq3NfjGxrE0ZFXseCDg=",
  },
  "Open Budget...": {
    val: "Apri Budget...",
    translated: true,
    h: "67FfAce57aSIe2ncVfWeIeiiRLQQ8uuEUdDyI6UHxHU=",
  },
  "Open Recent...": {
    val: "Apri Recente...",
    translated: true,
    h: "Uf1w3VIwUvsmKvOkQtBwsGvbRzQ5gMbEq/iyNzv95cs=",
  },
  "Open Transaction File": {
    val: "Open Transaction File",
    translated: false,
    h: "8teUT2P/KToCDoMTqS88JNVtG9PTE/5PojtS1SGmokw=",
  },
  "Open YNAB4 File": {
    val: "Apri file di YNAB4",
    translated: true,
    h: "BrKgvN0SgW410a7e11V3gP+FgW67iTGIY+o/cKI1Ftk=",
  },
  "Optional message:": {
    val: "Messaggio opzionale:",
    translated: true,
    h: "zVM8610w5Mn1yRIYOsmOY5ZxBd2KLIudsimw610auYU=",
  },
  "Optionally request a Amazon Refunds report": {
    val: "Optionally request a Amazon Refunds report",
    translated: false,
    h: "0Gpd84fiRS78S1bJAzdSplsljFZorKyMIlg+IP0Yjys=",
  },
  "Or click to download the new version manually.": {
    val: "Or click to download the new version manually.",
    translated: false,
    h: "J+hkW+8xOyf72R6IgkvGlwWYNzHN+/aWRtotPks3C5U=",
  },
  "Out": {
    val: "Out",
    translated: false,
    h: "v4Oj0CQx7cmHP4mcJsZX4xMTzMzeFS81XA9gU3qOFKU=",
  },
  "Passwords did not match": {
    val: "Le password non corrispondono",
    translated: true,
    h: "PyUeXNOVYhNDM/De1HIPLeiwy6d+x7bkZphOo5ZqR6Q=",
  },
  "Paste": {
    val: "Incolla",
    translated: true,
    h: "n2Hnio0AcQPZejqQ+hm35GthBg0zYDNoxd8RCFRUhu4=",
  },
  "Paste and Match Style": {
    val: "Paste and Match Style",
    translated: false,
    h: "w8hRIxBBNWtXNPcYtQ4t/mTHfPF66U/mJbVpOiIDgYE=",
  },
  "Paused": {
    val: "Paused",
    translated: false,
    h: "sMAADusAjpKEUapa7bSzeAnEAbEGpH+NKBgGh068Ifw=",
  },
  "Permanently delete account": {
    val: "Cancella account permanentemente",
    translated: true,
    h: "fcpAc/TcJr/ayfOjnYZmGo2BIga/mx8UyuwCbh2BRFg=",
  },
  "Personal Loan Payment": {
    val: "Personal Loan Payment",
    translated: false,
    h: "cL5KAz7DWc3XTzI4eo3t1PaGUe16WM+dKBg2ykfpQ6A=",
  },
  "Phone": {
    val: "Telefono",
    translated: true,
    h: "9WrpirmkhUIuWq47S+FrVpJP+prT4uInaMOfMHjxS8c=",
  },
  "Playing": {
    val: "Playing",
    translated: false,
    h: "69elN/r6NyshRWtcjLOKso9OmdOJhvg/ix+Xy/fE+Z0=",
  },
  "Possible Duplicates": {
    val: "Possibili Duplicati",
    translated: true,
    h: "ofGzHt7c7jfCo867EwNvCl3vCUJPLeLhFiC5Fmgrgp4=",
  },
  "Posted": {
    val: "Posted",
    translated: false,
    h: "h6jjM8ytGdEj+QfDnTVzEdq+0oLSE9zd+MArY7gtjzU=",
  },
  "Preferences": {
    val: "Preferenze",
    translated: true,
    h: "g621xQsjA9sSCp1y6ZMsd3RolFp3OMEblL/gPz1k0v8=",
  },
  "Preferences...": {
    val: "Preferenze...",
    translated: true,
    h: "6iQxyJ1WC9/Z0f0saApfwL5hmhgN5YgJeikLAYqCGBI=",
  },
  "Preparation": {
    val: "Preparation",
    translated: false,
    h: "hAU2jJdFn2hdOUvG6S3yousGGeHnblb2/CsaRHWvQwQ=",
  },
  "Prompt": {
    val: "Prompt",
    translated: false,
    h: "56HrS6R0zfyg5ruiVb/J04UP3T8O2V99V+mXHvVfEZ0=",
  },
  "Provide a name for the new account.": {
    val: "Fornisci un nome per il nuovo account.",
    translated: true,
    h: "WFHwJzRVIraGkeqDS03YjWe0vMsPsiRE1qM6V/Ef/xE=",
  },
  "Purchase": {
    val: "Purchase",
    translated: false,
    h: "SfwhUMXO5ckJhwUkBjdC9n17k8zH4+hoAlFoUdOwE/g=",
  },
  "Purchase Full Version...": {
    val: "Compra Versione Completa...",
    translated: true,
    h: "+6h2Y0QTHEVui0aUhwAlCsyJp/F+S0PYKMRlQysqjrk=",
  },
  "Quit Buckets": {
    val: "Esci da Buckets",
    translated: true,
    h: "QILEHXgAk6vuNPV3rqkbn2QRZ8WKrPnAZnscp7n8WaM=",
  },
  "Rain": {
    val: "Rain",
    translated: false,
    h: "fqeHyOaOYnCtGAcJlJbhAR37DG6YMrsasUNtiL6z8hc=",
  },
  "Rain left": {
    val: "Rain left",
    translated: false,
    h: "+xrBpD9ex3fqQgh+YuNxsFxWyrbE8G1236f81k2whuY=",
  },
  "Rainfall this month:": {
    val: "Rainfall this month:",
    translated: false,
    h: "S6dFwRYAFyRMUh4i6My2aNacGwMh8taa7neVTx9aiAM=",
  },
  "Recently used": {
    /* Label for list of recently used buckets files */
    val: "Recently used",
    translated: false,
    h: "tJ5cBjszrV/JztG5V1FUrgo0bfVgXfK5KB495TvGsYs=",
  },
  "Record change as transaction": {
    val: "Record change as transaction",
    translated: false,
    h: "yK0UuSf6pOl+44YBzW+tFNPHt6YYpqe88f+wQCuaHcQ=",
  },
  "Recording": {
    val: "Recording",
    translated: false,
    h: "s1hytW8ZlaU8eRtoTfV+4aCpW5biiyifheE3t0kouUo=",
  },
  "Recurring Expenses": {
    val: "Recurring Expenses",
    translated: false,
    h: "yDp5Agru+QzDSy583s3kjOdZbbe6X1WDfMeSNXsYlaY=",
  },
  "Redo": {
    val: "Redo",
    translated: false,
    h: "7buMF65dyGtKDY/ZW/Lkn7eUmdudCsdGV3KR2lYLLA0=",
  },
  "Reload": {
    val: "Reload",
    translated: false,
    h: "hUVVd3tppLGqwgo2OeC3h334aTF0Y+/GHbuL/I1clYk=",
  },
  "Remove Categorization": {
    val: "Remove Categorization",
    translated: false,
    h: "b5sIQMfXAnBAqHD2NJfIgIAxclRGe5LJ7NzzF6sOruQ=",
  },
  "Rent/Mortgage": {
    val: "Affitto/Mutuo",
    translated: true,
    h: "sCLO0xIawRUzVC3QV8aqowoCCfwYNvtXW848jCLfT10=",
  },
  "Reopen": {
    val: "Reopen",
    translated: false,
    h: "5497b4yxPFO2M524tL0qmmNk47Qv/aca/7n0zMEeX/o=",
  },
  "Reopen Account": {
    val: "Reopen Account",
    translated: false,
    h: "KBv9ohpTpLSanhr/AFbKdJCA0VZ1iJ0THB53Hut00v4=",
  },
  "Report Bug": {
    val: "Report Bug",
    translated: false,
    h: "RxuE9Dh0Dadda2PtjUPD0dQ7b8aQok84Ytvw31ABBRU=",
  },
  "Report Bug...": {
    val: "Report Bug...",
    translated: false,
    h: "i17nG0QruMiCn612ogDToWB1g4xqqei691Yeh/t8MIk=",
  },
  "Report Translation Error...": {
    val: "Report Translation Error...",
    translated: false,
    h: "/jSK7LcBLJ1FsOYb9ntsVYAxwAyGLLUZXlTL/zrC020=",
  },
  "Request an Amazon Items report": {
    val: "Request an Amazon Items report",
    translated: false,
    h: "P4rrDh5nDkcbT6+2mP6w2/DdQS+Hlhu7u/AEo7usOGc=",
  },
  "Request an Amazon Orders report": {
    val: "Request an Amazon Orders report",
    translated: false,
    h: "c+Qi3RJelGSlC9MybLul6oqMPosN10WOFW6k+roCtxk=",
  },
  "Required deposit:": {
    val: "Required deposit:",
    translated: false,
    h: "Q34JZduUI2Lx8xxjkeH/Md92nqWgEcbPFZjgf5m7tXA=",
  },
  "Restart Buckets": {
    val: "Restart Buckets",
    translated: false,
    h: "TNcYWk7YxhZ0U9Q+mFMRedeWB36VsDXoYgBapDvZCgM=",
  },
  "Restart Buckets for changes to take effect.": {
    val: "Restart Buckets for changes to take effect.",
    translated: false,
    h: "WDqnfUftItQB8zteFdZrFOknNYODkXCwU89Lk/Hs/SQ=",
  },
  "Save": {
    val: "Salva",
    translated: true,
    h: "wduD0WXtkIpIb6B4R8AA7ph724u3/Gtv27uaky6rEAU=",
  },
  "Screenshots:": {
    val: "Screenshot:",
    translated: true,
    h: "Vl/m/PU/CoPSp/t+drAAfxlQ818VKjlWKN8fsB4/+V4=",
  },
  "Search": {
    val: "Cerca",
    translated: true,
    h: "vembE+Cp1aKCKR2j2LCJD29QyiQxfGPUcGI1I8l5/5Y=",
  },
  "Search:": {
    val: "Cerca:",
    translated: true,
    h: "OHBHBOVnuMjmjWHZURDrna8FWv+geQYMQuobRo4tkq0=",
  },
  "Searching...": {
    val: "Ricerca...",
    translated: true,
    h: "7gAp07Zv3EjrgHoWJ04wEdRefy/aQ0zT8Y2EgQrnbHo=",
  },
  "Select All": {
    val: "Seleziona Tutto",
    translated: false,
    h: "tLJuQPindRFUyvGGdMLJbBHcVpAODsfT5p2gDnpB/Oo=",
  },
  "Select the account these transactions belong to.": {
    val: "Seleziona l'account relativo a queste transazioni.",
    translated: true,
    h: "qkaCMMw9CYakrPrLxgfkBp3KsfadBdGLYgZB8urPaC4=",
  },
  "Self debt": {
    val: "Self debt",
    translated: false,
    h: "zRWPLHqBTGcGqHHBHWdXpN2eOUUhRhvCyeAccFlR9Z4=",
  },
  "Send Report": {
    val: "Send Report",
    translated: false,
    h: "aLgG0qubuw0p0tGIUYKjgxecVsL0e3AKvQ5+W2JZg18=",
  },
  "Services": {
    val: "Servizi",
    translated: false,
    h: "Y5+GuNZXfFSynDsHvAY8cr0RqU+moaHZNmOk2eQrsNs=",
  },
  "Set mapping": {
    val: "Imposta mappatura",
    translated: true,
    h: "0GImzkG1VPzFzjFdepzZz8+Ysis4xn7QQRVGlxVrQIw=",
  },
  "Settings": {
    val: "Settings",
    translated: false,
    h: "g5CfgkRu6cPoKgSs58kE8baksjDRuXC1WTLWKVn75z0=",
  },
  "Show All": {
    val: "Mostra Tutto",
    translated: true,
    h: "Kng6HqlojyhuqEK6kaB3KPtAs1w0LcpFWkJYrscali0=",
  },
  "Show Log Files...": {
    val: "Show Log Files...",
    translated: false,
    h: "In00T9z1A4xO6nLu8zAU5s3UzH3+IcK4XjRvrT9CGMs=",
  },
  "Show uncategorized": {
    val: "Mostra non categorizzati",
    translated: true,
    h: "ZHhB69+qL72sD+upbAXLXIDMlEWXgSbwb5RupMV5K0c=",
  },
  "Sign": {
    /* Noun referring to the sign of a number (positive or negative) */
    val: "Segno",
    translated: true,
    h: "uw6BT7o9vlsgV2TpwBFx/MfF1npvA+6ru4lXXcSzoCM=",
  },
  "SimpleFIN Connections": {
    val: "SimpleFIN Connections",
    translated: false,
    h: "yzXdwvSSNy+FUFHW5+bAqRMq+j6krsNUFb/uFreKPNY=",
  },
  "Skip This Version": {
    val: "Skip This Version",
    translated: false,
    h: "YnC7GSI4QITirt1GGV/Tc1FvTbJYICkEeF3zj4u4eak=",
  },
  "Speech": {
    val: "Speech",
    translated: false,
    h: "i4Qm95bH8zVEbjpkUi7jvQiLtDzGkW9z90XEkiglzHM=",
  },
  "Spending Money": {
    val: "Spending Money",
    translated: false,
    h: "7mLvCPVxhYqWXYW8EcSN4N6vyUtQqT4PnR0iC1ucTtY=",
  },
  "Start Over": {
    val: "Ricomincia",
    translated: false,
    h: "hlKNxy6ZDz4ny/qpQfkv6FwXDangtq2ECEo+ICgEbJs=",
  },
  "Start Speaking": {
    val: "Start Speaking",
    translated: false,
    h: "v8sFOpEAoczjEjGparKZylHWHoxHMVQriwuhJaec2rY=",
  },
  "Start with a template": {
    val: "Inizia con un modello",
    translated: true,
    h: "HbSWD1rCMlssQIfvhdN+qwtdXT/k2Rq4+lTObtGpWbo=",
  },
  "Step took too long": {
    val: "Step took too long",
    translated: false,
    h: "Py3rsk0guEg0d8Ce9Lbfwzf1zP7E4Z8YPSOu165mOc0=",
  },
  "Stop Speaking": {
    val: "Stop Speaking",
    translated: false,
    h: "Pme2/qME7bKdVrHTIEBQYt1Fu/SXRNGyy6sLBfKpqqk=",
  },
  "Student Loan Payment": {
    val: "Student Loan Payment",
    translated: false,
    h: "j83e9PkiJgq0J5iPOaku/mbjw9H3KtXBaDV4ntsQktk=",
  },
  "Submit": {
    val: "Invia",
    translated: true,
    h: "/plzMiu0xhKwtFcT4VqbJMoCd2dB03dB9EJhijEA284=",
  },
  "Submit feedback": {
    val: "Invia feedback",
    translated: true,
    h: "ksa09D0YEXUycx+K+ZODvbWRCP78R2W7ClHhOaX4LmM=",
  },
  "Success!": {
    val: "Successo!",
    translated: true,
    h: "6NxF/uD6sOEPkEbPFOHdBKRxj0ZXVbmnPkRXNJDy0zs=",
  },
  "Successfully imported Amazon Items report": {
    val: "Successfully imported Amazon Items report",
    translated: false,
    h: "zcIlaWv/ZpEjOL5xQHbD/Q8+nNhqDbq4oJsVr0hLKcI=",
  },
  "Successfully imported Amazon Orders report": {
    val: "Successfully imported Amazon Orders report",
    translated: false,
    h: "jD2nczKNctIdPeGX20WLyUGOlIl/MbKqKpP5hCxbtt8=",
  },
  "Successfully imported Amazon Refunds report": {
    val: "Successfully imported Amazon Refunds report",
    translated: false,
    h: "cL1VAhdyv9ML3nJT0QY3lg6QrxkJ/UQf0gbcokIDJGU=",
  },
  "Sync": {
    val: "Sincronizzazione",
    translated: false,
    h: "zJAmFTCwHue7APF8kCb39YCX8J17Tsy3mxyhpQQhge8=",
  },
  "Sync complete": {
    val: "Sincronizzazione completata",
    translated: true,
    h: "e2VXpLTi1mhVSVqDkExwdM5j8PhfW0MHeOqBwabU4Zo=",
  },
  "Sync failed": {
    val: "Sincronizzazione fallita",
    translated: true,
    h: "jBGq60u/Y2WKAulnVvspUq9tLPFtXOnQYczjXXViGA0=",
  },
  "Sync has not yet been set up.": {
    val: "La sincronizzazione non è stata configurata",
    translated: true,
    h: "B5XIfqqMdt0gMHz2zsZr9GTj9vSRAS5R2akgGce+fsg=",
  },
  "Synced balance": {
    val: "Synced balance",
    translated: false,
    h: "yyCVeQRle/vbcZ1/QyVYtL+ZmyQ5WanHCYKZpJqFd6o=",
  },
  "Syncing...": {
    val: "SIncronizzazione in corso...",
    translated: true,
    h: "kuwg7vpvp082IqBtRakekOVu7bqB4PYxhnFVsoBDt/g=",
  },
  "System default": {
    /* Option for Buckets language preference */
    /* Option for timezone auto-detection */
    val: "Impostazioni predefinite di sistema",
    translated: true,
    h: "A9haWZjRR5Su694Q278jjqi/xmRweA6I6et1Q9L3ahI=",
  },
  "Target date:": {
    val: "Target date:",
    translated: false,
    h: "InmNQoNHlJkDpjvEB+J1XPqDWRqnfNIUwTQ86iNiOGc=",
  },
  "Test Toast": {
    val: "Test Toast",
    translated: false,
    h: "5SbiliirLaAKLdgRThX+cO2RwGuC87t3Z1O0xT2WsAE=",
  },
  "Thank you for the feedback!": {
    val: "Grazie per il feedback!",
    translated: true,
    h: "8bEPNAScct0pvqY775nF665zylB3/fKo1h3MqoWzXIQ=",
  },
  "There has been an error.": {
    val: "C'è stato un errore.",
    translated: true,
    h: "viN5uLRSpgzhvoD9KO9g1cr7ihLQ0Men9LiUpy9RcwE=",
  },
  "There was an error.  Maybe try again?": {
    val: "C'è stato un errore. Vuoi provare di nuovo?",
    translated: true,
    h: "l+W2GSV3tl8Gx19ZW+wOCziBj5/UeMCVO8tvh4P7LEo=",
  },
  "This is a special group for all the buckets without a group.": {
    val: "This is a special group for all the buckets without a group.",
    translated: false,
    h: "QP5fEqFwlvHWJyjzrIWUJFlMvhFDxxSsl1vnej/p30I=",
  },
  "This tool will delete data to make it easy to start over with your budget.": {
    val: "Questo strumento cancellerà i dati per permetterti di ricominciare facilmente con il tuo budget.",
    translated: true,
    h: "+40oxGj2jDLNe4ggunYHsgL/9aQz0pw5IeRM5VlYIIU=",
  },
  "Timezone": {
    /* Label for timezone selection preference */
    val: "Fuso orario",
    translated: true,
    h: "y2odAzUKexep7CmO6P8BCj1p4PWG6VZ/RbIg8oOWASI=",
  },
  "To": {
    val: "A",
    translated: true,
    h: "syFKIORaeu0FezL85oAbo76XXa8k7bxITMbNowi8ba0=",
  },
  "Toggle Developer Tools": {
    val: "Toggle Developer Tools",
    translated: false,
    h: "IYSSUL9ezB58nRuajYVa+zH4ucrmXQOB92zA7sDlrJc=",
  },
  "Toggle Full Screen": {
    val: "Toggle Full Screen",
    translated: false,
    h: "2ZRq+R5E0Cp4QI+y5jCefU1IOiYvNWLrN/iiJq6hGr8=",
  },
  "Tools": {
    val: "Strumenti",
    translated: true,
    h: "mPsch0seV0ZNaU+41My/wS+DkAGfYqzWpPlJpfT1sBs=",
  },
  "Tot:": {
    val: "Tot:",
    translated: false,
    h: "saHMHdDjhEhiq86BBPRvnL+Rb3M/qOu30ZLtUk20QIM=",
  },
  "Total amount your buckets expect each month.": {
    val: "Total amount your buckets expect each month.",
    translated: false,
    h: "UtK2gxh+N9D/p1G6dLyhcKMP5Df5XCyEp0jM0c+qoUw=",
  },
  "Transaction": {
    val: "Transazione",
    translated: true,
    h: "G0gRZS6Zq1VoQqtY+L8fY3ogdqSl/OAoTurOZ4L480Q=",
  },
  "Transactions": {
    val: "Transazioni",
    translated: true,
    h: "4+yGUer/b71cfxTdeUa5QbonqN9ezC8Eii7KO22Ety0=",
  },
  "Transactions to review": {
    val: "Transazioni da controllare",
    translated: true,
    h: "fcauVC7MkwNPXVHbfBl427k53jL2beDDx711UkVI5tg=",
  },
  "Transfer": {
    val: "Trasferimento",
    translated: true,
    h: "B5GGqjnE8KOjYJjhsFV7zs5TGmGmVPqjihzMVxHJ3sI=",
  },
  "Trial Version": {
    val: "Trial Version",
    translated: false,
    h: "GtZIXrHILA84HlpKlxi3BErHwR7WIYkQ/e5BE0Fiaxg=",
  },
  "Tuition": {
    val: "Tasse Universitarie",
    translated: true,
    h: "UpDg7j7/mXJnP7WdFJe4hMlLw2XtH7X3Cj669aLHzec=",
  },
  "Un-kick": {
    val: "Un-kick",
    translated: false,
    h: "P5Z1ij4jmS06jNOQiHymi+/D+uYJktoalTdw+AHGukM=",
  },
  "Un-kick Bucket": {
    val: "Un-kick Bucket",
    translated: false,
    h: "7WOQPepkeOH+dwwSbEjomy0amoqY5JtvtlyCSG02c1Q=",
  },
  "Unable to claim access token": {
    val: "Unable to claim access token",
    translated: false,
    h: "Gao95RuT9JvhdAoZ5winV9os7iMaPIex3Vq9CMSjhzs=",
  },
  "Unable to open the file:": {
    val: "Unable to open the file:",
    translated: false,
    h: "MxbgnQR4Cyi549ltzzIDDAI1qRGqoeRm0zOApQMS2DY=",
  },
  "Undo": {
    val: "Undo",
    translated: false,
    h: "Z1A2vTdYwfdLsWS25iSchnHOHa1VfbQg7u8MDGHk4yo=",
  },
  "Unexpected sync error": {
    val: "Unexpected sync error",
    translated: false,
    h: "78kYsQMTfGS8BNaZVuqYaRojJlTpcmN6CF9PQKKO0ME=",
  },
  "Unique ID": {
    val: "Unique ID",
    translated: false,
    h: "UZsJmQ28mtEO349l3zdNHoAtb0JT1LT9e7EjedqptSE=",
  },
  "Unknown account: ": {
    val: "Account sconosciuto: ",
    translated: true,
    h: "1pPv2ePlW/PBrqgYgGCM3lU9qnmnbplR3AzSDDG4TLs=",
  },
  "Unknown category": {
    val: "Categoria sconosciuta",
    translated: true,
    h: "bK4teMnFOuofJ4sX76ozAla50yDaLbvb5pCj+New5f4=",
  },
  "Unlinked Accounts": {
    val: "Account Scollegati",
    translated: true,
    h: "BPAjsiEkATiwSf9f6kde3yZwSmmyiPDLiZ7Rr+3Zv/A=",
  },
  "Unregistered Version": {
    val: "Versione non Eegistrata",
    translated: true,
    h: "x9ekMClqI57T6jREU5VJurBCzlD+hBNJ8pHNQ0zMB1U=",
  },
  "Update Account Balance": {
    val: "Aggiorna Bilancio Account",
    translated: true,
    h: "iwKjdHzqHPwoupXiUwrVL1tX4QfO//taXOPXFVtWRVE=",
  },
  "Update Account Name": {
    val: "Aggiorna Nome Account",
    translated: true,
    h: "xcyLhnHNOTDgJsYGhaelbAmXYam4HWMfD5mQiTiZJ50=",
  },
  "Update Available": {
    val: "Aggiornamento Disponibile",
    translated: true,
    h: "FKOD6i3t69T8rvTwVJ5VSnLfkQPBcceuuk2X4ZsNKMY=",
  },
  "Update Bucket Name": {
    val: "Update Bucket Name",
    translated: false,
    h: "Oa+1EZtc4RTtPYyk5LflMMlQq/esZ3qvTgbSLiKIl4E=",
  },
  "Update Bucket Type": {
    val: "Update Bucket Type",
    translated: false,
    h: "wt5F9WSIpGlUsGaPnhSJlLYk0qraymNHDw0bYzbHlIE=",
  },
  "Update Color": {
    val: "Aggiorna Colore",
    translated: true,
    h: "6QBa9YrDFsWCiiS/PMj7r+cTmIgMmmqjTnv9x4l90ic=",
  },
  "Update Goal": {
    val: "Aggiorna Obiettivo",
    translated: true,
    h: "S3dt9ahT1yTXTCP2uHqiTMkyPUmAvAHvsCeGNa+NL1E=",
  },
  "Update Group Name": {
    val: "Aggiorna Nome Gruppo",
    translated: true,
    h: "/pmHZLX1mkRHtus8eVyojidhAUe6BocaSkf5dGoIrSM=",
  },
  "Update Macro Name": {
    val: "Aggiorna Nome Macro",
    translated: true,
    h: "61srDLhVLo6bOo+SbnJ0rMbhNhXXRxEjgP3/nFafMKI=",
  },
  "Update Monthly Deposit": {
    val: "Aggiorna Deposito Mensile",
    translated: true,
    h: "rFQ5lKjSNpQyyptg2Y+a4LQ6jwa1xWjKarMapXiD1/8=",
  },
  "Update Name": {
    val: "Aggiorna Nome",
    translated: true,
    h: "fTqm8NUcvzaYHnGFDmVhLePEd/TFNPhUDzSYIIerjNc=",
  },
  "Update Note": {
    val: "Aggiorna Nota",
    translated: true,
    h: "h4A+jnQW9OrS0wVVoQ9OEJ5I6/h4p7IWrKvN+uSXe4I=",
  },
  "Update Target Date": {
    val: "Update Target Date",
    translated: false,
    h: "SEac1rQopyHALPSWU85qYV3GE0x9i2OGDB+JYnVID8A=",
  },
  "Update Transaction": {
    val: "Aggiorna Transazione",
    translated: true,
    h: "aMF18BJOMjuVOInpbGKf/3jyTE1qYzq4oHzb3sBVcWw=",
  },
  "Update account balance": {
    val: "Aggiorna bilancio account",
    translated: true,
    h: "GQWvUamqQOyoaXm16AiGtHme6kW171erNK5pa4vgDIE=",
  },
  "Update balance": {
    val: "Aggiorna bilancio",
    translated: true,
    h: "XSg0Q5Q7j+G+HNjn3YJOakbNLSjTNcem3BFbw6fTDI8=",
  },
  "Update balance without a transaction": {
    val: "Aggiorna bilancio senza una transazione",
    translated: true,
    h: "thUs8btJm84m3sFUOg0QZBXmDfqGOrDhsYqwJ31BIAo=",
  },
  "Update downloaded.": {
    val: "Aggiornamento scaricato.",
    translated: true,
    h: "DO2vE3TgW3xjiD8ZaOWeScL3qWCyiFPK8GENQ9NosYw=",
  },
  "Used in future": {
    val: "Used in future",
    translated: false,
    h: "O0zGsqv23d44/pWJqCSt+qkDtG/nBrBI2W0aRA9XoDw=",
  },
  "Vacation ": {
    val: "Vacanze ",
    translated: true,
    h: "Buf8KjuQKnfaA4c2qPDVm8FQgYWJUfiCYYkPAnsIIBw=",
  },
  "View": {
    val: "View",
    translated: false,
    h: "paIseOhKCT2+NaUBPKk98vQB/lphf7jIGeERV77doDg=",
  },
  "Want": {
    val: "Want",
    translated: false,
    h: "lV/eDqkplJ/XKjHyCSE47yOWOl3t3Igj9S559wDKMZI=",
  },
  "Wants": {
    val: "Wants",
    translated: false,
    h: "AOckwUko9CT2K8gxtu/GHFhjivPPgTDgQSjCNSujUV4=",
  },
  "Warning: Doing this will use rain you don't have and could steal rain from future months (if available).": {
    val: "Attenzione: Questo utilizzerà pioggia che non hai e potrebbe rubare la pioggia dei prossimi mesi (se disponibile).",
    translated: true,
    h: "YR+S0SMnFz4+K5vpXrMzMfSaBE5mHBrhQTalzgI0/7U=",
  },
  "Water": {
    val: "Acqua",
    translated: true,
    h: "BOL+IhrDsm6ooEqGpFPieQoyXrWpV6LvKh0DvkAJ2bw=",
  },
  "When \"On\" this macro will be run during a normal sync.": {
    val: "When \"On\" this macro will be run during a normal sync.",
    translated: false,
    h: "HnJ7qVSPXxIg3/lygw1Ln/VvBMBs8roJwXlCpP2KnMw=",
  },
  "Window": {
    val: "Finestra",
    translated: true,
    h: "qjw17TPhgeX5msjicdTljyCEeBLFbQvz/oyOunMLJnQ=",
  },
  "Year to Year": {
    val: "Anno per Anno",
    translated: true,
    h: "YBGCdB/QACmMM/QS2qMrGlC8qtfWz9bhue7sgDaIRHg=",
  },
  "Year's Supply": {
    val: "Year's Supply",
    translated: false,
    h: "E5VfnhjiYed/e2Ezg+RdChSIz6cjwl9oyRzpO1rjl0I=",
  },
  "Years": {
    val: "Anni",
    translated: true,
    h: "9bCZk+mcGxconx1JMhBZKdnRo4id89h4UiucsvMRAng=",
  },
  "You are running the latest version!": {
    val: "Stai usando l'ultima versione!",
    translated: true,
    h: "hShy87A6GAhRqqtK+8VdVeGD70zA64iiV0/SwectQ0I=",
  },
  "You don't have any recurring expense buckets yet.": {
    val: "You don't have any recurring expense buckets yet.",
    translated: false,
    h: "nq2IDCqs8m0MQJ5lO2TU1cnlj9nP1vwIMWMqi0WGOjk=",
  },
  "You have no closed accounts.": {
    val: "Non hai nessun account chiuso.",
    translated: true,
    h: "8BZG+UdW1Rrd/+2zFNv7SskiNpD6DtlNa8LwQulqX5s=",
  },
  "You haven't kicked the bucket yet...": {
    val: "You haven't kicked the bucket yet...",
    translated: false,
    h: "mtaAsLJ7BgWZcbIkRmZ4ZPSSRGXj6vJ2H8+diLhIba4=",
  },
  "You must backup to a different file.": {
    val: "You must backup to a different file.",
    translated: false,
    h: "LAt5pxdaPsRHDU6bS2Cu1aEDIQ2oZAMw46Pa7H6pc5o=",
  },
  "You must have at least one column each set to Amount, Memo and Date Posted.": {
    val: "You must have at least one column each set to Amount, Memo and Date Posted.",
    translated: false,
    h: "k5NuGeKNgPfZs7xUbwp5PgfPr6dosV0ZTVxAnphHH6E=",
  },
  "Your email address:": {
    val: "Il tuo indirizzo email:",
    translated: true,
    h: "/ip+dZCEKXdLQFW5CAt/fB8OBf/rD+67pz8etOXlJXc=",
  },
  "Zoom": {
    val: "Zoom",
    translated: false,
    h: "Zjzswxbrkbj1TLPOYCtimoyh/aJlkF/mxeghbzdheSs=",
  },
  "Zoom In": {
    val: "Zoom In",
    translated: false,
    h: "p3yHl1qkGVfRDPsLKitBuZhRJIDaTy3fV/vbWqOzo24=",
  },
  "Zoom Out": {
    val: "Zoom Out",
    translated: false,
    h: "hRo1uzcSNStVll7ef2xHOB6PqFh+q7Sg/VHiGcK4M8M=",
  },
  "account-bal-diff-1": {
    val: "The running balance does not match the last synced balance for one of these reasons:",
    translated: false,
    h: "9KaivrLeSKn8ROgvad6S9iE9NAz0BZRwQh3/ufRahVA=",
  },
  "account-bal-diff-fix-1": {
    val: "The bank has reported a future balance.  To fix this, wait until all transactions have arrived in Buckets.",
    translated: false,
    h: "CRYYgg8YHspvP5KI3HGvyzlrOhxZf4rrjjUQbmL6Z7Q=",
  },
  "account-bal-diff-fix-2": {
    val: "Transactions are missing from Buckets.",
    translated: false,
    h: "CeKVWaErT3a5EvPpQb/Av2kHD7RtudYjlQntfcMMtS8=",
  },
  "accounts.balance_mismatch_msg": {
    val: "The most recent synced balance does not match the balance computed from transactions.  Click ... for more information.",
    translated: false,
    h: "8xHas2SyXqC7roWhYQNIVhFVNvbvzMi6Y3mQce5sIbc=",
  },
  "accounts.name_placeholder": {
    val: "no name",
    translated: false,
    h: "UwMHboI9q49SZQkwMN8ps9zBi6YOSdtwakjLJwudtyA=",
  },
  "action.New bucket": {
    val: "New bucket",
    translated: false,
    h: "aIKjDQtVbUMjIHU/6fccfiWBUIwUBnAofdzRJTCuytI=",
  },
  "action.New group": {
    val: "New group",
    translated: false,
    h: "054RU7JImk6Pavh27xHA9CgGIgjmP0dYIgXez2UWx34=",
  },
  "action.ignore": {
    val: "Ignore",
    translated: false,
    h: "K8sAh2XND1/tJOuX9xTLmr1fQjUOB70cfc9GwI62fEs=",
  },
  "action.link-account": {
    val: "Link",
    translated: false,
    h: "unfAYQpjuyuTjjRCodr+S+jNjRmz3nahjZ91u/j5HfE=",
  },
  "action.report bug": {
    val: "Report Bug",
    translated: false,
    h: "RxuE9Dh0Dadda2PtjUPD0dQ7b8aQok84Ytvw31ABBRU=",
  },
  "bucket.detailslabel": {
    val: "Details",
    translated: false,
    h: "68e/QPEuI36iIEcTWmKDrVU9KBReQ3EjFzF1F06KQMA=",
  },
  "bucket.transfer.help": {
    val: "Un trasferimento è una transazione da un secchiello a un altro. Se la transazione non è nè un introito nè una spesa, probabilmente è un trasferimento.",
    translated: true,
    h: "dh5nslkaB1wNR4tJ5zAn6Hms+9oJqBDmAIR5k6WE6iY=",
  },
  "bucketactivity.help": {
    val: "This is the sum of money taken out of this bucket and transfers in from other buckets this month.",
    translated: false,
    h: "//A1247jGgumC/yiUDcTLEsXMcwseMWOiaZOpsiMCu0=",
  },
  "buckethead.in": {
    val: "Somma di denaro aggiunta questo mese.",
    translated: true,
    h: "VaDlj3R8L2TD4QFh1rotfK5RjV7WF91mP3iqVAvdppc=",
  },
  "bucketinout.help": {
    val: "Utilizza questo strumento per aggiungere o togliere denaro da ogni secchiello.",
    translated: true,
    h: "FVxtuv3HRHdU7Snx+P3YYxcSngOkrcKyS5mng6AB8gE=",
  },
  "bucketrain.help": {
    val: "Questo indica quanto denaro vogliono ogni mese questi secchielli. Il piccolo quadratino indica quanto ne hanno ricevuto.",
    translated: true,
    h: "3dbOFkUiGaEoD01CP7kIWDQHgUbULWexjdEKdEAF3sA=",
  },
  "buckettype.deposit": {
    val: "Spesa ricorrente",
    translated: true,
    h: "3HXotB9ZHFm14ArdM0RfCT0merw8+KuXthbzotnPRec=",
  },
  "buckettype.deposit-date": {
    val: "Save Z/mo until Y date",
    translated: false,
    h: "zdWdEX9eN5qpFDboBF+wi9EIguwYsB9nQCzN9GjrxMc=",
  },
  "buckettype.goal-date": {
    val: "Save X by Y date",
    translated: false,
    h: "+boZHIer4ggkvJ8A5cSl1EVyWRwKigC9UkBFn4WSEdg=",
  },
  "buckettype.goal-deposit": {
    val: "Save X by depositing Z/mo",
    translated: false,
    h: "BUzPSZsbi+lN/3tb6eF63oa7CEzS94r6ee5jf5G7inA=",
  },
  "buckettype.plain": {
    val: "Secchiello vecchio stile",
    translated: true,
    h: "AqvTaZK8lidyI8PZ9JXBBQABazz8uxM+uQM6iEuyO6w=",
  },
  "budget-file-type-name": {
    val: "Buckets Budget",
    translated: false,
    h: "g2jeytcuhPOlEo6R2OlTzT3vNdE7sVWGnXuffEioq4c=",
  },
  "daterange.all": {
    val: "All time",
    translated: false,
    h: "Fz1lBhxlewLJ5bSKTiIzzaW3CAtAPxkUWWKU0BVqgAA=",
  },
  "daterange.from2monthsago": {
    val: "From 2 months ago",
    translated: false,
    h: "zb4vtJXSL+UcXZTjSbkQueS8khVvJO2MDoFKKPuuDPM=",
  },
  "daterange.from3monthsago": {
    val: "From 3 months ago",
    translated: false,
    h: "4957XI6fjMtXcCqj3IRSUSQzX4ZlEucDTuwgu2krTLw=",
  },
  "daterange.fromlastmonth": {
    val: "From last month",
    translated: false,
    h: "tIBgx9VgMgV21a9XhH7L7TIe/PfdgcW3fdfGaGOeVMo=",
  },
  "daterange.thismonth": {
    val: "This month",
    translated: false,
    h: "jqSPxB9W3Xqmvb/7MIrwKgcCTUR0zgU3qqTqJFET1e0=",
  },
  "default account name": {
    val: "Savings",
    translated: false,
    h: "zCYN8vtLT3Hhb9CbDDSL2xOOjqhzmmhMa5yWDTR7bCE=",
  },
  "default new bucket name": {
    val: "New Bucket",
    translated: false,
    h: "FchHrB6weykpHiqRVxc5QKb6BEdhH4DXrc+t6RNcF8M=",
  },
  "default new group name": {
    val: "New Group",
    translated: false,
    h: "1dmXA/VlW+tjhojOGcypAy70L2wupHf9EdVjUByvpmA=",
  },
  "edit.mapping": {
    val: (onClick) => {
          return <span>Or <a href="#" onClick={onClick}>edit the mapping.</a></span>
        },
    translated: false,
    h: "hFYUKKIqC+nYQ+RRKwNu3/PGxbtuHzNHoigSJwCK8d4=",
  },
  "enter-license-prompt": {
    val: "\n      Please enter your Buckets License below.  Don&apos;t have a license?  <a href=\"#\" id=\"clicktobuy\">Click here to purchase one.</a>\n    ",
    translated: false,
    h: "bQ5kF1mLhFNyrJzVhTf5Cz5lxO8mRww7nwMpeCy9HC8=",
  },
  "error-detail": {
    val: "If this error keeps happening or doesn't make sense, please report a bug or chat with us.",
    translated: false,
    h: "10Kk29tlHpBnhcTf7RRMfq1OZPGZgvPPguRlInaLNoY=",
  },
  "export.why": {
    val: "Perhaps what you're doing with exported data could be built into Buckets.  Mind sending a note?",
    translated: false,
    h: "mv9GxRVjWShYHYo8kb/wvNU8eEYBGE2QtfUTxTsdP0I=",
  },
  "getting-started-link": {
    val: (clickhandler) => {
          return <span>First time using Buckets?  Check out the <a href="#" onClick={clickhandler}>Getting Started Videos.</a></span>
        },
    translated: false,
    h: "9NGQRvIxlAaOF9i+zWPXMFQubcY+5jtA7Td/lii16aM=",
  },
  "in the bank": {
    val: "in the bank",
    translated: false,
    h: "7gl7ZdgJ3HfhOcQMiU7hVkFpXIR3KFxXtlMhKyE/Irw=",
  },
  "match-count": {
    val: (current_match:number, total_matches:number) => {
        return `${current_match} of ${total_matches}`;
      },
    translated: false,
    h: "gGpkwXhLiDpxY0YOCXAFl6Q8D6sb7BX93TqgFRObOqo=",
  },
  "misc group name": {
    val: "Misc",
    translated: false,
    h: "DPoc7CIbzLHJxuar3WnaidO3Ryy1QtYkCswRzVHtVBg=",
  },
  "money-balance-as-of": {
    val: (amount:JSX.Element, date:JSX.Element) => {
                  return <span>{amount} as of {date}</span>
                },
    translated: false,
    h: "99X4HuXB5SeCrTqn5LuD/S4a6GjUCB6gV1Z1gAZPfKM=",
  },
  "months gain/loss label": {
    val: (gain) => {
                        return gain >= 0 ? "Month's gain" : "Month's loss";
                      },
    translated: false,
    h: "lGcEnJfZJau2h5ohbKNxY1FjL0vJoW3oJOJQwSCt+Kg=",
  },
  "more": {
    val: "more",
    translated: false,
    h: "uiqCMjSdL1TgDZHPNYXLnfN/yZq59+kDR/wKZSAP0hU=",
  },
  "nag-message": {
    val: () => `This is an unregistered trial version, and although the trial is untimed, a license must be purchased for continued use.

Would you like to purchase a license now?`,
    translated: false,
    h: "cugeP6FVXqdiCtOers5rslG0mDD5t/Rfl1ZWslfhD48=",
  },
  "navigatestep": {
    val: (url) => `Go to ${url}`,
    translated: false,
    h: "nI/J4GfYlL6BgRZRSiPFfA5o7ASdx2VVYW6x3vgCuKE=",
  },
  "net-transfers.help": {
    val: "Net transfers are the sum total of all transactions marked as a transfer.  It should be 0.  If it's not, click through to make sure there aren't duplicate transactions or transactions miscategorized as transfers.",
    translated: false,
    h: "2P3jr/VPQ35tlPa/uDMqi1spXO4Rinn76fgfVOegiA8=",
  },
  "noin.income": {
    val: "Income",
    translated: false,
    h: "D2fJbta5d1Z5QYuRC5zzkBHsItZOOgY4FKrFJ64BvRs=",
  },
  "notify-downloaded-file": {
    /* TRANSLATION CHANGED */
    /* 1. Translate "newval: ..." */
    /* 2. Delete the old "val: ..." */
    /* 3. Rename "newval" to "val" */
    newval: filename => `Downloaded file: ${filename}`,
    val: filename => `Downloaded file: ${filename}`,
    translated: false,
    h: "HwxJ2TVx57Qef6bXYySekL/eoBzvIEFUqBxQdxgcyCs=",
  },
  "noun.transfer": {
    val: "Transfer",
    translated: false,
    h: "B5GGqjnE8KOjYJjhsFV7zs5TGmGmVPqjihzMVxHJ3sI=",
  },
  "off": {
    val: "off",
    translated: false,
    h: "nzvsum5LFYOz4ZRB3eTVliJTfZvVSpTSImJ4XkhThNA=",
  },
  "on": {
    val: "on",
    translated: false,
    h: "mQwjhouWWBSxF8+abE3+RUUurcIXHh+YGGXr/ITxByQ=",
  },
  "press Escape to close": {
    val: "press Escape to close",
    translated: false,
    h: "5jKKS3xwogwcB2YptY5sW2/MQ/ikfMbR99l8ViHxmAA=",
  },
  "rain.help.neg": {
    val: (abs_amount:JSX.Element) => {
                                      return <span>
                                      You have put {abs_amount} too much money into buckets.  If all transactions have been categorized this month, remove {abs_amount} from buckets of your choosing.
                                      </span>
                                    },
    translated: false,
    h: "tqXmJxZXqyA0mN/8ugZkpCyspyO7XlPnGlEYGWgQ7jk=",
  },
  "rain.help.pos": {
    val: (abs_amount:JSX.Element) => {
                                      return <span>
                                      You have {abs_amount} left to put into buckets.
                                      </span>
                                    },
    translated: false,
    h: "boezbSGkVm3dnfFvodJOAeCgAEMIQN9L+8TwEHLpU/o=",
  },
  "simplefin-connect-intro": {
    val: "To connect, do the following:",
    translated: false,
    h: "421gz/BziKZhsIy2YKRFNtwoqPcbQ7uhFZWWfd6ReBg=",
  },
  "simplefin-get-token": {
    val: (mklink) => {
              return <span>Get a SimpleFIN Token from the {mklink('SimpleFIN Bridge')}</span>
            },
    translated: false,
    h: "VEeKjngcHxowWbB2xWy5oNH4MXIfJQ7EqpiomT6V0fg=",
  },
  "simplefin-paste": {
    val: "Then paste your SimpleFIN Token here:",
    translated: false,
    h: "vAoRsY20OBqs8bleaXD3auq8VnO9gQj7gXz5p+p71EI=",
  },
  "single-account Closed": {
    val: "Closed",
    translated: false,
    h: "8pZrnvzAUQTJhDN/XX31DLvx0wIs1Ww3fV6pktEKEHs=",
  },
  "single-bucket Kicked": {
    val: "Kicked",
    translated: false,
    h: "cWApfoLlcBvoHizIFtrDQq3uwrZIYMXKO1iLMvv8szI=",
  },
  "some day...": {
    val: "some day...",
    translated: false,
    h: "4K+3SY48UwcktULX4xiGt6J8Q8Hys3JjUR3t62WI6mo=",
  },
  "sync-symbol help": {
    val: "This symbol means the transaction came from an import/sync",
    translated: false,
    h: "S3tDRls+AJYj6f8jSNSCa1FVyNY+ngn6Db1EQJ3dpLE=",
  },
  "sync.toast.syncing": {
    val: (start:moment.Moment, end:moment.Moment) => {
        return `Syncing transactions from ${start.format('ll')} to ${end.format('ll')}`;
      },
    translated: false,
    h: "f7R9zSdK0q5+lZ8I9QRhiwN5ENKyWFnrmUG6Gltegfs=",
  },
  "toast.updated-trans": {
    val: count => `Updated/created ${count} transactions`,
    translated: false,
    h: "bBKDE3rQIV5P80cYEL6mkLmIvgxjzVHCIf3aFa+KtmU=",
  },
  "transfer-from-account": {
    val: (dropdown:JSX.Element) => {
                return <span>Transfer from {dropdown}</span>
              },
    translated: false,
    h: "VJmIMDZGOdMKwBpoqDUYiVdCFhw1pJ4qCmKiszAECL4=",
  },
  "transfer-to-account": {
    val: (dropdown:JSX.Element) => {
                return <span>Transfer to {dropdown}</span>
              },
    translated: false,
    h: "Bd1IGkjXo2ruWofGrT+WwLdiy8IwJ/PW+7SO4TaDcps=",
  },
  "version-available": {
    val: (newv:string) => `Version ${newv} available.`,
    translated: false,
    h: "YCoofx1v0tRUHkHfhFnm6bV2xXfnsNT6QAyXqgkUa9c=",
  },
}
export const pack:ILangPack<IMessages> = {
  name: 'Italiano',
  dir: 'ltr',
  numbers: 'comma-period',
  messages,
  contributors,
}
