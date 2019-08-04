import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { shell } from 'electron';
import * as internalIp from 'internal-ip';
import * as adb from 'adbkit';
import * as Promise from 'bluebird';
const server = require('./server');
const client = adb.createClient();
let headsetDevice;

let win: BrowserWindow;
ipcMain.on('run-module', (event, arg) => {
    try {
        // const modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets');
        const modulePath = path.join(__dirname, '/../../../modules', arg.moduleId.toString());
        const roomFilePath = path.join(modulePath, `${arg.moduleName}_Data`, 'room.txt');
        const serverIp = internalIp.v4.sync();
        console.log('Ip.......', serverIp, 'Pushing to the Device.....' );
        fs.writeFileSync(roomFilePath, `${arg.roomId}\n${serverIp}`, { flag: 'w+' });
        // pushRoomFile(roomFilePath);
        const opened = shell.openItem(path.join(modulePath, `${arg.moduleName}.exe`));
        event.returnValue = opened;
    } catch (err) {
        event.returnValue = false;
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

function pushRoomFile(roomFilePath) {
    if (!headsetDevice) {return console.log('Please make sure you cnnected the Headset device first'); }

    return client.push(headsetDevice.id, roomFilePath, '/sdcard/room.txt')
        .then((transfer) => {
            return new Promise((resolve, reject) => {
                transfer.on('progress', (stats) => {
                    console.log(
                        '[%s] Pushed %d bytes so far',
                        headsetDevice.id,
                        stats.bytesTransferred
                    );
                });
                transfer.on('end', () => {
                    console.log('[%s] Push complete', headsetDevice.id);
                    resolve();
                });
                transfer.on('error', reject);
            });
        })
        .then(() => {
            console.log(`Done pushing ${roomFilePath} to the connected device ${headsetDevice.id}`);
        })
        .catch((err) => {
        console.error('Something went wrong:', err.stack);
    });
}

function trackDevices() {
    client.trackDevices()
        .then((tracker) => {
            tracker.on('add', (device) => {
                headsetDevice = device;
                addHeadsetDevice(device);
            });
            tracker.on('remove', (device) => {
                headsetDevice = null;
                console.log('Device %s was unplugged', device.id);
            });
            tracker.on('end', () => {
                console.log('Tracking stopped');
            });
        })
        .catch((err) => {
            console.error('Something went wrong:', err.stack);
        });
}

function addHeadsetDevice(device) {
    headsetDevice = device;
    console.log('Device %s was plugged in', device.id);
}
