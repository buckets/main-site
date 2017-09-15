import * as React from 'react'
import { sss, localizeThisPage } from '../../i18n'
import { readState, modifyState, PersistentState } from '../../mainprocess/persistent'
import { Renderer } from '../../budget/render'

let PSTATE:PersistentState; 
let renderer:Renderer = new Renderer();

export async function start(base_element) {
  PSTATE = await readState();

  localizeThisPage();

  renderer.registerRendering(() => {
    return <PreferencesApp
      pstate={PSTATE}
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
            renderer.doUpdate(() => {
              return modifyState((state:PersistentState) => {
                state.locale = new_locale;
                PSTATE = state;
                return state;
              })
            })
          }}>
          <option value="">{sss('System Default')}</option>
          <option value="en">English</option>
          <option value="es">español</option>
        </select>
        <div className="helptext">{sss('(Restart Buckets for the change to take effect.)')}</div>
      </div>
    </div>
  }
}
