import {ObjectEvent} from '../store';
import {DBStore} from '../mainprocess/dbstore';

export async function getStore():Promise<{store:DBStore, events:ObjectEvent<any>[]}> {
  let store = new DBStore(':memory:');
  let events = [];
  await store.open();
  store.data.obj.on(message => {
    events.push(message as ObjectEvent<any>);
  })
  return {store, events}
}