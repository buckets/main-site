import * as React from 'react'
import { sss } from '../i18n'
import { AppState, manager } from './appstate'
import { getCurrentFile } from '../mainprocess/files'


interface SettingsPageProps {
  appstate: AppState;
}
export class SettingsPage extends React.Component<SettingsPageProps, {}> {
  render() {
    const { appstate } = this.props;
    return <div className="padded">
      <h1><span className="fa fa-cog" /> {sss('Budget Specific Settings'/* Title for budget settings page */)}</h1>
      <table className="fieldlist">
        <tbody>
          <tr>
            <th>{sss('Application preferences')}</th>
            <td>
              <a href="#" onClick={ev => {
                ev.preventDefault();
                getCurrentFile().openPreferences();
              }}>{sss('verb-open', 'Open'/* Verb to open a page */)}</a>
            </td>
          </tr>
          <tr>
            <th>{sss('Currency symbol'/* Label for currency symbol setting */)}</th>
            <td>
              <input
                type="text"
                value={appstate.settings.money_symbol}
                size={3}
                style={{
                  textAlign: 'center'
                }}
                onChange={ev => {
                  manager.nocheckpoint.sub
                  .settings.updateSettings({
                    money_symbol: ev.target.value.substr(0, 4)
                  })
                }}
              />
            </td>
          </tr>
          <tr>
            <th>{sss('Accounts in side bar')}</th>
            <td>
              <input
                type="checkbox"
                checked={appstate.settings.accounts_in_sidebar}
                onChange={(ev:any) => {
                  manager.nocheckpoint.sub
                  .settings.updateSettings({
                    accounts_in_sidebar: ev.target.checked,
                  })
                }} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  }
}


// <details>
//   <summary>{sss('Common symbols'/* Referring to currency symbols */)}</summary>
//   {CURRENCY_SYMBOLS.map((symbol, i) => {
//     return <a
//       key={i}
//       href="#"
//       style={{
//         padding: '0 .45rem',
//         display: 'inline-block',
//         fontSize: '1.2rem',
//       }}
//       onClick={(ev) => {
//         ev.preventDefault();
//         manager.nocheckpoint.sub
//         .settings.updateSettings({
//           money_symbol: symbol,
//         })
//       }}
//     >{symbol}</a>
//   })}
// </details>
// const CURRENCY_SYMBOLS = [
//   '0024',
//   '00A2',
//   '00A3',
//   '00A4',
//   '00A5',
//   '058F',
//   '060B',
//   '09F2',
//   '09F3',
//   '09FB',
//   '0AF1',
//   '0BF9',
//   '0E3F',
//   '17DB',
//   '20A0',
//   '20A1',
//   '20A2',
//   '20A3',
//   '20A4',
//   '20A5',
//   '20A6',
//   '20A7',
//   '20A8',
//   '20A9',
//   '20AA',
//   '20AB',
//   '20AC',
//   '20AD',
//   '20AE',
//   '20AF',
//   '20B0',
//   '20B1',
//   '20B2',
//   '20B3',
//   '20B4',
//   '20B5',
//   '20B6',
//   '20B7',
//   '20B8',
//   '20B9',
//   '20BA',
//   '20BB',
//   '20BC',
//   '20BD',
//   '20BE',
//   '3350',
//   '5143',
//   '5186',
//   '5706',
//   '570E',
//   '5713',
//   '571C',
//   'A838',
//   'C6D0',
//   'FDFC',
// ].map(x => String.fromCodePoint(parseInt(x, 16)))

