
import { ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { shell } from 'electron';
const { Store } = require('./store');

class VrModuleRunner {
  store;
  sendEvToWin;
  logMsg;

  MODULES_EVENTS = {
    error: 'main-error',
    run_module: 'run-module',
    desktop_module_deady: 'desktop-module-ready'
  };

  constructor(opts) {
    this.logMsg = opts.logMsg;
    this.sendEvToWin = opts.sendEvToWin;
    this.SetupEventsListeners();
    this.store = new Store({
      logMsg: this.logMsg,
      configName: 'modules-versions',
      defaults: { available_modules: [] }
    });
  }

  SetupEventsListeners() {
    ipcMain.on(this.MODULES_EVENTS.run_module, (event, options) => {
      const moduleData = this.store.get(options.moduleId) || {};
      const modulePath = moduleData.installation_dir;
      if (!modulePath) {
        this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, {
          ready: false, moduleName: options.moduleName,
          err: 'Looks like the module is not downloaded yet, please try again later.'
        });
      }
      this.prepareRunningMode(modulePath, options);
      this.startDesktopModule(options.moduleName, modulePath);
    });
  }

  prepareRunningMode(modulePath, options) {
    try {
      const roomFilePath = path.join(modulePath, `${options.moduleName}_Data`, 'room.txt');
      fs.writeFileSync(roomFilePath, `${options.roomId}`, { flag: 'w+' });
    } catch (err) {
      const msg = 'Error...' + 'prepareRunningMode' + JSON.stringify(err);
      this.logMsg(msg, 'error');
      this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, {
        ready: false, moduleName: options.moduleName,
        err: 'We could not prepare the module before starting it!'
      });
    }
  }

  startDesktopModule(moduleName, modulePath) {
    try {
      const opened = shell.openItem(path.join(modulePath, `${moduleName}.exe`));
      this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, { ready: opened, moduleName });
    } catch (err) {
      const msg = 'Error...' + 'prepareRunningMode' + JSON.stringify(err);
      this.logMsg(msg, 'error');
      this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, {
        ready: false, moduleName,
        err: 'We could not run the module!'
      });
    }
  }
}
module.exports.VrModuleRunner = VrModuleRunner;
