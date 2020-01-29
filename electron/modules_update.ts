
import { ipcMain, dialog } from 'electron';
import * as path from 'path';

const { Store } = require('./store');
const UPDATES_EVENTS = {
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
  module_version_installed: 'module-version-installed',
  close_main_win: 'close-main-win'
};

let store;
let sendEvToWin;
let logMsg;
const modulesDir = 'modules';
const modulesResponses = [];

const showDialog = async (title, message, detail, buttons = ['Ok']) => {
  const dialogOpts = {
    type: 'info', buttons, title, message, detail
  };
  const returnValue = await dialog.showMessageBox(dialogOpts);
  return returnValue.response;
};

const checkRunningUpdates = () => {
  return store.getAllValues().some((moduleVersion: any) => moduleVersion.downloading);
};

const ignoreRunningUpdates = () => {
  modulesResponses.forEach(res => res.pause());
  const currenModulesVersions: any[] = store.getAllValues();
  currenModulesVersions.filter((moduleVersion: any) => moduleVersion.downloading ).forEach((moduleVersion: any) => {
    store.removeFile(moduleVersion.downloading);
    moduleVersion.downloading = null;
    store.set(moduleVersion.vr_module_id, moduleVersion);
  });
};

const informUserWithRunningUpdates = async () => {
  const response = await showDialog(
    'Modules Still Updating',
    'Some of your modules are still updating',
    '',
    ['Quit', 'Continue Updating']);
  if (response === 0) {
    ignoreRunningUpdates();
    ipcMain.emit(UPDATES_EVENTS.close_main_win);
  }
};

exports.checkModulesUpdate = (logMsgFn, sendEvToWinFn) => {
  sendEvToWin = sendEvToWinFn;
  logMsg = logMsgFn;
  store = new Store({
    logMsg,
    configName: 'modules-versions',
    defaults: {}
  });
  SetupEventsListeners();
};

exports.windowWillClose = (ev) => {
  if (checkRunningUpdates()) {
    ev.preventDefault();
    informUserWithRunningUpdates();
  }
};

function compareModuleVersions(latestVesionData) {
  const currentVersionData = store.get(latestVesionData.vr_module_id) || {};
  if (currentVersionData.downloading) { return; }
  if (currentVersionData.id === latestVesionData.id && currentVersionData.installed) { return; }
  if (currentVersionData.id === latestVesionData.id && currentVersionData.downloaded) {
    sendEvToWin(UPDATES_EVENTS.new_module_version_available_to_install, currentVersionData);
  }

  logMsg(`You don't have the latest version.... ${JSON.stringify(currentVersionData)}`, 'updates');
  sendEvToWin(UPDATES_EVENTS.new_module_version_available_to_download, latestVesionData);
}

function downloadNewVersion(latestVesionData) {
  logMsg(`Will download..... ${latestVesionData.name}`, 'updates');
  const moduleId = latestVesionData.vr_module_id;
  const currentVersionData = store.get(moduleId) || { vr_module_id: moduleId};
  const downoadCB = {
    cb: downloadNewVersionDoneCallback, cbOptions: latestVesionData,
    responseCB: downloadResponseCallback
  };
  const downloadPath = path.join(
    modulesDir, latestVesionData.vr_module_id.toString(), latestVesionData.name
    );
  currentVersionData.downloading = store.download(latestVesionData.build.url, downloadPath, downoadCB);
  store.set(moduleId, currentVersionData);
}

function downloadResponseCallback(res, versionData) {
  versionData.size = parseInt(res.headers['content-length'], 10);

  sendEvToWin(UPDATES_EVENTS.module_version_size, versionData);
  modulesResponses.push(res);

  res.on('data', chunk => {
    versionData.data = chunk.length;
    sendEvToWin(UPDATES_EVENTS.module_version_downloading_progress, versionData);
  });
}

function downloadNewVersionDoneCallback(downloadedFile, versionData) {
  if (!downloadedFile) {
    logMsg('Version is not downloaded..', 'error');
    const moduleId = versionData.vr_module_id;
    const currentVersionData = store.get(moduleId);
    currentVersionData.downloading = null;
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

  ipcMain.on(UPDATES_EVENTS.reset_all_installed_modules, (event) => {
    store.removeDir(modulesDir);
    store.resetDefaults({});
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
