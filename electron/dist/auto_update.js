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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var autoUpdater = require('electron-updater').autoUpdater;
var baseFeedUrl = 'https://hazel-xi-seven.now.sh';
exports.SetupAutoUpdate = function (logMsg, sendEvToWin) {
    var UPDATES_EVENTS = {
        desktop_latest_version: 'module-latest-version'
    };
    electron_1.ipcMain.on(UPDATES_EVENTS.desktop_latest_version, function (event, moduleVesion) {
    });
    var platform = process.platform;
    if (platform.toLowerCase() === 'linux') {
        platform = 'AppImage';
    }
    // const feed: any = `${baseFeedUrl}/update/${platform}/${appVersion}`;
    // logMsg(feed, 'info');
    // autoUpdater.setFeedURL(feed);
    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        var _this = this;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    autoUpdater.on('checking-for-update', function (message) {
                        logMsg('checking for update has been started...', 'info');
                    });
                    autoUpdater.on('update-available', function (message) {
                        logMsg('There is an available update. The update is downloaded automatically.', 'info');
                        logMsg(JSON.stringify(message), 'info');
                    });
                    autoUpdater.on('download-progress', function (message) {
                        logMsg('download-progress....', 'info');
                        logMsg(JSON.stringify(message), 'info');
                    });
                    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName) {
                        var dialogOpts = {
                            type: 'info',
                            buttons: ['Restart', 'Later'],
                            title: 'Application Update',
                            message: process.platform === 'win32' ? releaseNotes : releaseName,
                            detail: 'A new version has been downloaded. Restart the application to apply the updates.'
                        };
                        electron_1.dialog.showMessageBox(dialogOpts).then(function (returnValue) {
                            if (returnValue.response === 0) {
                                autoUpdater.quitAndInstall();
                            }
                        });
                    });
                    autoUpdater.on('before-quit-for-update', function (message) {
                        logMsg('quit And Install...', 'info');
                        logMsg(JSON.stringify(message), 'info');
                    });
                    autoUpdater.on('update-not-available', function (message) {
                        logMsg('There is no available update.', 'info');
                        logMsg(JSON.stringify(message), 'info');
                    });
                    autoUpdater.on('error', function (message) {
                        logMsg('There was a problem updating the application', 'error');
                        logMsg(JSON.stringify(message), 'error');
                        // logMsg(autoUpdater.getFeedURL(), 'info');
                        logMsg('info...' + JSON.stringify(autoUpdater.getUpdateInfoAndProvider()), 'info');
                    });
                    // logMsg(autoUpdater.getFeedURL(), 'info');
                    _a = logMsg;
                    _b = 'Check Done...';
                    _d = (_c = JSON).stringify;
                    return [4 /*yield*/, autoUpdater.checkForUpdatesAndNotify()];
                case 1:
                    // logMsg(autoUpdater.getFeedURL(), 'info');
                    _a.apply(void 0, [_b + _d.apply(_c, [_e.sent()]), 'info']);
                    setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                        var _a, _b, _c, _d;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _a = logMsg;
                                    _b = 'Check Done...';
                                    _d = (_c = JSON).stringify;
                                    return [4 /*yield*/, autoUpdater.checkForUpdatesAndNotify()];
                                case 1:
                                    _a.apply(void 0, [_b + _d.apply(_c, [_e.sent()]), 'info']);
                                    return [2 /*return*/];
                            }
                        });
                    }); }, 60000 * 15);
                    return [2 /*return*/];
            }
        });
    }); }, 60000);
};
//# sourceMappingURL=auto_update.js.map