import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { shell } from 'electron';

// const { dialog } = require('electron').remote;

let win: BrowserWindow;
ipcMain.on('run-module', (event, arg) => {
    try {
        const modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/modules', arg.moduleId);
        fs.writeFileSync(
            path.join(modulePath, `${arg.moduleName}_Data`, 'room.txt'),
            `${arg.roomId}\n${arg.token}`,
            { flag: 'w+'});
        const opened = shell.openItem(path.join(modulePath, `${arg.moduleName}.exe`));
        event.returnValue = opened;
    } catch ( err) {
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
}
