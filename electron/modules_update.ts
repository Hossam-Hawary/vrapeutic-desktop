
import { ipcMain, dialog } from 'electron';
import * as path from 'path';

const { Store } = require('./store');
const UPDATES_EVENTS = {
  update_available_modules: 'update-available-modules',
  reset_all_installed_modules: 'reset-all-installed-modules',
  reset_installed_module: 'reset-installed-module',
  module_latest_version: 'module-latest-version',
  module_version_downloaded: 'module-version-downloaded',
  module_version_installed: 'module-version-installed'
};

let store;
let sendEvToWin;
let logMsg;

exports.checkModulesUpdate = (logMsgFn, sendEvToWinFn) => {
  sendEvToWin = sendEvToWinFn;
  logMsg = logMsgFn;
  store = new Store({
    logMsg,
    configName: 'modules-versions',
    defaults: { available_modules: [] }
  });
  SetupEventsListeners();
};

const showDialog = async (title, message, detail, buttons = ['Ok']) => {
  const dialogOpts = {
    type: 'info', buttons, title, message, detail
  };
  const returnValue = await dialog.showMessageBox(dialogOpts);
  return returnValue.response;
};

function compareModuleVersions(latestVesionData) {
  const currentVersionData = store.get(latestVesionData.vr_module_id) || {};
  if (currentVersionData.name === latestVesionData.name && currentVersionData.installed) { return; }
  if (currentVersionData.name === latestVesionData.name && currentVersionData.downloaded) {
    return installDownloadedVersion(currentVersionData);
  }
  logMsg(`You don't have the latest version.... ${JSON.stringify(currentVersionData)}`, 'updates');
  logMsg(`Will download..... ${latestVesionData.name}`, 'updates');
  const downoadCB = {
    cb: downloadNewVersionCallback, cbOptions: latestVesionData
  };

  store.download(latestVesionData.build.url, path.join(
    'modules', latestVesionData.vr_module_id.toString(), latestVesionData.name
    ), downoadCB);
}

function downloadNewVersionCallback(downloadedFile, versionData) {
  if (!downloadedFile) { return logMsg('Version is not downloaded..', 'error'); }

  logMsg(`New Version is downloaded... ${versionData.name}`, 'updates');
  versionData.downloaded = true;
  versionData.downloaded_file = downloadedFile;
  sendEvToWin(UPDATES_EVENTS.module_version_downloaded, versionData);
  store.set(versionData.vr_module_id, versionData);
  installDownloadedVersion(versionData);
}

function installDownloadedVersion(versionData) {
  if (!versionData.downloaded_file) { return logMsg('No file to install..', 'error'); }

  logMsg(`will install..... ${versionData.name}`, 'updates');
  const installCB = {
    cb: versionInstallCallback, cbOptions: versionData
  };
  store.unzipFile(versionData.downloaded_file, installCB);
}

function versionInstallCallback(unzipedDir, versionData) {
  if (!unzipedDir) { return logMsg('Version is not installed..', 'error'); } // ask user to redownload

  versionData.installed = true;
  versionData.installation_dir = unzipedDir;
  store.set(versionData.vr_module_id, versionData);
  sendEvToWin(UPDATES_EVENTS.module_version_installed, versionData);
  logMsg(`New Version is installed... ${JSON.stringify(versionData)}`, 'updates');
}

function SetupEventsListeners() {

  ipcMain.on(UPDATES_EVENTS.update_available_modules, (event, availableModules) => {
    store.set('available_modules', availableModules);
  });

  ipcMain.on(UPDATES_EVENTS.reset_all_installed_modules, (event) => {
    store.resetDefaults({ available_modules: [] });
  });

  ipcMain.on(UPDATES_EVENTS.reset_installed_module, (event, moduleId) => {
    store.set(moduleId, null);
  });

  ipcMain.on(UPDATES_EVENTS.module_latest_version, (event, latestVesionData) => {
    if (!latestVesionData) { return; }

    compareModuleVersions(latestVesionData);
  });
}
