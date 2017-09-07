import * as React from 'react'
import * as moment from 'moment'
import { Date } from '../time'

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
    val: "Buscar Actualizaciones...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 209"],
    h: "S/1p0syaOMqjAbHpmZa6gWaIh/9e29QR2cRJhiMadz0=",
  },
  "Enter Buckets License": {
    val: "Entrar Licencia de Buckets",
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
    val: "Enviar",
    translated: true,
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
    val: "Reiniciar Buckets",
    translated: true,
    src: ["src/wwwroot/misc/enter_license.tsx line 27"],
    h: "TNcYWk7YxhZ0U9Q+mFMRedeWB36VsDXoYgBapDvZCgM=",
  },
  "Invalid license": {
    val: "Licencia inválida",
    translated: true,
    src: ["src/wwwroot/misc/enter_license.tsx line 30"],
    h: "BfJdh6NOzurSCMGRmCP8gb1VAXUlrSSsCFIGHGXtNiA=",
  },
  "Buckets Updates": {
    val: "Buckets - Actualizaciones",
    translated: true,
    src: ["src/wwwroot/misc/updates.html line 0"],
    h: "/bdGAwJm/rYxsxx+n8mZcZ2R8TvkVU+hfEC7Acda0nk=",
  },
  "Check for Updates": {
    val: "Buscar Actualizaciones",
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 20"],
    h: "6vtxqhyfiDaIXgTBH0pdoPzTGftDDEoRFNGU082PhRk=",
  },
  "Checking for updates...": {
    val: "Buscando actualizaciones...",
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 26"],
    h: "wjjhyYhYEFdJWUmwdJIEdxm0iAq2bwrWU79ANObzzZY=",
  },
  "version-available": {
    val: (newv:string) => `Versión ${newv} es disponible.`,
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 31"],
    h: "YCoofx1v0tRUHkHfhFnm6bV2xXfnsNT6QAyXqgkUa9c=",
  },
  "Download Update": {
    val: "Descargar la actualización",
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 35"],
    h: "OvekDBh71chOkbTXqPs/V/x0lNbpc668s4hyXRF5G+I=",
  },
  "You are running the latest version!": {
    val: "You are running the latest version!",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 41"],
    h: "hShy87A6GAhRqqtK+8VdVeGD70zA64iiV0/SwectQ0I=",
  },
  "Downloading update...": {
    val: "Descargando...",
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 43"],
    h: "vTHXpZeFxjQhKPwUQPCm+eHcyYR6YjSmIm4mtV/5iTE=",
  },
  "Update downloaded.": {
    val: "Actualización descargada.",
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 48"],
    h: "DO2vE3TgW3xjiD8ZaOWeScL3qWCyiFPK8GENQ9NosYw=",
  },
  "Install and Relaunch Buckets": {
    val: "Instalar y reiniciar Buckets",
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 52"],
    h: "bzusTDIT831mqEwmmM59eT12mfoNMYiGPbUfoIzaCwo=",
  },
  "There was an error.  Maybe try again?": {
    val: "Habia error.  ¿Inténtelo de nuevo?",
    translated: false,
    src: ["src/wwwroot/misc/updates.tsx line 61"],
    h: "l+W2GSV3tl8Gx19ZW+wOCziBj5/UeMCVO8tvh4P7LEo=",
  },
  "Recently used": {
    val: "Recientes",
    translated: true,
    src: ["src/wwwroot/misc/wizard.html line 0"],
    h: "tJ5cBjszrV/JztG5V1FUrgo0bfVgXfK5KB495TvGsYs=",
  },
}
export const pack:ILangPack = {
  name: 'español',
  dir: 'ltr',
  messages
}
