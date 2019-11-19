"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var fs = require("fs");
var electron_2 = require("electron");
var internalIp = require("internal-ip");
var adb = require("adbkit");
var capcon = require("capture-console");
var electron_updater_1 = require("electron-updater");
var server = require('./server');
var client = adb.createClient();
var MAIN_EVENTS = {
    error: 'main-error',
    run_module: 'run-module',
    switch_mode: 'switch-mode',
    mode_switched: 'mode-switched',
    offline_headset_ready: 'offline-headset-ready',
    desktop_module_deady: 'desktop-module-ready',
    device_connected: 'device-connected',
    device_disconnected: 'device-disconnected',
    unauthorized_device_connected: 'unauthorized-device-connected',
    authorized_devices: 'authorized-devices',
    authorized_devices_changed: 'authorized-devices-changed',
    console_log: 'console-log',
    show_console_log: 'show-console-log',
    send_console_log: 'send-console-log'
};
var colors = {
    error: 'red',
    info: 'turquoise',
    debug: 'gold'
};
var logMsg = function (msg, type) {
    if (type === void 0) { type = 'debug'; }
    consoleWin.webContents.send(MAIN_EVENTS.console_log, { msg: msg, color: colors[type] });
};
var headsetDevice;
var authorizedHeadsets = [];
var offlineMode = true;
var win;
var consoleWin;
electron_1.ipcMain.on(MAIN_EVENTS.switch_mode, function (event, newMode) {
    offlineMode = newMode;
    win.webContents.send(MAIN_EVENTS.mode_switched, { offlineMode: offlineMode, headsetDevice: headsetDevice });
});
electron_1.ipcMain.on(MAIN_EVENTS.authorized_devices, function (event, newAuthorizedHeadsets) {
    authorizedHeadsets = newAuthorizedHeadsets;
    headsetDevice = null;
    authorizeConnectedHeadsets();
    win.webContents.send(MAIN_EVENTS.authorized_devices_changed, authorizedHeadsets);
});
electron_1.ipcMain.on(MAIN_EVENTS.show_console_log, function (event, show) {
    show ? consoleWin.show() : consoleWin.hide();
});
electron_1.ipcMain.on(MAIN_EVENTS.send_console_log, function (event, msg) {
    logMsg(msg, 'info');
});
electron_1.ipcMain.on(MAIN_EVENTS.run_module, function (event, arg) {
    // const modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets');
    // const roomFilePath = path.join(modulePath, 'room.txt');
    var modulePath = path.join(__dirname, '/../../../modules', arg.moduleId.toString());
    prepareRunningMode(modulePath, arg);
    startDesktopModule(arg.moduleName, modulePath);
});
electron_1.app.on('ready', createWindow);
electron_1.app.on('activate', function () {
    if (win === null) {
        createWindow();
    }
});
electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
function createWindow() {
    // fullscreen: true
    win = new electron_1.BrowserWindow({
        width: 800, height: 700, show: false,
        center: true,
        icon: path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/icons/win/icon.png.png'),
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.maximize();
    win.show();
    win.loadURL(url.format({
        pathname: path.join(__dirname, "/../../dist/vrapeutic-desktop/index.html"),
        protocol: 'file:',
        slashes: true,
    }));
    // win.webContents.openDevTools();
    win.on('closed', function () {
        win = null;
    });
    consoleWin = new electron_1.BrowserWindow({
        parent: win, width: 800, height: 600, show: false, closable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    consoleWin.loadURL(url.format({
        pathname: path.join(__dirname, "/../../dist/vrapeutic-desktop/assets/views/console.html"),
        protocol: 'file:',
        slashes: true,
    }));
    // the first parameter here is the stream to capture, and the
    // second argument is the function receiving the output
    capcon.startCapture(process.stdout, function (msg) {
        logMsg(msg, 'debug');
    });
    capcon.startCapture(process.stdout, function (msg) {
        logMsg(msg, 'debug');
    });
    capcon.startCapture(process.stderr, function (msg) {
        logMsg(msg, 'error');
    });
    // whatever is done here has stdout captured
    server.runLocalServer(logMsg);
    trackDevices();
}
function prepareRunningMode(modulePath, options) {
    // if (offlineMode) { return; }
    try {
        var roomFilePath = path.join(modulePath, options.moduleName + "_Data", 'room.txt');
        fs.writeFileSync(roomFilePath, "" + options.roomId, { flag: 'w+' });
    }
    catch (err) {
        var msg = 'Error...' + 'prepareRunningMode' + JSON.stringify(err);
        logMsg(msg, 'error');
        win.webContents.send(MAIN_EVENTS.error, err);
        win.webContents.send(MAIN_EVENTS.desktop_module_deady, {
            ready: false, moduleName: options.moduleName,
            err: 'Something went wrong while starting the Desktop module, Make sure you have the VR module on your Desktop device'
        });
    }
}
function startDesktopModule(moduleName, modulePath) {
    var opened = electron_2.shell.openItem(path.join(modulePath, moduleName + ".exe"));
    win.webContents.send(MAIN_EVENTS.desktop_module_deady, { ready: opened, moduleName: moduleName });
}
function trackDevices() {
    return __awaiter(this, void 0, void 0, function () {
        var tracker, err_1, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, client.trackDevices()];
                case 1:
                    tracker = _a.sent();
                    tracker.on('add', function (device) {
                        authorizeHeadsetDevice(device);
                    });
                    tracker.on('remove', function (device) {
                        headsetDevice = null;
                        win.webContents.send(MAIN_EVENTS.device_disconnected, device);
                    });
                    tracker.on('end', function () {
                        console.log('Tracking stopped');
                    });
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    msg = 'Error...' + 'trackDevices' + JSON.stringify(err_1);
                    logMsg(msg, 'error');
                    win.webContents.send(MAIN_EVENTS.error, err_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function authorizeHeadsetDevice(device) {
    if (!authorizedHeadsets.includes(device.id)) {
        return win.webContents.send(MAIN_EVENTS.unauthorized_device_connected, device);
    }
    headsetDevice = device;
    win.webContents.send(MAIN_EVENTS.device_connected, device);
    setTimeout(function () {
        prepareHeadsetOnOfflineMode();
    }, 5000);
}
function authorizeConnectedHeadsets() {
    return __awaiter(this, void 0, void 0, function () {
        var devices;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.listDevices()];
                case 1:
                    devices = _a.sent();
                    devices.forEach(function (device) { return __awaiter(_this, void 0, void 0, function () {
                        var fet;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, client.getFeatures(device.id)];
                                case 1:
                                    fet = _a.sent();
                                    authorizeHeadsetDevice(device);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
function prepareHeadsetOnOfflineMode() {
    return __awaiter(this, void 0, void 0, function () {
        var msg, ipInfo, data, ipFilePath, transfer, err_2, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!headsetDevice) {
                        msg = 'Error: No Authorized Headset connected!';
                        logMsg(msg, 'error');
                        return [2 /*return*/, win.webContents.send(MAIN_EVENTS.offline_headset_ready, { ready: false, headsetDevice: headsetDevice, err: 'No Authorized Headset connected!' })];
                    }
                    ipInfo = { ip: internalIp.v4.sync() };
                    data = JSON.stringify(ipInfo, null, 4);
                    ipFilePath = path.join(__dirname, 'ip.json');
                    fs.writeFileSync(ipFilePath, data);
                    return [4 /*yield*/, client.push(headsetDevice.id, ipFilePath, '/sdcard/Download/ip.json')];
                case 1:
                    transfer = _a.sent();
                    transfer.once('end', function () {
                        win.webContents.send(MAIN_EVENTS.offline_headset_ready, { ready: true, headsetDevice: headsetDevice });
                    });
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    win.webContents.send(MAIN_EVENTS.offline_headset_ready, {
                        ready: false, headsetDevice: headsetDevice,
                        err: err_2.message || 'ADB Faliure: Something went wrong while pushing file to connected headset',
                    });
                    msg = 'Error...' + 'prepareHeadsetOnOfflineMode' + JSON.stringify(err_2);
                    logMsg(msg, 'error');
                    win.webContents.send(MAIN_EVENTS.error, err_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=main.js.map