"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var fs = require("fs");
var win;
electron_1.ipcMain.on('getFiles', function (event, arg) {
    event.returnValue = 'sync pong' + arg;
    var files = fs.readdirSync(__dirname);
    event.sender.send('getFilesResponse', {
        msg: 'pong pong',
        files: files
    });
    // win.webContents.send('getFilesResponse', 'hossam');
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