import { Recorder } from '../../recordlib';
const recorder = new Recorder();
recorder

// window.addEventListener('click', (ev) => {
//   console.log('clicked', ev);
//   ipcRenderer.sendToHost('rec:click', {
//     element: identifyElement(ev.target as HTMLElement),
//     x: ev.x,
//     y: ev.y,
//     screenX: ev.screenX,
//     screenY: ev.screenY,
//     clientX: ev.clientX,
//     clientY: ev.clientY,
//     offsetX: ev.offsetX,
//     offsetY: ev.offsetY,
//     pageX: ev.pageX,
//     pageY: ev.pageY,
//   });
//   return true;
// }, false)

// window.addEventListener('keydown', (ev) => {
//   if (ev.key === 'Meta' || ev.key === 'Control' || ev.key === 'Shift' || ev.key === 'Alt') {
//     return;
//   }
//   console.log('keydown', ev);
//   ipcRenderer.sendToHost('rec:keydown', {
//     element: identifyElement(ev.target as HTMLElement),
//     key: ev.key,
//     keyCode: ev.keyCode,
//     which: ev.which,
//     shiftKey: ev.shiftKey,
//     metaKey: ev.metaKey,
//     ctrlKey: ev.ctrlKey,
//     altKey: ev.altKey,
//   });
// }, false);

// function elementChanged(ev) {
//   ipcRenderer.sendToHost('rec:change', {
//     element: identifyElement(ev.target as HTMLElement),
//     value: ev.target.value,
//     checked: ev.target.checked,
//     selected: ev.target.selected,
//   })
// }

// const observer = new MutationObserver(mutations => {
//   mutations.forEach(mutation => {
//     if (mutation.type === 'childList') {
//       mutation.addedNodes.forEach(node => {
//         if (node.nodeName === 'INPUT') {
//           node.addEventListener('change', elementChanged);
//         } else if (node.nodeName === 'SELECT') {
//           node.addEventListener('change', elementChanged);
//         }
//       })
//     }
//   })
// })

// window.addEventListener('load', () => {
//   Array.from(document.getElementsByTagName('input')).forEach(elem => {
//     elem.addEventListener('change', elementChanged, false);
//   })
//   Array.from(document.getElementsByTagName('select')).forEach(elem => {
//     elem.addEventListener('change', elementChanged, false);
//   })
//   observer.observe(document.body, {
//     childList: true,
//     subtree: true,
//   });
// })
