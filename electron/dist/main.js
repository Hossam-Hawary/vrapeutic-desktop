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
    // const files = fs.readdirSync(__dirname);
    // const opened = shell.openExternal('https://github.com');
    // const opened = shell.openItem('/home/hossam/Downloads/austin-neill-160129-unsplash.jpg');
    try {
        var modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/modules', arg.moduleId);
        console.log(modulePath);
        if (!fs.existsSync(modulePath)) {
            fs.mkdirSync(modulePath, { recursive: true });
        }
        fs.writeFileSync(path.join(modulePath, 'session.txt'), arg.roomId, { flag: 'w+' });
        var opened = electron_2.shell.openItem(path.join(modulePath, 'module.exe'));
        event.returnValue = opened;
    }
    catch (err) {
        event.returnValue = false;
    }
    // event.sender.send('getFilesResponse', {
    //     msg: 'pong pong',
    //     opened
    // } );
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