import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { shell } from 'electron';
import * as internalIp from 'internal-ip';
import * as adb from 'adbkit';
import * as capcon from 'capture-console';
const server = require('./server');
const client = adb.createClient();

const MAIN_EVENTS = {
    error: 'main-error',
    run_module: 'run-module',
    switch_mode: 'switch-mode',
    mode_switched: 'mode-switched',
    offline_headset_ready: 'offline-headset-ready',
    desktop_module_deady: 'desktop-module-ready',
    device_connected: 'device-connected',
    device_disconnected: 'device-disconnected',
    unauthorized_device_connected: 'unauthorized-device-connected',
    authorized_devices: 'authorized-devices',
    authorized_devices_changed: 'authorized-devices-changed',
    console_log: 'console-log',
    show_console_log: 'show-console-log'
};

// the first parameter here is the stream to capture, and the
// second argument is the function receiving the output
capcon.startCapture(process.stdout, (stdout) => {
    consoleWin.webContents.send(MAIN_EVENTS.console_log, stdout);
});
// whatever is done here has stdout captured

let headsetDevice;
let authorizedHeadsets = [];
let offlineMode = true;

let win: BrowserWindow;
let consoleWin: BrowserWindow;

ipcMain.on(MAIN_EVENTS.switch_mode, (event, newMode) => {
    offlineMode = newMode;
    win.webContents.send(MAIN_EVENTS.mode_switched, { offlineMode, headsetDevice });
});

ipcMain.on(MAIN_EVENTS.authorized_devices, (event, newAuthorizedHeadsets) => {
    authorizedHeadsets = newAuthorizedHeadsets;
    headsetDevice = null;
    win.webContents.send(MAIN_EVENTS.authorized_devices_changed, authorizedHeadsets);
});

ipcMain.on(MAIN_EVENTS.show_console_log, (event, show) => {
    show ? consoleWin.show() : consoleWin.hide();
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


function createWindow() {
    // fullscreen: true
    win = new BrowserWindow(
        {
            width: 800, height: 700,
            center: true,
            icon: path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/icons/png/64x64.png'),
            webPreferences: {
                nodeIntegration: true
            }
        });

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
        } });
    consoleWin.loadURL(
        url.format({
            pathname: path.join(__dirname, `/../../dist/vrapeutic-desktop/assets/views/console.html`),
            protocol: 'file:',
            slashes: true,
        })
    );
    trackDevices();
}

function prepareRunningMode(modulePath, options) {
    // if (offlineMode) { return; }
    try {
        const roomFilePath = path.join(modulePath, `${options.moduleName}_Data`, 'room.txt');
        fs.writeFileSync(roomFilePath, `${options.roomId}`, { flag: 'w+' });
    } catch (err) {
        console.log('Error...', 'prepareRunningMode', err);
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
        console.log('Error...', 'trackDevices', err);
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

async function prepareHeadsetOnOfflineMode() {
    try {

        if (!headsetDevice) {
            console.log('Error: No Authorized Headset connected!');
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
        console.log('Error...', 'prepareHeadsetOnOfflineMode', err);
        win.webContents.send(MAIN_EVENTS.error, err);
    }
}
