import { ILangPack, IMessages } from './spec';

const messages:IMessages = {

  // src/budget/accounts.tsx line 32
  "accounts.balance_mismatch_msg": "The most recent synced balance does not match the balance computed from transactions.  Click more for more information.", // TO TRANSLATE

  // src/budget/accounts.tsx line 39
  "accounts.name_placeholder": "no name", // TO TRANSLATE

  // src/budget/accounts.tsx line 45
  "accounts.more_link": "más",

  // src/budget/accounts.tsx line 51
  "accounts.Account": "Cuenta",

  // src/mainprocess/menu.ts line 175
  "Trial Version": "Versión de Prueba",

  // src/budget/budget.tsx line 115
  "Accounts": "Cuentas",

  // src/budget/budget.tsx line 116
  "Transactions": "Transacciones",

  // src/budget/budget.tsx line 117
  "Buckets": "Cubos",

  // src/budget/budget.tsx line 119
  "Kicked": "Echados",

  // src/budget/budget.tsx line 121
  "Analysis": "Analysis", // TO TRANSLATE

  // src/budget/budget.tsx line 124
  "Recurring Expenses": "Recurring Expenses", // TO TRANSLATE

  // src/budget/budget.tsx line 127
  "Connections": "Conexiones",

  // src/budget/budget.tsx line 128
  "Import": "Importar",

  // src/budget/budget.tsx line 136
  "Chat with Matt": "Charlar con Matt",

  // src/budget/budget.tsx line 172
  "Rain": "Lluvia",

  // src/budget/transactions.tsx line 84
  "Delete selected":  function(ahoy:string):string {
      return ahoy;
    }, // TO TRANSLATE

  // src/budget/transactions.tsx line 88
  "transactions.delete":  (size:number) => {
        return `Delete selected (${size})`
      }, // TO TRANSLATE

  // src/mainprocess/menu.ts line 33
  "File": "Archivo",

  // src/mainprocess/menu.ts line 36
  "New Budget...": "Presupuesto Nuevo...",

  // src/mainprocess/menu.ts line 43
  "Open Budget...": "Abrir Presupuesto...",

  // src/mainprocess/menu.ts line 50
  "Open Recent...": "Abrir Un Reciente...",

  // src/mainprocess/menu.ts line 63
  "Duplicate Window": "Duplicar la Ventana",

  // src/mainprocess/menu.ts line 72
  "Import Transactions...": "Importar Transacciones...",

  // src/mainprocess/menu.ts line 144
  "Learn More": "Aprende más",

  // src/mainprocess/menu.ts line 148
  "Show Log Files...": "Mostrar Archivos de Registro...",

  // src/mainprocess/menu.ts line 154
  "Report Bug...": "Reportar un Error...",

  // src/mainprocess/menu.ts line 160
  "Chat...": "Charlar...",

  // src/mainprocess/menu.ts line 166
  "Getting Started...": "Getting Started...", // TO TRANSLATE

  // src/mainprocess/menu.ts line 178
  "Purchase Full Version...": 'Comprar las Versión Completa...',

  // src/mainprocess/menu.ts line 184
  "Enter License...": "Entrar Licencia...",

  // src/mainprocess/menu.ts line 209
  "Check For Updates...": "Check For Updates...", // TO TRANSLATE
}

export const pack:ILangPack = {
  name: 'español',
  messages
}
