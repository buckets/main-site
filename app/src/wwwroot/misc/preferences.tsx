import * as React from 'react'
import * as moment from 'moment-timezone'
import { sss, localizeThisPage } from '../../i18n'
import { PSTATE, updateState, PersistentState } from '../../mainprocess/persistent'
import { Renderer } from '../../budget/render'
import { NUMBER_FORMAT_EXAMPLES } from '@iffycan/i18n'

let CURRENT_PSTATE = PSTATE;
let renderer:Renderer = new Renderer();

export async function start(base_element) {
  localizeThisPage();

  renderer.registerRendering(() => {
    return <PreferencesApp
      pstate={CURRENT_PSTATE}
    />;
  }, base_element);
  renderer.doUpdate();
}


class PreferencesApp extends React.Component<{
  pstate: PersistentState,
}, {}> {
  render() {
    const timezone_names = moment.tz.names();
    let { pstate } = this.props;
    return <div className="pane-body">
      <table className="fieldlist">
        <tbody>
          <tr>
            <td colSpan={2}>
              {sss('Restart Buckets for changes to take effect.')}
            </td>
          </tr>

          <tr>
            <th>{sss('Language'/* Label for application language preference */)}</th>
            <td>
              <select
                value={pstate.locale}
                onChange={(ev) => {
                  let new_locale = ev.target.value;
                  renderer.doUpdate(async () => {
                    CURRENT_PSTATE = await updateState({
                      locale: new_locale,
                    });
                  })
                }}>
                <option value="">{sss('System default'/* Option for Buckets language preference */)}</option>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="es">español</option>
                <option value="fr">Français</option>
                <option value="nl">Nederlands</option>
                <option value="pl">Polski</option>
                <option value="pt">Português</option>
              </select>
            </td>
          </tr>

          <tr>
            <th>{sss('Number format'/* Label for application number formatting preference */)}</th>
            <td>
              <select
                value={pstate.number_format}
                onChange={(ev) => {
                  let new_format = ev.target.value;
                  renderer.doUpdate(async () => {
                    CURRENT_PSTATE = await updateState({
                      number_format: new_format as any,
                    })
                  })
                }}>
                <option value="">{sss('Language default')}</option>
                <option value="comma-period">{NUMBER_FORMAT_EXAMPLES['comma-period']}</option>
                <option value="period-comma">{NUMBER_FORMAT_EXAMPLES['period-comma']}</option>
                <option value="space-comma">{NUMBER_FORMAT_EXAMPLES['space-comma']}</option>
              </select>
            </td>
          </tr>

          <tr>
            <th>{sss("Timezone"/* Label for timezone selection preference */)}</th>
            <td>
              <select
                value={pstate.timezone}
                onChange={(ev) => {
                  let new_timezone = ev.target.value;
                  renderer.doUpdate(async () => {
                    CURRENT_PSTATE = await updateState({
                      timezone: new_timezone as any,
                    })
                  })
                }}>
                <option value="">{sss('System default' /* Option for timezone auto-detection */)}</option>
                {timezone_names.map(name => {
                  return <option key={name}>{name.replace(/_/g, ' ')}</option>
                })}
              </select>
              {pstate.timezone
                ? null
                : <div>{moment.tz.guess()}</div>}
            </td>
          </tr>

          <tr>
            <th>{sss('Animation'/* Label for application preference enabling/disabling animations */)}</th>
            <td>
              <input
                type="checkbox"
                checked={pstate.animation}
                onChange={ev => {
                  let new_animation = ev.target.checked;
                  renderer.doUpdate(async () => {
                    CURRENT_PSTATE = await updateState({
                      animation: new_animation,
                    })
                  })
                }} />
            </td>
          </tr>

          <tr>
            <th>{sss('Beta Updates'/* Label for checkbox indicating if users want to receive Beta version of Buckets before wide release */)}</th>
            <td>
              <input
                type="checkbox"
                checked={pstate.download_beta_versions}
                onChange={ev => {
                  let newval = ev.target.checked;
                  renderer.doUpdate(async () => {
                    CURRENT_PSTATE = await updateState({
                      download_beta_versions: newval,
                    })
                  })
                }} />
              <div className="helptext">{sss('Enable to get new versions of Buckets before everyone else.  There might be more bugs :)')}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  }
}
