import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { shell } from 'electron';
import * as internalIp from 'internal-ip';
import * as adb from 'adbkit';
const server = require('./server');
const client = adb.createClient();

const MAIN_EVENTS = {
    error: 'main-error',
    run_module: 'run-module',
    switch_mode: 'switch-mode',
    mode_switched: 'mode-switched',
    module_deady: 'vr-module-ready',
    device_connected: 'device-connected',
    device_disconnected: 'device-disconnected',
    unauthorized_device_connected: 'unauthorized-device-connected',
    authorized_devices: 'authorized-devices',
};

let headsetDevice;
let authorizedHeadsets = [];
let onlineMode = true;

let win: BrowserWindow;

ipcMain.on(MAIN_EVENTS.switch_mode, (event, newMode) => {
    onlineMode = newMode;
    win.webContents.send(MAIN_EVENTS.mode_switched, onlineMode);
});

ipcMain.on(MAIN_EVENTS.authorized_devices, (event, newAuthorizedHeadsets) => {
    authorizedHeadsets = newAuthorizedHeadsets;
});

ipcMain.on(MAIN_EVENTS.run_module, (event, arg) => {
    try {
        // const modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets');
        // const roomFilePath = path.join(modulePath, 'room.txt');
        const modulePath = path.join(__dirname, '/../../../modules', arg.moduleId.toString());
        const roomFilePath = path.join(modulePath, `${arg.moduleName}_Data`, 'room.txt');
        const serverIp = internalIp.v4.sync();
        fs.writeFileSync(roomFilePath, `${arg.roomId}\n${serverIp}`, { flag: 'w+' });
        prepareAndStartModule(roomFilePath, arg.moduleName, modulePath);
    } catch (err) {
        win.webContents.send(MAIN_EVENTS.error, err);
        win.webContents.send(MAIN_EVENTS.module_deady, { opened: false, headsetDevice, moduleName: arg.moduleName, err});
    }
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
            width: 800, height: 600,
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

    trackDevices();
}

async function prepareAndStartModule(roomFilePath, moduleName, modulePath) {
    try {
        if (onlineMode) {
            return startDesktopModule(moduleName, modulePath);
        }

        if (!headsetDevice) {
           return win.webContents.send(
                MAIN_EVENTS.module_deady,
                { ready: false, headsetDevice, moduleName, err: 'No Authorized Headset connected!' }
            );
        }
        const transfer = await client.push(headsetDevice.id, roomFilePath, '/sdcard/Download/room.txt');
        transfer.once('end', () => {
            startDesktopModule(moduleName, modulePath);
        });

    } catch (err) {
        win.webContents.send(MAIN_EVENTS.module_deady, { ready: false, headsetDevice, err, moduleName});
        win.webContents.send(MAIN_EVENTS.error, err);
    }
}

function startDesktopModule(moduleName, modulePath) {
    const opened = shell.openItem(path.join(modulePath, `${moduleName}.exe`));
    win.webContents.send(MAIN_EVENTS.module_deady, { ready: opened, headsetDevice, moduleName });
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
        win.webContents.send(MAIN_EVENTS.error, err);
    }
}

function authorizeHeadsetDevice(device) {
    // if (!authorizedHeadsets.includes(device.id)) {
    //     return win.webContents.send(MAIN_EVENTS.unauthorized_device_connected, device);
    // }

    headsetDevice = device;
    win.webContents.send(MAIN_EVENTS.device_connected, device);
}
