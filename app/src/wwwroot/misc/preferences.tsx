import * as React from 'react'
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
    let { pstate } = this.props;
    return <div className="pane-body">
      <div>
        {sss('Language:')} <select
          value={pstate.locale}
          onChange={(ev) => {
            let new_locale = ev.target.value;
            renderer.doUpdate(async () => {
              CURRENT_PSTATE = await updateState({
                locale: new_locale,
              });
            })
          }}>
          <option value="">{sss('System Default')}</option>
          <option value="en">English</option>
          <option value="es">español</option>
          <option value="pt">Português</option>
        </select>
      </div>
      <div>
        {sss('Animation:')} <input
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
