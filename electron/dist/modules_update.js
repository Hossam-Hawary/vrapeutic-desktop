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
var path = require("path");
var Store = require('./store').Store;
var UPDATES_EVENTS = {
    update_available_modules_list: 'update-available-modules',
    reset_all_installed_modules: 'reset-all-installed-modules',
    reset_installed_module: 'reset-installed-module',
    module_latest_version: 'module-latest-version',
    module_version_size: 'module-version-size',
    module_version_downloading_progress: 'module-version-downloading-progress',
    module_version_downloaded: 'module-version-downloaded',
    module_version_installed: 'module-version-installed'
};
var store;
var sendEvToWin;
var logMsg;
var modulesDir = 'modules';
exports.checkModulesUpdate = function (logMsgFn, sendEvToWinFn) {
    sendEvToWin = sendEvToWinFn;
    logMsg = logMsgFn;
    store = new Store({
        logMsg: logMsg,
        configName: 'modules-versions',
        defaults: { available_modules: [] }
    });
    SetupEventsListeners();
};
var showDialog = function (title, message, detail, buttons) {
    if (buttons === void 0) { buttons = ['Ok']; }
    return __awaiter(_this, void 0, void 0, function () {
        var dialogOpts, returnValue;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dialogOpts = {
                        type: 'info', buttons: buttons, title: title, message: message, detail: detail
                    };
                    return [4 /*yield*/, electron_1.dialog.showMessageBox(dialogOpts)];
                case 1:
                    returnValue = _a.sent();
                    return [2 /*return*/, returnValue.response];
            }
        });
    });
};
function compareModuleVersions(latestVesionData) {
    var currentVersionData = store.get(latestVesionData.vr_module_id) || {};
    if (currentVersionData.name === latestVesionData.name && currentVersionData.installed) {
        return;
    }
    if (currentVersionData.name === latestVesionData.name && currentVersionData.downloaded) {
        return installDownloadedVersion(currentVersionData);
    }
    logMsg("You don't have the latest version.... " + JSON.stringify(currentVersionData), 'updates');
    downloadNewVersion(latestVesionData);
}
function downloadNewVersion(latestVesionData) {
    logMsg("Will download..... " + latestVesionData.name, 'updates');
    var downoadCB = {
        cb: downloadNewVersionDoneCallback, cbOptions: latestVesionData,
        responseCB: downloadResponseCallback
    };
    store.download(latestVesionData.build.url, path.join('modules', latestVesionData.vr_module_id.toString(), latestVesionData.name), downoadCB);
}
function downloadResponseCallback(res, versionData) {
    versionData.size = parseInt(res.headers['content-length'], 10);
    sendEvToWin(UPDATES_EVENTS.module_version_size, versionData);
    res.on('data', function (chunk) {
        versionData.data = chunk.length;
        sendEvToWin(UPDATES_EVENTS.module_version_downloading_progress, versionData);
    });
}
function downloadNewVersionDoneCallback(downloadedFile, versionData) {
    if (!downloadedFile) {
        return logMsg('Version is not downloaded..', 'error');
    }
    versionData.downloaded = true;
    versionData.downloaded_file = downloadedFile;
    sendEvToWin(UPDATES_EVENTS.module_version_downloaded, versionData);
    store.set(versionData.vr_module_id, versionData);
    installDownloadedVersion(versionData);
}
function installDownloadedVersion(versionData) {
    if (!versionData.downloaded_file) {
        return logMsg('No file to install..', 'error');
    }
    logMsg("will install..... " + versionData.name, 'updates');
    var installCB = {
        cb: versionInstallCallback, cbOptions: versionData
    };
    store.unzipFile(versionData.downloaded_file, installCB);
}
function versionInstallCallback(unzipedDir, versionData) {
    if (!unzipedDir) {
        return logMsg('Version is not installed..', 'error');
    } // ask user to redownload
    versionData.installed = true;
    versionData.installation_dir = unzipedDir;
    store.set(versionData.vr_module_id, versionData);
    sendEvToWin(UPDATES_EVENTS.module_version_installed, versionData);
}
function SetupEventsListeners() {
    electron_1.ipcMain.on(UPDATES_EVENTS.update_available_modules_list, function (event, availableModules) {
        store.set('available_modules', availableModules);
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.reset_all_installed_modules, function (event) {
        store.removeDir(modulesDir);
        store.resetDefaults({ available_modules: [] });
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.reset_installed_module, function (event, moduleId) {
        store.set(moduleId, null);
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.module_latest_version, function (event, latestVesionData) {
        if (!latestVesionData) {
            return;
        }
        compareModuleVersions(latestVesionData);
    });
}
//# sourceMappingURL=modules_update.js.map