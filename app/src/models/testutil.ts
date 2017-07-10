import {ObjectEvent} from '../store';
import {DBStore} from '../mainprocess/dbstore';

export async function getStore():Promise<{store:DBStore, events:ObjectEvent<any>[]}> {
  let store = new DBStore(':memory:');
  let events = [];
  await store.open();
  store.data.on('obj', message => {
    events.push(message as ObjectEvent<any>);
  })
  return {store, events}
}