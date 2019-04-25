import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { shell } from 'electron';

// const { dialog } = require('electron').remote;

let win: BrowserWindow;
ipcMain.on('run-module', (event, arg) => {
    // const files = fs.readdirSync(__dirname);
    // const opened = shell.openExternal('https://github.com');
    // const opened = shell.openItem('/home/hossam/Downloads/austin-neill-160129-unsplash.jpg');
    try {
        const modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/modules', arg.moduleId);
        console.log(modulePath);
        if (!fs.existsSync(modulePath)) {
            fs.mkdirSync(modulePath, { recursive: true });
        }
        fs.writeFileSync(path.join(modulePath, 'session.txt'), arg.roomId, { flag: 'w+'});
        const opened = shell.openItem(path.join(modulePath, 'module.exe'));
        event.returnValue = opened;
    } catch ( err) {
        event.returnValue = false;
    }
    // event.sender.send('getFilesResponse', {
    //     msg: 'pong pong',
    //     opened
    // } );
    // win.webContents.send('getFilesResponse', 'hossam');
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
