"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var fs = require("fs");
var electron_2 = require("electron");
var internalIp = require("internal-ip");
var adb = require("adbkit");
var server = require("./server");
var client = adb.createClient();
var win;
electron_1.ipcMain.on('run-module', function (event, arg) {
    try {
        // const modulePath = path.join(__dirname, '/../../../dist/vrapeutic-desktop/assets/modules', arg.moduleId);
        console.log('Ip.......', internalIp.v4.sync());
        var modulePath = path.join(__dirname, '/../../../modules', arg.moduleId.toString());
        fs.writeFileSync(path.join(modulePath, arg.moduleName + "_Data", 'room.txt'), "" + arg.roomId, { flag: 'w+' });
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
    adbCheck();
    win.on('closed', function () {
        win = null;
    });
    function adbCheck() {
        client.trackDevices()
            .then(function (tracker) {
            tracker.on('add', function (device) {
                console.log('Device %s was plugged in', device.id);
            });
            tracker.on('remove', function (device) {
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
}
//# sourceMappingURL=main.js.map