
import { ipcMain, dialog } from 'electron';
const { autoUpdater } = require('electron-updater');
const baseFeedUrl = 'https://hazel-xi-seven.now.sh';

exports.SetupAutoUpdate = (logMsg, sendEvToWin) => {
  const UPDATES_EVENTS = {
    desktop_latest_version: 'module-latest-version'
  };

  ipcMain.on(UPDATES_EVENTS.desktop_latest_version, (event, moduleVesion) => {

  });

  let platform: string = process.platform;
  if (platform.toLowerCase() === 'linux') {
    platform = 'AppImage';
  }

  // const feed: any = `${baseFeedUrl}/update/${platform}/${appVersion}`;
  // logMsg(feed, 'info');
  // autoUpdater.setFeedURL(feed);
  setTimeout(async () => {

    autoUpdater.on('checking-for-update', message => {
      logMsg('checking for update has been started...', 'info');
    });

    autoUpdater.on('update-available', message => {
      logMsg('There is an available update. The update is downloaded automatically.', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('download-progress', message => {
      logMsg('download-progress....', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
      const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
      };

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) { autoUpdater.quitAndInstall(); }
      });
    });

    autoUpdater.on('before-quit-for-update', message => {
      logMsg('quit And Install...', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('update-not-available', message => {
      logMsg('There is no available update.', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('error', message => {
      logMsg('There was a problem updating the application', 'error');
      logMsg(JSON.stringify(message), 'error');
      // logMsg(autoUpdater.getFeedURL(), 'info');
      logMsg('info...' + JSON.stringify(autoUpdater.getUpdateInfoAndProvider()), 'info');
    });

    // logMsg(autoUpdater.getFeedURL(), 'info');
    logMsg('Check Done...' + JSON.stringify(await autoUpdater.checkForUpdatesAndNotify()), 'info');
    setInterval(async () => {
      logMsg('Check Done...' + JSON.stringify(await autoUpdater.checkForUpdatesAndNotify()), 'info');
    }, 60000 * 15);
  }, 60000);
};
