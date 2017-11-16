import * as React from 'react'
import * as moment from 'moment'

import { ILangPack, IMessages } from './spec';


const messages:IMessages = {
  "accounts.balance_mismatch_msg": {
    val: "El saldo sincronizado más reciente no coincide con el saldo calculado a partir de las transacciones.  Haga clic en \"más\" para obtener más información.",
    translated: true,
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
    val: "Cuenta",
    translated: true,
    src: ["src/budget/accounts.tsx line 52"],
    h: "ihCgI4A9UaFZ63kuiKXqFHoGsze2dYwzpgSVU0clMfQ=",
  },
  "Balance": {
    val: "Saldo",
    translated: true,
    src: ["src/budget/accounts.tsx line 53","src/budget/accounts.tsx line 105"],
    h: "azvDWgVPY349dq4q8mbtpDhehRsFKYKNzMk/TcuOvEQ=",
  },
  "Synced balance": {
    val: "Saldo sincronizado",
    translated: true,
    src: ["src/budget/accounts.tsx line 77"],
    h: "yyCVeQRle/vbcZ1/QyVYtL+ZmyQ5WanHCYKZpJqFd6o=",
  },
  "accounts.balance_mismatch_long_msg": {
    val: () => {
            return (<span>
              El "Saldo" anterior es el saldo de esta cuenta a partir de la última transacción introducida.
              El "Saldo sincronizado" es el saldo de esta cuenta <i>según lo informado por el banco.</i>
              Algunos bancos siempre reportan el balance <i>de hoy</i> como el "saldo sincronizado", aunque <i>las transacciones de hoy</i> no se han enviado a Buckets todavía.
              Por lo tanto, este desajuste normalmente se resolverá cuando todas las transacciones de su banco hayan sido sincronizadas en Buckets.
          </span>)},
    translated: true,
    src: ["src/budget/accounts.tsx line 82"],
    h: "wR5L88lhIXbxAVDXEZbN1lwbnZjYUBkAifA2KtAg8dM=",
  },
  "balance-as-of": {
    val: (date:JSX.Element) => {
            return <span>desde {date}</span>
          },
    translated: true,
    src: ["src/budget/accounts.tsx line 112"],
    h: "zfEhD0nTmeclrDPBvF4YQvThWfdELzmW0m1T1UJNEKw=",
  },
  "getting-started-link": {
    val: (clickhandler) => {
          return <span>¿Primera vez usando Buckets?  Echa un vistazo a <a href="#" onClick={clickhandler}>los vídeos de inicio.</a></span>
        },
    translated: true,
    src: ["src/budget/accounts.tsx line 138"],
    h: "9NGQRvIxlAaOF9i+zWPXMFQubcY+5jtA7Td/lii16aM=",
  },
  "New account": {
    val: "Cuenta nueva",
    translated: true,
    src: ["src/budget/accounts.tsx line 138"],
    h: "MtAiANg7ugdeUiGmiGklfBPG4T1igh1iChKeC0Mdxnc=",
  },
  "Connect to bank": {
    val: "Conectar al banco",
    translated: true,
    src: ["src/budget/accounts.tsx line 139"],
    h: "0T7eA3oFvMxyPIOAkMZ2rDpJxQVORgxrLqrDx87L1ZY=",
  },
  "default account name": {
    val: "Ahorros",
    translated: true,
    src: ["src/budget/accounts.tsx line 164"],
    h: "zCYN8vtLT3Hhb9CbDDSL2xOOjqhzmmhMa5yWDTR7bCE=",
  },
  "sync.toast.syncing": {
    val: (start:moment.Moment, end:moment.Moment) => {
        return `Sincronizando transacciones de ${start.format('ll')} a ${end.format('ll')}`;
      },
    translated: true,
    src: ["src/budget/appstate.ts line 238"],
    h: "f7R9zSdK0q5+lZ8I9QRhiwN5ENKyWFnrmUG6Gltegfs=",
  },
  "sync.status.week": {
    val: (sync_start:moment.Moment) => {
        return `sem. de ${sync_start.format('ll')}`;
      },
    translated: true,
    src: ["src/budget/appstate.ts line 245"],
    h: "PDBHTH/ocFsAZ2tQBdsDt9agGKjcgYvqJLlYn/lwZeU=",
  },
  "sync.cancelled": {
    val: (trans_count:number) => {
          return `Sincronizado ${trans_count} transacciones antes de ser cancelado.`;
        },
    translated: true,
    src: ["src/budget/appstate.ts line 252"],
    h: "vKPTjoWpzYT7nXd/1E8Hklltu1+GqPNCLKpPvhQCMjI=",
  },
  "sync.done": {
    val: (trans_count:number, start:moment.Moment, end:moment.Moment) => {
          return `Sincronizado ${trans_count} transacciones de ${start.format('ll')} a ${end.format('ll')}`;
        },
    translated: true,
    src: ["src/budget/appstate.ts line 256"],
    h: "G02Wh4RjKpcx6OWMrzrWbWH2OBPaLf3kaUffUt0FeYY=",
  },
  "Un-kick": {
    val: "Des-echar",
    translated: true,
    src: ["src/budget/buckets.tsx line 44","src/budget/buckets.tsx line 961"],
    h: "P5Z1ij4jmS06jNOQiHymi+/D+uYJktoalTdw+AHGukM=",
  },
  "more": {
    val: "más",
    translated: true,
    src: ["src/budget/buckets.tsx line 46"],
    h: "uiqCMjSdL1TgDZHPNYXLnfN/yZq59+kDR/wKZSAP0hU=",
  },
  "You haven't kicked the bucket yet...": {
    val: "Todavía, no has echado ningún cubo...",
    translated: true,
    src: ["src/budget/buckets.tsx line 52"],
    h: "mtaAsLJ7BgWZcbIkRmZ4ZPSSRGXj6vJ2H8+diLhIba4=",
  },
  "Bucket": {
    val: "Cubo",
    translated: true,
    src: ["src/budget/buckets.tsx line 59","src/budget/buckets.tsx line 783"],
    h: "APPSgbsmF5H9B7YIJDaPcEVh4T7ctWU+hxQv/eG1Dg0=",
  },
  "action.transfermoney": {
    val: (money:JSX.Element) => {
          return <span>Transferir {money}</span>
        },
    translated: true,
    src: ["src/budget/buckets.tsx line 98"],
    h: "/9WmQxngVMz0QosfkB5Hz/VKJB9Hx2ccEDUf5+3YIPo=",
  },
  "action.transactmoney": {
    val: (deposit:JSX.Element, withdraw:JSX.Element) => {
        if (deposit && withdraw) {
          return <span>Deposita {deposit} y retira {withdraw}</span>
        } else if (deposit) {
          return <span>Deposita {deposit}</span>
        } else {
          return <span>Retira {withdraw}</span>
        }
      },
    translated: true,
    src: ["src/budget/buckets.tsx line 102"],
    h: "Y8kM6FlfTVDdYnezCEHOEVkFf5hedllAi2iSz2T5/g0=",
  },
  "rain left": {
    val: (money:JSX.Element) => {
        return <span>Queda {money} lluvia</span>
      },
    translated: true,
    src: ["src/budget/buckets.tsx line 118"],
    h: "l19s59dGdfkfn+e8R7vHs0ACvroQ1qy0jhZYNafh2to=",
  },
  "Deposit/Withdraw": {
    val: "Depositar/Retirar",
    translated: true,
    src: ["src/budget/buckets.tsx line 127"],
    h: "i8dU5/EFDzzyAHP1gvlIy1HyMr2CcFziXigaOpNwDJQ=",
  },
  "Self debt": {
    val: "Auto deudas",
    translated: true,
    src: ["src/budget/buckets.tsx line 149"],
    h: "zRWPLHqBTGcGqHHBHWdXpN2eOUUhRhvCyeAccFlR9Z4=",
  },
  "Amount of money over-allocated in buckets.": {
    val: "Cantidad sobrepasada en los cubos.",
    translated: true,
    src: ["src/budget/buckets.tsx line 151"],
    h: "kFucvPefN9Kae7dArnle8i0rTZZq1U+3d8w81lDNVKw=",
  },
  "Make it rain!": {
    val: "¡Has que llueve!",
    translated: true,
    src: ["src/budget/buckets.tsx line 181"],
    h: "GCU3Hru9VCit7F+BYEMKmg5U8gsc1/UZ+o5wsbMAkeY=",
  },
  "action.New bucket": {
    val: "Cubo nuevo",
    translated: true,
    src: ["src/budget/buckets.tsx line 182","src/budget/buckets.tsx line 794"],
    h: "aIKjDQtVbUMjIHU/6fccfiWBUIwUBnAofdzRJTCuytI=",
  },
  "action.New group": {
    val: "Grupo nuevo",
    translated: true,
    src: ["src/budget/buckets.tsx line 183"],
    h: "054RU7JImk6Pavh27xHA9CgGIgjmP0dYIgXez2UWx34=",
  },
  "Rain": {
    val: "Lluvia",
    translated: true,
    src: ["src/budget/budget.tsx line 172"],
    h: "fqeHyOaOYnCtGAcJlJbhAR37DG6YMrsasUNtiL6z8hc=",
  },
  "Total amount your buckets expect each month.": {
    val: "Cantidad total que requieren los cubos cada mes.",
    translated: true,
    src: ["src/budget/buckets.tsx line 187"],
    h: "UtK2gxh+N9D/p1G6dLyhcKMP5Df5XCyEp0jM0c+qoUw=",
  },
  "default new bucket name": {
    val: "Cubo nuevo",
    translated: true,
    src: ["src/budget/buckets.tsx line 214","src/budget/buckets.tsx line 799"],
    h: "FchHrB6weykpHiqRVxc5QKb6BEdhH4DXrc+t6RNcF8M=",
  },
  "default new group name": {
    val: "Grupo nuevo",
    translated: true,
    src: ["src/budget/buckets.tsx line 217"],
    h: "1dmXA/VlW+tjhojOGcypAy70L2wupHf9EdVjUByvpmA=",
  },
  "Goal:": {
    val: "Meta:",
    translated: true,
    src: ["src/budget/buckets.tsx line 364","src/budget/buckets.tsx line 494"],
    h: "77+E2dn/Mw53xjGhNc6irsiq1WULAiC4yIyt4NaO0DM=",
  },
  "Target date:": {
    val: "Fecha objetiva:",
    translated: true,
    src: ["src/budget/buckets.tsx line 383"],
    h: "InmNQoNHlJkDpjvEB+J1XPqDWRqnfNIUwTQ86iNiOGc=",
  },
  "Monthly deposit:": {
    val: "Depósito mensual:",
    translated: true,
    src: ["src/budget/buckets.tsx line 399"],
    h: "GKlnbgfjEkmlOI0TT0pyfI30T1/0jrXjT01JZrBTpP0=",
  },
  "Bucket type:": {
    val: "Tipo de cubo:",
    translated: true,
    src: ["src/budget/buckets.tsx line 419"],
    h: "NMC+sjsH6UgNhNtiqYeiHDi4zDK/+S5h5yMfZ5CQk1c=",
  },
  "buckettype.plain": {
    val: "Cubo normal",
    translated: true,
    src: ["src/budget/buckets.tsx line 426"],
    h: "AqvTaZK8lidyI8PZ9JXBBQABazz8uxM+uQM6iEuyO6w=",
  },
  "buckettype.deposit": {
    val: "Gasto recurrente",
    translated: true,
    src: ["src/budget/buckets.tsx line 427"],
    h: "3HXotB9ZHFm14ArdM0RfCT0merw8+KuXthbzotnPRec=",
  },
  "buckettype.goal-date": {
    val: "Ahorra X antes de la fecha Y",
    translated: true,
    src: ["src/budget/buckets.tsx line 428"],
    h: "+boZHIer4ggkvJ8A5cSl1EVyWRwKigC9UkBFn4WSEdg=",
  },
  "buckettype.goal-deposit": {
    val: "Ahorra X depositando Z cada mes",
    translated: true,
    src: ["src/budget/buckets.tsx line 429"],
    h: "BUzPSZsbi+lN/3tb6eF63oa7CEzS94r6ee5jf5G7inA=",
  },
  "buckettype.deposit-date": {
    val: "Ahorra Z cada mes hasta una fecha",
    translated: true,
    src: ["src/budget/buckets.tsx line 430"],
    h: "zdWdEX9eN5qpFDboBF+wi9EIguwYsB9nQCzN9GjrxMc=",
  },
  "Goal completion:": {
    val: "Meta acabará:",
    translated: true,
    src: ["src/budget/buckets.tsx line 443"],
    h: "v+G5gj6B+MtHwQovNmj/BWbpnQncARZGo+swhE1fbtg=",
  },
  "some day...": {
    val: "algún día...",
    translated: true,
    src: ["src/budget/buckets.tsx line 445"],
    h: "4K+3SY48UwcktULX4xiGt6J8Q8Hys3JjUR3t62WI6mo=",
  },
  "Required deposit:": {
    val: "Deposito requerido:",
    translated: true,
    src: ["src/budget/buckets.tsx line 454"],
    h: "Q34JZduUI2Lx8xxjkeH/Md92nqWgEcbPFZjgf5m7tXA=",
  },
  "Ending amount:": {
    val: "Cantidad final:",
    translated: true,
    src: ["src/budget/buckets.tsx line 466"],
    h: "0IUvXk9nogxjdL1n0VZPrxcMOUZODNXMlGrlpyXq8bI=",
  },
  "Goal: 0": {
    val: "Meta: 0",
    translated: true,
    src: ["src/budget/buckets.tsx line 488"],
    h: "rtvJnJFYA7lHYjPjGpF27/h2So3pRdrRLjfnkg78woQ=",
  },
  "rainfall-received-this-month": {
    val: (money:JSX.Element, percent:number) => {
          return <span>Lluvia este mes: {money} ({percent}%)</span>
        },
    translated: true,
    src: ["src/budget/buckets.tsx line 574"],
    h: "8WyxY5Vv9Dh9oCx1HkelgzuyfrAW/ynIxBz0ocmoEl4=",
  },
  "Effective": {
    val: "En efecto",
    translated: true,
    src: ["src/budget/buckets.tsx line 785"],
    h: "Iu58QrugjAc/VqZhXc0aKtmSC8KziRWTzVTiliXpAL0=",
  },
  "effective.help": {
    val: "Este sería el saldo si ningún cubo no tiene saldo negativo.",
    translated: true,
    src: ["src/budget/buckets.tsx line 785"],
    h: "D6V8nTUoyPCGCdFMHiUFZiACXp8Lpz5MFDbiujAlfSc=",
  },
  "action.transact": {
    val: "Tramita",
    translated: true,
    src: ["src/budget/buckets.tsx line 786"],
    h: "A8cB9Rz7UbbFB6Y9hBfS0LjKzndtjd+8KoyILgsjbcU=",
  },
  "bucketrain.help": {
    val: "La cantidad que los cubos quieren cada mes.  La caja muestra cuanto han recibido ya.",
    translated: true,
    src: ["src/budget/buckets.tsx line 787"],
    h: "3dbOFkUiGaEoD01CP7kIWDQHgUbULWexjdEKdEAF3sA=",
  },
  "bucket.detailslabel": {
    val: "Detalles",
    translated: true,
    src: ["src/budget/buckets.tsx line 788"],
    h: "68e/QPEuI36iIEcTWmKDrVU9KBReQ3EjFzF1F06KQMA=",
  },
  "misc group name": {
    val: "Misc",
    translated: true,
    src: ["src/budget/buckets.tsx line 925"],
    h: "DPoc7CIbzLHJxuar3WnaidO3Ryy1QtYkCswRzVHtVBg=",
  },
  "single-bucket Kicked": {
    val: "Echado",
    translated: true,
    src: ["src/budget/buckets.tsx line 957"],
    h: "cWApfoLlcBvoHizIFtrDQq3uwrZIYMXKO1iLMvv8szI=",
  },
  "Bucket deleted completely": {
    val: "Cubo fue borrado",
    translated: true,
    src: ["src/budget/buckets.tsx line 970"],
    h: "gBMlSFTWDRRSWZeZ3fuxDhpJnhv2MoF3EvZSwo1BZHg=",
  },
  "Kick the bucket": {
    val: "Echar el cubo",
    translated: true,
    src: ["src/budget/buckets.tsx line 973"],
    h: "IvzeGJ9G+Rns8Rbnal26flTFzd+yBNSEBQSptdNy8t8=",
  },
  "Balance:": {
    val: "Saldo:",
    translated: true,
    src: ["src/budget/buckets.tsx line 1023"],
    h: "hHHAAGXs0oscbD5jkMQSQUQ5sLsgo/sPaBumUBAq+CA=",
  },
  "Rainfall:": {
    val: "Lluvia:",
    translated: true,
    src: ["src/budget/buckets.tsx line 1024"],
    h: "bcN/iGnrCShKBVfwMuv4r1YDwr5UdkUbry7nN2Ws3ms=",
  },
  "Posted": {
    val: "Publicado",
    translated: true,
    src: ["src/budget/buckets.tsx line 1070"],
    h: "h6jjM8ytGdEj+QfDnTVzEdq+0oLSE9zd+MArY7gtjzU=",
  },
  "Memo": {
    val: "Memo",
    translated: true,
    src: ["src/budget/buckets.tsx line 1071"],
    h: "9yClwoAwAV0+DXl8NnkkAnlUi+Ebp2soPwN5meYKgWY=",
  },
  "Amount": {
    val: "Cantidad",
    translated: true,
    src: ["src/budget/buckets.tsx line 1072"],
    h: "DHNNaJF4hWTWIFdaMdMhUT4aSdti7ZfaNexABzxWWzc=",
  },
  "noun.transfer": {
    val: "Transferencia",
    translated: true,
    src: ["src/budget/buckets.tsx line 1073"],
    h: "B5GGqjnE8KOjYJjhsFV7zs5TGmGmVPqjihzMVxHJ3sI=",
  },
  "bucket.transfer.help": {
    val: "Una transferencia es una transacción de un cubo a otro.  Si la transacción no es un ingreso ni un gasto, es probablemente una transferencia.",
    translated: true,
    src: ["src/budget/buckets.tsx line 1073"],
    h: "dh5nslkaB1wNR4tJ5zAn6Hms+9oJqBDmAIR5k6WE6iY=",
  },
  "Misc": {
    val: "Misc",
    translated: true,
    src: ["src/budget/buckets.tsx line 1074"],
    h: "DPoc7CIbzLHJxuar3WnaidO3Ryy1QtYkCswRzVHtVBg=",
  },
  "Trial Version": {
    val: "Versión de prueba",
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
    val: "Análisis",
    translated: true,
    src: ["src/budget/budget.tsx line 121"],
    h: "+LNAOPSLW2rpFCrT+U1suhdnoYyZa1k8ALddRlddDlI=",
  },
  "Recurring Expenses": {
    val: "Gastos recurrentes",
    translated: true,
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
  "rain.help.pos": {
    val: (abs_amount:JSX.Element) => {
                                    return <span>
                                    Te quedan {abs_amount} para poner en los cubos.
                                    </span>
                                  },
    translated: true,
    src: ["src/budget/budget.tsx line 205"],
    h: "+/jK/QSyuJD3iVjhYMN06CfavdnrCnRjxQ1H8Xbw1AI=",
  },
  "rain.help.neg": {
    val: (abs_amount:JSX.Element) => {
                                    return <span>
                                    Tienes {abs_amount} demasiado en los cubos.  Si todas las transacciones se han categorizado este mes, elimine {abs_amount} de los cubos que elija.
                                    </span>
                                  },
    translated: true,
    src: ["src/budget/budget.tsx line 210"],
    h: "fto4vaDk+40kX6i0CXC6cwlcuojQv8YP+ov9QdBuWk0=",
  },
  "Income": {
    val: "Ingresos",
    translated: true,
    src: ["src/budget/budget.tsx line 176","src/budget/reports.tsx line 213"],
    h: "D2fJbta5d1Z5QYuRC5zzkBHsItZOOgY4FKrFJ64BvRs=",
  },
  "Expenses": {
    val: "Gastos",
    translated: true,
    src: ["src/budget/budget.tsx line 181","src/budget/reports.tsx line 224"],
    h: "d6aKytFAPwPUzFOv41R0itfcMu11VdE29vkM05dnpBU=",
  },
  "months gain/loss label": {
    val: (gain) => {
                        return gain >= 0 ? "Ganacia" : "Pérdida";
                      },
    translated: true,
    src: ["src/budget/budget.tsx line 186"],
    h: "lGcEnJfZJau2h5ohbKNxY1FjL0vJoW3oJOJQwSCt+Kg=",
  },
  "in the bank": {
    val: "en el banco",
    translated: true,
    src: ["src/budget/budget.tsx line 192"],
    h: "7gl7ZdgJ3HfhOcQMiU7hVkFpXIR3KFxXtlMhKyE/Irw=",
  },
  "Sync": {
    val: "Sinc",
    translated: true,
    src: ["src/budget/connections.tsx line 22","src/budget/connections.tsx line 136"],
    h: "zJAmFTCwHue7APF8kCb39YCX8J17Tsy3mxyhpQQhge8=",
  },
  "Syncing...": {
    val: "Sincronizando...",
    translated: true,
    src: ["src/budget/connections.tsx line 27"],
    h: "kuwg7vpvp082IqBtRakekOVu7bqB4PYxhnFVsoBDt/g=",
  },
  "simplefin-connect-intro": {
    val: "Conectarse a su cuenta bancaria hará que sea más fácil extraer historial de transacciones de su banco a Buckets.  Para conectarse, haga lo siguiente::",
    translated: true,
    src: ["src/budget/connections.tsx line 75"],
    h: "QyrzIPdjiuD+b5YSn7kbPRbYYDDwryIuscSYpL+TgJw=",
  },
  "simplefin-get-token": {
    val: (mklink) => {
              return <span>Obtenga un SimpleFIN Token del {mklink('SimpleFIN Bridge')}</span>
            },
    translated: true,
    src: ["src/budget/connections.tsx line 79"],
    h: "VEeKjngcHxowWbB2xWy5oNH4MXIfJQ7EqpiomT6V0fg=",
  },
  "simplefin-paste": {
    val: "Luego, pégue el SimpleFIN Token aquí:",
    translated: true,
    src: ["src/budget/connections.tsx line 89"],
    h: "vAoRsY20OBqs8bleaXD3auq8VnO9gQj7gXz5p+p71EI=",
  },
  "Connecting...": {
    val: "Conectando...",
    translated: true,
    src: ["src/budget/connections.tsx line 94"],
    h: "fYdj0RfOQMPN3n28gswFnK4aOvozPH0hqm9oqd+NcWI=",
  },
  "Unlinked Accounts": {
    val: "Cuentas desvinculadas",
    translated: true,
    src: ["src/budget/connections.tsx line 109"],
    h: "BPAjsiEkATiwSf9f6kde3yZwSmmyiPDLiZ7Rr+3Zv/A=",
  },
  "Cancel sync": {
    val: "Cancelar sinc",
    translated: true,
    src: ["src/budget/connections.tsx line 136"],
    h: "8xFWyPShIifEhumOA/PeoTtccm5TTtbQmWFViIGcPQA=",
  },
  "Test Toast": {
    val: "Prueba el pan tostado",
    translated: true,
    src: ["src/budget/connections.tsx line 140"],
    h: "5SbiliirLaAKLdgRThX+cO2RwGuC87t3Z1O0xT2WsAE=",
  },
  "Connection saved!": {
    val: "¡Conexión guardado!",
    translated: true,
    src: ["src/budget/connections.tsx line 168"],
    h: "wAgyeIQsbaI/kFPgBf8sWlKK1mf/VcP7BjHpC9TNYuc=",
  },
  "Delete": {
    val: "Borrar",
    translated: true,
    src: ["src/budget/connections.tsx line 184"],
    h: "sm3jcrSw6qxgICiEpy25imvm6QNueF6oZ+oBxfeSEJg=",
  },
  "ID": {
    val: "ID",
    translated: true,
    src: ["src/budget/connections.tsx line 190"],
    h: "ge86Jcy26vcv5uPFI29MfLOxHh8ctACck6nRdrl9aM4=",
  },
  "Last used": {
    val: "Último uso",
    translated: true,
    src: ["src/budget/connections.tsx line 191"],
    h: "G5a6Jdor9jRT/Wtcg9SfXQsvqL7VFvnVD2+gq7yT1Jg=",
  },
  "Description": {
    val: "Descripción",
    translated: true,
    src: ["src/budget/connections.tsx line 216"],
    h: "bg0ZDIR+z+PEkinc/ZyqkERMsVZcFFm3NhQoIqZH+WM=",
  },
  "Create new account": {
    val: "Crear nueva cuenta",
    translated: true,
    src: ["src/budget/connections.tsx line 253","src/budget/importing.tsx line 150"],
    h: "SmoVFbeAWSO4cW1YQJbuDJQz8kenVz5++WTJEkS6Vos=",
  },
  "action.link-account": {
    val: "Vincular",
    translated: true,
    src: ["src/budget/connections.tsx line 258","src/budget/importing.tsx line 155"],
    h: "unfAYQpjuyuTjjRCodr+S+jNjRmz3nahjZ91u/j5HfE=",
  },
  "Account created:": {
    val: "Cuenta fue creada:",
    translated: true,
    src: ["src/budget/connections.tsx line 267","src/budget/importing.tsx line 101"],
    h: "3akIYFguLafrrZub6+2XJ3aY6DNEQ95QP5aIT64aov4=",
  },
  "Account linked": {
    val: "Cuenta fue vinculada",
    translated: true,
    src: ["src/budget/connections.tsx line 271","src/budget/importing.tsx line 105"],
    h: "6BIwDJOD6nTFkAPNFUFkl5FadqIUsOu2NiXhkqUBfec=",
  },
  "match-count": {
    val: (current_match:number, total_matches:number) => {
        return `${current_match} de ${total_matches}`;
      },
    translated: true,
    src: ["src/budget/finding.tsx line 129"],
    h: "gGpkwXhLiDpxY0YOCXAFl6Q8D6sb7BX93TqgFRObOqo=",
  },
  "Open Transaction File": {
    val: "Abrir archivo de transacciones",
    translated: true,
    src: ["src/budget/importing.tsx line 40"],
    h: "8teUT2P/KToCDoMTqS88JNVtG9PTE/5PojtS1SGmokw=",
  },
  "imported X trans": {
    val: (trans_count:number) => {
          return `${trans_count} transacciones fueron importadas.`;
        },
    translated: true,
    src: ["src/budget/importing.tsx line 81"],
    h: "VXbRvtaAKzRwSAIJE5VPPrQxzJLGUyjjCmde8Y4/hGs=",
  },
  "imported n trans": {
    val: (num_trans:number) => {
      return `${num_trans} transacciones fueron importadas.`;
    },
    translated: true,
    src: ["src/budget/importing.tsx line 116"],
    h: "fKPnz16l9WkD5o21rN0yPtBFwuaTyHbAiz1rQ5Aj5Nk=",
  },
  "Name": {
    val: "Nombre",
    translated: true,
    src: ["src/budget/importing.tsx line 182"],
    h: "bMXfNfAzjiMOnmM+rZmR8I9iyrRaMmSXja7cZ0eGcwU=",
  },
  "Import transaction file": {
    val: "Importar archivo de transacciones",
    translated: true,
    src: ["src/budget/importing.tsx line 198"],
    h: "gzuSikXZDG8MBMTly4ipzOZIG7lfvL/JbSX4eNJEfMw=",
  },
  "Month to Month": {
    val: "Mes a mes",
    translated: true,
    src: ["src/budget/reports.tsx line 67"],
    h: "VYq/DQYARQsjblXvXMijYnVbyFbLkqoRYmQ8IHhTbDQ=",
  },
  "Year to Year": {
    val: "Año a año",
    translated: true,
    src: ["src/budget/reports.tsx line 79"],
    h: "YBGCdB/QACmMM/QS2qMrGlC8qtfWz9bhue7sgDaIRHg=",
  },
  "Avg:": {
    val: "Promedio:",
    translated: true,
    src: ["src/budget/reports.tsx line 220","src/budget/reports.tsx line 231"],
    h: "EVMZyhHQEFPlI2ib8VqTJo25bJBk8gHsgZR1SZ2Jcj0=",
  },
  "Net Transfers": {
    val: "Transferencias netas",
    translated: true,
    src: ["src/budget/reports.tsx line 235"],
    h: "4FYbJ2rCxhrWW9XBurKbS2mOSTwlxIXH/jCv5FDofeM=",
  },
  "net-transfers.help": {
    val: "Las transferencias netas son la suma total de todas las transacciones marcadas como transferencia.  Debe ser 0.  Si no es así, haga clic para asegurarse de que no hay transacciones duplicadas o transacciones mal clasificadas como transferencias.",
    translated: true,
    src: ["src/budget/reports.tsx line 235"],
    h: "2P3jr/VPQ35tlPa/uDMqi1spXO4Rinn76fgfVOegiA8=",
  },
  "Tot:": {
    val: "Tot:",
    translated: true,
    src: ["src/budget/reports.tsx line 242","src/budget/reports.tsx line 380"],
    h: "saHMHdDjhEhiq86BBPRvnL+Rb3M/qOu30ZLtUk20QIM=",
  },
  "Gain/Loss": {
    val: "Ganancia/pérdida",
    translated: true,
    src: ["src/budget/reports.tsx line 373"],
    h: "Kop7hNPijjGN5jXxpDmcP32CJy22tzVz1qXWTjNxVg0=",
  },
  "Ending Balance": {
    val: "Saldo final",
    translated: true,
    src: ["src/budget/reports.tsx line 432"],
    h: "bwan2qqqdDloluCkgp+UPYWSAeOQk9zkaNwb2p0kUDk=",
  },
  "Budgeted": {
    val: "Presupuestado",
    translated: true,
    src: ["src/budget/reports.tsx line 534"],
    h: "aP72arzLN/j79zGtL8DWE7wcBGciRcWqMOR1aTHJmNo=",
  },
  "Prior 12 months": {
    val: "12 meses anteriores",
    translated: true,
    src: ["src/budget/reports.tsx line 535"],
    h: "0M7KePS3rfMQeASk2IqHTYGXTAj0v1V27kPVHCsgPaY=",
  },
  "Prior 3 months": {
    val: "3 meses anteriores",
    translated: true,
    src: ["src/budget/reports.tsx line 536"],
    h: "spZsVyneGnwmYcYcv5FAET+76DRv205SW2FspmtvKpI=",
  },
  "Delete selected": {
    val: "Eliminar seleccionado",
    translated: true,
    src: ["src/budget/transactions.tsx line 84"],
    h: "bsJ1Vyhm8h3AT4g3iLkWOso1mGTLsIFexh1ymwKankw=",
  },
  "transactions.delete": {
    val: (size:number) => {
        return `Eliminar seleccionado (${size})`
      },
    translated: true,
    src: ["src/budget/transactions.tsx line 86"],
    h: "/u86qzz5nT6n9ZqcgDLwC0GHmjDy0cELJjSzjBAim5g=",
  },
  "Import from file": {
    val: "Importar del archivo",
    translated: true,
    src: ["src/budget/transactions.tsx line 98"],
    h: "pFUUU47IsBM4t150vlDrtZPYmzaQTNFLynl5hVnyaWI=",
  },
  "Show uncategorized": {
    val: "Mostrarlas sin clasificar",
    translated: true,
    src: ["src/budget/transactions.tsx line 108"],
    h: "ZHhB69+qL72sD+upbAXLXIDMlEWXgSbwb5RupMV5K0c=",
  },
  "sync-symbol help": {
    val: "Esta transacción provenía de una importación o sincronización",
    translated: true,
    src: ["src/budget/transactions.tsx line 171"],
    h: "S3tDRls+AJYj6f8jSNSCa1FVyNY+ngn6Db1EQJ3dpLE=",
  },
  "Category": {
    val: "Categoría",
    translated: true,
    src: ["src/budget/transactions.tsx line 192"],
    h: "/frArhrZL+bxdiiBKi/1cYdR/tSD7rhbMHJLgHQQdNQ=",
  },
  "action.deposit": {
    val: "Depositar",
    translated: true,
    src: ["src/budget/transactions.tsx line 262"],
    h: "m1MGQLRYdNxU9nxvjA8qOlurdztaw7NQI15XBoTWhN8=",
  },
  "action.withdraw": {
    val: "Retirar",
    translated: true,
    src: ["src/budget/transactions.tsx line 264"],
    h: "vkX+S+y0j4o6Bq0+STQc4O3AXZINynrIwo6qzEul+XE=",
  },
  "Cancel": {
    val: "Cancelar",
    translated: true,
    src: ["src/budget/transactions.tsx line 508"],
    h: "wHdMGFBg/BNmqwwBSIr4TrXk4fT1kilDHgZN5z4N5sU=",
  },
  "Save": {
    val: "Guardar",
    translated: true,
    src: ["src/budget/transactions.tsx line 509"],
    h: "wduD0WXtkIpIb6B4R8AA7ph724u3/Gtv27uaky6rEAU=",
  },
  "noun.income": {
    val: "Ingresos",
    translated: true,
    src: ["src/budget/transactions.tsx line 512"],
    h: "D2fJbta5d1Z5QYuRC5zzkBHsItZOOgY4FKrFJ64BvRs=",
  },
  "noin.income": {
    val: "Ingresos",
    translated: true,
    src: ["src/budget/transactions.tsx line 524"],
    h: "D2fJbta5d1Z5QYuRC5zzkBHsItZOOgY4FKrFJ64BvRs=",
  },
  "Categorize": {
    val: "Categorizar",
    translated: true,
    src: ["src/budget/transactions.tsx line 552"],
    h: "mA6/TefxgXpo2M+OUx/ATLQ4QYHv4t1+8vy3MmV+EQg=",
  },
  "Error": {
    val: "Error",
    translated: true,
    src: ["src/errors.ts line 17","src/errors.ts line 46"],
    h: "/ErBlknw7o83xx0uIDCjdDA4u5bAwnNZuhFd2GV1Zcw=",
  },
  "There has been an error.": {
    val: "Hay error.",
    translated: true,
    src: ["src/errors.ts line 18"],
    h: "viN5uLRSpgzhvoD9KO9g1cr7ihLQ0Men9LiUpy9RcwE=",
  },
  "error-detail": {
    val: "Si este error sigue ocurriendo o no tiene sentido, informe un error o hable con nosotros.",
    translated: true,
    src: ["src/errors.ts line 19"],
    h: "10Kk29tlHpBnhcTf7RRMfq1OZPGZgvPPguRlInaLNoY=",
  },
  "action.ignore": {
    val: "Ignorar",
    translated: true,
    src: ["src/errors.ts line 20"],
    h: "K8sAh2XND1/tJOuX9xTLmr1fQjUOB70cfc9GwI62fEs=",
  },
  "action.chat": {
    val: "Charlar",
    translated: true,
    src: ["src/errors.ts line 21"],
    h: "Ct9w1d0AYWvEp42SCfVm7DFmet6f43eJOSWwg17o+7A=",
  },
  "action.report bug": {
    val: "Reportar error",
    translated: true,
    src: ["src/errors.ts line 22"],
    h: "RxuE9Dh0Dadda2PtjUPD0dQ7b8aQok84Ytvw31ABBRU=",
  },
  "bug-include-line": {
    val: "Incluye algo más, si quiere, sobre esta línea",
    translated: true,
    src: ["src/errors.ts line 35"],
    h: "rn0WG7RYQFy1lbX3RhGEuTns0lNN14OcJzHTVx2eOMo=",
  },
  "OK": {
    val: "OK",
    translated: true,
    src: ["src/errors.ts line 48"],
    h: "mMSSK7ZBxlx6MLe8r98jC5sAtmk2McVhRqslsnhu5KM=",
  },
  "Buckets License": {
    val: "Licencia para Buckets",
    translated: true,
    src: ["src/mainprocess/dbstore.ts line 31","src/mainprocess/dbstore.ts line 65"],
    h: "sym++hSpJ7LeHTQAaiYRAK41eYIw9pfMFO2EbYTHGxo=",
  },
  "Unable to open the file:": {
    val: "No se puede abrir el archivo:",
    translated: true,
    src: ["src/mainprocess/files.ts line 44"],
    h: "MxbgnQR4Cyi549ltzzIDDAI1qRGqoeRm0zOApQMS2DY=",
  },
  "File does not exist:": {
    val: "Archivo no existe:",
    translated: true,
    src: ["src/mainprocess/files.ts line 102"],
    h: "RPeWW9lCHkg+d6XybADj3OH2jxrYcSOhrA3+QHEcYz0=",
  },
  "Open Buckets Budget": {
    val: "Abrir Presupuesto de Buckets",
    translated: true,
    src: ["src/mainprocess/files.ts line 127"],
    h: "5odppwzoA5bC5nAM3F+GDOVrAq3NfjGxrE0ZFXseCDg=",
  },
  "budget-file-type-name": {
    val: "Presupuesto de Buckets",
    translated: true,
    src: ["src/mainprocess/files.ts line 129"],
    h: "g2jeytcuhPOlEo6R2OlTzT3vNdE7sVWGnXuffEioq4c=",
  },
  "Buckets Budget Filename": {
    val: "Nombre de archivo",
    translated: true,
    src: ["src/mainprocess/files.ts line 143"],
    h: "PMqvee/qJsh/OYtRi+hbcH4fgl07SR6XM0wx4c1C+sU=",
  },
  "No file chosen": {
    val: "Archivo no elijido",
    translated: true,
    src: ["src/mainprocess/files.ts line 149"],
    h: "MKsAG2u3PyHfYzTNB+XEA8Myeu1DiSU2HNpIW8QXTpc=",
  },
  "File": {
    val: "Archivo",
    translated: true,
    src: ["src/mainprocess/menu.ts line 33"],
    h: "9XpUff7TtVQbIncvgmrfzVB2gkBh35RnM1ET/HFr3k0=",
  },
  "New Budget...": {
    val: "Presupuesto nuevo...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 36","src/wwwroot/misc/wizard.html line 0"],
    h: "daxIu+dqn7pfUDeB26rLQnPnAz2v5opSTHbAyBovaoI=",
  },
  "Open Budget...": {
    val: "Abrir...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 43"],
    h: "67FfAce57aSIe2ncVfWeIeiiRLQQ8uuEUdDyI6UHxHU=",
  },
  "Open Recent...": {
    val: "Abrir recientes...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 50"],
    h: "Uf1w3VIwUvsmKvOkQtBwsGvbRzQ5gMbEq/iyNzv95cs=",
  },
  "Edit": {
    val: "Editar",
    translated: true,
    src: ["src/mainprocess/menu.ts line 83"],
    h: "9+ZynTDPePvsJX4rW8Mn0wEzk0GRQ+udON01NKHVsQU=",
  },
  "Undo": {
    val: "Deshacer",
    translated: true,
    src: ["src/mainprocess/menu.ts line 87"],
    h: "Z1A2vTdYwfdLsWS25iSchnHOHa1VfbQg7u8MDGHk4yo=",
  },
  "Redo": {
    val: "Rehacer",
    translated: true,
    src: ["src/mainprocess/menu.ts line 91"],
    h: "7buMF65dyGtKDY/ZW/Lkn7eUmdudCsdGV3KR2lYLLA0=",
  },
  "Cut": {
    val: "Cortar",
    translated: true,
    src: ["src/mainprocess/menu.ts line 96"],
    h: "+kuX06pgC809fwr+5h9VbC8sVgVWo6EXgg6bzfXXtJs=",
  },
  "Copy": {
    val: "Copiar",
    translated: true,
    src: ["src/mainprocess/menu.ts line 100"],
    h: "T2DR4UKv+pyVWY8GzF/WWjk5XqMXgZ0gDyXkZmYczHw=",
  },
  "Paste": {
    val: "Pegar",
    translated: true,
    src: ["src/mainprocess/menu.ts line 104"],
    h: "n2Hnio0AcQPZejqQ+hm35GthBg0zYDNoxd8RCFRUhu4=",
  },
  "Paste and Match Style": {
    val: "Pegar con el mismo estilo",
    translated: true,
    src: ["src/mainprocess/menu.ts line 108"],
    h: "w8hRIxBBNWtXNPcYtQ4t/mTHfPF66U/mJbVpOiIDgYE=",
  },
  "Select All": {
    val: "Seleccionar todo",
    translated: true,
    src: ["src/mainprocess/menu.ts line 116"],
    h: "tLJuQPindRFUyvGGdMLJbBHcVpAODsfT5p2gDnpB/Oo=",
  },
  "Find...": {
    val: "Buscar...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 96"],
    h: "aUU1pzvlZzKNgYZP2ZpPtQMImBOStbFnK33P3YwXTNs=",
  },
  "Find Next": {
    val: "Buscar siguiente",
    translated: true,
    src: ["src/mainprocess/menu.ts line 103"],
    h: "LALfI5V4TsQo0DcGJwmNmrm3xNPtY5PmQuxB1voZo34=",
  },
  "Find Previous": {
    val: "Buscar anterior",
    translated: true,
    src: ["src/mainprocess/menu.ts line 110"],
    h: "0n6Dq5KDTxxsTAKrJE+RDdgi9ln6FyfUEPNBJ6ejZ5o=",
  },
  "View": {
    val: "Visualización",
    translated: true,
    src: ["src/mainprocess/menu.ts line 119"],
    h: "paIseOhKCT2+NaUBPKk98vQB/lphf7jIGeERV77doDg=",
  },
  "Reload": {
    val: "Recargar",
    translated: true,
    src: ["src/mainprocess/menu.ts line 147"],
    h: "hUVVd3tppLGqwgo2OeC3h334aTF0Y+/GHbuL/I1clYk=",
  },
  "Force Reload": {
    val: "Recargar de fuerza",
    translated: true,
    src: ["src/mainprocess/menu.ts line 151"],
    h: "ktBJY2UXO+2r0ZvmbQXhArN51bSTnyaNnnBNR9PQ5K8=",
  },
  "Toggle Developer Tools": {
    val: "Alternar herramientas del programador",
    translated: true,
    src: ["src/mainprocess/menu.ts line 155"],
    h: "IYSSUL9ezB58nRuajYVa+zH4ucrmXQOB92zA7sDlrJc=",
  },
  "Actual Size": {
    val: "Tamaño real",
    translated: true,
    src: ["src/mainprocess/menu.ts line 160"],
    h: "k1ZfUj7bmT4XwiALRlZo7ztl2d+e7JcLt3WCnvjpBYg=",
  },
  "Zoom In": {
    val: "Acercar",
    translated: true,
    src: ["src/mainprocess/menu.ts line 164"],
    h: "p3yHl1qkGVfRDPsLKitBuZhRJIDaTy3fV/vbWqOzo24=",
  },
  "Zoom Out": {
    val: "Alejar",
    translated: true,
    src: ["src/mainprocess/menu.ts line 168"],
    h: "hRo1uzcSNStVll7ef2xHOB6PqFh+q7Sg/VHiGcK4M8M=",
  },
  "Toggle Full Screen": {
    val: "Alternar pantalla completa",
    translated: true,
    src: ["src/mainprocess/menu.ts line 173"],
    h: "2ZRq+R5E0Cp4QI+y5jCefU1IOiYvNWLrN/iiJq6hGr8=",
  },
  "Window": {
    val: "Ventana",
    translated: true,
    src: ["src/mainprocess/menu.ts line 134"],
    h: "qjw17TPhgeX5msjicdTljyCEeBLFbQvz/oyOunMLJnQ=",
  },
  "Minimize": {
    val: "Minimizar",
    translated: true,
    src: ["src/mainprocess/menu.ts line 183","src/mainprocess/menu.ts line 308"],
    h: "ELhkWGGY5oNKpfCzoXXW6TgkfS1nI0ZuJbWyYLmT+ro=",
  },
  "Close Window": {
    val: "Cerrar ventana",
    translated: true,
    src: ["src/mainprocess/menu.ts line 187","src/mainprocess/menu.ts line 304"],
    h: "hrPxvP/hrVgtNNTMX4sv5sljx57neTy+2p0U1TKGuCE=",
  },
  "Budget": {
    val: "Presupuesto",
    translated: true,
    src: ["src/mainprocess/menu.ts line 158"],
    h: "zOO4DqNSFLa6Z9vlmfaz8OnwggHn8wJeP058V5mUKbE=",
  },
  "Duplicate Window": {
    val: "Duplicar la ventana",
    translated: true,
    src: ["src/mainprocess/menu.ts line 63"],
    h: "tjwFTBARBKQ5uC9Fh0zm7ag/RViV95pptJBJn9eVqHE=",
  },
  "Import Transactions...": {
    val: "Importar transacciones...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 72"],
    h: "PPLzf/61MKc3iWfDMTRo6ERH/TYu6TxBH2vmVbZD5Lk=",
  },
  "Import From YNAB4...": {
    val: "Importar de YNAB4...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 179"],
    h: "z10Vp9BzEC6CkLTNtR8xywSTNYGMBbGFZMD7XUEbrVs=",
  },
  "Help": {
    val: "Ayuda",
    translated: true,
    src: ["src/mainprocess/menu.ts line 143"],
    h: "TvUUB7AuCuFJ9IWiz2SbsjnUvYoDPZAaMPxup/rwosM=",
  },
  "Learn More": {
    val: "Aprende más",
    translated: true,
    src: ["src/mainprocess/menu.ts line 144"],
    h: "8bk7nEyrz+Q0vmMisWIPVuvHR4/TeW4DhemALir6s1o=",
  },
  "Getting Started...": {
    val: "Empezar...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 166"],
    h: "XD8GQYEIDrNjTMPX4TjGeAbbCIEBcAONlYPd/D8Hz84=",
  },
  "Chat...": {
    val: "Charlar...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 160"],
    h: "SytGirG0+cdtbPfjBma/G/tEOt4rdOj4mnjcaWsTbt8=",
  },
  "Show Log Files...": {
    val: "Mostrar archivos de registro...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 148"],
    h: "In00T9z1A4xO6nLu8zAU5s3UzH3+IcK4XjRvrT9CGMs=",
  },
  "Report Bug...": {
    val: "Reportar un error...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 154"],
    h: "i17nG0QruMiCn612ogDToWB1g4xqqei691Yeh/t8MIk=",
  },
  "Report Translation Error...": {
    val: "Reportar un error de traducción...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 173"],
    h: "/jSK7LcBLJ1FsOYb9ntsVYAxwAyGLLUZXlTL/zrC020=",
  },
  "It says:": {
    val: "Dice:",
    translated: true,
    src: ["src/mainprocess/menu.ts line 176"],
    h: "gbWdWRhcKGQzFCi8CcKy9Bmfg2oYqz1zGMHQzSU8jQE=",
  },
  "It should say:": {
    val: "Debe decir:",
    translated: true,
    src: ["src/mainprocess/menu.ts line 176"],
    h: "RjwjZtmUgFzGUxR0zMmyXh0cHzpzsbj4nk6R7tGe+i4=",
  },
  "API/File Format": {
    val: "Formato del archivo/API",
    translated: true,
    src: ["src/mainprocess/menu.ts line 237"],
    h: "tmi6N7ONU1/Iq2UdrKOr06w0UGQwzs39FSzDDXauGHU=",
  },
  "Purchase Full Version...": {
    val: "Comprar la versión completa...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 178"],
    h: "+6h2Y0QTHEVui0aUhwAlCsyJp/F+S0PYKMRlQysqjrk=",
  },
  "Enter License...": {
    val: "Entrar licencia...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 184"],
    h: "A+/eZ8qTAh97iBouJPInRkCg7F0nOkteYEBO7+lFHHA=",
  },
  "About Buckets": {
    val: "Acerca de Buckets",
    translated: true,
    src: ["src/mainprocess/menu.ts line 271"],
    h: "9bzPsx+kCkNUeLTSVjaygyWCkm3VCdsFaAFRvdS+xEU=",
  },
  "Check For Updates...": {
    val: "Buscar actualizaciones...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 209"],
    h: "S/1p0syaOMqjAbHpmZa6gWaIh/9e29QR2cRJhiMadz0=",
  },
  "Preferences...": {
    val: "Preferencias...",
    translated: true,
    src: ["src/mainprocess/menu.ts line 280"],
    h: "6iQxyJ1WC9/Z0f0saApfwL5hmhgN5YgJeikLAYqCGBI=",
  },
  "Services": {
    val: "Servicios",
    translated: true,
    src: ["src/mainprocess/menu.ts line 290"],
    h: "Y5+GuNZXfFSynDsHvAY8cr0RqU+moaHZNmOk2eQrsNs=",
  },
  "Hide Buckets": {
    val: "Ocultar Buckets",
    translated: true,
    src: ["src/mainprocess/menu.ts line 295"],
    h: "38YdGXFjndmgDFgXTpfUZ0F+W/D9e267YaAvzYZm4O8=",
  },
  "Hide Others": {
    val: "Ocultar otros",
    translated: true,
    src: ["src/mainprocess/menu.ts line 299"],
    h: "RpKz0G7Y8OE5oyGm0/zRffPdr7RQkneZCYrikLHIZ+U=",
  },
  "Show All": {
    val: "Mostrar todo",
    translated: true,
    src: ["src/mainprocess/menu.ts line 303"],
    h: "Kng6HqlojyhuqEK6kaB3KPtAs1w0LcpFWkJYrscali0=",
  },
  "Quit Buckets": {
    val: "Salir Buckets",
    translated: true,
    src: ["src/mainprocess/menu.ts line 308"],
    h: "QILEHXgAk6vuNPV3rqkbn2QRZ8WKrPnAZnscp7n8WaM=",
  },
  "Speech": {
    val: "Voz",
    translated: true,
    src: ["src/mainprocess/menu.ts line 227"],
    h: "i4Qm95bH8zVEbjpkUi7jvQiLtDzGkW9z90XEkiglzHM=",
  },
  "Start Speaking": {
    val: "Iniciar locución",
    translated: true,
    src: ["src/mainprocess/menu.ts line 292"],
    h: "v8sFOpEAoczjEjGparKZylHWHoxHMVQriwuhJaec2rY=",
  },
  "Stop Speaking": {
    val: "Detener locución",
    translated: true,
    src: ["src/mainprocess/menu.ts line 296"],
    h: "Pme2/qME7bKdVrHTIEBQYt1Fu/SXRNGyy6sLBfKpqqk=",
  },
  "Zoom": {
    val: "Zoom",
    translated: true,
    src: ["src/mainprocess/menu.ts line 312"],
    h: "Zjzswxbrkbj1TLPOYCtimoyh/aJlkF/mxeghbzdheSs=",
  },
  "Bring All to Front": {
    val: "Traer todo al frente",
    translated: true,
    src: ["src/mainprocess/menu.ts line 317"],
    h: "vXNLSncC5dTsDdfhZY5dhbev+Y3PpqQEy1fwxTkGWU0=",
  },
  "Update Available": {
    val: "Actualización disponible",
    translated: true,
    src: ["src/mainprocess/updater.ts line 159"],
    h: "FKOD6i3t69T8rvTwVJ5VSnLfkQPBcceuuk2X4ZsNKMY=",
  },
  "version-available": {
    val: (newv:string) => `Versión ${newv} es disponible.`,
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 31"],
    h: "YCoofx1v0tRUHkHfhFnm6bV2xXfnsNT6QAyXqgkUa9c=",
  },
  "Later": {
    val: "Ahora no",
    translated: true,
    src: ["src/mainprocess/updater.ts line 161"],
    h: "wZUl6R8m08S1l0zLg0xgDG2XE1sodemTuRDbalIB4VM=",
  },
  "Download": {
    val: "Descargar",
    translated: true,
    src: ["src/mainprocess/updater.ts line 162"],
    h: "QVM3NKWnuJ19cWUaN3y9fVCbkiQTygWbOYuFMklAwNc=",
  },
  "Sync failed": {
    val: "Sincronización ha fallado",
    translated: true,
    src: ["src/models/simplefin.ts line 159"],
    h: "jBGq60u/Y2WKAulnVvspUq9tLPFtXOnQYczjXXViGA0=",
  },
  "Invalid SimpleFIN Token": {
    val: "SimpleFIN Token es inválido",
    translated: true,
    src: ["src/models/simplefin.ts line 298"],
    h: "C6BzeT0S0G+xUVzgdubtVeH39oIVS4hUaVBd2gKS3Uo=",
  },
  "Unable to claim access token": {
    val: "Incapaz de reclamar SimpleFIN Token",
    translated: true,
    src: ["src/models/simplefin.ts line 310"],
    h: "Gao95RuT9JvhdAoZ5winV9os7iMaPIex3Vq9CMSjhzs=",
  },
  "Error fetching data": {
    val: "Error al obtener datos",
    translated: true,
    src: ["src/models/simplefin.ts line 326"],
    h: "z94B0956dECmmaMVLZFW0oZMVtA92etw+2ZqumR4K9Q=",
  },
  "Error parsing response": {
    val: "Error al analizar la respuesta",
    translated: true,
    src: ["src/models/simplefin.ts line 333"],
    h: "PsIRbom+m8Y5OIEPW2rzJYVlNA2NQrZmEQnpW7Y/9KI=",
  },
  "/mo": {
    val: "/mes",
    translated: true,
    src: ["src/time.tsx line 35"],
    h: "ggq7na5vMB1wOjQQo0Wq0o7ctwbMUiiJr1tRRKphHss=",
  },
  "Enter Buckets License": {
    val: "Entrar licencia de Buckets",
    translated: true,
    src: ["src/wwwroot/misc/enter_license.html line 0"],
    h: "QPy/bCk+yTP2DzZAmXWbRYj2KC5QbrLq/XeXrysIX6Q=",
  },
  "enter-license-prompt": {
    val: "\n      Por favor, ingrese su licencia de Buckets abajo.  ¿No tiene licencia?  <a href=\"#\" id=\"clicktobuy\">Cómprala aquí.</a>\n    ",
    translated: true,
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
    val: "¡Éxito!",
    translated: true,
    src: ["src/wwwroot/misc/enter_license.tsx line 26"],
    h: "6NxF/uD6sOEPkEbPFOHdBKRxj0ZXVbmnPkRXNJDy0zs=",
  },
  "Restart Buckets": {
    val: "Reiniciar buckets",
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
  "Buckets File Format": {
    val: "Formato de los Archivos de Buckets",
    translated: true,
    src: ["src/wwwroot/misc/fileformat.html line 0","src/wwwroot/misc/fileformat.html line 0"],
    h: "nvdgyKvpjrJsaVCyT2YOfOveCKs22Us+MUkm4LSYvAA=",
  },
  "Preferences": {
    val: "Preferencias",
    translated: true,
    src: ["src/wwwroot/misc/preferences.html line 0"],
    h: "g621xQsjA9sSCp1y6ZMsd3RolFp3OMEblL/gPz1k0v8=",
  },
  "Language:": {
    val: "Idioma:",
    translated: true,
    src: ["src/wwwroot/misc/preferences.tsx line 31"],
    h: "Xcdts2Yh+LAPXO+KLTuFxMiNsv+xxIJPLlbCDbLrink=",
  },
  "System Default": {
    val: "Predeterminado del sistema",
    translated: true,
    src: ["src/wwwroot/misc/preferences.tsx line 43"],
    h: "UB0KL/QZH4CikHbpWgyv1qC4YgSqsZGmS6lmmgTTiFw=",
  },
  "(Restart Buckets for the change to take effect.)": {
    val: "(Reinicie Buckets para que el cambio pasa).",
    translated: true,
    src: ["src/wwwroot/misc/preferences.tsx line 47"],
    h: "IYHFL+R57iN4UW8AS35balApUouS8GdkRIQ3uEa6wT8=",
  },
  "Buckets Updates": {
    val: "Buckets - Actualizaciones",
    translated: true,
    src: ["src/wwwroot/misc/updates.html line 0"],
    h: "/bdGAwJm/rYxsxx+n8mZcZ2R8TvkVU+hfEC7Acda0nk=",
  },
  "Check for Updates": {
    val: "Buscar actualizaciones",
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
  "Download Update": {
    val: "Descargar la actualización",
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 35"],
    h: "OvekDBh71chOkbTXqPs/V/x0lNbpc668s4hyXRF5G+I=",
  },
  "You are running the latest version!": {
    val: "Buckets está actualizado!",
    translated: true,
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
    translated: true,
    src: ["src/wwwroot/misc/updates.tsx line 61"],
    h: "l+W2GSV3tl8Gx19ZW+wOCziBj5/UeMCVO8tvh4P7LEo=",
  },
  "Recently used": {
    val: "Recientes",
    translated: true,
    src: ["src/wwwroot/misc/wizard.html line 0"],
    h: "tJ5cBjszrV/JztG5V1FUrgo0bfVgXfK5KB495TvGsYs=",
  },
  "Open YNAB4 File": {
    val: "Abrir archivo de YNAB4",
    translated: true,
    src: ["src/ynab.ts line 311"],
    h: "BrKgvN0SgW410a7e11V3gP+FgW67iTGIY+o/cKI1Ftk=",
  },
  "Error importing": {
    val: "Habia error importando",
    translated: true,
    src: ["src/ynab.ts line 371"],
    h: "rekzwWcY0HRZEhFebX1fJrp4aDJ/NTPxIwWaCYAk+7k=",
  },
}
export const pack:ILangPack = {
  name: 'español',
  dir: 'ltr',
  messages
}
