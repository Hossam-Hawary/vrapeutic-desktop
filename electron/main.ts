import { app, BrowserWindow, ipcMain, dialog } from 'electron';
const { autoUpdater } = require('electron-updater');
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { shell } from 'electron';
import * as internalIp from 'internal-ip';
import * as adb from 'adbkit';
import * as capcon from 'capture-console';
const log = require('electron-log');
const { netLog } = require('electron');
// let logger = require('logger-electron');
// logger = new logger({ fileName: 'looger_log'});
// logger.enableLogging();
log.transports.console.format = '{h}:{i}:{s} {text}';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';

// Set maximum log size in bytes. When it exceeds, old log will be saved
// as log.old.log file
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.file.file = path.join(__dirname, '/../../../../', 'log.log');
// fs.createWriteStream options, must be set before first logging
log.transports.file.streamConfig = { flags: 'w' };
// set existed file stream
log.transports.file.stream = fs.createWriteStream(log.transports.file.file);
// Sometimes it's helpful to use electron-log instead of default console
console.log = log.log;
log.transports.file.level = 'silly';
autoUpdater.logger = log;
const server = require('./server');

const client = adb.createClient();
const baseFeedUrl = 'https://hazel-xi-seven.now.sh';
const MAIN_EVENTS = {
  error: 'main-error',
  run_module: 'run-module',
  offline_headset_ready: 'offline-headset-ready',
  desktop_module_deady: 'desktop-module-ready',
  device_connected: 'device-connected',
  device_disconnected: 'device-disconnected',
  unauthorized_device_connected: 'unauthorized-device-connected',
  authorized_devices: 'authorized-devices',
  authorized_devices_changed: 'authorized-devices-changed',
  console_log: 'console-log',
  show_console_log: 'show-console-log',
  send_console_log: 'send-console-log'
};
const appVersion = app.getVersion();
const colors = {
  error: 'red',
  info: 'turquoise',
  debug: 'gold'
};

let headsetDevice;
let authorizedHeadsets = [];

let win: BrowserWindow;
let consoleWin: BrowserWindow;
const logMsg = (msg, type = 'debug') => {
  msg = `[${appVersion}] ${msg}`;
  consoleWin.webContents.send(MAIN_EVENTS.console_log, { msg, color: colors[type] });
};


ipcMain.on(MAIN_EVENTS.authorized_devices, (event, newAuthorizedHeadsets) => {
  authorizedHeadsets = newAuthorizedHeadsets;
  headsetDevice = null;
  authorizeConnectedHeadsets();
  win.webContents.send(MAIN_EVENTS.authorized_devices_changed, authorizedHeadsets);
});

ipcMain.on(MAIN_EVENTS.show_console_log, (event, show) => {
  show ? consoleWin.show() : consoleWin.hide();
});

ipcMain.on(MAIN_EVENTS.send_console_log, (event, msg) => {
  logMsg(msg, 'info');
});

ipcMain.on(MAIN_EVENTS.run_module, (event, arg) => {
  // const modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets');
  // const roomFilePath = path.join(modulePath, 'room.txt');
  const modulePath = path.join(__dirname, '/../../../modules', arg.moduleId.toString());
  prepareRunningMode(modulePath, arg);
  startDesktopModule(arg.moduleName, modulePath);
});

app.on('ready', createWindow);

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

async function createWindow() {
  await netLog.startLogging(log.transports.file.file);

  // fullscreen: true
  win = new BrowserWindow(
    {
      width: 800, height: 700, show: false,
      center: true,
      icon: path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/icons/win/icon.png.png'),
      webPreferences: {
        nodeIntegration: true
      }
    });
  win.maximize();
  win.show();
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, `/../../dist/vrapeutic-desktop/index.html`),
      protocol: 'file:',
      slashes: true,
    })
  );
  // win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });
  consoleWin = new BrowserWindow({
    parent: win, width: 800, height: 600, show: false, closable: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  consoleWin.loadURL(
    url.format({
      pathname: path.join(__dirname, `/../../dist/vrapeutic-desktop/assets/views/console.html`),
      protocol: 'file:',
      slashes: true,
    })
  );
  // the first parameter here is the stream to capture, and the
  // second argument is the function receiving the output
  capcon.startCapture(process.stdout, (msg) => {
    logMsg(msg, 'debug');
  });
  capcon.startCapture(process.stdout, (msg) => {
    logMsg(msg, 'debug');
  });

  capcon.startCapture(process.stderr, (msg) => {
    logMsg(msg, 'error');
  });
  // whatever is done here has stdout captured

  server.runLocalServer(logMsg);
  trackDevices();
  SetupAutoUpdate();
}

function prepareRunningMode(modulePath, options) {
  try {
    const roomFilePath = path.join(modulePath, `${options.moduleName}_Data`, 'room.txt');
    fs.writeFileSync(roomFilePath, `${options.roomId}`, { flag: 'w+' });
  } catch (err) {
    const msg = 'Error...' + 'prepareRunningMode' + JSON.stringify(err);
    logMsg(msg, 'error');
    win.webContents.send(MAIN_EVENTS.error, err);
    win.webContents.send(MAIN_EVENTS.desktop_module_deady, {
      ready: false, moduleName: options.moduleName,
      err: 'Something went wrong while starting the Desktop module, Make sure you have the VR module on your Desktop device'
    });
  }
}

function startDesktopModule(moduleName, modulePath) {
  const opened = shell.openItem(path.join(modulePath, `${moduleName}.exe`));
  win.webContents.send(MAIN_EVENTS.desktop_module_deady, { ready: opened, moduleName });
}

async function trackDevices() {
  try {
    const tracker = await client.trackDevices();
    tracker.on('add', (device) => {
      authorizeHeadsetDevice(device);
    });
    tracker.on('remove', (device) => {
      headsetDevice = null;
      win.webContents.send(MAIN_EVENTS.device_disconnected, device);
    });
    tracker.on('end', () => {
      console.log('Tracking stopped');
    });
  } catch (err) {
    const msg = 'Error...' + 'trackDevices' + JSON.stringify(err);
    logMsg(msg, 'error');

    win.webContents.send(MAIN_EVENTS.error, err);
  }
}

function authorizeHeadsetDevice(device) {

  if (!authorizedHeadsets.includes(device.id)) {
    return win.webContents.send(MAIN_EVENTS.unauthorized_device_connected, device);
  }

  headsetDevice = device;
  win.webContents.send(MAIN_EVENTS.device_connected, device);
  setTimeout(() => {
    prepareHeadsetOnOfflineMode();
  }, 5000);

}

async function authorizeConnectedHeadsets() {
  const devices = await client.listDevices();
  devices.forEach(async device => {
    const fet = await client.getFeatures(device.id);
    authorizeHeadsetDevice(device);
  });

}

async function prepareHeadsetOnOfflineMode() {
  try {

    if (!headsetDevice) {
      const msg = 'Error: No Authorized Headset connected!';
      logMsg(msg, 'error');

      return win.webContents.send(
        MAIN_EVENTS.offline_headset_ready,
        { ready: false, headsetDevice, err: 'No Authorized Headset connected!' }
      );
    }

    const ipInfo = { ip: internalIp.v4.sync() };
    const data = JSON.stringify(ipInfo, null, 4);
    const ipFilePath = path.join(__dirname, 'ip.json');
    fs.writeFileSync(ipFilePath, data);
    const transfer = await client.push(headsetDevice.id, ipFilePath, '/sdcard/Download/ip.json');
    transfer.once('end', () => {
      win.webContents.send(MAIN_EVENTS.offline_headset_ready, { ready: true, headsetDevice });
    });

  } catch (err) {
    win.webContents.send(MAIN_EVENTS.offline_headset_ready, {
      ready: false, headsetDevice,
      err: err.message || 'ADB Faliure: Something went wrong while pushing file to connected headset',
    });

    const msg = 'Error...' + 'prepareHeadsetOnOfflineMode' + JSON.stringify(err);
    logMsg(msg, 'error');
    win.webContents.send(MAIN_EVENTS.error, err);
  }
}

function SetupAutoUpdate() {
  let platform: string = process.platform;
  if (platform.toLowerCase() === 'linux') {
    platform = 'AppImage';
  }
  // const feed: any = `${baseFeedUrl}/update/${platform}/${appVersion}`;
  // logMsg(feed, 'info');
  // autoUpdater.setFeedURL(feed);
  setTimeout(async () => {
    autoUpdater.on('update-available', message => {
      logMsg('There is an available update. The update is downloaded automatically.', 'info');
      logMsg(JSON.stringify(message), 'info');
    });
    autoUpdater.on('update-not-available', message => {
      logMsg('There is no available update.', 'info');
      logMsg(JSON.stringify(message), 'info');
      // logMsg(autoUpdater.getFeedURL(), 'info');
      logMsg('info...' + JSON.stringify(autoUpdater.getUpdateInfoAndProvider()), 'info');
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

    autoUpdater.on('error', message => {
      logMsg('There was a problem updating the application', 'error');
      logMsg(JSON.stringify(message), 'error');
      // logMsg(autoUpdater.getFeedURL(), 'info');
      logMsg('info...' + JSON.stringify(autoUpdater.getUpdateInfoAndProvider()), 'info');
    });

    autoUpdater.on('checking-for-update', message => {
      logMsg('checking for update has been started', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('download-progress', message => {
      logMsg('download-progress....', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('before-quit-for-update', message => {
      logMsg('quit And Install...', 'info');
      logMsg(JSON.stringify(message), 'info');
    });
    // logMsg(autoUpdater.getFeedURL(), 'info');
    logMsg('info...' + JSON.stringify(autoUpdater.getUpdateInfoAndProvider()), 'info');
    logMsg('Check Done...' +  JSON.stringify(await autoUpdater.checkForUpdatesAndNotify()), 'info');
    setInterval(async () => {
      logMsg('Check Done...' + JSON.stringify(await autoUpdater.checkForUpdatesAndNotify()), 'info');
    }, 60000 * 15);
  }, 60000);
}
