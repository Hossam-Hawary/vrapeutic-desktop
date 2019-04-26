"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var fs = require("fs");
var electron_2 = require("electron");
// const { dialog } = require('electron').remote;
var win;
electron_1.ipcMain.on('run-module', function (event, arg) {
    try {
        // const modulePath = path.join(__dirname, '/../../../dist/vrapeutic-desktop/assets/modules', arg.moduleId);
        var modulePath = path.join(__dirname, '/../../../modules', arg.moduleId);
        fs.writeFileSync(path.join(modulePath, arg.moduleName + "_Data", 'room.txt'), arg.roomId + "\n" + arg.token, { flag: 'w+' });
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
}
//# sourceMappingURL=main.js.map