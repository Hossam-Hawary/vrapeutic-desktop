
import { ipcMain, dialog } from 'electron';
import * as path from 'path';

const { Store } = require('./store');
const UPDATES_EVENTS = {
  update_available_modules_list: 'update-available-modules',
  reset_all_installed_modules: 'reset-all-installed-modules',
  reset_installed_module: 'reset-installed-module',
  module_latest_version: 'module-latest-version',
  new_module_version_available_to_download: 'new-module-version-available-to-download',
  new_module_version_available_to_install: 'new-module-version-available-to-install',
  download_new_module_version: 'download-new-module-version',
  install_new_module_version: 'install-new-module-version',
  module_version_size: 'module-version-size',
  module_version_downloading_progress: 'module-version-downloading-progress',
  module_version_downloaded: 'module-version-downloaded',
  module_version_installed: 'module-version-installed'
};

let store;
let sendEvToWin;
let logMsg;
const modulesDir = 'modules';
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
  if (currentVersionData.downloading) { return; }
  if (currentVersionData.name === latestVesionData.name && currentVersionData.installed) { return; }
  if (currentVersionData.name === latestVesionData.name && currentVersionData.downloaded) {
    sendEvToWin(UPDATES_EVENTS.new_module_version_available_to_install, currentVersionData);
  }

  logMsg(`You don't have the latest version.... ${JSON.stringify(currentVersionData)}`, 'updates');
  sendEvToWin(UPDATES_EVENTS.new_module_version_available_to_download, latestVesionData);
}

function downloadNewVersion(latestVesionData) {
  logMsg(`Will download..... ${latestVesionData.name}`, 'updates');
  const moduleId = latestVesionData.vr_module_id;
  const currentVersionData = store.get(moduleId) || {};
  currentVersionData.downloading = true;
  store.set(moduleId, currentVersionData);
  const downoadCB = {
    cb: downloadNewVersionDoneCallback, cbOptions: latestVesionData,
    responseCB: downloadResponseCallback
  };

  store.download(latestVesionData.build.url, path.join(
    modulesDir, latestVesionData.vr_module_id.toString(), latestVesionData.name
  ), downoadCB);
}

function downloadResponseCallback(res, versionData) {
  versionData.size = parseInt(res.headers['content-length'], 10);

  sendEvToWin(UPDATES_EVENTS.module_version_size, versionData);
  res.on('data', chunk => {
    versionData.data = chunk.length;
    sendEvToWin(UPDATES_EVENTS.module_version_downloading_progress, versionData);
  });
}

function downloadNewVersionDoneCallback(downloadedFile, versionData) {
  if (!downloadedFile) {
    logMsg('Version is not downloaded..', 'error');
    const moduleId = versionData.vr_module_id;
    const currentVersionData = store.get(moduleId) || {};
    currentVersionData.downloading = false;
    return store.set(moduleId, currentVersionData);
  }

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
}

function SetupEventsListeners() {

  ipcMain.on(UPDATES_EVENTS.update_available_modules_list, (event, availableModules) => {
    store.set('available_modules', availableModules);
  });

  ipcMain.on(UPDATES_EVENTS.reset_all_installed_modules, (event) => {
    store.removeDir(modulesDir);
    store.resetDefaults({ available_modules: [] });
  });

  ipcMain.on(UPDATES_EVENTS.reset_installed_module, (event, moduleId) => {
    store.removeDir(path.join(modulesDir, moduleId));
    store.set(moduleId, null);
  });

  ipcMain.on(UPDATES_EVENTS.module_latest_version, (event, latestVesionData) => {
    if (!latestVesionData) { return; }

    compareModuleVersions(latestVesionData);
  });

  ipcMain.on(UPDATES_EVENTS.download_new_module_version, (event, latestVesionData) => {
    if (!latestVesionData) { return; }

    downloadNewVersion(latestVesionData);
  });

  ipcMain.on(UPDATES_EVENTS.install_new_module_version, (event, latestVesionData) => {
    if (!latestVesionData) { return; }
    const currentVersionData = store.get(latestVesionData.vr_module_id) || {};

    installDownloadedVersion(currentVersionData);
  });
}
