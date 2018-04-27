import * as React from 'react'
import { sss } from '../i18n'
import { AppState, manager } from './appstate'


interface SettingsPageProps {
  appstate: AppState;
}
export class SettingsPage extends React.Component<SettingsPageProps, {}> {
  render() {
    const { appstate } = this.props;
    return <div className="padded">
      <h1><span className="fa fa-cog" /> {sss('Budget Settings'/* Title for budget settings page */)}</h1>
      <table className="fieldlist">
        <tbody>
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
                    money_symbol: ev.target.value
                  })
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  }
}