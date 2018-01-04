const { remote } = require('electron');
let close_button = document.getElementById('singlepane-close');
if (close_button) {
  close_button.addEventListener('click', () => {
    remote.getCurrentWindow().close();
  })
}
