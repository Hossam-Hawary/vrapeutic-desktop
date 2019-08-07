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
var server = require('./server');
var client = adb.createClient();
var MAIN_EVENTS = {
    error: 'main-error',
    run_module: 'run-module',
    switch_mode: 'switch-mode',
    mode_switched: 'mode-switched',
    module_deady: 'vr-module-ready',
    device_connected: 'device-connected',
    device_disconnected: 'device-disconnected',
    unauthorized_device_connected: 'unauthorized-device-connected',
    authorized_devices: 'authorized-devices',
};
var headsetDevice;
var authorizedHeadsets = [];
var onlineMode = true;
var win;
electron_1.ipcMain.on(MAIN_EVENTS.switch_mode, function (event, newMode) {
    onlineMode = newMode;
    win.webContents.send(MAIN_EVENTS.mode_switched, onlineMode);
});
electron_1.ipcMain.on(MAIN_EVENTS.authorized_devices, function (event, newAuthorizedHeadsets) {
    authorizedHeadsets = newAuthorizedHeadsets;
});
electron_1.ipcMain.on(MAIN_EVENTS.run_module, function (event, arg) {
    try {
        // const modulePath = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets');
        // const roomFilePath = path.join(modulePath, 'room.txt');
        var modulePath = path.join(__dirname, '/../../../modules', arg.moduleId.toString());
        var roomFilePath = path.join(modulePath, arg.moduleName + "_Data", 'room.txt');
        var serverIp = internalIp.v4.sync();
        fs.writeFileSync(roomFilePath, arg.roomId + "\n" + serverIp, { flag: 'w+' });
        prepareAndStartModule(roomFilePath, arg.moduleName, modulePath);
    }
    catch (err) {
        win.webContents.send(MAIN_EVENTS.error, err);
        win.webContents.send(MAIN_EVENTS.module_deady, { opened: false, headsetDevice: headsetDevice, moduleName: arg.moduleName, err: err });
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
function prepareAndStartModule(roomFilePath, moduleName, modulePath) {
    return __awaiter(this, void 0, void 0, function () {
        var transfer, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (onlineMode) {
                        return [2 /*return*/, startDesktopModule(moduleName, modulePath)];
                    }
                    if (!headsetDevice) {
                        return [2 /*return*/, win.webContents.send(MAIN_EVENTS.module_deady, { ready: false, headsetDevice: headsetDevice, moduleName: moduleName, err: 'No Authorized Headset connected!' })];
                    }
                    return [4 /*yield*/, client.push(headsetDevice.id, roomFilePath, '/sdcard/Download/room.txt')];
                case 1:
                    transfer = _a.sent();
                    transfer.once('end', function () {
                        startDesktopModule(moduleName, modulePath);
                    });
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    win.webContents.send(MAIN_EVENTS.module_deady, { ready: false, headsetDevice: headsetDevice, err: err_1, moduleName: moduleName });
                    win.webContents.send(MAIN_EVENTS.error, err_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function startDesktopModule(moduleName, modulePath) {
    var opened = electron_2.shell.openItem(path.join(modulePath, moduleName + ".exe"));
    win.webContents.send(MAIN_EVENTS.module_deady, { ready: opened, headsetDevice: headsetDevice, moduleName: moduleName });
}
function trackDevices() {
    return __awaiter(this, void 0, void 0, function () {
        var tracker, err_2;
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
                    err_2 = _a.sent();
                    win.webContents.send(MAIN_EVENTS.error, err_2);
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
}
//# sourceMappingURL=main.js.map