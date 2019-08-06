"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var fs = require("fs");
var electron_2 = require("electron");
var internalIp = require("internal-ip");
var adb = require("adbkit");
var Promise = require("bluebird");
var server = require('./server');
var client = adb.createClient();
var headsetDevice;
var win;
electron_1.ipcMain.on('run-module', function (event, arg) {
    try {
        // const modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets');
        var modulePath = path.join(__dirname, '/../../../modules', arg.moduleId.toString());
        var roomFilePath = path.join(modulePath, arg.moduleName + "_Data", 'room.txt');
        var serverIp = internalIp.v4.sync();
        console.log('Ip.......', serverIp, 'Pushing to the Device.....');
        fs.writeFileSync(roomFilePath, arg.roomId + "\n" + serverIp, { flag: 'w+' });
        // pushRoomFile(roomFilePath);
        var opened = electron_2.shell.openItem(path.join(modulePath, arg.moduleName + ".exe"));
        event.returnValue = opened;
    }
    catch (err) {
        event.returnValue = false;
    }
});
electron_1.app.on('ready', createWindow);
electron_1.app.on('activate', function () {
    if (win === null) {
        createWindow();
    }
});
function createWindow() {
    // fullscreen: true
    win = new electron_1.BrowserWindow({
        width: 800, height: 600,
        icon: path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/icons/png/64x64.png'),
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, "/../../dist/vrapeutic-desktop/index.html"),
        protocol: 'file:',
        slashes: true,
    }));
    // win.webContents.openDevTools();
    win.on('closed', function () {
        win = null;
    });
    trackDevices();
}
function pushRoomFile(roomFilePath) {
    if (!headsetDevice) {
        return console.log('Please make sure you cnnected the Headset device first');
    }
    var serverIp = internalIp.v4.sync();
    var ipInfo = { ip: serverIp };
    var data = JSON.stringify(ipInfo, null, 4);
    var currentPath = path.join(__dirname, 'ip.json');
    fs.writeFileSync(currentPath, data);
    console.log('connecting to: ' + serverIp + ' to path: ' + currentPath);
    return client.push(headsetDevice.id, currentPath, '/sdcard/Download/ip.json')
        .then(function (transfer) {
        return new Promise(function (resolve, reject) {
            transfer.on('progress', function (stats) {
                console.log('[%s] Pushed %d bytes so far', headsetDevice.id, stats.bytesTransferred);
            });
            transfer.on('end', function () {
                console.log('[%s] Push complete', headsetDevice.id);
                resolve();
            });
            transfer.on('error', reject);
        });
    })
        .then(function () {
        console.log("Done pushing " + roomFilePath + " to the connected device " + headsetDevice.id);
    })
        .catch(function (err) {
        console.error('Something went wrong:', err.stack);
    });
}
function trackDevices() {
    client.trackDevices()
        .then(function (tracker) {
        tracker.on('add', function (device) {
            headsetDevice = device;
            addHeadsetDevice(device);
            pushRoomFile('');
        });
        tracker.on('remove', function (device) {
            headsetDevice = null;
            console.log('Device %s was unplugged', device.id);
        });
        tracker.on('end', function () {
            console.log('Tracking stopped');
        });
    })
        .catch(function (err) {
        console.error('Something went wrong:', err.stack);
    });
}
function addHeadsetDevice(device) {
    headsetDevice = device;
    console.log('Device %s was plugged in', device.id);
}
//# sourceMappingURL=main.js.map