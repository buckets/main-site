import { ObjectEvent, BudgetBus } from '../../store';
import {DBStore} from '../../mainprocess/dbstore';

export async function getStore():Promise<{store:DBStore, events:ObjectEvent<any>[]}> {
  let bus = new BudgetBus('whatevs');
  let store = new DBStore(':memory:', bus);
  let events = [];
  await store.open();
  store.bus.obj.on(message => {
    events.push(message as ObjectEvent<any>);
  })
  return {store, events}
}