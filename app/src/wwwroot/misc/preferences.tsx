import * as React from 'react'
import * as moment from 'moment-timezone'
import { sss, localizeThisPage } from '../../i18n'
import { PSTATE, updateState, PersistentState } from '../../mainprocess/persistent'
import { Renderer } from '../../budget/render'

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
      <div>
        {sss('Language:'/* Label for application language preference */)} <select
          value={pstate.locale}
          onChange={(ev) => {
            let new_locale = ev.target.value;
            renderer.doUpdate(async () => {
              CURRENT_PSTATE = await updateState({
                locale: new_locale,
              });
            })
          }}>
          <option value="">{sss('System Default'/* Option for Buckets language preference */)}</option>
          <option value="en">English</option>
          <option value="es">español</option>
          <option value="fr">Français</option>
          <option value="pt">Português</option>
        </select>
      </div>
      <div>
        {sss('Number format:'/* Label for application number formatting preference */)} <select
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
          <option value="comma-period">1,500.22</option>
          <option value="period-comma">1.500,22</option>
          <option value="space-comma">1 500,22</option>
        </select>
      </div>
      <div>
        {sss("Timezone:"/* Label for timezone selection preference */)} <select
          value={pstate.timezone}
          onChange={(ev) => {
            let new_timezone = ev.target.value;
            renderer.doUpdate(async () => {
              CURRENT_PSTATE = await updateState({
                timezone: new_timezone as any,
              })
            })
          }}>
          <option value="">{sss('System Default' /* Option for timezone auto-detection */)}</option>
          {timezone_names.map(name => {
            return <option key={name}>{name}</option>
          })}
        </select>
      </div>
      <div>
        {sss('Animation:'/* Label for application preference enabling/disabling animations */)} <input
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
      </div>
      <div>
        <div className="helptext">{sss('(Restart Buckets for the change to take effect.)')}</div>
      </div>
    </div>
  }
}
