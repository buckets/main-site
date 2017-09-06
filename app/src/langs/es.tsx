import { ILangPack, IMessages } from './spec';


const messages:IMessages = {
  "accounts.balance_mismatch_msg": {
    val: "The most recent synced balance does not match the balance computed from transactions.  Click more for more information.",
    translated: false,
    src: ["src/budget/accounts.tsx line 32"],
    h: "cMuGJ8vkjW+HMm8Ac01xULd9Lwf/iVtXYPi3WBC2JS4=",
  },
  "accounts.name_placeholder": {
    val: "desconocido",
    translated: true,
    src: ["src/budget/accounts.tsx line 39"],
    h: "UwMHboI9q49SZQkwMN8ps9zBi6YOSdtwakjLJwudtyA=",
  },
  "accounts.more_link": {
    val: "más",
    translated: true,
    src: ["src/budget/accounts.tsx line 45"],
    h: "uiqCMjSdL1TgDZHPNYXLnfN/yZq59+kDR/wKZSAP0hU=",
  },
  "accounts.Account": {
    val: "Cuenta",
    translated: true,
    src: ["src/budget/accounts.tsx line 51"],
    h: "ihCgI4A9UaFZ63kuiKXqFHoGsze2dYwzpgSVU0clMfQ=",
  },
  "Trial Version": {
    val: "Versión de Prueba",
    translated: true,
    src: ["src/budget/budget.tsx line 79","src/mainprocess/menu.ts line 175"],
    h: "GtZIXrHILA84HlpKlxi3BErHwR7WIYkQ/e5BE0Fiaxg=",
  },
  "Accounts": {
    val: "Cuentas",
    translated: true,
    src: ["src/budget/budget.tsx line 115"],
    h: "1oHDkv2zB1yiCABVTWBY5oX4Ccu36nJBCG7Q+JVg8TA=",
  },
  "Transactions": {
    val: "Transacciones",
    translated: true,
    src: ["src/budget/budget.tsx line 116"],
    h: "4+yGUer/b71cfxTdeUa5QbonqN9ezC8Eii7KO22Ety0=",
  },
  "Buckets": {
    val: "Cubos",
    translated: true,
    src: ["src/budget/budget.tsx line 117"],
    h: "fMPIWzGvVEG0t7+bZX1ucgzulk8FaQfqioLgwLsj+oE=",
  },
  "Kicked": {
    val: "Echados",
    translated: true,
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
    val: "Conexiones",
    translated: true,
    src: ["src/budget/budget.tsx line 127"],
    h: "1hPfKAqhO0JhEGc2rQ8tee2sqrIAP38KrxQcfLF3I1Y=",
  },
  "Import": {
    val: "Importar",
    translated: true,
    src: ["src/budget/budget.tsx line 128"],
    h: "F3sijvfYz3oB4iz2rVHjUvNDLQs43MbXDVIr5VFA2/c=",
  },
  "Chat with Matt": {
    val: "Charlar con Matt",
    translated: true,
    src: ["src/budget/budget.tsx line 136"],
    h: "9nQjbkjkf8l2mX6xeNaU///NYhxxWFqnvTKOmakMmRY=",
  },
  "Rain": {
    val: "Lluvia",
    translated: true,
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
    val: "Archivo",
    translated: true,
    src: ["src/mainprocess/menu.ts line 33"],
    h: "9XpUff7TtVQbIncvgmrfzVB2gkBh35RnM1ET/HFr3k0=",
  },
  "New Budget...": {
    val: "Presupuesto Nuevo...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 36","src/wwwroot/misc/wizard.html line 0"],
    h: "daxIu+dqn7pfUDeB26rLQnPnAz2v5opSTHbAyBovaoI=",
  },
  "Open Budget...": {
    val: "Abrir Presupuesto...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 43"],
    h: "67FfAce57aSIe2ncVfWeIeiiRLQQ8uuEUdDyI6UHxHU=",
  },
  "Open Recent...": {
    val: "Abrir Un Reciente...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 50"],
    h: "Uf1w3VIwUvsmKvOkQtBwsGvbRzQ5gMbEq/iyNzv95cs=",
  },
  "Duplicate Window": {
    val: "Duplicar la Ventana",
    translated: true,
    src: ["src/mainprocess/menu.ts line 63"],
    h: "tjwFTBARBKQ5uC9Fh0zm7ag/RViV95pptJBJn9eVqHE=",
  },
  "Import Transactions...": {
    val: "Importar Transacciones...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 72"],
    h: "PPLzf/61MKc3iWfDMTRo6ERH/TYu6TxBH2vmVbZD5Lk=",
  },
  "Learn More": {
    val: "Aprende Más",
    translated: true,
    src: ["src/mainprocess/menu.ts line 144"],
    h: "8bk7nEyrz+Q0vmMisWIPVuvHR4/TeW4DhemALir6s1o=",
  },
  "Show Log Files...": {
    val: "Mostrar Archivos de Registro...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 148"],
    h: "In00T9z1A4xO6nLu8zAU5s3UzH3+IcK4XjRvrT9CGMs=",
  },
  "Report Bug...": {
    val: "Reportar un Error...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 154"],
    h: "i17nG0QruMiCn612ogDToWB1g4xqqei691Yeh/t8MIk=",
  },
  "Chat...": {
    val: "Charlar...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 160"],
    h: "SytGirG0+cdtbPfjBma/G/tEOt4rdOj4mnjcaWsTbt8=",
  },
  "Getting Started...": {
    val: "Empezar...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 166"],
    h: "XD8GQYEIDrNjTMPX4TjGeAbbCIEBcAONlYPd/D8Hz84=",
  },
  "Purchase Full Version...": {
    val: "Comprar las Versión Completa...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 178"],
    h: "+6h2Y0QTHEVui0aUhwAlCsyJp/F+S0PYKMRlQysqjrk=",
  },
  "Enter License...": {
    val: "Entrar Licencia...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 184"],
    h: "A+/eZ8qTAh97iBouJPInRkCg7F0nOkteYEBO7+lFHHA=",
  },
  "Check For Updates...": {
    val: "Check For Updates...",
    translated: false,
    src: ["src/mainprocess/menu.ts line 209"],
    h: "S/1p0syaOMqjAbHpmZa6gWaIh/9e29QR2cRJhiMadz0=",
  },
  "Recently used": {
    val: "Recientes",
    translated: false,
    src: ["src/wwwroot/misc/wizard.html line 0"],
    h: "tJ5cBjszrV/JztG5V1FUrgo0bfVgXfK5KB495TvGsYs=",
  },
}
export const pack:ILangPack = {
  name: 'español',
  messages
}
