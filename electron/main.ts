import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

let win: BrowserWindow;
ipcMain.on('getFiles', (event, arg) => {
    event.returnValue = 'sync pong' + arg;
    const files = fs.readdirSync(__dirname);
    event.sender.send('getFilesResponse', {
        msg: 'pong pong',
        files
    } );
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
