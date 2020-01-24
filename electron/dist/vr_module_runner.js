"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var fs = require("fs");
var electron_2 = require("electron");
var Store = require('./store').Store;
var VrModuleRunner = /** @class */ (function () {
    function VrModuleRunner(opts) {
        this.MODULES_EVENTS = {
            error: 'main-error',
            run_module: 'run-module',
            desktop_module_deady: 'desktop-module-ready'
        };
        this.logMsg = opts.logMsg;
        this.sendEvToWin = opts.sendEvToWin;
        this.SetupEventsListeners();
        this.store = new Store({
            logMsg: this.logMsg,
            configName: 'modules-versions',
            defaults: { available_modules: [] }
        });
    }
    VrModuleRunner.prototype.SetupEventsListeners = function () {
        var _this = this;
        electron_1.ipcMain.on(this.MODULES_EVENTS.run_module, function (event, options) {
            var moduleData = _this.store.get(options.moduleId) || {};
            var modulePath = moduleData.installation_dir;
            if (!modulePath) {
                _this.sendEvToWin(_this.MODULES_EVENTS.desktop_module_deady, {
                    ready: false, moduleName: options.moduleName,
                    err: 'Looks like the module is not downloaded yet, please try again later.'
                });
            }
            _this.prepareRunningMode(modulePath, options);
            _this.startDesktopModule(options.moduleName, modulePath);
        });
    };
    VrModuleRunner.prototype.prepareRunningMode = function (modulePath, options) {
        try {
            var roomFilePath = path.join(modulePath, options.moduleName + "_Data", 'room.txt');
            fs.writeFileSync(roomFilePath, "" + options.roomId, { flag: 'w+' });
        }
        catch (err) {
            var msg = 'Error...' + 'prepareRunningMode' + JSON.stringify(err);
            this.logMsg(msg, 'error');
            this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, {
                ready: false, moduleName: options.moduleName,
                err: 'We could not prepare the module before starting it!'
            });
        }
    };
    VrModuleRunner.prototype.startDesktopModule = function (moduleName, modulePath) {
        try {
            var opened = electron_2.shell.openItem(path.join(modulePath, moduleName + ".exe"));
            this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, { ready: opened, moduleName: moduleName });
        }
        catch (err) {
            var msg = 'Error...' + 'prepareRunningMode' + JSON.stringify(err);
            this.logMsg(msg, 'error');
            this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, {
                ready: false, moduleName: moduleName,
                err: 'We could not run the module!'
            });
        }
    };
    return VrModuleRunner;
}());
module.exports.VrModuleRunner = VrModuleRunner;
//# sourceMappingURL=vr_module_runner.js.map