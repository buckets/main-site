// import { IObjectEvent } from '../store';
// XXX TODO
// import {DBStore} from '../mainprocess/dbstore';

// export async function getStore():Promise<{store:DBStore, events:ObjectEvent<any>[]}> {
//   let store = new DBStore(':memory:');
//   let events = [];
//   await store.open();
//   store.bus.obj.on(message => {
//     events.push(message as ObjectEvent<any>);
//   })
//   return {store, events}
// }