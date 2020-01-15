import { app, BrowserWindow, ipcMain } from 'electron';
const { autoUpdater } = require('electron-updater');
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as internalIp from 'internal-ip';
import * as adb from 'adbkit';
import * as capcon from 'capture-console';
const log = require('electron-log');
const { netLog } = require('electron');
const { Store } = require('./store');
const { VrModuleRunner } = require('./vr_module_runner');

autoUpdater.logger = log;
const server = require('./server');
const modulesUpdate = require('./modules_update');
const desktopAutoUpdate = require('./auto_update');
const client = adb.createClient();
const MAIN_EVENTS = {
  error: 'main-error',
  offline_headset_ready: 'offline-headset-ready',
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
  debug: 'gold',
  updates: 'lightskyblue'
};

let headsetDevice;
let authorizedHeadsets = [];

let win: BrowserWindow;
let consoleWin: BrowserWindow;
let storeHelper: any;
let vrmoduleRunnerHelper: any;
const logMsg = (msg, type = 'debug') => {
  msg = `[${appVersion}] ${msg}`;
  consoleWin.webContents.send(MAIN_EVENTS.console_log, { msg, color: colors[type] });
};

const sendEvToWin = (evName, options) => {
  win.webContents.send(evName, options);
};

ipcMain.on(MAIN_EVENTS.authorized_devices, (event, newAuthorizedHeadsets) => {
  authorizedHeadsets = newAuthorizedHeadsets;
  headsetDevice = null;
  authorizeConnectedHeadsets();
  sendEvToWin(MAIN_EVENTS.authorized_devices_changed, authorizedHeadsets);
});

ipcMain.on(MAIN_EVENTS.show_console_log, (event, show) => {
  show ? consoleWin.show() : consoleWin.hide();
});

ipcMain.on(MAIN_EVENTS.send_console_log, (event, msg) => {
  logMsg(msg, 'info');
});

app.on('ready', initDesktopApp);

app.on('activate', () => {
  if (win === null) {
    initDesktopApp();
  }
});

async function initDesktopApp() {
  setupLogging();
  createConsoleWindow();
  createStoreHelper();
  createModuleRunnerHelper();
  createWindow();
  trackDevices();
  server.runLocalServer(logMsg);
  desktopAutoUpdate.SetupAutoUpdate(logMsg, sendEvToWin);
  modulesUpdate.checkModulesUpdate(logMsg, sendEvToWin);
}

async function createWindow() {
  await netLog.startLogging(log.transports.file.file);

  const mainWindowBounds = storeHelper.get('mainWindowBounds');
  mainWindowBounds.webPreferences = { nodeIntegration: true };
  mainWindowBounds.icon = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/icons/win/icon.png.png');
  win = new BrowserWindow(mainWindowBounds);
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

  win.on('resize', () => {
    const { width, height } = win.getBounds();
    mainWindowBounds.height = height;
    mainWindowBounds.width = width;
    storeHelper.set('mainWindowBounds', mainWindowBounds);
  });

}

function createConsoleWindow() {
  const consoleWindowBounds: any = { width: 800, height: 600, show: false, closable: false };
  consoleWindowBounds.webPreferences = { nodeIntegration: true };
  consoleWindowBounds.parent = win;
  consoleWin = new BrowserWindow(consoleWindowBounds);
  consoleWin.loadURL(
    url.format({
      pathname: path.join(__dirname, `/../../dist/vrapeutic-desktop/assets/views/console.html`),
      protocol: 'file:',
      slashes: true,
    })
  );
}

function createStoreHelper() {
  storeHelper = new Store({
    logMsg,
    configName: 'user-preferences',
    defaults: {
      mainWindowBounds: { width: 800, height: 700, center: true, show: false }
    }
  });
}

function createModuleRunnerHelper() {
  vrmoduleRunnerHelper = new VrModuleRunner({
    logMsg,
    sendEvToWin
  });
}

async function setupLogging() {
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
}

async function trackDevices() {
  try {
    const tracker = await client.trackDevices();
    tracker.on('add', (device) => {
      authorizeHeadsetDevice(device);
    });
    tracker.on('remove', (device) => {
      headsetDevice = null;
      sendEvToWin(MAIN_EVENTS.device_disconnected, device);
    });
    tracker.on('end', () => {
      console.log('Tracking stopped');
    });
  } catch (err) {
    const msg = 'Error...' + 'trackDevices' + JSON.stringify(err);
    logMsg(msg, 'error');

    sendEvToWin(MAIN_EVENTS.error, err);
  }
}

function authorizeHeadsetDevice(device) {

  if (!authorizedHeadsets.includes(device.id)) {
    return sendEvToWin(MAIN_EVENTS.unauthorized_device_connected, device);
  }

  headsetDevice = device;
  sendEvToWin(MAIN_EVENTS.device_connected, device);
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

      return sendEvToWin(
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
      sendEvToWin(MAIN_EVENTS.offline_headset_ready, { ready: true, headsetDevice });
    });

  } catch (err) {
    sendEvToWin(MAIN_EVENTS.offline_headset_ready, {
      ready: false, headsetDevice,
      err: err.message || 'ADB Faliure: Something went wrong while pushing file to connected headset',
    });

    const msg = 'Error...' + 'prepareHeadsetOnOfflineMode' + JSON.stringify(err);
    logMsg(msg, 'error');
    sendEvToWin(MAIN_EVENTS.error, err);
  }
}
